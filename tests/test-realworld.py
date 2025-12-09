"""Real-world integration tests for Home Topology.

These tests simulate realistic scenarios with actual data flows:
- Bidirectional sync between HA areas/floors and topology locations
- Event flow from sensors through modules to binary sensors
- Timeout handling with short intervals for easy testing
- Complete end-to-end scenarios

Test Configuration:
- Short timeouts for live testing (10s occupancy, 1s coordinator)
- Realistic house structure (2 floors, 5 rooms)
- Multiple sensor types (motion, door, light, media player)
"""

from __future__ import annotations

import asyncio
from datetime import timedelta
from typing import Any
from unittest.mock import Mock, patch

import pytest
from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import area_registry as ar, entity_registry as er
from homeassistant.util import dt as dt_util

# Short timeouts for easy live testing
TEST_OCCUPANCY_TIMEOUT = 10  # 10 seconds
TEST_COORDINATOR_INTERVAL = 1  # 1 second
TEST_TRAILING_TIMEOUT = 2  # 2 seconds


# ============================================================================
# REALISTIC TEST FIXTURES
# ============================================================================


@pytest.fixture
def realistic_house_areas():
    """Create a realistic house structure with floors and areas."""
    return {
        "floors": [
            {"id": "ground_floor", "name": "Ground Floor"},
            {"id": "first_floor", "name": "First Floor"},
        ],
        "areas": [
            # Ground floor
            {
                "id": "living_room",
                "name": "Living Room",
                "floor_id": "ground_floor",
            },
            {
                "id": "kitchen",
                "name": "Kitchen",
                "floor_id": "ground_floor",
            },
            {
                "id": "hallway",
                "name": "Hallway",
                "floor_id": "ground_floor",
            },
            # First floor
            {
                "id": "master_bedroom",
                "name": "Master Bedroom",
                "floor_id": "first_floor",
            },
            {
                "id": "guest_bedroom",
                "name": "Guest Bedroom",
                "floor_id": "first_floor",
            },
        ],
    }


@pytest.fixture
def realistic_sensors():
    """Create realistic sensor entities for testing."""
    return {
        # Living room - motion + light + media player
        "binary_sensor.living_room_motion": {
            "state": STATE_OFF,
            "attributes": {
                "device_class": "motion",
                "friendly_name": "Living Room Motion",
            },
            "area_id": "living_room",
        },
        "light.living_room": {
            "state": STATE_OFF,
            "attributes": {
                "brightness": 0,
                "friendly_name": "Living Room Light",
            },
            "area_id": "living_room",
        },
        "media_player.living_room_tv": {
            "state": STATE_OFF,
            "attributes": {
                "friendly_name": "Living Room TV",
            },
            "area_id": "living_room",
        },
        # Kitchen - motion + door
        "binary_sensor.kitchen_motion": {
            "state": STATE_OFF,
            "attributes": {
                "device_class": "motion",
                "friendly_name": "Kitchen Motion",
            },
            "area_id": "kitchen",
        },
        "binary_sensor.kitchen_door": {
            "state": STATE_OFF,
            "attributes": {
                "device_class": "door",
                "friendly_name": "Kitchen Door",
            },
            "area_id": "kitchen",
        },
        # Master bedroom - motion + light
        "binary_sensor.master_bedroom_motion": {
            "state": STATE_OFF,
            "attributes": {
                "device_class": "motion",
                "friendly_name": "Master Bedroom Motion",
            },
            "area_id": "master_bedroom",
        },
        "light.master_bedroom": {
            "state": STATE_OFF,
            "attributes": {
                "brightness": 0,
                "friendly_name": "Master Bedroom Light",
            },
            "area_id": "master_bedroom",
        },
    }


@pytest.fixture
async def setup_realistic_house(
    hass: HomeAssistant,
    realistic_house_areas: dict[str, Any],
    realistic_sensors: dict[str, Any],
) -> dict[str, Any]:
    """Set up a realistic house with areas and sensors in HA registries."""
    # Create area registry entries
    area_registry = ar.async_get(hass)
    created_areas = {}
    for area_data in realistic_house_areas["areas"]:
        area_entry = area_registry.async_create(name=area_data["name"])
        created_areas[area_data["id"]] = area_entry

    # Create entity registry entries
    entity_registry = er.async_get(hass)
    created_entities = {}
    for entity_id, entity_data in realistic_sensors.items():
        area_id = entity_data.get("area_id")
        if area_id and area_id in created_areas:
            entity_entry = entity_registry.async_get_or_create(
                domain=entity_id.split(".")[0],
                platform="test",
                unique_id=entity_id,
                suggested_object_id=entity_id.split(".")[1],
                area_id=created_areas[area_id].id,
            )
            created_entities[entity_id] = entity_entry

            # Set initial state
            hass.states.async_set(
                entity_id,
                entity_data["state"],
                entity_data["attributes"],
            )

    return {
        "areas": created_areas,
        "entities": created_entities,
        "area_registry": area_registry,
        "entity_registry": entity_registry,
    }


# ============================================================================
# TEST 1: LOCATION/AREA BIDIRECTIONAL SYNC
# ============================================================================


class TestLocationAreaSync:
    """Test bidirectional synchronization between HA areas and topology locations."""

    @pytest.mark.asyncio
    async def test_ha_areas_imported_as_locations(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],
    ):
        """Test that HA areas are imported as locations on integration setup."""
        # This would test the actual integration setup
        # For now, we'll test the core logic

        from home_topology import LocationManager  # noqa: PLC0415

        loc_mgr = LocationManager()

        # Create root
        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)

        # Import areas
        areas = setup_realistic_house["areas"]
        for _area_id, area_entry in areas.items():
            location_id = f"area_{area_entry.id}"
            loc_mgr.create_location(
                id=location_id,
                name=area_entry.name,
                parent_id="house",
                ha_area_id=area_entry.id,
            )

        # Verify all locations were created
        all_locations = loc_mgr.all_locations()
        assert len(all_locations) == 6  # 1 root + 5 areas

        # Verify structure
        living_room = loc_mgr.get_location("area_" + areas["living_room"].id)
        assert living_room is not None
        assert living_room.name == "Living Room"
        assert living_room.parent_id == "house"

    @pytest.mark.asyncio
    async def test_entities_mapped_to_locations(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],
    ):
        """Test that HA entities are mapped to locations based on area assignments."""
        from home_topology import LocationManager  # noqa: PLC0415

        loc_mgr = LocationManager()
        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)

        # Import areas and entities
        areas = setup_realistic_house["areas"]
        entities = setup_realistic_house["entities"]

        # Create locations from areas
        for _area_id, area_entry in areas.items():
            location_id = f"area_{area_entry.id}"
            loc_mgr.create_location(
                id=location_id,
                name=area_entry.name,
                parent_id="house",
                ha_area_id=area_entry.id,
            )

        # Map entities to locations
        for entity_id, entity_entry in entities.items():
            if entity_entry.area_id:
                location_id = f"area_{entity_entry.area_id}"
                loc_mgr.add_entity_to_location(entity_id, location_id)

        # Verify mappings
        living_room_id = f"area_{areas['living_room'].id}"
        _living_room_loc = loc_mgr.get_location(living_room_id)

        # Check entity location
        motion_location = loc_mgr.get_entity_location(
            "binary_sensor.living_room_motion"
        )
        assert motion_location == living_room_id

    @pytest.mark.asyncio
    async def test_location_hierarchy_preserved(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],
    ):
        """Test that location hierarchy is preserved (house → areas)."""
        from home_topology import LocationManager  # noqa: PLC0415

        loc_mgr = LocationManager()
        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)

        areas = setup_realistic_house["areas"]
        for _area_id, area_entry in areas.items():
            location_id = f"area_{area_entry.id}"
            loc_mgr.create_location(
                id=location_id,
                name=area_entry.name,
                parent_id="house",
                ha_area_id=area_entry.id,
            )

        # Verify hierarchy
        house = loc_mgr.get_location("house")
        assert house.is_root

        # All areas should be children of house
        for area_id, area_entry in areas.items():
            location_id = f"area_{area_entry.id}"
            location = loc_mgr.get_location(location_id)
            assert location.parent_id == "house"
            assert not location.is_root


# ============================================================================
# TEST 2: EVENT FLOW INTEGRATION
# ============================================================================


class TestEventFlowIntegration:
    """Test complete event flow from sensors through modules to binary sensors."""

    @pytest.mark.asyncio
    async def test_motion_sensor_triggers_occupancy(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],  # noqa: ARG002
    ):
        """Test that motion sensor state change triggers occupancy."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        # Setup
        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(
            id="living_room",
            name="Living Room",
            parent_id="house",
        )
        loc_mgr.add_entity_to_location(
            "binary_sensor.living_room_motion",
            "living_room",
        )

        # Setup occupancy module with short timeout
        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        # Override default timeout
        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("living_room", "occupancy", config)

        # Track events
        events_received = []

        def on_occupancy_changed(event):
            events_received.append(event)

        bus.subscribe(
            on_occupancy_changed,
            event_type="occupancy.changed",
        )

        # Trigger motion
        bus.publish(
            event_type="sensor.motion",
            location_id="living_room",
            data={
                "entity_id": "binary_sensor.living_room_motion",
                "detected": True,
            },
        )

        # Verify occupancy changed
        assert len(events_received) == 1
        assert events_received[0].location_id == "living_room"
        assert events_received[0].payload["occupied"] is True

    @pytest.mark.asyncio
    async def test_light_dimmer_triggers_occupancy(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],  # noqa: ARG002
    ):
        """Test that light brightness change triggers occupancy (activity detection)."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        # Setup
        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(
            id="bedroom",
            name="Bedroom",
            parent_id="house",
        )
        loc_mgr.add_entity_to_location("light.bedroom", "bedroom")

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("bedroom", "occupancy", config)

        events_received = []
        bus.subscribe(
            lambda e: events_received.append(e),
            event_type="occupancy.changed",
        )

        # Turn light on with brightness
        bus.publish(
            event_type="light.state_changed",
            location_id="bedroom",
            data={
                "entity_id": "light.bedroom",
                "on": True,
                "brightness": 0.5,
            },
        )

        # Verify occupancy
        assert len(events_received) == 1
        assert events_received[0].payload["occupied"] is True

    @pytest.mark.asyncio
    async def test_media_player_triggers_occupancy(
        self,
        hass: HomeAssistant,  # noqa: ARG002
        setup_realistic_house: dict[str, Any],  # noqa: ARG002
    ):
        """Test that media player playing state triggers occupancy."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(
            id="living_room",
            name="Living Room",
            parent_id="house",
        )
        loc_mgr.add_entity_to_location(
            "media_player.living_room_tv",
            "living_room",
        )

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("living_room", "occupancy", config)

        events_received = []
        bus.subscribe(
            lambda e: events_received.append(e),
            event_type="occupancy.changed",
        )

        # Start playing media
        bus.publish(
            event_type="media_player.state_changed",
            location_id="living_room",
            data={
                "entity_id": "media_player.living_room_tv",
                "state": "playing",
            },
        )

        assert len(events_received) == 1
        assert events_received[0].payload["occupied"] is True

    @pytest.mark.asyncio
    async def test_event_bridge_translates_ha_states(
        self,
        hass: HomeAssistant,
        setup_realistic_house: dict[str, Any],  # noqa: ARG002
    ):
        """Test EventBridge translates HA state changes to kernel events."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from custom_components.home_topology.event_bridge import EventBridge  # noqa: PLC0415

        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(
            id="kitchen",
            name="Kitchen",
            parent_id="house",
        )
        loc_mgr.add_entity_to_location(
            "binary_sensor.kitchen_motion",
            "kitchen",
        )

        # Track published events
        events_received = []
        bus.subscribe(
            lambda e: events_received.append(e),
            event_type="sensor.motion",
        )

        # Create event bridge
        bridge = EventBridge(hass, bus, loc_mgr)

        # Simulate HA state change
        old_state = State(
            "binary_sensor.kitchen_motion",
            STATE_OFF,
            {"device_class": "motion"},
        )
        new_state = State(
            "binary_sensor.kitchen_motion",
            STATE_ON,
            {"device_class": "motion"},
        )

        # Process state change
        await bridge._async_state_changed_listener(
            Mock(data={"entity_id": "binary_sensor.kitchen_motion"}),
            old_state,
            new_state,
        )

        # Verify event was published
        assert len(events_received) == 1
        assert events_received[0].location_id == "kitchen"
        assert events_received[0].data["detected"] is True


# ============================================================================
# TEST 3: TIMEOUT HANDLING
# ============================================================================


class TestTimeoutHandling:
    """Test timeout handling with short intervals for easy live testing."""

    @pytest.mark.asyncio
    async def test_occupancy_timeout_expires(
        self,
        hass: HomeAssistant,  # noqa: ARG002
    ):
        """Test that occupancy expires after timeout with no activity."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(id="room", name="Room", parent_id="house")

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("room", "occupancy", config)

        events = []
        bus.subscribe(lambda e: events.append(e), event_type="occupancy.changed")

        # Trigger occupancy
        bus.publish(
            event_type="sensor.motion",
            location_id="room",
            data={"entity_id": "binary_sensor.motion", "detected": True},
        )

        assert len(events) == 1
        assert events[0].payload["occupied"] is True

        # Fast-forward time
        now = dt_util.utcnow()
        future = now + timedelta(seconds=TEST_OCCUPANCY_TIMEOUT + 1)

        # Check timeouts
        occupancy.check_timeouts(future)

        # Verify occupancy expired
        assert len(events) == 2
        assert events[1].payload["occupied"] is False

    @pytest.mark.asyncio
    async def test_coordinator_schedules_next_timeout(
        self,
        hass: HomeAssistant,
    ):
        """Test that coordinator schedules the next timeout check."""
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415
        from custom_components.home_topology.coordinator import (  # noqa: PLC0415
            HomeTopologyCoordinator,
        )

        # Mock occupancy module with timeout
        occupancy = Mock(spec=OccupancyModule)
        next_timeout = dt_util.utcnow() + timedelta(seconds=TEST_COORDINATOR_INTERVAL)
        occupancy.get_next_timeout.return_value = next_timeout
        occupancy.check_timeouts = Mock()

        modules = {"occupancy": occupancy}
        coordinator = HomeTopologyCoordinator(hass, modules)

        # Schedule
        with patch(
            "homeassistant.helpers.event.async_track_point_in_time"
        ) as mock_track:
            coordinator.schedule_next_timeout()

            # Verify scheduled
            mock_track.assert_called_once()
            call_args = mock_track.call_args
            assert call_args[0][2] == next_timeout  # Scheduled time

    @pytest.mark.asyncio
    async def test_multiple_modules_timeout_coordination(
        self,
        hass: HomeAssistant,
    ):
        """Test coordinator finds earliest timeout across multiple modules."""
        from custom_components.home_topology.coordinator import (  # noqa: PLC0415
            HomeTopologyCoordinator,
        )

        now = dt_util.utcnow()

        # Module 1 - timeout in 5 seconds
        module1 = Mock()
        module1.get_next_timeout.return_value = now + timedelta(seconds=5)

        # Module 2 - timeout in 10 seconds
        module2 = Mock()
        module2.get_next_timeout.return_value = now + timedelta(seconds=10)

        # Module 3 - no timeout
        module3 = Mock()
        module3.get_next_timeout.return_value = None

        modules = {
            "module1": module1,
            "module2": module2,
            "module3": module3,
        }

        coordinator = HomeTopologyCoordinator(hass, modules)

        with patch(
            "homeassistant.helpers.event.async_track_point_in_time"
        ) as mock_track:
            coordinator.schedule_next_timeout()

            # Should schedule for earliest (module1, 5 seconds)
            mock_track.assert_called_once()
            scheduled_time = mock_track.call_args[0][2]
            assert scheduled_time == now + timedelta(seconds=5)


# ============================================================================
# TEST 4: END-TO-END SCENARIOS
# ============================================================================


class TestEndToEndScenarios:
    """Test complete end-to-end scenarios simulating real usage."""

    @pytest.mark.asyncio
    async def test_morning_routine_scenario(
        self,
        hass: HomeAssistant,  # noqa: ARG002
    ):
        """Test realistic morning routine: motion → light → media player."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        # Setup bedroom
        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(id="bedroom", name="Bedroom", parent_id="house")

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("bedroom", "occupancy", config)

        events = []
        bus.subscribe(lambda e: events.append(e), event_type="occupancy.changed")

        # Scenario: Wake up
        # 1. Motion detected
        bus.publish(
            event_type="sensor.motion",
            location_id="bedroom",
            data={"entity_id": "binary_sensor.bedroom_motion", "detected": True},
        )

        assert len(events) == 1
        assert events[0].payload["occupied"] is True

        # 2. Turn on light (extends timeout)
        await asyncio.sleep(0.1)
        bus.publish(
            event_type="light.state_changed",
            location_id="bedroom",
            data={"entity_id": "light.bedroom", "on": True, "brightness": 0.7},
        )

        # Still occupied, timeout extended
        assert len(events) == 1

        # 3. Leave room (no more activity)
        now = dt_util.utcnow()
        future = now + timedelta(seconds=TEST_OCCUPANCY_TIMEOUT + 1)
        occupancy.check_timeouts(future)

        # Should be vacant now
        assert len(events) == 2
        assert events[1].payload["occupied"] is False

    @pytest.mark.asyncio
    async def test_movie_watching_scenario(
        self,
        hass: HomeAssistant,  # noqa: ARG002
    ):
        """Test movie watching: motion → lights off → media playing."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(
            id="living_room",
            name="Living Room",
            parent_id="house",
        )

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        config = occupancy.default_config()
        config["timeout"] = TEST_OCCUPANCY_TIMEOUT
        loc_mgr.set_module_config("living_room", "occupancy", config)

        events = []
        bus.subscribe(lambda e: events.append(e), event_type="occupancy.changed")

        # 1. Enter room
        bus.publish(
            event_type="sensor.motion",
            location_id="living_room",
            data={"entity_id": "binary_sensor.motion", "detected": True},
        )

        assert len(events) == 1
        assert events[0].payload["occupied"] is True

        # 2. Turn off lights (brightness = 0 should not clear occupancy)
        bus.publish(
            event_type="light.state_changed",
            location_id="living_room",
            data={"entity_id": "light.living_room", "on": False, "brightness": 0},
        )

        # Still occupied (lights off doesn't clear)
        assert len(events) == 1

        # 3. Start movie (keeps occupancy alive)
        bus.publish(
            event_type="media_player.state_changed",
            location_id="living_room",
            data={"entity_id": "media_player.tv", "state": "playing"},
        )

        # Still occupied
        assert len(events) == 1

    @pytest.mark.asyncio
    async def test_multi_room_tracking(
        self,
        hass: HomeAssistant,  # noqa: ARG002
    ):
        """Test tracking person moving through multiple rooms."""
        from home_topology import EventBus, LocationManager  # noqa: PLC0415
        from home_topology.modules.occupancy import OccupancyModule  # noqa: PLC0415

        loc_mgr = LocationManager()
        bus = EventBus()
        bus.set_location_manager(loc_mgr)

        # Setup house
        loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
        loc_mgr.create_location(id="hallway", name="Hallway", parent_id="house")
        loc_mgr.create_location(id="kitchen", name="Kitchen", parent_id="house")
        loc_mgr.create_location(id="living_room", name="Living Room", parent_id="house")

        occupancy = OccupancyModule()
        occupancy.attach(bus, loc_mgr)

        for location_id in ["hallway", "kitchen", "living_room"]:
            config = occupancy.default_config()
            config["timeout"] = TEST_OCCUPANCY_TIMEOUT
            loc_mgr.set_module_config(location_id, "occupancy", config)

        events = []
        bus.subscribe(lambda e: events.append(e), event_type="occupancy.changed")

        # Person walks: Hallway → Kitchen → Living Room

        # 1. Hallway motion
        bus.publish(
            event_type="sensor.motion",
            location_id="hallway",
            data={"entity_id": "binary_sensor.hallway_motion", "detected": True},
        )

        assert len(events) == 1
        assert events[0].location_id == "hallway"
        assert events[0].payload["occupied"] is True

        # 2. Kitchen motion (person moved)
        await asyncio.sleep(0.1)
        bus.publish(
            event_type="sensor.motion",
            location_id="kitchen",
            data={"entity_id": "binary_sensor.kitchen_motion", "detected": True},
        )

        assert len(events) == 2
        assert events[1].location_id == "kitchen"
        assert events[1].payload["occupied"] is True

        # 3. Living room motion
        await asyncio.sleep(0.1)
        bus.publish(
            event_type="sensor.motion",
            location_id="living_room",
            data={"entity_id": "binary_sensor.living_room_motion", "detected": True},
        )

        assert len(events) == 3
        assert events[2].location_id == "living_room"
        assert events[2].payload["occupied"] is True

        # 4. After timeouts, all should clear
        now = dt_util.utcnow()
        future = now + timedelta(seconds=TEST_OCCUPANCY_TIMEOUT + 1)
        occupancy.check_timeouts(future)

        # All three rooms should now be vacant
        assert len(events) == 6  # 3 occupied + 3 vacant
        vacant_events = [e for e in events[3:] if not e.payload["occupied"]]
        assert len(vacant_events) == 3


# ============================================================================
# TEST CONFIGURATION
# ============================================================================


@pytest.fixture(autouse=True)
def set_test_timeouts():
    """Configure short timeouts for all tests."""
    # This would be used to override default module configurations
    yield
    # Cleanup if needed


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
