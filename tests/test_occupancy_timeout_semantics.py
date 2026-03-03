"""Occupancy timeout semantics for mixed source activity."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from home_topology import EventBus, LocationManager
from home_topology.modules.occupancy import OccupancyModule


def _build_occupancy_module() -> OccupancyModule:
    """Create a minimal occupancy runtime with one test area."""
    bus = EventBus()
    loc_mgr = LocationManager()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)
    loc_mgr.create_location(id="root", name="Home", is_explicit_root=True)
    loc_mgr.create_location(id="area_test", name="Test Area", parent_id="root")

    module = OccupancyModule()
    module.attach(bus, loc_mgr)
    return module


def _expires_at_for_source(state: dict, source_id: str) -> datetime | None:
    for contribution in state.get("contributions", []):
        if contribution.get("source_id") != source_id:
            continue
        raw = contribution.get("expires_at")
        if raw is None:
            return None
        return datetime.fromisoformat(str(raw))
    return None


def test_longest_source_timeout_controls_vacancy() -> None:
    """Location stays occupied until the longest active source contribution expires."""
    occupancy = _build_occupancy_module()
    base = datetime(2026, 3, 3, 12, 0, tzinfo=UTC)

    # Motion contributes short hold; light contributes longer hold.
    occupancy.trigger("area_test", "motion", 300, now=base)
    occupancy.trigger("area_test", "light", 1800, now=base + timedelta(seconds=60))

    # Immediate clear for motion must not vacate while light is still active.
    occupancy.clear("area_test", "motion", 0, now=base + timedelta(seconds=120))
    state = occupancy.get_location_state("area_test")
    assert state is not None
    assert state["occupied"] is True
    assert {c["source_id"] for c in state["contributions"]} == {"light"}

    # Area remains occupied before the light timeout.
    occupancy.check_timeouts(base + timedelta(seconds=1800))
    state_before = occupancy.get_location_state("area_test")
    assert state_before is not None
    assert state_before["occupied"] is True

    # Area turns vacant only after the longest source timeout elapses.
    occupancy.check_timeouts(base + timedelta(seconds=1861))
    state_after = occupancy.get_location_state("area_test")
    assert state_after is not None
    assert state_after["occupied"] is False


def test_shorter_trigger_does_not_shorten_existing_longer_timeout() -> None:
    """A later short trigger does not reduce effective timeout set by another source."""
    occupancy = _build_occupancy_module()
    base = datetime(2026, 3, 3, 13, 0, tzinfo=UTC)

    occupancy.trigger("area_test", "light", 1800, now=base)
    occupancy.trigger("area_test", "motion", 300, now=base + timedelta(seconds=600))

    state = occupancy.get_location_state("area_test")
    assert state is not None

    light_expiry = _expires_at_for_source(state, "light")
    motion_expiry = _expires_at_for_source(state, "motion")
    assert light_expiry is not None
    assert motion_expiry is not None
    assert light_expiry > motion_expiry

    effective_timeout = occupancy.get_effective_timeout("area_test", now=base + timedelta(seconds=600))
    assert effective_timeout == light_expiry
