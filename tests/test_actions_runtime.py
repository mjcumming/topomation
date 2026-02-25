"""Tests for occupied/vacant actions runtime observers."""

from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from unittest.mock import AsyncMock

from home_topology import Event, EventBus
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import async_capture_events

from custom_components.topomation.actions_runtime import TopomationActionsRuntime
from custom_components.topomation.const import (
    AUTOMATION_REAPPLY_CONFIG_KEY,
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


def _metadata_line(location_id: str, trigger_type: str) -> str:
    return (
        f"Managed by Topomation\n"
        f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} "
        f'{{"version":1,"location_id":"{location_id}","trigger_type":"{trigger_type}"}}'
    )


async def test_occupancy_transition_emits_summary_event(hass: HomeAssistant) -> None:
    """Occupancy transitions should emit action summary events scoped by trigger type."""
    location_id = "area_kitchen"
    location_manager = _LocationManager({location_id: {AUTOMATION_REAPPLY_CONFIG_KEY: False}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.kitchen_on_occupied",
                raw_config={"description": _metadata_line(location_id, "occupied")},
            ),
            _AutomationEntity(
                entity_id="automation.kitchen_on_vacant",
                raw_config={"description": _metadata_line(location_id, "vacant")},
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


async def test_startup_reapply_reports_failures(hass: HomeAssistant) -> None:
    """Startup reapply should summarize totals and include failure details."""
    location_id = "area_kitchen"
    location_manager = _LocationManager({location_id: {AUTOMATION_REAPPLY_CONFIG_KEY: True}})
    event_bus = EventBus()
    runtime = TopomationActionsRuntime(hass, location_manager, event_bus, startup_delay_seconds=0)

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            _AutomationEntity(
                entity_id="automation.kitchen_primary",
                raw_config={"description": _metadata_line(location_id, "occupied")},
            ),
            _AutomationEntity(
                entity_id="automation.kitchen_secondary",
                raw_config={"description": _metadata_line(location_id, "occupied")},
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
    hass.services.async_call = mock_async_call

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
