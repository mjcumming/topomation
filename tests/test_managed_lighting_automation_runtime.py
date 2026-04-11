"""Runtime tests: Topomation-shaped automations actually drive lights in Home Assistant.

Uses the same trigger/condition builders as production (`TopomationManagedActions`) and
HA's `automation` component so we validate compiled rules, not only YAML structure.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.components import light as light_integration
from homeassistant.components.automation.config import async_validate_config_item
from homeassistant.components.light import ColorMode, LightEntity
from homeassistant.const import CONF_ID, STATE_OFF, STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, setup_test_component_platform

from custom_components.topomation.const import DOMAIN, TOPOMATION_AUTOMATION_METADATA_PREFIX
from custom_components.topomation.managed_actions import TopomationManagedActions
from custom_components.topomation.websocket_api import (
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    handle_locations_set_module_config,
)


class _TestOnOffLight(LightEntity):
    """Minimal on/off light for service + automation assertions."""

    _attr_supported_color_modes = frozenset({ColorMode.ONOFF})
    _attr_color_mode = ColorMode.ONOFF
    _attr_is_on = False

    def __init__(self, unique_fragment: str) -> None:
        super().__init__()
        self._attr_unique_id = f"e2e_lt_{unique_fragment}"
        # Friendly name is the stable handle for tests (registry unique_id keys vary by HA version).
        self._attr_name = f"E2E {unique_fragment}"

    async def async_turn_on(self, **kwargs: Any) -> None:
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._attr_is_on = False
        self.async_write_ha_state()


def _light_entity_id_by_friendly_name(hass: HomeAssistant, friendly: str) -> str:
    for eid in hass.states.async_entity_ids("light"):
        state = hass.states.get(eid)
        if state and state.attributes.get("friendly_name") == friendly:
            return eid
    raise AssertionError(f"No light with friendly_name={friendly!r}")


def _ha_actions_from_normalized(
    manager: TopomationManagedActions, normalized_actions: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Mirror managed `async_create_rule` action serialization (incl. only_if_off)."""
    config_actions: list[dict[str, Any]] = []
    for action_target in normalized_actions:
        action_entity = str(action_target["entity_id"])
        action_service_name = str(action_target["service"])
        action_domain = (
            action_entity.split(".", 1)[0]
            if "." in action_entity
            else "homeassistant"
        )
        action_step: dict[str, Any] = {
            "action": f"{action_domain}.{action_service_name}",
            "target": {"entity_id": action_entity},
        }
        action_step_data = action_target.get("data")
        if isinstance(action_step_data, Mapping) and action_step_data:
            action_step["data"] = dict(action_step_data)
        only_if_off = (
            bool(action_target.get("only_if_off"))
            if manager._action_supports_only_if_off(action_entity, action_service_name)
            else False
        )
        if only_if_off:
            config_actions.append(
                {
                    "choose": [
                        {
                            "conditions": [
                                {
                                    "condition": "state",
                                    "entity_id": action_entity,
                                    "state": "off",
                                }
                            ],
                            "sequence": [action_step],
                        }
                    ]
                }
            )
        else:
            config_actions.append(action_step)
    return config_actions


def _metadata_stub(
    *,
    location_id: str,
    trigger_type: str,
    ambient_condition: str = "any",
    must_be_occupied: bool | None = None,
    time_condition_enabled: bool = False,
    start_time: str = "00:00",
    end_time: str = "23:59",
) -> str:
    payload: dict[str, Any] = {
        "version": 4,
        "location_id": location_id,
        "trigger_type": trigger_type,
        "trigger_types": [trigger_type],
        "ambient_condition": ambient_condition,
        "time_condition_enabled": time_condition_enabled,
        "start_time": start_time,
        "end_time": end_time,
        "rule_uuid": f"e2e_{trigger_type[:8]}",
    }
    if isinstance(must_be_occupied, bool):
        payload["must_be_occupied"] = must_be_occupied
    return f"Managed by Topomation.\n{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(payload)}"


async def _validated_rule_dict(
    hass: HomeAssistant,
    manager: TopomationManagedActions,
    automation_id: str,
    *,
    alias: str,
    location_id: str,
    trigger_types: tuple[str, ...],
    occupancy_entity_id: str | None,
    ambient_config: dict[str, Any],
    ambient_condition: str,
    must_be_occupied: bool | None = None,
    time_condition_enabled: bool = False,
    start_time: str = "00:00",
    end_time: str = "23:59",
    normalized_actions: list[dict[str, Any]],
) -> dict[str, Any]:
    triggers = manager._build_trigger_definitions(
        trigger_types=trigger_types,  # type: ignore[arg-type]
        occupancy_entity_id=occupancy_entity_id,
        ambient_config=ambient_config,
    )
    conditions = manager._build_condition_definitions(
        ambient_condition=ambient_condition,  # type: ignore[arg-type]
        must_be_occupied=must_be_occupied,
        occupancy_entity_id=occupancy_entity_id,
        time_condition_enabled=time_condition_enabled,
        start_time=start_time,
        end_time=end_time,
        ambient_config=ambient_config,
    )
    payload: dict[str, Any] = {
        CONF_ID: automation_id,
        "alias": alias,
        "description": _metadata_stub(
            location_id=location_id,
            trigger_type=trigger_types[0],
            ambient_condition=ambient_condition,
            must_be_occupied=must_be_occupied,
            time_condition_enabled=time_condition_enabled,
            start_time=start_time,
            end_time=end_time,
        ),
        "triggers": triggers,
        "conditions": conditions,
        "actions": _ha_actions_from_normalized(manager, normalized_actions),
        "mode": "single",
    }
    validated = await async_validate_config_item(hass, automation_id, payload)
    assert validated is not None
    return dict(validated)


async def _compile_and_load(
    hass: HomeAssistant,
    manager: TopomationManagedActions,
    automation_id: str,
    *,
    alias: str,
    location_id: str,
    trigger_types: tuple[str, ...],
    occupancy_entity_id: str | None,
    ambient_config: dict[str, Any],
    ambient_condition: str,
    must_be_occupied: bool | None = None,
    time_condition_enabled: bool = False,
    start_time: str = "00:00",
    end_time: str = "23:59",
    normalized_actions: list[dict[str, Any]],
) -> None:
    one = await _validated_rule_dict(
        hass,
        manager,
        automation_id,
        alias=alias,
        location_id=location_id,
        trigger_types=trigger_types,
        occupancy_entity_id=occupancy_entity_id,
        ambient_config=ambient_config,
        ambient_condition=ambient_condition,
        must_be_occupied=must_be_occupied,
        time_condition_enabled=time_condition_enabled,
        start_time=start_time,
        end_time=end_time,
        normalized_actions=normalized_actions,
    )
    assert await async_setup_component(hass, "automation", {"automation": [one]})
    await hass.async_block_till_done()


async def _base_runtime_setup(hass: HomeAssistant) -> tuple[str, str, TopomationManagedActions]:
    """Lights + sun; return (light_a_id, light_b_id, manager)."""
    light_a = _TestOnOffLight("a")
    light_b = _TestOnOffLight("b")
    setup_test_component_platform(hass, "light", [light_a, light_b])
    assert await async_setup_component(
        hass,
        light_integration.DOMAIN,
        {light_integration.DOMAIN: [{"platform": "test"}]},
    )
    assert await async_setup_component(hass, "sun", {})
    await hass.async_block_till_done()

    eid_a = _light_entity_id_by_friendly_name(hass, "E2E a")
    eid_b = _light_entity_id_by_friendly_name(hass, "E2E b")
    return eid_a, eid_b, TopomationManagedActions(hass)


@pytest.mark.asyncio
async def test_on_occupied_turn_on_runs(hass: HomeAssistant) -> None:
    """on_occupied should turn the light on when occupancy goes on."""
    occ = "binary_sensor.rt_occ_a"
    light_a, _light_b, manager = await _base_runtime_setup(hass)

    hass.states.async_set(occ, STATE_OFF)
    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on"}],
        trigger_type="on_occupied",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_occ_on",
        alias="RT occ on",
        location_id="room_rt",
        trigger_types=("on_occupied",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="any",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_ON


@pytest.mark.asyncio
async def test_on_occupied_only_if_off_skips_when_light_already_on(hass: HomeAssistant) -> None:
    """only_if_off + turn_on should not run when light is already on (brightness guard use-case)."""
    occ = "binary_sensor.rt_occ_only_if_off"
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(occ, STATE_OFF)
    await hass.services.async_call("light", "turn_on", {"entity_id": light_a}, blocking=True)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_ON

    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on", "only_if_off": True}],
        trigger_type="on_occupied",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_only_if_off",
        alias="RT only off",
        location_id="room_rt",
        trigger_types=("on_occupied",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="any",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    # Still on, not toggled / no duplicate side effects; state remains on
    assert hass.states.get(light_a).state == STATE_ON


@pytest.mark.asyncio
async def test_on_vacant_turn_off_runs(hass: HomeAssistant) -> None:
    """on_vacant should turn the light off."""
    occ = "binary_sensor.rt_occ_vac"
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(occ, STATE_ON)
    await hass.services.async_call("light", "turn_on", {"entity_id": light_a}, blocking=True)
    await hass.async_block_till_done()

    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_off"}],
        trigger_type="on_vacant",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_vac_off",
        alias="RT vac",
        location_id="room_rt",
        trigger_types=("on_vacant",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="any",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_OFF)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_OFF


@pytest.mark.asyncio
async def test_on_dark_sun_trigger_turns_on(hass: HomeAssistant) -> None:
    """on_dark with sun-only ambient should fire when sun goes below horizon."""
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(
        "sun.sun",
        "above_horizon",
        {
            "next_dawn": "2026-04-10T06:00:00+00:00",
            "next_dusk": "2026-04-10T18:00:00+00:00",
            "next_midnight": "2026-04-10T00:00:00+00:00",
            "next_noon": "2026-04-10T12:00:00+00:00",
            "next_rising": "2026-04-10T06:30:00+00:00",
            "next_setting": "2026-04-10T17:30:00+00:00",
        },
    )
    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on"}],
        trigger_type="on_dark",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_dark_sun",
        alias="RT dark sun",
        location_id="room_rt",
        trigger_types=("on_dark",),
        occupancy_entity_id="binary_sensor.unused",
        ambient_config={
            "lux_sensor": None,
            "dark_threshold": 50.0,
            "bright_threshold": 500.0,
            "fallback_to_sun": True,
        },
        ambient_condition="any",
        normalized_actions=normalized,
    )

    hass.states.async_set(
        "sun.sun",
        "below_horizon",
        {
            "next_dawn": "2026-04-11T06:00:00+00:00",
            "next_dusk": "2026-04-11T18:00:00+00:00",
            "next_midnight": "2026-04-11T00:00:00+00:00",
            "next_noon": "2026-04-11T12:00:00+00:00",
            "next_rising": "2026-04-11T06:30:00+00:00",
            "next_setting": "2026-04-11T17:30:00+00:00",
        },
    )
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_ON


@pytest.mark.asyncio
async def test_on_bright_sun_trigger_turns_off(hass: HomeAssistant) -> None:
    """on_bright with sun-only trigger should fire when sun goes above horizon."""
    light_a, _b, manager = await _base_runtime_setup(hass)
    await hass.services.async_call("light", "turn_on", {"entity_id": light_a}, blocking=True)
    await hass.async_block_till_done()

    hass.states.async_set(
        "sun.sun",
        "below_horizon",
        {
            "next_dawn": "2026-04-11T06:00:00+00:00",
            "next_dusk": "2026-04-11T18:00:00+00:00",
            "next_midnight": "2026-04-11T00:00:00+00:00",
            "next_noon": "2026-04-11T12:00:00+00:00",
            "next_rising": "2026-04-11T06:30:00+00:00",
            "next_setting": "2026-04-11T17:30:00+00:00",
        },
    )
    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_off"}],
        trigger_type="on_bright",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_bright_sun",
        alias="RT bright",
        location_id="room_rt",
        trigger_types=("on_bright",),
        occupancy_entity_id="binary_sensor.unused2",
        ambient_config={
            "lux_sensor": None,
            "dark_threshold": 50.0,
            "bright_threshold": 500.0,
            "fallback_to_sun": True,
        },
        ambient_condition="any",
        normalized_actions=normalized,
    )

    hass.states.async_set(
        "sun.sun",
        "above_horizon",
        {
            "next_dawn": "2026-04-10T06:00:00+00:00",
            "next_dusk": "2026-04-10T18:00:00+00:00",
            "next_midnight": "2026-04-10T00:00:00+00:00",
            "next_noon": "2026-04-10T12:00:00+00:00",
            "next_rising": "2026-04-10T06:30:00+00:00",
            "next_setting": "2026-04-10T17:30:00+00:00",
        },
    )
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_OFF


@pytest.mark.asyncio
@pytest.mark.freeze_time("2026-04-10T14:00:00+00:00")
async def test_time_condition_allows_inside_window(hass: HomeAssistant, freezer) -> None:  # noqa: ARG001
    """Time-gated on_occupied should run inside after/before."""
    await hass.config.async_set_time_zone("UTC")
    assert dt_util.utcnow().hour == 14
    occ = "binary_sensor.rt_time_in"
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(occ, STATE_OFF)

    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on"}],
        trigger_type="on_occupied",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_time_ok",
        alias="RT time ok",
        location_id="room_rt",
        trigger_types=("on_occupied",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="any",
        time_condition_enabled=True,
        start_time="09:00",
        end_time="18:00",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_ON


@pytest.mark.asyncio
@pytest.mark.freeze_time("2026-04-10T20:00:00+00:00")
async def test_time_condition_blocks_outside_window(hass: HomeAssistant, freezer) -> None:  # noqa: ARG001
    """Time-gated on_occupied should not run outside after/before (same-day window)."""
    await hass.config.async_set_time_zone("UTC")
    assert dt_util.utcnow().hour == 20
    occ = "binary_sensor.rt_time_out"
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(occ, STATE_OFF)

    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on"}],
        trigger_type="on_occupied",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_time_block",
        alias="RT time block",
        location_id="room_rt",
        trigger_types=("on_occupied",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="any",
        time_condition_enabled=True,
        start_time="09:00",
        end_time="18:00",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_OFF


@pytest.mark.asyncio
async def test_on_dark_lux_numeric_trigger_with_must_be_occupied(hass: HomeAssistant) -> None:
    """Lux on_dark numeric trigger + must_be_occupied: fires only when room occupied."""
    lux_id = "sensor.rt_lux_dark"
    occ = "binary_sensor.rt_occ_dark_cond"
    _light_a, light_b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(lux_id, "200", {"unit_of_measurement": "lx"})
    hass.states.async_set(occ, STATE_OFF)

    ambient_cfg = {
        "lux_sensor": lux_id,
        "dark_threshold": 50.0,
        "bright_threshold": 500.0,
        "fallback_to_sun": False,
    }
    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_b, "service": "turn_on"}],
        trigger_type="on_dark",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_dark_lux",
        alias="RT dark lux",
        location_id="room_rt",
        trigger_types=("on_dark",),
        occupancy_entity_id=occ,
        ambient_config=ambient_cfg,
        ambient_condition="any",
        must_be_occupied=True,
        normalized_actions=normalized,
    )

    hass.states.async_set(lux_id, "40", {"unit_of_measurement": "lx"})
    await hass.async_block_till_done()
    assert hass.states.get(light_b).state == STATE_OFF

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    hass.states.async_set(lux_id, "200", {"unit_of_measurement": "lx"})
    await hass.async_block_till_done()
    hass.states.async_set(lux_id, "30", {"unit_of_measurement": "lx"})
    await hass.async_block_till_done()
    assert hass.states.get(light_b).state == STATE_ON


@pytest.mark.asyncio
async def test_ambient_dark_condition_blocks_when_sun_up(hass: HomeAssistant) -> None:
    """ambient_condition=dark adds sun-below condition for on_occupied (require_dark-style)."""
    occ = "binary_sensor.rt_occ_dark_guard"
    light_a, _b, manager = await _base_runtime_setup(hass)
    hass.states.async_set(occ, STATE_OFF)
    hass.states.async_set(
        "sun.sun",
        "above_horizon",
        {
            "next_dawn": "2026-04-10T06:00:00+00:00",
            "next_dusk": "2026-04-10T18:00:00+00:00",
            "next_midnight": "2026-04-10T00:00:00+00:00",
            "next_noon": "2026-04-10T12:00:00+00:00",
            "next_rising": "2026-04-10T06:30:00+00:00",
            "next_setting": "2026-04-10T17:30:00+00:00",
        },
    )

    normalized = manager._normalize_rule_actions(
        actions=[{"entity_id": light_a, "service": "turn_on"}],
        trigger_type="on_occupied",
        fallback_entity_id=None,
        fallback_service=None,
        fallback_data=None,
    )
    await _compile_and_load(
        hass,
        manager,
        "topomation_rt_dark_cond",
        alias="RT dark cond",
        location_id="room_rt",
        trigger_types=("on_occupied",),
        occupancy_entity_id=occ,
        ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        ambient_condition="dark",
        normalized_actions=normalized,
    )

    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_OFF

    hass.states.async_set(
        "sun.sun",
        "below_horizon",
        {
            "next_dawn": "2026-04-11T06:00:00+00:00",
            "next_dusk": "2026-04-11T18:00:00+00:00",
            "next_midnight": "2026-04-11T00:00:00+00:00",
            "next_noon": "2026-04-11T12:00:00+00:00",
            "next_rising": "2026-04-11T06:30:00+00:00",
            "next_setting": "2026-04-11T17:30:00+00:00",
        },
    )
    hass.states.async_set(occ, STATE_OFF)
    await hass.async_block_till_done()
    hass.states.async_set(occ, STATE_ON)
    await hass.async_block_till_done()
    assert hass.states.get(light_a).state == STATE_ON


@pytest.mark.asyncio
async def test_grouped_occupancy_vacant_turns_off_each_room_light(hass: HomeAssistant) -> None:
    """When grouped areas vacate together, each location's on_vacant rule can turn its light off."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)
    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    occupancy_module = kernel["modules"]["occupancy"]

    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_gr_kitchen", name="G Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_gr_kitchen", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_gr_family", name="G Family", parent_id="floor_main")
    loc_mgr.set_module_config("area_gr_family", "_meta", {"type": "area"})
    await hass.async_block_till_done()

    entity_registry = er.async_get(hass)
    kitchen_occ = entity_registry.async_get_entity_id(
        "binary_sensor", DOMAIN, "occupancy_area_gr_kitchen"
    )
    family_occ = entity_registry.async_get_entity_id(
        "binary_sensor", DOMAIN, "occupancy_area_gr_family"
    )
    assert kitchen_occ and family_occ

    lt_k = _TestOnOffLight("gr_kitchen")
    lt_f = _TestOnOffLight("gr_family")
    setup_test_component_platform(hass, "light", [lt_k, lt_f])
    assert await async_setup_component(
        hass,
        light_integration.DOMAIN,
        {light_integration.DOMAIN: [{"platform": "test"}]},
    )
    assert await async_setup_component(hass, "sun", {})
    await hass.async_block_till_done()
    eid_k = _light_entity_id_by_friendly_name(hass, "E2E gr_kitchen")
    eid_f = _light_entity_id_by_friendly_name(hass, "E2E gr_family")

    await hass.services.async_call("light", "turn_on", {"entity_id": eid_k}, blocking=True)
    await hass.services.async_call("light", "turn_on", {"entity_id": eid_f}, blocking=True)
    await hass.async_block_till_done()

    manager = TopomationManagedActions(hass)
    validated_automations: list[dict[str, Any]] = []
    for aid, occ_eid, lt_eid, room in (
        ("topomation_gr_k_v", kitchen_occ, eid_k, "area_gr_kitchen"),
        ("topomation_gr_f_v", family_occ, eid_f, "area_gr_family"),
    ):
        normalized = manager._normalize_rule_actions(
            actions=[{"entity_id": lt_eid, "service": "turn_off"}],
            trigger_type="on_vacant",
            fallback_entity_id=None,
            fallback_service=None,
            fallback_data=None,
        )
        validated_automations.append(
            await _validated_rule_dict(
                hass,
                manager,
                aid,
                alias=f"Vac {room}",
                location_id=room,
                trigger_types=("on_vacant",),
                occupancy_entity_id=occ_eid,
                ambient_config={"lux_sensor": None, "fallback_to_sun": True},
                ambient_condition="any",
                normalized_actions=normalized,
            )
        )
    assert await async_setup_component(
        hass, "automation", {"automation": validated_automations}
    )
    await hass.async_block_till_done()

    ws_conn = Mock()
    ws_conn.send_result = Mock()
    ws_conn.send_error = Mock()
    for lid, req in (("area_gr_kitchen", 5511), ("area_gr_family", 5512)):
        handle_locations_set_module_config(
            hass,
            ws_conn,
            {
                "id": req,
                "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
                "location_id": lid,
                "module_id": "occupancy",
                "config": {
                    "enabled": True,
                    "occupancy_sources": [],
                    "occupancy_group_id": "grp_rt",
                },
                "entry_id": entry.entry_id,
            },
        )
    await hass.async_block_till_done()
    ws_conn.send_error.assert_not_called()

    base = datetime(2026, 1, 1, tzinfo=UTC)
    occupancy_module.trigger("area_gr_family", "sensor.family_motion", 60, now=base)
    await hass.async_block_till_done()
    assert hass.states.get(kitchen_occ).state == "on"
    assert hass.states.get(family_occ).state == "on"

    occupancy_module.check_timeouts(base + timedelta(seconds=61))
    await hass.async_block_till_done()

    assert hass.states.get(kitchen_occ).state == "off"
    assert hass.states.get(family_occ).state == "off"
    assert hass.states.get(eid_k).state == STATE_OFF
    assert hass.states.get(eid_f).state == STATE_OFF
