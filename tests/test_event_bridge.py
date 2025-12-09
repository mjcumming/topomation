"""Tests for the Home Topology event bridge.

Following HA integration testing best practices:
- Test event translation logic
- Use proper fixtures and mocks
- Test error handling
- Follow GIVEN-WHEN-THEN structure
"""

from __future__ import annotations

from unittest.mock import Mock

import pytest
from home_topology import Event, EventBus, LocationManager
from homeassistant.const import STATE_OFF, STATE_ON, STATE_PLAYING
from homeassistant.core import HomeAssistant, State

from custom_components.home_topology.event_bridge import EventBridge


@pytest.fixture(name="location_manager")
def location_manager_fixture() -> Mock:
    """Create a mock LocationManager for event bridge testing."""
    loc_mgr = Mock(spec=LocationManager)
    loc_mgr.get_entity_location.return_value = "kitchen"
    return loc_mgr


@pytest.fixture(name="event_bus")
def event_bus_fixture() -> Mock:
    """Create a mock EventBus for event bridge testing."""
    bus = Mock(spec=EventBus)
    bus.publish = Mock()
    return bus


@pytest.fixture(name="event_bridge")
async def event_bridge_fixture(
    hass: HomeAssistant,
    event_bus: Mock,
    location_manager: Mock,
) -> EventBridge:
    """Create an EventBridge instance for testing."""
    bridge = EventBridge(hass, event_bus, location_manager)
    await bridge.async_setup()
    return bridge


async def test_setup_and_teardown(
    hass: HomeAssistant,
    event_bus: Mock,
    location_manager: Mock,
) -> None:
    """Test EventBridge setup and teardown lifecycle.

    GIVEN: An EventBridge instance
    WHEN: Setup and teardown are called
    THEN: State change listener is registered and unregistered
    """
    # GIVEN
    bridge = EventBridge(hass, event_bus, location_manager)

    # WHEN - Setup
    await bridge.async_setup()

    # THEN
    assert bridge._unsub is not None

    # WHEN - Teardown
    await bridge.async_teardown()

    # THEN
    assert bridge._unsub is None


def test_normalize_state_light_brightness_zero(event_bridge: EventBridge) -> None:
    """Test light with brightness=0 normalized to OFF.

    GIVEN: A light state of ON with brightness=0
    WHEN: State is normalized
    THEN: Result is OFF
    """
    # GIVEN / WHEN
    result = event_bridge._normalize_state(STATE_ON, {"brightness": 0})

    # THEN
    assert result == STATE_OFF


def test_normalize_state_light_brightness_nonzero(event_bridge: EventBridge) -> None:
    """Test light with brightness>0 stays ON.

    GIVEN: A light state of ON with brightness=128
    WHEN: State is normalized
    THEN: Result stays ON
    """
    # GIVEN / WHEN
    result = event_bridge._normalize_state(STATE_ON, {"brightness": 128})

    # THEN
    assert result == STATE_ON


def test_normalize_state_light_no_brightness(event_bridge: EventBridge) -> None:
    """Test light without brightness attribute passes through.

    GIVEN: A light state of ON without brightness
    WHEN: State is normalized
    THEN: Result stays ON
    """
    # GIVEN / WHEN
    result = event_bridge._normalize_state(STATE_ON, {})

    # THEN
    assert result == STATE_ON


@pytest.mark.parametrize(
    ("state", "expected"),
    [
        (STATE_PLAYING, STATE_PLAYING),
        ("paused", "paused"),
        ("idle", "idle"),
        ("standby", "standby"),
    ],
)
def test_normalize_media_player_states(
    event_bridge: EventBridge,
    state: str,
    expected: str,
) -> None:
    """Test media player state normalization.

    GIVEN: Various media player states
    WHEN: States are normalized
    THEN: They pass through unchanged
    """
    # GIVEN / WHEN
    result = event_bridge._normalize_state(state, {})

    # THEN
    assert result == expected


def test_normalize_state_none(event_bridge: EventBridge) -> None:
    """Test None state returns None.

    GIVEN: A None state
    WHEN: State is normalized
    THEN: Result is None
    """
    # GIVEN / WHEN
    result = event_bridge._normalize_state(None, {})

    # THEN
    assert result is None


async def test_state_change_publishes_kernel_event(
    event_bridge: EventBridge,
    event_bus: Mock,
    location_manager: Mock,
) -> None:
    """Test HA state changes are translated to kernel events.

    GIVEN: A motion sensor state change in HA
    WHEN: The state change event is processed
    THEN: A kernel event is published to the event bus
    """
    # GIVEN
    old_state = State("binary_sensor.kitchen_motion", STATE_OFF)
    new_state = State("binary_sensor.kitchen_motion", STATE_ON)

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "binary_sensor.kitchen_motion",
        "old_state": old_state,
        "new_state": new_state,
    }

    # WHEN
    event_bridge._state_changed_listener(ha_event)

    # THEN
    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]

    assert published_event.type == "sensor.state_changed"
    assert published_event.source == "ha"
    assert published_event.entity_id == "binary_sensor.kitchen_motion"
    assert published_event.location_id == "kitchen"
    assert published_event.payload["old_state"] == STATE_OFF
    assert published_event.payload["new_state"] == STATE_ON


async def test_unmapped_entity_ignored(
    event_bridge: EventBridge,
    event_bus: Mock,
    location_manager: Mock,
) -> None:
    """Test unmapped entities don't generate kernel events.

    GIVEN: An entity not mapped to any location
    WHEN: Its state changes
    THEN: No kernel event is published
    """
    # GIVEN
    location_manager.get_entity_location.return_value = None

    old_state = State("binary_sensor.unknown", STATE_OFF)
    new_state = State("binary_sensor.unknown", STATE_ON)

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "binary_sensor.unknown",
        "old_state": old_state,
        "new_state": new_state,
    }

    # WHEN
    event_bridge._state_changed_listener(ha_event)

    # THEN
    event_bus.publish.assert_not_called()


async def test_missing_entity_id_ignored(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test events without entity_id are ignored.

    GIVEN: A state change event without entity_id
    WHEN: The event is processed
    THEN: No kernel event is published
    """
    # GIVEN
    ha_event = Mock()
    ha_event.data = {
        "old_state": None,
        "new_state": None,
    }

    # WHEN
    event_bridge._state_changed_listener(ha_event)

    # THEN
    event_bus.publish.assert_not_called()


async def test_dimmer_state_normalized_in_event(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test dimmer brightness=0 normalized in published events.

    GIVEN: A dimmer reporting ON with brightness=0
    WHEN: The state change is processed
    THEN: Published event has state=OFF
    """
    # GIVEN
    old_state = State("light.kitchen", STATE_OFF)
    new_state = State("light.kitchen", STATE_ON, {"brightness": 0})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "light.kitchen",
        "old_state": old_state,
        "new_state": new_state,
    }

    # WHEN
    event_bridge._state_changed_listener(ha_event)

    # THEN
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["new_state"] == STATE_OFF


async def test_publish_error_handled_gracefully(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test errors during publish are caught and logged.

    GIVEN: An event bus that raises an exception
    WHEN: A state change is processed
    THEN: The error is caught and execution continues
    """
    # GIVEN
    event_bus.publish.side_effect = Exception("Test error")

    old_state = State("binary_sensor.motion", STATE_OFF)
    new_state = State("binary_sensor.motion", STATE_ON)

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "binary_sensor.motion",
        "old_state": old_state,
        "new_state": new_state,
    }

    # WHEN / THEN - Should not raise
    event_bridge._state_changed_listener(ha_event)
