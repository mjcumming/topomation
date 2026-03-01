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

    sensor = OccupancyBinarySensor("kitchen", "Kitchen", bus, occupancy_module=occupancy_module)
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()

    assert sensor.is_on is True
    attrs = sensor.extra_state_attributes
    assert attrs["is_locked"] is True
    assert attrs["locked_by"] == ["manual_lock"]
    assert attrs["reason"] == "restore"
    sensor.async_write_ha_state.assert_called_once()

    subscribed_callback, event_filter = bus.subscribe.call_args.args
    assert callable(subscribed_callback)
    assert getattr(event_filter, "event_type", None) == "occupancy.changed"


@pytest.mark.asyncio
async def test_binary_sensor_updates_on_live_occupancy_changed_event() -> None:
    """Entity should still update from occupancy.changed events after startup."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = None
    occupancy_module.get_effective_timeout.return_value = None

    sensor = OccupancyBinarySensor("kitchen", "Kitchen", bus, occupancy_module=occupancy_module)
    sensor.async_write_ha_state = Mock()

    await sensor.async_added_to_hass()
    assert sensor.is_on is False
    assert sensor.async_write_ha_state.call_count == 0

    callback = bus.subscribe.call_args.args[0]
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
    assert sensor.async_write_ha_state.call_count == 1
