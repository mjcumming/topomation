"""Unit tests for Topomation occupancy binary sensor entities."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import Mock

import pytest
from home_topology.core.bus import Event

from custom_components.topomation.binary_sensor import OccupancyBinarySensor


@pytest.mark.asyncio
async def test_binary_sensor_hydrates_startup_state_from_occupancy_module() -> None:
    """Entity should initialize from restored occupancy module runtime state."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = {
        "occupied": True,
        "locked_by": ["manual_lock"],
        "is_locked": True,
        "lock_modes": ["freeze"],
        "direct_locks": [{"source_id": "manual_lock", "mode": "freeze", "scope": "self"}],
        "contributions": [{"source_id": "binary_sensor.kitchen_motion", "expires_at": None}],
        "previous_occupied": False,
        "reason": "restore",
    }
    occupancy_module.get_effective_timeout.return_value = None

    sensor = OccupancyBinarySensor(
        "kitchen",
        "Kitchen",
        bus,
        occupancy_module=occupancy_module,
        recent_changes_provider=lambda _: [{"kind": "state", "event": "occupied"}],
    )
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()

    assert sensor.is_on is True
    attrs = sensor.extra_state_attributes
    assert attrs["is_locked"] is True
    assert attrs["locked_by"] == ["manual_lock"]
    assert attrs["reason"] == "restore"
    assert attrs["recent_changes"] == [{"kind": "state", "event": "occupied"}]
    sensor.async_write_ha_state.assert_called_once()

    assert bus.subscribe.call_count == 2
    assert getattr(bus.subscribe.call_args_list[0].args[1], "event_type", None) == "occupancy.changed"
    assert getattr(bus.subscribe.call_args_list[1].args[1], "event_type", None) == "occupancy.signal"


@pytest.mark.asyncio
async def test_binary_sensor_updates_on_live_occupancy_changed_event() -> None:
    """Entity should still update from occupancy.changed events after startup."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = None
    occupancy_module.get_effective_timeout.return_value = None

    sensor = OccupancyBinarySensor(
        "kitchen",
        "Kitchen",
        bus,
        occupancy_module=occupancy_module,
        recent_changes_provider=lambda _: [{"kind": "state", "event": "occupied"}],
    )
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()
    assert sensor.is_on is False
    assert sensor.async_write_ha_state.call_count == 0

    callback = bus.subscribe.call_args_list[0].args[0]
    callback(
        Event(
            type="occupancy.changed",
            source="occupancy",
            location_id="kitchen",
            payload={"occupied": True, "reason": "event:trigger"},
            timestamp=datetime.now(UTC),
        )
    )

    assert sensor.is_on is True
    assert sensor.extra_state_attributes["reason"] == "event:trigger"
    assert sensor.extra_state_attributes["recent_changes"] == [{"kind": "state", "event": "occupied"}]
    assert sensor.async_write_ha_state.call_count == 1


@pytest.mark.asyncio
async def test_binary_sensor_updates_lock_attributes_on_occupancy_changed() -> None:
    """occupancy.changed should refresh lock-related attributes from the payload."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = None
    occupancy_module.get_effective_timeout.return_value = None

    sensor = OccupancyBinarySensor(
        "kitchen",
        "Kitchen",
        bus,
        occupancy_module=occupancy_module,
        recent_changes_provider=lambda _: [],
    )
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()
    callback = bus.subscribe.call_args_list[0].args[0]
    callback(
        Event(
            type="occupancy.changed",
            source="occupancy",
            location_id="kitchen",
            payload={
                "occupied": True,
                "is_locked": True,
                "locked_by": ["ui_freeze"],
                "lock_modes": ["freeze"],
                "direct_locks": [{"source_id": "ui_freeze", "mode": "freeze", "scope": "self"}],
                "reason": "event:lock",
            },
            timestamp=datetime.now(UTC),
        )
    )

    assert sensor.extra_state_attributes["is_locked"] is True
    assert sensor.extra_state_attributes["locked_by"] == ["ui_freeze"]
    assert sensor.extra_state_attributes["lock_modes"] == ["freeze"]
    assert sensor.extra_state_attributes["reason"] == "event:lock"


@pytest.mark.asyncio
async def test_binary_sensor_refreshes_recent_changes_on_signal_event() -> None:
    """Source-level occupancy signals should refresh explainability attributes."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = {
        "occupied": True,
        "contributions": [],
        "reason": "event:trigger",
    }
    occupancy_module.get_effective_timeout.return_value = None

    sensor = OccupancyBinarySensor(
        "kitchen",
        "Kitchen",
        bus,
        occupancy_module=occupancy_module,
        recent_changes_provider=lambda _: [{"kind": "signal", "event": "trigger"}],
    )
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()
    sensor.async_write_ha_state.reset_mock()

    callback = bus.subscribe.call_args_list[1].args[0]
    callback(
        Event(
            type="occupancy.signal",
            source="event_bridge",
            location_id="kitchen",
            payload={"event_type": "trigger", "source_id": "binary_sensor.kitchen_motion"},
            timestamp=datetime.now(UTC),
        )
    )

    assert sensor.extra_state_attributes["recent_changes"] == [{"kind": "signal", "event": "trigger"}]
    assert sensor.async_write_ha_state.call_count == 1
