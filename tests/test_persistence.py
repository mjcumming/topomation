"""Tests for topology configuration persistence."""

from __future__ import annotations

from unittest.mock import Mock

from home_topology import LocationManager
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from custom_components.topomation import _load_configuration, _save_state
from custom_components.topomation.const import STORAGE_KEY_CONFIG, STORAGE_VERSION


async def test_save_and_restore_topology_configuration(hass: HomeAssistant) -> None:
    """Persisted location hierarchy and configs should restore on startup."""
    source_mgr = LocationManager()
    source_mgr.create_location(
        id="office",
        name="Office",
        parent_id=None,
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
    await _load_configuration(hass, restored_mgr)

    office = restored_mgr.get_location("office")
    assert office is not None
    assert office.parent_id is None
    assert office.order == 3
    assert "light.office" in office.entity_ids
    assert restored_mgr.get_module_config("office", "occupancy")["timeout"] == 120


async def test_invalid_saved_configuration_is_ignored(hass: HomeAssistant) -> None:
    """Invalid configuration payloads should not break setup."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": "invalid"})

    loc_mgr = LocationManager()

    await _load_configuration(hass, loc_mgr)

    # Load did not crash and no locations were introduced from invalid data.
    assert loc_mgr.all_locations() == []


async def test_legacy_house_root_is_migrated_to_rootless(hass: HomeAssistant) -> None:
    """Legacy synthetic house root should be dropped during restore."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save(
        {
            "locations": [
                {
                    "id": "house",
                    "name": "House",
                    "parent_id": None,
                    "is_explicit_root": True,
                    "order": 0,
                    "entity_ids": [],
                    "modules": {},
                },
                {
                    "id": "office",
                    "name": "Office",
                    "parent_id": "house",
                    "is_explicit_root": False,
                    "order": 1,
                    "entity_ids": ["light.office"],
                    "modules": {"_meta": {"type": "area"}},
                },
            ]
        }
    )

    loc_mgr = LocationManager()
    await _load_configuration(hass, loc_mgr)

    assert loc_mgr.get_location("house") is None
    office = loc_mgr.get_location("office")
    assert office is not None
    assert office.parent_id is None
    assert "light.office" in office.entity_ids


async def test_custom_structural_types_round_trip_in_persistence(
    hass: HomeAssistant,
) -> None:
    """Integration-owned types should persist and restore without mutation."""
    source_mgr = LocationManager()
    source_mgr.create_location(
        id="building_main",
        name="Main Building",
        parent_id=None,
        is_explicit_root=False,
    )
    source_mgr.set_module_config("building_main", "_meta", {"type": "building"})

    source_mgr.create_location(
        id="grounds",
        name="Grounds",
        parent_id=None,
        is_explicit_root=False,
    )
    source_mgr.set_module_config("grounds", "_meta", {"type": "grounds"})

    source_mgr.create_location(
        id="patio_zone",
        name="Patio Zone",
        parent_id="grounds",
        is_explicit_root=False,
    )
    source_mgr.set_module_config("patio_zone", "_meta", {"type": "subarea"})
    source_mgr.add_entity_to_location("binary_sensor.patio_motion", "patio_zone")

    occupancy = Mock()
    occupancy.dump_state.return_value = {"dummy": "state"}
    modules = {"occupancy": occupancy}

    await _save_state(hass, "test_entry", source_mgr, modules)

    restored_mgr = LocationManager()
    await _load_configuration(hass, restored_mgr)

    building = restored_mgr.get_location("building_main")
    grounds = restored_mgr.get_location("grounds")
    patio_zone = restored_mgr.get_location("patio_zone")

    assert building is not None
    assert grounds is not None
    assert patio_zone is not None

    assert restored_mgr.get_module_config("building_main", "_meta")["type"] == "building"
    assert restored_mgr.get_module_config("grounds", "_meta")["type"] == "grounds"
    assert restored_mgr.get_module_config("patio_zone", "_meta")["type"] == "subarea"
    assert patio_zone.parent_id == "grounds"
    assert "binary_sensor.patio_motion" in patio_zone.entity_ids


async def test_policy_source_bindings_round_trip_in_persistence(
    hass: HomeAssistant,
) -> None:
    """Policy source mappings should persist across save/restore cycles."""
    source_mgr = LocationManager()
    source_mgr.create_location(
        id="building_main",
        name="Main Building",
        parent_id=None,
        is_explicit_root=False,
    )
    source_mgr.set_module_config(
        "building_main",
        "occupancy",
        {
            "enabled": True,
            "policy_sources": [
                {
                    "entity_id": "alarm_control_panel.home",
                    "source_id": "security_panel",
                    "targets": ["all_roots"],
                    "state_map": {
                        "armed_away": {
                            "action": "vacate_area",
                            "include_locked": True,
                        }
                    },
                }
            ],
        },
    )

    occupancy = Mock()
    occupancy.dump_state.return_value = {"dummy": "state"}
    modules = {"occupancy": occupancy}

    await _save_state(hass, "test_entry", source_mgr, modules)

    restored_mgr = LocationManager()
    await _load_configuration(hass, restored_mgr)

    restored = restored_mgr.get_module_config("building_main", "occupancy")
    assert isinstance(restored, dict)
    policy_sources = restored.get("policy_sources")
    assert isinstance(policy_sources, list)
    assert policy_sources == [
        {
            "entity_id": "alarm_control_panel.home",
            "source_id": "security_panel",
            "targets": ["all_roots"],
            "state_map": {
                "armed_away": {
                    "action": "vacate_area",
                    "include_locked": True,
                }
            },
        }
    ]
