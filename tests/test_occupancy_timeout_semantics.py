"""Occupancy timeout semantics for mixed source activity."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from home_topology import EventBus, LocationManager
from home_topology.core.bus import Event
from home_topology.modules.occupancy import OccupancyModule


def _build_occupancy_module() -> tuple[OccupancyModule, EventBus]:
    """Create a minimal occupancy runtime with one test area."""
    bus = EventBus()
    loc_mgr = LocationManager()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)
    loc_mgr.create_location(id="root", name="Home", is_explicit_root=True)
    loc_mgr.create_location(id="area_test", name="Test Area", parent_id="root")

    module = OccupancyModule()
    module.attach(bus, loc_mgr)
    return module, bus


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
    occupancy, _bus = _build_occupancy_module()
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
    occupancy, _bus = _build_occupancy_module()
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


def test_presence_clear_does_not_cancel_active_motion_hold() -> None:
    """Presence OFF clears only presence while motion hold remains active."""
    occupancy, _bus = _build_occupancy_module()
    base = datetime(2026, 3, 3, 14, 0, tzinfo=UTC)

    occupancy.trigger("area_test", "presence", None, now=base)
    occupancy.trigger("area_test", "motion", 1800, now=base + timedelta(seconds=30))

    occupancy.clear("area_test", "presence", 300, now=base + timedelta(seconds=60))

    state_during_presence_delay = occupancy.get_location_state("area_test")
    assert state_during_presence_delay is not None
    assert state_during_presence_delay["occupied"] is True
    assert {c["source_id"] for c in state_during_presence_delay["contributions"]} == {"motion", "presence"}

    occupancy.check_timeouts(base + timedelta(seconds=361))

    state_after_presence_clear = occupancy.get_location_state("area_test")
    assert state_after_presence_clear is not None
    assert state_after_presence_clear["occupied"] is True
    assert {c["source_id"] for c in state_after_presence_clear["contributions"]} == {"motion"}

    motion_expiry = _expires_at_for_source(state_after_presence_clear, "motion")
    assert motion_expiry == base + timedelta(seconds=1830)

    occupancy.check_timeouts(base + timedelta(seconds=1831))

    state_after_motion_timeout = occupancy.get_location_state("area_test")
    assert state_after_motion_timeout is not None
    assert state_after_motion_timeout["occupied"] is False


def test_occupancy_signal_authoritative_vacant_vacates_entire_location() -> None:
    """Mirrors HA bridge: authoritative_vacant + clear timeout 0 vacates the whole location."""
    occupancy, bus = _build_occupancy_module()
    base = datetime(2026, 4, 11, 15, 0, tzinfo=UTC)

    occupancy.trigger("area_test", "motion", 600, now=base)
    occupancy.trigger("area_test", "light", 900, now=base)
    assert occupancy.get_location_state("area_test")["occupied"] is True

    bus.publish(
        Event(
            type="occupancy.signal",
            source="ha",
            entity_id="light.kitchen_ceiling",
            location_id="area_test",
            payload={
                "event_type": "clear",
                "source_id": "light",
                "timeout": 0,
                "authoritative_vacant": True,
            },
            timestamp=base + timedelta(seconds=10),
        )
    )

    st = occupancy.get_location_state("area_test")
    assert st is not None
    assert st["occupied"] is False
    assert st["contributions"] == []


def test_exit_grace_cancelled_by_occupancy_signal_trigger() -> None:
    """Trailing presence clear is exit-grace; a later signal trigger drops that hold."""
    occupancy, bus = _build_occupancy_module()
    t0 = datetime(2026, 4, 11, 16, 0, tzinfo=UTC)

    occupancy.trigger("area_test", "motion", 1800, now=t0)
    occupancy.trigger("area_test", "presence", None, now=t0 + timedelta(seconds=30))
    occupancy.clear("area_test", "presence", 300, now=t0 + timedelta(seconds=60))

    mid = occupancy.get_location_state("area_test")
    assert mid is not None
    assert {c["source_id"] for c in mid["contributions"]} == {"motion", "presence"}
    presence_row = next(c for c in mid["contributions"] if c["source_id"] == "presence")
    assert presence_row.get("exit_grace") is True

    bus.publish(
        Event(
            type="occupancy.signal",
            source="ha",
            location_id="area_test",
            payload={
                "event_type": "trigger",
                "source_id": "motion",
                "timeout": 1800,
            },
            timestamp=t0 + timedelta(seconds=120),
        )
    )

    after = occupancy.get_location_state("area_test")
    assert after is not None
    assert after["occupied"] is True
    assert {c["source_id"] for c in after["contributions"]} == {"motion"}
