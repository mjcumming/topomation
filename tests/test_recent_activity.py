"""Tests for property recent-activity runtime."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from home_topology import LocationManager
from home_topology.core.bus import Event, EventBus, EventFilter

from custom_components.topomation.recent_activity import (
    EVENT_RECENT_ACTIVITY_CHANGED,
    MODULE_ID,
    TopomationRecentActivityModule,
)


def _manager_with_property() -> tuple[LocationManager, EventBus, TopomationRecentActivityModule]:
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    loc_mgr.create_location(id="home", name="Home")
    loc_mgr.set_module_config("home", "_meta", {"type": "property"})
    loc_mgr.set_module_config(
        "home",
        MODULE_ID,
        {
            "enabled": True,
            "window_hours": 48,
            "include_descendant_occupancy": True,
        },
    )
    loc_mgr.create_location(id="pathway", name="Pathway", parent_id="home")
    loc_mgr.set_module_config("pathway", "_meta", {"type": "area"})

    module = TopomationRecentActivityModule()
    module.attach(bus, loc_mgr)
    return loc_mgr, bus, module


def test_descendant_occupancy_refreshes_property_recent_activity() -> None:
    """A descendant occupied event should mark the ancestor property active."""
    _loc_mgr, bus, module = _manager_with_property()
    changed: list[dict[str, object]] = []
    bus.subscribe(
        lambda event: changed.append(dict(event.payload)),
        EventFilter(event_type=EVENT_RECENT_ACTIVITY_CHANGED),
    )

    now = datetime(2026, 5, 22, 4, 0, tzinfo=UTC)
    bus.publish(
        Event(
            type="occupancy.changed",
            source="test",
            location_id="pathway",
            payload={"occupied": True, "source_id": "binary_sensor.path_motion"},
            timestamp=now,
        )
    )

    state = module.get_state("home")
    assert state["active"] is True
    assert state["recently_active"] is True
    assert state["last_activity_at"] == now.isoformat()
    assert state["active_until"] == (now + timedelta(hours=48)).isoformat()
    assert state["reason"] == "descendant_occupancy"
    assert changed[-1]["active"] is True


def test_recent_activity_expiry_does_not_vacate_occupancy() -> None:
    """Recent activity expires independently from occupancy state."""
    _loc_mgr, _bus, module = _manager_with_property()
    now = datetime(2026, 5, 22, 4, 0, tzinfo=UTC)

    module.refresh(
        "home",
        reason="descendant_occupancy",
        source_location_id="pathway",
        now=now,
    )
    module.check_timeouts(now + timedelta(hours=49))

    state = module.get_state("home")
    assert state["active"] is False
    assert state["last_activity_at"] == now.isoformat()
    assert state["active_until"] == (now + timedelta(hours=48)).isoformat()


def test_non_property_config_change_clears_recent_activity_state() -> None:
    """Only properties may own recent-activity state."""
    _loc_mgr, _bus, module = _manager_with_property()

    module._state["pathway"] = {"active": True}  # noqa: SLF001
    module.on_location_config_changed("pathway", {"enabled": True})

    assert "pathway" not in module.dump_state()
