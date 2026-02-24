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
from home_topology import Event, EventBus, EventFilter, LocationManager
from homeassistant.const import EVENT_STATE_CHANGED, STATE_OFF, STATE_ON, STATE_PAUSED, STATE_PLAYING
from homeassistant.core import HomeAssistant, State

from custom_components.home_topology.event_bridge import EventBridge


@pytest.fixture(name="location_manager")
def location_manager_fixture() -> Mock:
    """Create a mock LocationManager for event bridge testing."""
    loc_mgr = Mock(spec=LocationManager)
    loc_mgr.get_entity_location.return_value = "kitchen"
    loc_mgr.get_module_config.return_value = {
        "enabled": True,
        "default_timeout": 300,
        "occupancy_sources": [
            {
                "entity_id": "binary_sensor.kitchen_motion",
                "mode": "specific_states",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "clear",
                "off_trailing": 0,
            },
            {
                "entity_id": "light.kitchen",
                "source_id": "light.kitchen::power",
                "signal_key": "power",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "clear",
                "off_trailing": 0,
            },
            {
                "entity_id": "light.kitchen",
                "source_id": "light.kitchen::level",
                "signal_key": "level",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "none",
                "off_trailing": 0,
            },
            {
                "entity_id": "light.kitchen",
                "source_id": "light.kitchen::color",
                "signal_key": "color",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "none",
                "off_trailing": 0,
            },
            {
                "entity_id": "binary_sensor.motion",
                "mode": "specific_states",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "none",
                "off_trailing": 0,
            },
            {
                "entity_id": "media_player.living_room_tv",
                "source_id": "media_player.living_room_tv::playback",
                "signal_key": "playback",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "clear",
                "off_trailing": 0,
            },
            {
                "entity_id": "media_player.living_room_tv",
                "source_id": "media_player.living_room_tv::volume",
                "signal_key": "volume",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "none",
                "off_trailing": 0,
            },
            {
                "entity_id": "media_player.living_room_tv",
                "source_id": "media_player.living_room_tv::mute",
                "signal_key": "mute",
                "mode": "any_change",
                "on_event": "trigger",
                "on_timeout": 1800,
                "off_event": "none",
                "off_trailing": 0,
            },
        ],
    }
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


@pytest.mark.parametrize(
    ("old_state", "new_state", "expected"),
    [
        (STATE_PAUSED, STATE_PLAYING, ("trigger", "playback")),
        (STATE_PLAYING, STATE_PAUSED, ("clear", "playback")),
        (STATE_PLAYING, "idle", ("clear", "playback")),
    ],
)
def test_media_state_to_signal_from_playback(
    event_bridge: EventBridge,
    old_state: str,
    new_state: str,
    expected: tuple[str, str] | None,
) -> None:
    """Test media playback state mapping for occupancy signals."""
    old = State("media_player.living_room_tv", old_state)
    new = State("media_player.living_room_tv", new_state)

    result = event_bridge._media_state_to_signal(
        old_state=old,
        new_state=new,
        old_normalized=old_state,
        new_normalized=new_state,
    )

    assert result == expected


@pytest.mark.parametrize(
    ("old_attrs", "new_attrs", "expected"),
    [
        (
            {"volume_level": 0.2, "is_volume_muted": False},
            {"volume_level": 0.5, "is_volume_muted": False},
            ("trigger", "volume"),
        ),
        (
            {"volume_level": 0.2, "is_volume_muted": False},
            {"volume_level": 0.2, "is_volume_muted": True},
            ("trigger", "mute"),
        ),
        (
            {"volume_level": 0.2, "is_volume_muted": False},
            {"volume_level": 0.2, "is_volume_muted": False},
            None,
        ),
        (
            {"volume_level": 0.2, "is_volume_muted": False},
            {"volume_level": 0.2, "is_volume_muted": False, "media_position": 100},
            None,
        ),
    ],
)
def test_media_signal_from_interaction(
    event_bridge: EventBridge,
    old_attrs: dict,
    new_attrs: dict,
    expected: tuple[str, str] | None,
) -> None:
    """Test media interaction mapping tracks volume/mute signal keys."""
    old = State("media_player.living_room_tv", STATE_PLAYING, old_attrs)
    new = State("media_player.living_room_tv", STATE_PLAYING, new_attrs)
    assert (
        event_bridge._media_state_to_signal(
            old_state=old,
            new_state=new,
            old_normalized=STATE_PLAYING,
            new_normalized=STATE_PLAYING,
        )
        == expected
    )


@pytest.mark.parametrize(
    ("old_state", "new_state", "old_attrs", "new_attrs", "expected"),
    [
        (STATE_OFF, STATE_ON, {}, {"brightness": 128}, ("trigger", "power")),
        (STATE_ON, STATE_OFF, {"brightness": 128}, {"brightness": 0}, ("clear", "power")),
        (STATE_ON, STATE_ON, {"brightness": 64}, {"brightness": 192}, ("trigger", "level")),
        (STATE_ON, STATE_ON, {"rgb_color": [255, 100, 0]}, {"rgb_color": [0, 120, 255]}, ("trigger", "color")),
        (STATE_ON, STATE_ON, {"brightness": 64}, {"brightness": 64}, None),
    ],
)
def test_light_state_to_signal_mapping(
    event_bridge: EventBridge,
    old_state: str,
    new_state: str,
    old_attrs: dict,
    new_attrs: dict,
    expected: tuple[str, str] | None,
) -> None:
    """Test light power and dimmer level mapping to signal keys."""
    old = State("light.kitchen", old_state, old_attrs)
    new = State("light.kitchen", new_state, new_attrs)
    assert (
        event_bridge._light_state_to_signal(
            old_state=old,
            new_state=new,
            old_normalized=old_state,
            new_normalized=new_state,
        )
        == expected
    )


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

    assert published_event.type == "occupancy.signal"
    assert published_event.source == "ha"
    assert published_event.entity_id == "binary_sensor.kitchen_motion"
    assert published_event.location_id == "kitchen"
    assert published_event.payload["event_type"] == "trigger"
    assert published_event.payload["source_id"] == "binary_sensor.kitchen_motion"
    assert published_event.payload["old_state"] == STATE_OFF
    assert published_event.payload["new_state"] == STATE_ON


async def test_media_volume_change_publishes_trigger(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test media volume changes generate trigger signals even without state change."""
    old_state = State("media_player.living_room_tv", STATE_PLAYING, {"volume_level": 0.2})
    new_state = State("media_player.living_room_tv", STATE_PLAYING, {"volume_level": 0.5})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "media_player.living_room_tv",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["event_type"] == "trigger"
    assert published_event.payload["signal_key"] == "volume"
    assert published_event.payload["source_id"] == "media_player.living_room_tv::volume"
    assert published_event.payload["old_state"] == STATE_PLAYING
    assert published_event.payload["new_state"] == STATE_PLAYING


async def test_media_mute_change_publishes_trigger(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test media mute toggles generate trigger signals."""
    old_state = State("media_player.living_room_tv", STATE_PLAYING, {"is_volume_muted": False})
    new_state = State("media_player.living_room_tv", STATE_PLAYING, {"is_volume_muted": True})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "media_player.living_room_tv",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["event_type"] == "trigger"
    assert published_event.payload["signal_key"] == "mute"
    assert published_event.payload["source_id"] == "media_player.living_room_tv::mute"


async def test_media_non_interaction_attribute_change_ignored(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test unrelated media attribute changes do not trigger occupancy."""
    old_state = State("media_player.living_room_tv", STATE_PLAYING, {"media_position": 10})
    new_state = State("media_player.living_room_tv", STATE_PLAYING, {"media_position": 20})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "media_player.living_room_tv",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_not_called()


async def test_media_paused_state_publishes_clear(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test media pause transitions emit clear signals."""
    old_state = State("media_player.living_room_tv", STATE_PLAYING)
    new_state = State("media_player.living_room_tv", STATE_PAUSED)

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "media_player.living_room_tv",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["event_type"] == "clear"
    assert published_event.payload["signal_key"] == "playback"
    assert published_event.payload["source_id"] == "media_player.living_room_tv::playback"


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
    old_state = State("light.kitchen", STATE_ON, {"brightness": 255})
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
    assert published_event.type == "occupancy.signal"
    assert published_event.payload["event_type"] == "clear"
    assert published_event.payload["signal_key"] == "power"
    assert published_event.payload["source_id"] == "light.kitchen::power"
    assert published_event.payload["new_state"] == STATE_OFF


async def test_dimmer_level_change_publishes_level_signal(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test dimmer brightness changes while ON emit level trigger."""
    old_state = State("light.kitchen", STATE_ON, {"brightness": 40})
    new_state = State("light.kitchen", STATE_ON, {"brightness": 180})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "light.kitchen",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["event_type"] == "trigger"
    assert published_event.payload["signal_key"] == "level"
    assert published_event.payload["source_id"] == "light.kitchen::level"


async def test_light_color_change_publishes_color_signal(
    event_bridge: EventBridge,
    event_bus: Mock,
) -> None:
    """Test RGB/color changes while ON emit color trigger."""
    old_state = State("light.kitchen", STATE_ON, {"rgb_color": [255, 100, 0]})
    new_state = State("light.kitchen", STATE_ON, {"rgb_color": [0, 120, 255]})

    ha_event = Mock()
    ha_event.data = {
        "entity_id": "light.kitchen",
        "old_state": old_state,
        "new_state": new_state,
    }

    event_bridge._state_changed_listener(ha_event)

    event_bus.publish.assert_called_once()
    published_event: Event = event_bus.publish.call_args[0][0]
    assert published_event.payload["event_type"] == "trigger"
    assert published_event.payload["signal_key"] == "color"
    assert published_event.payload["source_id"] == "light.kitchen::color"


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


async def test_media_state_changed_end_to_end_with_module_config(
    hass: HomeAssistant,
) -> None:
    """End-to-end test: configured media source + HA state_changed emits occupancy.signal.

    GIVEN: A real EventBus/LocationManager setup with an occupancy source configured
    WHEN: HA fires a media state_changed event with volume interaction delta
    THEN: EventBridge publishes occupancy.signal trigger for that location
    """
    bus = EventBus()
    loc_mgr = LocationManager()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
    loc_mgr.create_location(id="living_room", name="Living Room", parent_id="house")
    loc_mgr.add_entity_to_location("media_player.living_room_tv", "living_room")
    loc_mgr.set_module_config(
        "living_room",
        "occupancy",
        {
            "enabled": True,
            "default_timeout": 300,
            "occupancy_sources": [
                {
                    "entity_id": "media_player.living_room_tv",
                    "source_id": "media_player.living_room_tv::playback",
                    "signal_key": "playback",
                    "mode": "any_change",
                    "on_event": "trigger",
                    "on_timeout": 1800,
                    "off_event": "clear",
                    "off_trailing": 0,
                },
                {
                    "entity_id": "media_player.living_room_tv",
                    "source_id": "media_player.living_room_tv::volume",
                    "signal_key": "volume",
                    "mode": "any_change",
                    "on_event": "trigger",
                    "on_timeout": 1800,
                    "off_event": "none",
                    "off_trailing": 0,
                }
            ],
        },
    )

    captured: list[Event] = []

    def _capture(event: Event) -> None:
        captured.append(event)

    bus.subscribe(_capture, EventFilter(event_type="occupancy.signal"))

    bridge = EventBridge(hass, bus, loc_mgr)
    await bridge.async_setup()

    old_state = State(
        "media_player.living_room_tv",
        STATE_PLAYING,
        {"volume_level": 0.2, "is_volume_muted": False},
    )
    new_state = State(
        "media_player.living_room_tv",
        STATE_PLAYING,
        {"volume_level": 0.6, "is_volume_muted": False},
    )

    hass.bus.async_fire(
        EVENT_STATE_CHANGED,
        {
            "entity_id": "media_player.living_room_tv",
            "old_state": old_state,
            "new_state": new_state,
        },
    )
    await hass.async_block_till_done()

    assert len(captured) == 1
    emitted = captured[0]
    assert emitted.type == "occupancy.signal"
    assert emitted.location_id == "living_room"
    assert emitted.payload["event_type"] == "trigger"
    assert emitted.payload["source_id"] == "media_player.living_room_tv::volume"
    assert emitted.payload["signal_key"] == "volume"

    await bridge.async_teardown()
