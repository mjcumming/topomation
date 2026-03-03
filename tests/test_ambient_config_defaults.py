"""Tests for ambient configuration defaults in integration setup."""

from __future__ import annotations

from unittest.mock import Mock

from custom_components.topomation import _setup_default_configs


def test_setup_default_configs_forces_ambient_auto_discover_off() -> None:
    """Ambient config should always persist with auto_discover disabled."""
    location_existing = Mock()
    location_existing.id = "area_existing"
    location_new = Mock()
    location_new.id = "area_new"

    existing_configs: dict[tuple[str, str], dict | None] = {
        ("area_existing", "ambient"): {
            "version": 1,
            "lux_sensor": None,
            "auto_discover": True,
            "inherit_from_parent": True,
        },
        ("area_new", "ambient"): None,
        ("area_existing", "occupancy"): {"version": 1, "enabled": True},
        ("area_new", "occupancy"): None,
        ("area_existing", "automation"): {"version": 1, "enabled": True},
        ("area_new", "automation"): None,
    }

    loc_mgr = Mock()
    loc_mgr.all_locations.return_value = [location_existing, location_new]
    loc_mgr.get_module_config.side_effect = (
        lambda location_id, module_id: existing_configs.get((location_id, module_id))
    )

    set_calls: list[tuple[str, str, dict]] = []

    def _set_module_config(*, location_id: str, module_id: str, config: dict) -> None:
        set_calls.append((location_id, module_id, config))
        existing_configs[(location_id, module_id)] = config

    loc_mgr.set_module_config.side_effect = _set_module_config

    ambient_module = Mock()
    ambient_module.CURRENT_CONFIG_VERSION = 1
    ambient_module.default_config.return_value = {
        "version": 1,
        "auto_discover": True,
        "inherit_from_parent": True,
    }

    occupancy_module = Mock()
    occupancy_module.CURRENT_CONFIG_VERSION = 1
    occupancy_module.default_config.return_value = {"version": 1, "enabled": True}

    automation_module = Mock()
    automation_module.CURRENT_CONFIG_VERSION = 1
    automation_module.default_config.return_value = {"version": 1, "enabled": True}

    _setup_default_configs(
        loc_mgr,
        {
            "ambient": ambient_module,
            "occupancy": occupancy_module,
            "automation": automation_module,
        },
    )

    existing_ambient = existing_configs[("area_existing", "ambient")]
    new_ambient = existing_configs[("area_new", "ambient")]

    assert isinstance(existing_ambient, dict)
    assert existing_ambient.get("auto_discover") is False
    assert isinstance(new_ambient, dict)
    assert new_ambient.get("auto_discover") is False
    assert any(
        location_id == "area_existing" and module_id == "ambient" and config.get("auto_discover") is False
        for location_id, module_id, config in set_calls
    )
    assert any(
        location_id == "area_new" and module_id == "ambient" and config.get("auto_discover") is False
        for location_id, module_id, config in set_calls
    )
