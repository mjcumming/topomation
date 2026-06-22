"""Kernel AmbientLightModule extra_lux_entity_ids (managed-shadow lux wiring)."""

from __future__ import annotations

from unittest.mock import Mock

import pytest
from home_topology import EventBus, LocationManager
from home_topology.modules.ambient import AmbientLightModule

from custom_components.topomation import TopomationAmbientLightModule


@pytest.fixture
def loc_mgr() -> LocationManager:
    mgr = LocationManager()
    mgr.create_location("host", "Host", is_explicit_root=True)
    mgr.set_module_config(
        "host",
        "ambient",
        {
            "version": 1,
            "lux_sensor": None,
            "auto_discover": False,
            "inherit_from_parent": True,
        },
    )
    return mgr


def test_extra_lux_entity_ids_resolves_when_auto_discover_off(loc_mgr: LocationManager) -> None:
    """Managed-shadow lux candidates apply even when auto_discover is false."""
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 120.0

    mod = AmbientLightModule(
        platform_adapter=adapter,
        extra_lux_entity_ids=lambda lid: ["sensor.shadow_lux"] if lid == "host" else [],
    )
    mod.attach(bus, loc_mgr)

    assert mod.get_lux_sensor("host", inherit=False) == "sensor.shadow_lux"


def test_invalidate_ambient_sensor_cache_clears_resolution(loc_mgr: LocationManager) -> None:
    """After invalidation, lux resolution can change."""
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 50.0

    batches: list[list[str]] = [["sensor.a"], ["sensor.b"]]

    def extra(_lid: str) -> list[str]:
        return batches.pop(0)

    mod = AmbientLightModule(platform_adapter=adapter, extra_lux_entity_ids=extra)
    mod.attach(bus, loc_mgr)

    assert mod.get_lux_sensor("host", inherit=False) == "sensor.a"
    mod.invalidate_ambient_sensor_cache("host")
    assert mod.get_lux_sensor("host", inherit=False) == "sensor.b"


def test_topomation_ambient_skips_local_lux_when_local_light_is_on() -> None:
    """Local lux can be ignored while local area lights are on, falling back to parent lux."""
    mgr = LocationManager()
    mgr.create_location("parent", "Parent", is_explicit_root=True)
    mgr.create_location("room", "Room", parent_id="parent")
    mgr.add_entity_to_location("sensor.outdoor_lux", "parent")
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.add_entity_to_location("light.room_ceiling", "room")
    mgr.set_module_config(
        "parent",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.outdoor_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
        },
    )
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.room_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
            "local_lux_light_entity_ids": ["light.room_ceiling"],
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.side_effect = lambda entity_id: {
        "sensor.room_lux": 900.0,
        "sensor.outdoor_lux": 120.0,
    }.get(entity_id)
    adapter.get_state.side_effect = lambda entity_id: {
        "light.room_ceiling": "on",
    }.get(entity_id)

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    reading = mod.get_ambient_light("room")
    payload = reading.to_dict()

    assert reading.source_sensor == "sensor.outdoor_lux"
    assert reading.source_location == "parent"
    assert reading.is_inherited is True
    assert payload["ignored_local_lux_sensor"] == "sensor.room_lux"
    assert payload["ignored_local_lux_reason"] == "local_lights_on"
    assert payload["ignored_local_lux_light_entity_ids"] == ["light.room_ceiling"]


def test_topomation_ambient_inherit_skips_same_location_lux_candidate() -> None:
    """Inherit means same-location lux candidates are not effective sources."""
    mgr = LocationManager()
    mgr.create_location("parent", "Parent", is_explicit_root=True)
    mgr.create_location("room", "Room", parent_id="parent")
    mgr.add_entity_to_location("sensor.outdoor_lux", "parent")
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.set_module_config(
        "parent",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.outdoor_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
        },
    )
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": None,
            "auto_discover": False,
            "inherit_from_parent": True,
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.side_effect = lambda entity_id: {
        "sensor.room_lux": 900.0,
        "sensor.outdoor_lux": 120.0,
    }.get(entity_id)

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    reading = mod.get_ambient_light("room")
    payload = reading.to_dict()

    assert reading.source_sensor == "sensor.outdoor_lux"
    assert reading.source_location == "parent"
    assert reading.is_inherited is True
    assert payload["ignored_local_lux_sensor"] is None


def test_topomation_ambient_uses_configured_light_list_for_local_lux_guard() -> None:
    """Only selected local lights contaminate a local lux sensor."""
    mgr = LocationManager()
    mgr.create_location("room", "Room", is_explicit_root=True)
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.add_entity_to_location("light.room_ceiling", "room")
    mgr.add_entity_to_location("light.room_lamp", "room")
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.room_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
            "local_lux_light_entity_ids": ["light.room_ceiling"],
            "fallback_to_sun": True,
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 900.0
    adapter.get_state.side_effect = lambda entity_id: {
        "light.room_ceiling": "off",
        "light.room_lamp": "on",
        "sun.sun": "below_horizon",
    }.get(entity_id)

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    reading = mod.get_ambient_light("room")
    payload = reading.to_dict()

    assert reading.source_sensor == "sensor.room_lux"
    assert payload["ignored_local_lux_sensor"] is None
    assert payload["ignored_local_lux_light_entity_ids"] == []


def test_topomation_ambient_ignores_legacy_local_lux_boolean_without_light_list() -> None:
    """The old ambient boolean is inert without an explicit selected light list."""
    mgr = LocationManager()
    mgr.create_location("room", "Room", is_explicit_root=True)
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.add_entity_to_location("light.room_ceiling", "room")
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.room_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
            "ignore_local_lux_when_lights_on": True,
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 900.0
    adapter.get_state.return_value = "on"

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    reading = mod.get_ambient_light("room")

    assert reading.source_sensor == "sensor.room_lux"
    assert reading.is_inherited is False


def test_topomation_ambient_uses_local_lux_when_local_light_is_off() -> None:
    """The local sensor remains authoritative when no local light is on."""
    mgr = LocationManager()
    mgr.create_location("room", "Room", is_explicit_root=True)
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.add_entity_to_location("light.room_ceiling", "room")
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.room_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
            "local_lux_light_entity_ids": ["light.room_ceiling"],
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 900.0
    adapter.get_state.return_value = "off"

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    reading = mod.get_ambient_light("room")
    payload = reading.to_dict()

    assert reading.source_sensor == "sensor.room_lux"
    assert reading.source_location == "room"
    assert reading.is_inherited is False
    assert payload["ignored_local_lux_sensor"] is None


def test_topomation_ambient_reports_ignored_local_lux_when_falling_back_to_sun() -> None:
    """Fallback readings include local lux ignore diagnostics."""
    mgr = LocationManager()
    mgr.create_location("room", "Room", is_explicit_root=True)
    mgr.add_entity_to_location("sensor.room_lux", "room")
    mgr.add_entity_to_location("light.room_ceiling", "room")
    mgr.set_module_config(
        "room",
        "ambient",
        {
            "version": 1,
            "lux_sensor": "sensor.room_lux",
            "auto_discover": False,
            "inherit_from_parent": True,
            "fallback_to_sun": True,
            "local_lux_light_entity_ids": ["light.room_ceiling"],
        },
    )
    bus = EventBus()
    bus.set_location_manager(mgr)
    mgr.set_event_bus(bus)

    adapter = Mock()
    adapter.get_device_class.return_value = "illuminance"
    adapter.get_numeric_state.return_value = 900.0
    adapter.get_state.side_effect = lambda entity_id: {
        "light.room_ceiling": "on",
        "sun.sun": "below_horizon",
    }.get(entity_id)

    mod = TopomationAmbientLightModule(platform_adapter=adapter)
    mod.attach(bus, mgr)

    payload = mod.get_ambient_light("room").to_dict()

    assert payload["source_sensor"] is None
    assert payload["fallback_method"] == "sun_position"
    assert payload["ignored_local_lux_sensor"] == "sensor.room_lux"
    assert payload["ignored_local_lux_reason"] == "local_lights_on"
