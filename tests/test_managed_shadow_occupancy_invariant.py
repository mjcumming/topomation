"""Kernel-level regression: managed shadow occupancy must mirror the host.

Integration stamps ``follow_parent`` + ``contributes_to_parent: false`` on shadow
rows; these tests lock the runtime invariant the UI depends on.
"""

from __future__ import annotations

from datetime import UTC, datetime

from home_topology import EventBus, LocationManager
from home_topology.modules.occupancy import OccupancyModule


def _build_floor_shadow_room_topology() -> tuple[EventBus, LocationManager]:
    bus = EventBus()
    loc_mgr = LocationManager()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    loc_mgr.create_location(id="home", name="Home", parent_id=None, is_explicit_root=True)

    loc_mgr.create_location(
        id="floor_basement",
        name="Basement",
        parent_id="home",
        is_explicit_root=False,
    )
    loc_mgr.set_module_config(
        "floor_basement",
        "_meta",
        {"type": "floor", "sync_source": "ha", "ha_floor_id": "fake"},
    )

    loc_mgr.create_location(
        id="area_shadow_basement",
        name="Basement [Topomation]",
        parent_id="floor_basement",
        is_explicit_root=False,
    )
    loc_mgr.set_module_config(
        "area_shadow_basement",
        "_meta",
        {
            "type": "area",
            "role": "managed_shadow",
            "shadow_for_location_id": "floor_basement",
            "ha_area_id": "shadow-ha",
        },
    )
    loc_mgr.set_module_config(
        "area_shadow_basement",
        "occupancy",
        {
            "enabled": True,
            "occupancy_strategy": "follow_parent",
            "contributes_to_parent": False,
            "default_timeout": 300,
            "default_trailing_timeout": 120,
            "occupancy_group_id": None,
            "linked_locations": [],
        },
    )

    loc_mgr.create_location(
        id="area_rec",
        name="Rec Room",
        parent_id="floor_basement",
        is_explicit_root=False,
    )
    loc_mgr.set_module_config("area_rec", "_meta", {"type": "area", "ha_area_id": "rec-ha"})
    loc_mgr.set_module_config(
        "area_rec",
        "occupancy",
        {
            "enabled": True,
            "occupancy_strategy": "independent",
            "contributes_to_parent": True,
            "default_timeout": 300,
            "default_trailing_timeout": 120,
            "occupancy_group_id": None,
            "linked_locations": [],
        },
    )

    return bus, loc_mgr


def test_follow_parent_managed_shadow_matches_host_when_descendant_triggers() -> None:
    """Child room occupied ⇒ floor and its managed shadow both read occupied."""
    bus, loc_mgr = _build_floor_shadow_room_topology()
    occupancy = OccupancyModule()
    occupancy.attach(bus, loc_mgr)

    t0 = datetime(2026, 4, 14, 12, 0, 0, tzinfo=UTC)
    occupancy.trigger("area_rec", "motion", 300, now=t0)

    floor_s = occupancy.get_location_state("floor_basement")
    shadow_s = occupancy.get_location_state("area_shadow_basement")
    rec_s = occupancy.get_location_state("area_rec")

    assert rec_s is not None and rec_s["occupied"] is True
    assert floor_s is not None and floor_s["occupied"] is True
    assert shadow_s is not None and shadow_s["occupied"] is True


def test_independent_managed_shadow_diverges_when_only_child_triggers() -> None:
    """Documents the bug class: wrong shadow config leaves shadow vacant while host is occupied."""
    bus, loc_mgr = _build_floor_shadow_room_topology()
    loc_mgr.set_module_config(
        "area_shadow_basement",
        "occupancy",
        {
            "enabled": True,
            "occupancy_strategy": "independent",
            "contributes_to_parent": True,
            "default_timeout": 300,
            "default_trailing_timeout": 120,
            "occupancy_group_id": None,
            "linked_locations": [],
        },
    )

    occupancy = OccupancyModule()
    occupancy.attach(bus, loc_mgr)

    t0 = datetime(2026, 4, 14, 12, 0, 0, tzinfo=UTC)
    occupancy.trigger("area_rec", "motion", 300, now=t0)

    floor_s = occupancy.get_location_state("floor_basement")
    shadow_s = occupancy.get_location_state("area_shadow_basement")

    assert floor_s is not None and floor_s["occupied"] is True
    assert shadow_s is not None and shadow_s["occupied"] is False
