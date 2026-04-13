"""Tests for TopomationAmbientLightModule (shadow lux hook on PyPI home-topology)."""

from __future__ import annotations

from unittest.mock import Mock

import pytest
from home_topology import EventBus, LocationManager

from custom_components.topomation.topomation_ambient import TopomationAmbientLightModule


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

    mod = TopomationAmbientLightModule(
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

    mod = TopomationAmbientLightModule(platform_adapter=adapter, extra_lux_entity_ids=extra)
    mod.attach(bus, loc_mgr)

    assert mod.get_lux_sensor("host", inherit=False) == "sensor.a"
    mod.invalidate_ambient_sensor_cache("host")
    assert mod.get_lux_sensor("host", inherit=False) == "sensor.b"
