"""Unit tests for SyncManager HA-registry-driven synchronization.

These tests validate the SyncManager class independently from full
integration setup, making them faster and more focused.
"""

from __future__ import annotations

import pytest
from home_topology import EventBus, LocationManager
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import floor_registry as fr

from custom_components.home_topology.sync_manager import SyncManager

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def loc_mgr():
    """Create a LocationManager instance."""
    mgr = LocationManager()
    # Create root location
    mgr.create_location(id="house", name="House", is_explicit_root=True)
    return mgr


@pytest.fixture
def event_bus(loc_mgr):
    """Create an EventBus instance."""
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    return bus


@pytest.fixture
async def sync_manager(hass: HomeAssistant, loc_mgr, event_bus):
    """Create a SyncManager instance."""
    return SyncManager(hass, loc_mgr, event_bus)


@pytest.fixture
async def clean_registries(hass: HomeAssistant):
    """Start with clean area and entity registries."""
    area_reg = ar.async_get(hass)
    floor_reg = fr.async_get(hass)

    # Clear all areas
    for area in list(area_reg.areas.values()):
        area_reg.async_delete(area.id)

    for floor in list(floor_reg.floors.values()):
        floor_reg.async_delete(floor.floor_id)

    yield

    # Cleanup after test
    for area in list(area_reg.areas.values()):
        area_reg.async_delete(area.id)
    for floor in list(floor_reg.floors.values()):
        floor_reg.async_delete(floor.floor_id)


# =============================================================================
# Phase 1: Initial Import Tests
# =============================================================================


class TestInitialImport:
    """Test HA → Topology initial import."""

    async def test_import_empty_ha(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test importing from empty HA creates only root.

        GIVEN: Empty HA with no areas
        WHEN: Import runs
        THEN: Only root "house" location exists
        """
        await sync_manager.import_all_areas_and_floors()

        locations = loc_mgr.all_locations()
        assert len(locations) == 1
        assert locations[0].id == "house"

    async def test_import_single_area(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test importing a single area.

        GIVEN: HA has one area "Kitchen"
        WHEN: Import runs
        THEN: Topology has location "area_<id>" with name "Kitchen"
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()

        location = loc_mgr.get_location(f"area_{kitchen.id}")
        assert location is not None
        assert location.name == "Kitchen"
        assert location.parent_id == "house"

        # Check metadata
        meta = location.modules.get("_meta", {})
        assert location.ha_area_id == kitchen.id
        assert meta["ha_area_id"] == kitchen.id
        assert meta["type"] == "area"
        assert meta["sync_source"] == "homeassistant"
        assert meta["sync_enabled"] is True

    async def test_import_multiple_areas(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test importing multiple areas.

        GIVEN: HA has Kitchen, Living Room, Bedroom
        WHEN: Import runs
        THEN: All three locations created
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")
        living_room = area_reg.async_create("Living Room")
        bedroom = area_reg.async_create("Bedroom")

        await sync_manager.import_all_areas_and_floors()

        assert loc_mgr.get_location(f"area_{kitchen.id}") is not None
        assert loc_mgr.get_location(f"area_{living_room.id}") is not None
        assert loc_mgr.get_location(f"area_{bedroom.id}") is not None

    async def test_import_area_with_entities(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test entity mapping during import.

        GIVEN: HA area with entities assigned
        WHEN: Import runs
        THEN: Entities are mapped to location
        """
        area_reg = ar.async_get(hass)
        entity_reg = er.async_get(hass)

        kitchen = area_reg.async_create("Kitchen")

        # Create entity in kitchen
        light = entity_reg.async_get_or_create(
            domain="light",
            platform="test",
            unique_id="light_kitchen_1",
            suggested_object_id="kitchen_light",
        )
        entity_reg.async_update_entity(light.entity_id, area_id=kitchen.id)

        await sync_manager.import_all_areas_and_floors()

        location = loc_mgr.get_location(f"area_{kitchen.id}")
        assert location is not None
        assert light.entity_id in location.entity_ids

    async def test_import_floor_with_areas(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test importing floor with areas.

        GIVEN: HA has floor "Ground Floor" with kitchen area
        WHEN: Import runs
        THEN:
          - Floor becomes location "floor_<id>"
          - Area parent is set to floor
        """
        area_reg = ar.async_get(hass)
        floor_reg = fr.async_get(hass)
        floor = floor_reg.async_create("Ground Floor")
        kitchen = area_reg.async_create("Kitchen", floor_id=floor.floor_id)

        await sync_manager.import_all_areas_and_floors()

        # Check floor location
        floor_loc = loc_mgr.get_location(f"floor_{floor.floor_id}")
        assert floor_loc is not None
        assert floor_loc.name == "Ground Floor"
        assert floor_loc.parent_id == "house"

        # Check area location
        area_loc = loc_mgr.get_location(f"area_{kitchen.id}")
        assert area_loc is not None
        assert area_loc.parent_id == f"floor_{floor.floor_id}"


# =============================================================================
# Phase 2: HA → Topology Live Sync Tests
# =============================================================================


class TestHAToTopologySync:
    """Test live sync from HA to topology."""

    async def test_area_rename_updates_location(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test HA area rename updates location.

        GIVEN: Synced area "Kitchen"
        WHEN: Area renamed to "Culinary Space"
        THEN: Location name updates to "Culinary Space"
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()  # Start listeners

        # Rename in HA
        area_reg.async_update(kitchen.id, name="Culinary Space")
        await hass.async_block_till_done()

        # Verify location updated
        location = loc_mgr.get_location(f"area_{kitchen.id}")
        assert location.name == "Culinary Space"

    async def test_area_delete_removes_location(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test HA area deletion removes location.

        GIVEN: Synced area "Kitchen"
        WHEN: Area deleted in HA
        THEN: Location is removed
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        # Delete in HA
        area_reg.async_delete(kitchen.id)
        await hass.async_block_till_done()

        # Verify location removed
        location = loc_mgr.get_location(f"area_{kitchen.id}")
        assert location is None

    async def test_entity_move_updates_mapping(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test entity area change updates location mapping.

        GIVEN: Entity in Kitchen
        WHEN: Entity moved to Living Room
        THEN: Location mapping updates
        """
        area_reg = ar.async_get(hass)
        entity_reg = er.async_get(hass)

        kitchen = area_reg.async_create("Kitchen")
        living_room = area_reg.async_create("Living Room")

        light = entity_reg.async_get_or_create(
            domain="light",
            platform="test",
            unique_id="light_1",
            suggested_object_id="light_1",
        )
        entity_reg.async_update_entity(light.entity_id, area_id=kitchen.id)

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        # Move entity
        entity_reg.async_update_entity(light.entity_id, area_id=living_room.id)
        await hass.async_block_till_done()

        # Verify mapping
        kitchen_loc = f"area_{kitchen.id}"
        living_loc = f"area_{living_room.id}"

        assert light.entity_id not in loc_mgr.get_location(kitchen_loc).entity_ids
        assert light.entity_id in loc_mgr.get_location(living_loc).entity_ids

    async def test_area_update_ignored_for_topology_owned_location(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """HA area updates should not overwrite topology-owned locations."""
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        location_id = f"area_{kitchen.id}"
        location = loc_mgr.get_location(location_id)
        loc_mgr.set_module_config(
            location_id,
            "_meta",
            {
                **location.modules.get("_meta", {}),
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )

        area_reg.async_update(kitchen.id, name="Culinary Space")
        await hass.async_block_till_done()

        assert loc_mgr.get_location(location_id).name == "Kitchen"

    async def test_area_update_ignored_when_sync_disabled(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """HA area updates should not apply when sync is disabled."""
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        location_id = f"area_{kitchen.id}"
        location = loc_mgr.get_location(location_id)
        loc_mgr.set_module_config(
            location_id,
            "_meta",
            {
                **location.modules.get("_meta", {}),
                "sync_enabled": False,
            },
        )

        area_reg.async_update(kitchen.id, name="Culinary Space")
        await hass.async_block_till_done()

        assert loc_mgr.get_location(location_id).name == "Kitchen"


# =============================================================================
# Phase 3: Topology Mutation Non-Writeback Tests
# =============================================================================


class TestTopologyToHASync:
    """Test live sync from topology to HA."""

    async def test_location_rename_does_not_update_area_registry(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        event_bus: EventBus,
        clean_registries,
    ):
        """Topology rename should not mutate HA area registry.

        GIVEN: Synced location "Kitchen"
        WHEN: Location renamed to "Culinary Space"
        THEN: HA area name remains unchanged
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        location_id = f"area_{kitchen.id}"

        # Rename in topology
        loc_mgr.update_location(location_id, name="Culinary Space")
        await hass.async_block_till_done()

        # Verify HA area not updated by integration writeback
        updated_area = area_reg.async_get_area(kitchen.id)
        assert updated_area.name == "Kitchen"

    async def test_topology_only_location_no_sync(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test topology-only locations don't sync to HA.

        GIVEN: Location created directly in topology
        WHEN: Location renamed
        THEN: No HA area is created
        """
        area_reg = ar.async_get(hass)

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        initial_area_count = len(area_reg.areas)

        # Create topology-only location
        loc_mgr.create_location(
            id="custom_zone",
            name="Custom Zone",
            parent_id="house",
        )

        # Mark as topology-only
        loc_mgr.set_module_config(
            "custom_zone",
            "_meta",
            {
                "type": "custom",
                "sync_source": "topology",
                "sync_enabled": False,
            },
        )

        # Rename it
        loc_mgr.update_location("custom_zone", name="Special Zone")
        await hass.async_block_till_done()

        # Verify no new HA area created
        assert len(area_reg.areas) == initial_area_count

    async def test_parent_change_does_not_write_floor_assignment_to_ha(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Topology parent changes should not mutate HA area floor assignment."""
        area_reg = ar.async_get(hass)
        floor_reg = fr.async_get(hass)

        floor = floor_reg.async_create("Ground Floor")
        kitchen = area_reg.async_create("Kitchen", floor_id=floor.floor_id)

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        floor_location_id = f"floor_{floor.floor_id}"
        loc_mgr.create_location(
            id="grouping_area",
            name="Grouping Area",
            parent_id=floor_location_id,
        )
        loc_mgr.set_module_config(
            "grouping_area",
            "_meta",
            {
                "type": "area",
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )

        original_floor_id = area_reg.async_get_area(kitchen.id).floor_id
        loc_mgr.update_location(f"area_{kitchen.id}", parent_id="grouping_area")
        await hass.async_block_till_done()

        # No topology->HA writeback: floor assignment remains as configured in HA.
        assert area_reg.async_get_area(kitchen.id).floor_id == original_floor_id


# =============================================================================
# Edge Cases and Conflict Tests
# =============================================================================


class TestSyncEdgeCases:
    """Test edge cases and conflict scenarios."""

    async def test_circular_update_prevention(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test circular update prevention.

        GIVEN: Synced location "Kitchen"
        WHEN: Rename in HA triggers topology update
        THEN: Topology update doesn't trigger HA update again
        """
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()
        await sync_manager.async_setup()

        # Track update events
        ha_updates = []
        topo_updates = []

        original_ha_update = area_reg.async_update
        original_topo_update = loc_mgr.update_location

        def track_ha_update(area_id, **kwargs):
            ha_updates.append((area_id, kwargs))
            return original_ha_update(area_id, **kwargs)

        def track_topo_update(loc_id, **kwargs):
            topo_updates.append((loc_id, kwargs))
            return original_topo_update(loc_id, **kwargs)

        area_reg.async_update = track_ha_update
        loc_mgr.update_location = track_topo_update

        # Rename in HA
        area_reg.async_update(kitchen.id, name="New Name")
        await hass.async_block_till_done()

        # Should have: 1 HA update, 1 topology update, no circular loop
        assert len(ha_updates) == 1
        assert len(topo_updates) == 1

    async def test_special_characters_in_names(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test special characters in area names.

        GIVEN: Area with special characters
        WHEN: Import runs
        THEN: Name preserved correctly
        """
        area_reg = ar.async_get(hass)
        special_area = area_reg.async_create("Mom's Kitchen & Dining 🍽️")

        await sync_manager.import_all_areas_and_floors()

        location = loc_mgr.get_location(f"area_{special_area.id}")
        assert location is not None
        assert location.name == "Mom's Kitchen & Dining 🍽️"


# =============================================================================
# Utility Method Tests
# =============================================================================


class TestSyncUtilities:
    """Test SyncManager utility methods."""

    async def test_get_location_for_area(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test utility method to get location for HA area."""
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()

        location = sync_manager.get_location_for_area(kitchen.id)
        assert location is not None
        assert location.name == "Kitchen"

    async def test_get_area_for_location(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test utility method to get HA area for location."""
        area_reg = ar.async_get(hass)
        kitchen = area_reg.async_create("Kitchen")

        await sync_manager.import_all_areas_and_floors()

        location_id = f"area_{kitchen.id}"
        area = sync_manager.get_area_for_location(location_id)
        assert area is not None
        assert area.name == "Kitchen"
        assert area.id == kitchen.id


# =============================================================================
# Performance Tests
# =============================================================================


@pytest.mark.slow
class TestSyncPerformance:
    """Test performance with large datasets."""

    async def test_import_many_areas(
        self,
        hass: HomeAssistant,
        sync_manager: SyncManager,
        loc_mgr: LocationManager,
        clean_registries,
    ):
        """Test importing many areas performs acceptably.

        GIVEN: 50 areas in HA
        WHEN: Import runs
        THEN: Completes in reasonable time
        """
        area_reg = ar.async_get(hass)

        # Create 50 areas
        for i in range(50):
            area_reg.async_create(f"Area {i:02d}")

        import time

        start = time.time()
        await sync_manager.import_all_areas_and_floors()
        duration = time.time() - start

        # Should complete in under 2 seconds
        assert duration < 2.0
        assert len(loc_mgr.all_locations()) == 51  # 50 areas + root
