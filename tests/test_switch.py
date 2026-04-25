"""Unit tests for Topomation per-location lock switch entities."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

import pytest
from home_topology.core.bus import Event

from custom_components.topomation.const import DOMAIN
from custom_components.topomation.switch import LOCK_SWITCH_SOURCE_ID, LocationLockSwitch


def _make_switch(
    bus: Mock,
    occupancy_module: Mock,
    *,
    location_id: str = "kitchen",
    location_name: str = "Kitchen",
    entry_id: str = "test_entry",
) -> LocationLockSwitch:
    """Construct a LocationLockSwitch with shared test wiring."""
    return LocationLockSwitch(
        entry_id,
        location_id,
        location_name,
        bus,
        occupancy_module=occupancy_module,
    )


@pytest.mark.asyncio
async def test_switch_hydrates_lock_state_from_occupancy_module() -> None:
    """Entity should initialize is_on from restored occupancy module runtime state."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = {
        "occupied": True,
        "is_locked": True,
        "locked_by": ["automation_party_mode"],
        "lock_modes": ["block_vacant"],
        "direct_locks": [
            {"source_id": "automation_party_mode", "mode": "block_vacant", "scope": "subtree"}
        ],
    }

    switch = _make_switch(bus, occupancy_module)
    switch.async_write_ha_state = Mock()

    await switch.async_added_to_hass()

    assert switch.is_on is True
    assert switch.icon == "mdi:lock"
    attrs = switch.extra_state_attributes
    assert attrs["locked_by"] == ["automation_party_mode"]
    assert attrs["lock_modes"] == ["block_vacant"]
    switch.async_write_ha_state.assert_called_once()

    # Subscriptions match binary_sensor pattern: occupancy.changed + occupancy.signal
    assert bus.subscribe.call_count == 2
    assert getattr(bus.subscribe.call_args_list[0].args[1], "event_type", None) == "occupancy.changed"
    assert getattr(bus.subscribe.call_args_list[1].args[1], "event_type", None) == "occupancy.signal"


@pytest.mark.asyncio
async def test_switch_updates_on_live_lock_state_change() -> None:
    """occupancy.changed events should toggle the switch on lock state transitions."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = None

    switch = _make_switch(bus, occupancy_module)
    switch.async_write_ha_state = Mock()

    await switch.async_added_to_hass()
    assert switch.is_on is False
    assert switch.icon == "mdi:lock-open-variant-outline"

    on_occupancy_changed = bus.subscribe.call_args_list[0].args[0]
    on_occupancy_changed(
        Event(
            type="occupancy.changed",
            source="occupancy",
            location_id="kitchen",
            payload={
                "occupied": False,
                "is_locked": True,
                "locked_by": ["manual_ui"],
                "lock_modes": ["freeze"],
            },
            timestamp=datetime.now(UTC),
        )
    )

    assert switch.is_on is True
    assert switch.icon == "mdi:lock"
    assert switch.extra_state_attributes["locked_by"] == ["manual_ui"]


@pytest.mark.asyncio
async def test_switch_ignores_events_for_other_locations() -> None:
    """Events for unrelated locations must not mutate this switch's state."""
    bus = Mock()
    occupancy_module = Mock()
    occupancy_module.get_location_state.return_value = None

    switch = _make_switch(bus, occupancy_module, location_id="kitchen")
    switch.async_write_ha_state = Mock()
    await switch.async_added_to_hass()

    on_occupancy_changed = bus.subscribe.call_args_list[0].args[0]
    on_occupancy_changed(
        Event(
            type="occupancy.changed",
            source="occupancy",
            location_id="living_room",
            payload={"is_locked": True},
            timestamp=datetime.now(UTC),
        )
    )

    assert switch.is_on is False


@pytest.mark.asyncio
async def test_switch_turn_on_invokes_lock_service_with_freeze_subtree() -> None:
    """turn_on must call topomation.lock with freeze + subtree + stable source_id."""
    bus = Mock()
    occupancy_module = Mock()

    switch = _make_switch(bus, occupancy_module, entry_id="entry_abc")

    hass = Mock()
    hass.services.async_call = AsyncMock()
    switch.hass = hass

    await switch.async_turn_on()

    hass.services.async_call.assert_awaited_once_with(
        DOMAIN,
        "lock",
        {
            "entry_id": "entry_abc",
            "location_id": "kitchen",
            "source_id": LOCK_SWITCH_SOURCE_ID,
            "mode": "freeze",
            "scope": "subtree",
        },
        blocking=True,
    )


@pytest.mark.asyncio
async def test_switch_turn_off_invokes_unlock_all_service() -> None:
    """turn_off must call topomation.unlock_all to match the tree row's force-clear."""
    bus = Mock()
    occupancy_module = Mock()

    switch = _make_switch(bus, occupancy_module, entry_id="entry_abc")

    hass = Mock()
    hass.services.async_call = AsyncMock()
    switch.hass = hass

    await switch.async_turn_off()

    hass.services.async_call.assert_awaited_once_with(
        DOMAIN,
        "unlock_all",
        {
            "entry_id": "entry_abc",
            "location_id": "kitchen",
        },
        blocking=True,
    )


@pytest.mark.asyncio
async def test_switch_unique_id_and_name_match_location() -> None:
    """Unique ID and name should be derived from location id/name for stability."""
    bus = Mock()
    occupancy_module = Mock()

    switch = LocationLockSwitch(
        "entry_xyz",
        "main_floor_storage",
        "Main Floor Storage",
        bus,
        occupancy_module=occupancy_module,
    )

    assert switch.unique_id == "lock_main_floor_storage"
    assert switch.name == "Main Floor Storage Lock"
