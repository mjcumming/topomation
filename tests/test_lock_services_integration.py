"""Integration tests: lock/unlock services through real kernel to occupancy entities."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation.const import DOMAIN


@pytest.mark.asyncio
async def test_lock_unlock_and_unlock_all_update_occupancy_entity(hass: HomeAssistant) -> None:
    """topomation.lock / unlock / unlock_all should update binary_sensor attributes (wiring)."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]

    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_lock_demo", name="Lock Demo", parent_id="floor_main")
    loc_mgr.set_module_config("area_lock_demo", "_meta", {"type": "area"})
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    entity_id = registry.async_get_entity_id("binary_sensor", DOMAIN, "occupancy_area_lock_demo")
    assert entity_id is not None

    state = hass.states.get(entity_id)
    assert state is not None
    assert state.attributes.get("is_locked") is not True

    await hass.services.async_call(
        DOMAIN,
        "lock",
        {
            "location_id": "area_lock_demo",
            "source_id": "integration_test",
            "mode": "freeze",
            "scope": "self",
            "entry_id": entry.entry_id,
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    locked = hass.states.get(entity_id)
    assert locked is not None
    assert locked.attributes.get("is_locked") is True
    assert "integration_test" in (locked.attributes.get("locked_by") or [])

    await hass.services.async_call(
        DOMAIN,
        "unlock",
        {
            "location_id": "area_lock_demo",
            "source_id": "integration_test",
            "entry_id": entry.entry_id,
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    unlocked = hass.states.get(entity_id)
    assert unlocked is not None
    assert unlocked.attributes.get("is_locked") is not True

    await hass.services.async_call(
        DOMAIN,
        "lock",
        {
            "location_id": "area_lock_demo",
            "source_id": "lock_a",
            "mode": "block_vacant",
            "scope": "self",
            "entry_id": entry.entry_id,
        },
        blocking=True,
    )
    await hass.services.async_call(
        DOMAIN,
        "lock",
        {
            "location_id": "area_lock_demo",
            "source_id": "lock_b",
            "mode": "freeze",
            "scope": "self",
            "entry_id": entry.entry_id,
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    multi = hass.states.get(entity_id)
    assert multi is not None
    assert multi.attributes.get("is_locked") is True
    locked_by = multi.attributes.get("locked_by") or []
    assert "lock_a" in locked_by
    assert "lock_b" in locked_by

    await hass.services.async_call(
        DOMAIN,
        "unlock_all",
        {
            "location_id": "area_lock_demo",
            "entry_id": entry.entry_id,
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    cleared = hass.states.get(entity_id)
    assert cleared is not None
    assert cleared.attributes.get("is_locked") is not True
