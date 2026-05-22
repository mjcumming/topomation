"""Tests for occupied/vacant actions runtime observers."""

from __future__ import annotations

import json
from dataclasses import dataclass
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from home_topology import Event, EventBus
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.core import CoreState, HomeAssistant
from pytest_homeassistant_custom_component.common import async_capture_events

from custom_components.topomation.actions_runtime import TopomationActionsRuntime
from custom_components.topomation.const import (
    EVENT_TOPOMATION_ACTIONS_SUMMARY,
    TOPOMATION_AUTOMATION_METADATA_PREFIX,
)


@dataclass(slots=True)
class _Location:
    id: str


class _LocationManager:
    """Minimal location manager surface needed by TopomationActionsRuntime tests."""

    def __init__(self, automation_configs: dict[str, dict[str, object]]) -> None:
        self._automation_configs = automation_configs
        self._locations = [_Location(location_id) for location_id in automation_configs]

    def all_locations(self) -> list[_Location]:
        return self._locations

    def get_module_config(self, location_id: str, module_id: str) -> dict[str, object] | None:
        if module_id != "automation":
            return None
        return self._automation_configs.get(location_id)

    def set_module_config(
        self,
        location_id: str,
        module_id: str,
        config: dict[str, object],
    ) -> None:
        if module_id != "automation":
            return
        self._automation_configs[location_id] = config


@dataclass(slots=True)
class _AutomationEntity:
    entity_id: str
    raw_config: dict[str, object]


def _metadata_line(
    location_id: str,
    trigger_type: str,
    *,
    run_on_startup: bool | None = None,
) -> str:
    payload: dict[str, object] = {
        "version": 1,
        "location_id": location_id,
        "trigger_type": trigger_type,
    }
    if isinstance(run_on_startup, bool):
        payload["run_on_startup"] = run_on_startup
    return (
        f"Managed by Topomation\n"
        f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(payload)}"
    )


async def test_occupancy_transition_emits_summary_event(hass: HomeAssistant) -> None:
    """Occupancy transitions should emit action summary events scoped by trigger type."""
    location_id = "area_kitchen"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.kitchen_on_occupied",
                raw_config={"description": _metadata_line(location_id, "on_occupied")},
            ),
            _AutomationEntity(
                entity_id="automation.kitchen_on_vacant",
                raw_config={"description": _metadata_line(location_id, "on_vacant")},
            ),
        ]
    )
    hass.states.async_set("automation.kitchen_on_occupied", "on")
    hass.states.async_set("automation.kitchen_on_vacant", "on")

    events = async_capture_events(hass, EVENT_TOPOMATION_ACTIONS_SUMMARY)
    await runtime.async_setup()

    event_bus.publish(
        Event(
            type="occupancy.changed",
            source="occupancy",
            location_id=location_id,
            payload={"occupied": True},
        )
    )
    await hass.async_block_till_done()

    assert events
    summary = events[-1].data
    assert summary["phase"] == "occupancy_transition"
    assert summary["location_id"] == location_id
    assert summary["transition"] == "occupied"
    assert summary["total_automations"] == 1
    assert summary["automations"] == ["automation.kitchen_on_occupied"]

    await runtime.async_teardown()


async def test_setup_schedules_startup_reapply_before_automation_entities_exist(
    hass: HomeAssistant,
) -> None:
    """Startup replay should not depend on automation entities being loaded at setup."""
    location_manager = _LocationManager({"area_kitchen": {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus)

    hass.state = CoreState.running
    schedule = Mock()

    with patch.object(runtime, "_schedule_startup_reapply", schedule):
        await runtime.async_setup()

    schedule.assert_called_once_with()
    await runtime.async_teardown()


async def test_startup_reapply_reports_failures(hass: HomeAssistant) -> None:
    """Startup reapply should summarize totals and include failure details."""
    location_id = "area_kitchen"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus, startup_delay_seconds=0)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.kitchen_primary",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_occupied",
                        run_on_startup=True,
                    )
                },
            ),
            _AutomationEntity(
                entity_id="automation.kitchen_secondary",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_occupied",
                        run_on_startup=True,
                    )
                },
            ),
        ]
    )
    hass.states.async_set("automation.kitchen_primary", "on")
    hass.states.async_set("automation.kitchen_secondary", "on")
    hass.states.async_set(
        "binary_sensor.kitchen_occupancy",
        "on",
        {"device_class": "occupancy", "location_id": location_id},
    )

    mock_async_call = AsyncMock(side_effect=[None, RuntimeError("boom")])

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        events = async_capture_events(hass, EVENT_TOPOMATION_ACTIONS_SUMMARY)
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

        assert mock_async_call.await_count == 2
        mock_async_call.assert_any_await(
            "automation",
            "trigger",
            {"entity_id": "automation.kitchen_primary", "skip_condition": False},
            blocking=True,
        )
        mock_async_call.assert_any_await(
            "automation",
            "trigger",
            {"entity_id": "automation.kitchen_secondary", "skip_condition": False},
            blocking=True,
        )

    assert events
    summary = events[-1].data
    assert summary["phase"] == "startup_reapply"
    assert summary["location_id"] == location_id
    assert summary["transition"] == "occupied"
    assert summary["total_automations"] == 2
    assert summary["triggered_automations"] == 1
    assert summary["failed_automations"] == 1
    assert len(summary["failure_details"]) == 1


async def test_startup_reapply_runs_ambient_rules_without_occupancy_sensor(
    hass: HomeAssistant,
) -> None:
    """Ambient startup rules should not be blocked by missing occupancy state."""
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus, startup_delay_seconds=0)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_dark",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "state",
                            "entity_id": "sun.sun",
                            "to": "below_horizon",
                        }
                    ],
                },
            ),
            _AutomationEntity(
                entity_id="automation.porch_occupied",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_occupied",
                        run_on_startup=True,
                    )
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_dark", "on")
    hass.states.async_set("automation.porch_occupied", "on")
    hass.states.async_set("sun.sun", "below_horizon")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        events = async_capture_events(hass, EVENT_TOPOMATION_ACTIONS_SUMMARY)
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_awaited_once_with(
        "automation",
        "trigger",
        {"entity_id": "automation.porch_dark", "skip_condition": False},
        blocking=True,
    )
    assert events
    summary = events[-1].data
    assert summary["transition"] == "unknown"
    assert summary["occupancy_skip_reason"] == "missing_occupancy_entity"
    assert summary["total_automations"] == 1
    assert summary["triggered_automations"] == 1


async def test_startup_reapply_waits_for_lux_before_ambient_rule(
    hass: HomeAssistant,
) -> None:
    """Ambient startup replay should wait for lux sensors during the reconcile window."""
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(
        hass,
        location_manager,
        event_bus,
        startup_delay_seconds=0,
        startup_reconcile_interval_seconds=30,
        startup_reconcile_timeout_seconds=60,
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_dark",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "numeric_state",
                            "entity_id": "sensor.porch_lux",
                            "below": 800,
                        }
                    ],
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_dark", "on")
    hass.states.async_set("sensor.porch_lux", "unknown")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        events = async_capture_events(hass, EVENT_TOPOMATION_ACTIONS_SUMMARY)
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()
        mock_async_call.assert_not_awaited()

        hass.states.async_set("sensor.porch_lux", "3")
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_awaited_once_with(
        "automation",
        "trigger",
        {"entity_id": "automation.porch_dark", "skip_condition": False},
        blocking=True,
    )
    assert events[0].data["pending_automations"] == 1
    assert events[0].data["pending_details"][0]["reason"] == "waiting_for_lux_state"
    assert events[-1].data["triggered_automations"] == 1
    await runtime.async_teardown()


async def test_startup_reapply_uses_sun_fallback_after_lux_timeout(
    hass: HomeAssistant,
) -> None:
    """After the bounded wait, ambient startup rules may fall back to HA conditions."""
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(
        hass,
        location_manager,
        event_bus,
        startup_delay_seconds=0,
        startup_reconcile_interval_seconds=30,
        startup_reconcile_timeout_seconds=0,
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_dark",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "numeric_state",
                            "entity_id": "sensor.porch_lux",
                            "below": 800,
                        },
                        {
                            "trigger": "state",
                            "entity_id": "sun.sun",
                            "to": "below_horizon",
                        },
                    ],
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_dark", "on")
    hass.states.async_set("sensor.porch_lux", "unavailable")
    hass.states.async_set("sun.sun", "below_horizon")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        events = async_capture_events(hass, EVENT_TOPOMATION_ACTIONS_SUMMARY)
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_awaited_once_with(
        "automation",
        "trigger",
        {"entity_id": "automation.porch_dark", "skip_condition": False},
        blocking=True,
    )
    assert events[-1].data["reconcile_timed_out"] is True
    assert events[-1].data["triggered_automations"] == 1
    await runtime.async_teardown()


async def test_startup_reapply_skips_on_dark_when_currently_bright(
    hass: HomeAssistant,
) -> None:
    """Midday restart must not fire on_dark rules — the trigger threshold is bypassed
    by automation.trigger, so the runtime must evaluate current lux directly.
    """
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(
        hass,
        location_manager,
        event_bus,
        startup_delay_seconds=0,
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_dark",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "numeric_state",
                            "entity_id": "sensor.porch_lux",
                            "below": 50,
                        }
                    ],
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_dark", "on")
    hass.states.async_set("sensor.porch_lux", "1200")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_not_awaited()
    await runtime.async_teardown()


async def test_startup_reapply_runs_when_any_ambient_fallback_source_matches(
    hass: HomeAssistant,
) -> None:
    """Startup precheck should let HA conditions arbitrate multi-source ambient rules."""
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(
        hass,
        location_manager,
        event_bus,
        startup_delay_seconds=0,
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_bright",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_bright",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "numeric_state",
                            "entity_id": "sensor.room_lux",
                            "above": 1200,
                        },
                        {
                            "trigger": "state",
                            "entity_id": "sun.sun",
                            "to": "above_horizon",
                        },
                    ],
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_bright", "on")
    hass.states.async_set("sensor.room_lux", "20")
    hass.states.async_set("sun.sun", "above_horizon")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_awaited_once_with(
        "automation",
        "trigger",
        {"entity_id": "automation.porch_bright", "skip_condition": False},
        blocking=True,
    )
    await runtime.async_teardown()


async def test_startup_reapply_skips_on_dark_when_sun_above_horizon(
    hass: HomeAssistant,
) -> None:
    """Sun-fallback on_dark rules must not fire during the day."""
    location_id = "area_porch"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(
        hass,
        location_manager,
        event_bus,
        startup_delay_seconds=0,
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.porch_dark_sun",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "state",
                            "entity_id": "sun.sun",
                            "to": "below_horizon",
                        }
                    ],
                },
            ),
        ]
    )
    hass.states.async_set("automation.porch_dark_sun", "on")
    hass.states.async_set("sun.sun", "above_horizon")

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_not_awaited()
    await runtime.async_teardown()


async def test_startup_reapply_honors_per_rule_run_on_startup_without_global_flag(
    hass: HomeAssistant,
) -> None:
    """Explicit per-rule startup opt-in should work without a location-global flag."""
    location_id = "area_kitchen"
    location_manager = _LocationManager({location_id: {}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus, startup_delay_seconds=0)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.kitchen_dark",
                raw_config={
                    "description": _metadata_line(
                        location_id,
                        "on_dark",
                        run_on_startup=True,
                    ),
                    "triggers": [
                        {
                            "trigger": "state",
                            "entity_id": "sun.sun",
                            "to": "below_horizon",
                        }
                    ],
                },
            ),
            _AutomationEntity(
                entity_id="automation.kitchen_occupied",
                raw_config={"description": _metadata_line(location_id, "on_occupied")},
            ),
        ]
    )
    hass.states.async_set("automation.kitchen_dark", "on")
    hass.states.async_set("automation.kitchen_occupied", "on")
    hass.states.async_set("sun.sun", "below_horizon")
    hass.states.async_set(
        "binary_sensor.kitchen_occupancy",
        "on",
        {"device_class": "occupancy", "location_id": location_id},
    )

    mock_async_call = AsyncMock(return_value=None)

    with patch("homeassistant.core.ServiceRegistry.async_call", new=mock_async_call):
        await runtime.async_reapply_startup_actions()
        await hass.async_block_till_done()

    mock_async_call.assert_awaited_once_with(
        "automation",
        "trigger",
        {"entity_id": "automation.kitchen_dark", "skip_condition": False},
        blocking=True,
    )
