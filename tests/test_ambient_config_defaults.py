"""Tests for ambient configuration defaults in integration setup."""

from __future__ import annotations

from unittest.mock import Mock

from custom_components.topomation import _setup_default_configs
from custom_components.topomation.const import (
    AMBIENT_BRIGHT_THRESHOLD_DEFAULT,
    AMBIENT_DARK_THRESHOLD_DEFAULT,
    AMBIENT_LUX_DEFAULTS_MIGRATION_KEY,
    AMBIENT_LUX_DEFAULTS_MIGRATION_VALUE,
)


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
            "dark_threshold": 50.0,
            "bright_threshold": 500.0,
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
    assert existing_ambient.get("dark_threshold") == AMBIENT_DARK_THRESHOLD_DEFAULT
    assert existing_ambient.get("bright_threshold") == AMBIENT_BRIGHT_THRESHOLD_DEFAULT
    assert (
        existing_ambient.get(AMBIENT_LUX_DEFAULTS_MIGRATION_KEY)
        == AMBIENT_LUX_DEFAULTS_MIGRATION_VALUE
    )
    assert isinstance(new_ambient, dict)
    assert new_ambient.get("auto_discover") is False
    assert new_ambient.get("dark_threshold") == AMBIENT_DARK_THRESHOLD_DEFAULT
    assert new_ambient.get("bright_threshold") == AMBIENT_BRIGHT_THRESHOLD_DEFAULT
    assert (
        new_ambient.get(AMBIENT_LUX_DEFAULTS_MIGRATION_KEY)
        == AMBIENT_LUX_DEFAULTS_MIGRATION_VALUE
    )
    assert any(
        location_id == "area_existing"
        and module_id == "ambient"
        and config.get("auto_discover") is False
        for location_id, module_id, config in set_calls
    )
    assert any(
        location_id == "area_new"
        and module_id == "ambient"
        and config.get("auto_discover") is False
        for location_id, module_id, config in set_calls
    )

    set_calls.clear()
    _setup_default_configs(
        loc_mgr,
        {
            "ambient": ambient_module,
            "occupancy": occupancy_module,
            "automation": automation_module,
        },
    )
    assert set_calls == []


def test_setup_default_configs_preserves_custom_ambient_thresholds() -> None:
    """One-shot ambient migration should not overwrite explicit calibration."""
    location = Mock()
    location.id = "area_custom"
    existing_configs: dict[tuple[str, str], dict | None] = {
        ("area_custom", "ambient"): {
            "version": 1,
            "lux_sensor": "sensor.custom_lux",
            "auto_discover": False,
            "inherit_from_parent": False,
            "dark_threshold": 300.0,
            "bright_threshold": 900.0,
        },
    }

    loc_mgr = Mock()
    loc_mgr.all_locations.return_value = [location]
    loc_mgr.get_module_config.side_effect = (
        lambda location_id, module_id: existing_configs.get((location_id, module_id))
    )

    def _set_module_config(*, location_id: str, module_id: str, config: dict) -> None:
        existing_configs[(location_id, module_id)] = config

    loc_mgr.set_module_config.side_effect = _set_module_config

    ambient_module = Mock()
    ambient_module.CURRENT_CONFIG_VERSION = 1
    ambient_module.default_config.return_value = {}

    _setup_default_configs(loc_mgr, {"ambient": ambient_module})

    ambient = existing_configs[("area_custom", "ambient")]
    assert isinstance(ambient, dict)
    assert ambient.get("dark_threshold") == 300.0
    assert ambient.get("bright_threshold") == 900.0
    assert (
        ambient.get(AMBIENT_LUX_DEFAULTS_MIGRATION_KEY)
        == AMBIENT_LUX_DEFAULTS_MIGRATION_VALUE
    )
