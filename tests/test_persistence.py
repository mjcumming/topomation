"""Tests for topology configuration persistence."""

from __future__ import annotations

from unittest.mock import Mock

from home_topology import LocationManager
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from custom_components.home_topology import _load_configuration, _save_state
from custom_components.home_topology.const import STORAGE_KEY_CONFIG, STORAGE_VERSION


async def test_save_and_restore_topology_configuration(hass: HomeAssistant) -> None:
    """Persisted location hierarchy and configs should restore on startup."""
    source_mgr = LocationManager()
    source_mgr.create_location(id="house", name="House", is_explicit_root=True)
    source_mgr.create_location(
        id="office",
        name="Office",
        parent_id="house",
        is_explicit_root=False,
        order=3,
    )
    source_mgr.add_entity_to_location("light.office", "office")
    source_mgr.set_module_config("office", "_meta", {"type": "room", "sync_source": "topology"})
    source_mgr.set_module_config("office", "occupancy", {"enabled": True, "timeout": 120})

    occupancy = Mock()
    occupancy.dump_state.return_value = {"dummy": "state"}
    modules = {"occupancy": occupancy}

    await _save_state(hass, "test_entry", source_mgr, modules)

    restored_mgr = LocationManager()
    restored_mgr.create_location(id="house", name="House", is_explicit_root=True)
    await _load_configuration(hass, restored_mgr)

    office = restored_mgr.get_location("office")
    assert office is not None
    assert office.parent_id == "house"
    assert office.order == 3
    assert "light.office" in office.entity_ids
    assert restored_mgr.get_module_config("office", "occupancy")["timeout"] == 120


async def test_invalid_saved_configuration_is_ignored(hass: HomeAssistant) -> None:
    """Invalid configuration payloads should not break setup."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": "invalid"})

    loc_mgr = LocationManager()
    loc_mgr.create_location(id="house", name="House", is_explicit_root=True)

    await _load_configuration(hass, loc_mgr)

    # Root remains available and load did not crash.
    assert loc_mgr.get_location("house") is not None
