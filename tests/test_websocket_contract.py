"""WebSocket contract tests for Topomation.

These tests verify that the integration:
- Imports HA floors/areas/entities into topology locations
- Exposes the expected shape via the WebSocket list endpoint
- Keeps HA-backed floor/area lifecycle authoritative in Home Assistant and
  permits topology-initiated delete by forwarding to HA registries (root
  remains protected), while supporting integration-owned structural operations
  as an adapter overlay
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import floor_registry as fr
from homeassistant.helpers.storage import Store
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation.const import (  # type: ignore[import]
    DOMAIN,
    STORAGE_KEY_CONFIG,
    STORAGE_VERSION,
    WS_TYPE_ACTION_RULES_CREATE,
    WS_TYPE_ACTION_RULES_DELETE,
    WS_TYPE_ACTION_RULES_LIST,
    WS_TYPE_ACTION_RULES_SET_ENABLED,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
    WS_TYPE_SYNC_ENABLE,
    WS_TYPE_SYNC_STATUS,
)
from custom_components.topomation.websocket_api import (  # type: ignore[import]
    handle_action_rules_create,
    handle_action_rules_delete,
    handle_action_rules_list,
    handle_action_rules_set_enabled,
    handle_locations_create,
    handle_locations_delete,
    handle_locations_list,
    handle_locations_reorder,
    handle_locations_set_module_config,
    handle_locations_update,
    handle_sync_enable,
    handle_sync_status,
)


@dataclass
class FloorDef:
    """Simple floor definition."""

    floor_id: str
    name: str


@pytest.mark.asyncio
async def test_locations_list_imports_floors_areas_and_entities(
    hass: HomeAssistant,
) -> None:
    """Areas and entities from HA registries are exposed via locations/list."""

    # Build HA registries: floors, areas, entities
    area_registry = ar.async_get(hass)
    entity_registry = er.async_get(hass)

    floors = [
        FloorDef("ground", "Ground Floor"),
        FloorDef("first", "First Floor"),
    ]
    _add_floors(hass, floors)

    areas = [
        ("Living Room", "ground"),
        ("Kitchen", "ground"),
        ("Hallway", "ground"),
        ("Dining Room", "ground"),
        ("Master Bedroom", "first"),
        ("Guest Bedroom", "first"),
        ("Bathroom", "first"),
        ("Office", "first"),
    ]
    area_entries = {name: _create_area(area_registry, name, floor_id) for name, floor_id in areas}

    # Entities mapped to areas
    _create_entity(entity_registry, "binary_sensor.living_room_motion", area_entries["Living Room"])
    _create_entity(entity_registry, "light.living_room", area_entries["Living Room"])
    _create_entity(entity_registry, "binary_sensor.kitchen_motion", area_entries["Kitchen"])
    _create_entity(entity_registry, "binary_sensor.kitchen_door", area_entries["Kitchen"])
    _create_entity(entity_registry, "binary_sensor.hallway_motion", area_entries["Hallway"])
    _create_entity(entity_registry, "light.dining_room", area_entries["Dining Room"])
    _create_entity(
        entity_registry, "binary_sensor.master_bedroom_motion", area_entries["Master Bedroom"]
    )
    _create_entity(entity_registry, "light.master_bedroom", area_entries["Master Bedroom"])
    _create_entity(
        entity_registry, "binary_sensor.guest_bedroom_motion", area_entries["Guest Bedroom"]
    )
    _create_entity(entity_registry, "binary_sensor.bathroom_motion", area_entries["Bathroom"])
    _create_entity(entity_registry, "binary_sensor.office_motion", area_entries["Office"])

    # Set up integration (runs SyncManager import)
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    # Call WS list handler
    connection = _fake_connection()
    handle_locations_list(
        hass,
        connection,
        {"id": 1, "type": WS_TYPE_LOCATIONS_LIST},
    )

    payload = connection.send_result.call_args[0][1]
    locations = payload["locations"]

    # 2 floors + 8 areas, plus first-install Home root + building + grounds wrappers
    assert len(locations) == 13

    # Floors exist and are grouped under default Home building.
    floor_names = {loc["name"] for loc in locations if loc["id"].startswith("floor_")}
    assert floor_names == {"Ground Floor", "First Floor"}
    assert any(loc["id"] == "home" and loc["is_explicit_root"] for loc in locations)
    assert any(loc["id"] == "building_main" for loc in locations)
    assert any(loc["id"] == "grounds" for loc in locations)
    for floor_loc in (loc for loc in locations if loc["id"].startswith("floor_")):
        assert floor_loc["parent_id"] == "building_main"

    # Rooms are parented to the right floor and carry entities
    def find_by_name(name: str) -> dict:
        return next(loc for loc in locations if loc["name"] == name)

    living_room = find_by_name("Living Room")
    kitchen = find_by_name("Kitchen")
    master_bed = find_by_name("Master Bedroom")

    assert living_room["parent_id"] == "floor_ground"
    assert kitchen["parent_id"] == "floor_ground"
    assert master_bed["parent_id"] == "floor_first"

    assert "binary_sensor.living_room_motion" in living_room["entity_ids"]
    assert "light.living_room" in living_room["entity_ids"]
    assert "binary_sensor.kitchen_motion" in kitchen["entity_ids"]
    assert "binary_sensor.master_bedroom_motion" in master_bed["entity_ids"]

    # Area-linked locations must have canonical ha_area_id (ISSUE-051)
    for loc in locations:
        if loc["id"].startswith("area_"):
            assert "ha_area_id" in loc
            assert loc["ha_area_id"] is not None
            assert loc["ha_area_id"] == loc["id"].replace("area_", "")


@pytest.mark.asyncio
async def test_locations_create_allows_floor_and_area(hass: HomeAssistant) -> None:
    """locations/create allows floor/area as topology-managed nodes."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    floor_connection = _fake_connection()
    handle_locations_create(
        hass,
        floor_connection,
        {
            "id": 2,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Top Floor",
            "parent_id": None,
            "meta": {"type": "floor"},
        },
    )

    assert floor_connection.send_error.call_count == 0
    floor_connection.send_result.assert_called_once()
    floor_payload = floor_connection.send_result.call_args[0][1]
    assert floor_payload["success"] is True
    assert floor_payload["location"]["modules"]["_meta"]["type"] == "floor"

    area_connection = _fake_connection()
    handle_locations_create(
        hass,
        area_connection,
        {
            "id": 3,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Bonus Room",
            "parent_id": floor_payload["location"]["id"],
            "meta": {"type": "area"},
        },
    )
    assert area_connection.send_error.call_count == 0
    area_connection.send_result.assert_called_once()
    area_payload = area_connection.send_result.call_args[0][1]
    assert area_payload["success"] is True
    assert area_payload["location"]["modules"]["_meta"]["type"] == "area"
    assert area_payload["location"]["parent_id"] == floor_payload["location"]["id"]
    assert area_payload["location"]["ha_area_id"] is not None

    area_registry = ar.async_get(hass)
    created_area = area_registry.async_get_area(area_payload["location"]["ha_area_id"])
    assert created_area is not None
    assert created_area.name == "Bonus Room"


@pytest.mark.asyncio
async def test_locations_create_rejects_unknown_explicit_ha_area_id(
    hass: HomeAssistant,
) -> None:
    """locations/create fails when explicit ha_area_id does not exist in HA registry."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 30,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Invalid Linked Area",
            "parent_id": None,
            "meta": {"type": "area"},
            "ha_area_id": "does_not_exist",
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "ha_area_not_found"


@pytest.mark.asyncio
async def test_locations_create_allows_integration_owned_building(
    hass: HomeAssistant,
) -> None:
    """locations/create allows integration-owned structural nodes."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 3,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Main Building",
            "parent_id": None,
            "meta": {"type": "building"},
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    location = payload["location"]
    assert location["id"].startswith("building_")
    assert location["name"] == "Main Building"
    assert location["parent_id"] is None
    assert location["modules"]["_meta"]["type"] == "building"
    assert location["modules"]["_meta"]["sync_source"] == "topology"
    assert location["modules"]["_meta"]["sync_enabled"] is True


@pytest.mark.asyncio
async def test_locations_create_rejects_non_root_building(
    hass: HomeAssistant,
) -> None:
    """building/grounds nodes must be root-level wrappers."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="parent_zone", name="Parent Zone", parent_id=None)

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 4,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Nested Building",
            "parent_id": "parent_zone",
            "meta": {"type": "building"},
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"


@pytest.mark.asyncio
async def test_locations_create_rejects_non_root_grounds(
    hass: HomeAssistant,
) -> None:
    """Grounds wrappers must be root-level."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="parent_zone", name="Parent Zone", parent_id=None)

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 5,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Nested Grounds",
            "parent_id": "parent_zone",
            "meta": {"type": "grounds"},
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"


@pytest.mark.asyncio
async def test_locations_create_rejects_explicit_root_as_parent(
    hass: HomeAssistant,
) -> None:
    """Explicit Home root cannot be used as a parent target."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    explicit_root = next(
        (loc for loc in loc_mgr.all_locations() if bool(getattr(loc, "is_explicit_root", False))),
        None,
    )
    assert explicit_root is not None

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 6,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Floor Under Root",
            "parent_id": explicit_root.id,
            "meta": {"type": "floor"},
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"


@pytest.mark.asyncio
async def test_locations_list_sorts_siblings_alphabetically_until_manual_reorder(
    hass: HomeAssistant,
) -> None:
    """Sibling groups default to alphabetical ordering before user drag/drop."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Main Building", parent_id=None)
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="child_z", name="Zulu", parent_id="building_main")
    loc_mgr.set_module_config("child_z", "_meta", {"type": "subarea", "sync_source": "topology"})
    loc_mgr.create_location(id="child_a", name="Alpha", parent_id="building_main")
    loc_mgr.set_module_config("child_a", "_meta", {"type": "subarea", "sync_source": "topology"})
    loc_mgr.create_location(id="child_m", name="Middle", parent_id="building_main")
    loc_mgr.set_module_config("child_m", "_meta", {"type": "subarea", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_list(
        hass,
        connection,
        {"id": 18, "type": WS_TYPE_LOCATIONS_LIST},
    )

    payload = connection.send_result.call_args[0][1]
    children = [loc for loc in payload["locations"] if loc["parent_id"] == "building_main"]
    assert [loc["name"] for loc in children] == ["Alpha", "Middle", "Zulu"]
    assert [loc["order"] for loc in children] == [1, 2, 0]


@pytest.mark.asyncio
async def test_locations_delete_allows_ha_backed_area(hass: HomeAssistant) -> None:
    """HA-backed area wrappers can be deleted from topology via HA registry."""

    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 11,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": f"area_{kitchen.id}",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == f"area_{kitchen.id}"
    assert area_registry.async_get_area(kitchen.id) is None


@pytest.mark.asyncio
async def test_locations_delete_allows_ha_backed_floor(hass: HomeAssistant) -> None:
    """HA-backed floor wrappers can be deleted from topology via floor registry."""
    floor_registry = fr.async_get(hass)
    main_floor = floor_registry.async_create("Main Floor")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 111,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": f"floor_{main_floor.floor_id}",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == f"floor_{main_floor.floor_id}"
    assert floor_registry.async_get_floor(main_floor.floor_id) is None


@pytest.mark.asyncio
async def test_locations_delete_allows_topology_owned_leaf(hass: HomeAssistant) -> None:
    """Topology-owned locations can be deleted from the topology panel."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="zone_pantry", name="Pantry Zone", parent_id=None)
    loc_mgr.set_module_config("zone_pantry", "_meta", {"type": "subarea", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 12,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "zone_pantry",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == "zone_pantry"
    assert payload["deleted_ids"] == ["zone_pantry"]
    assert payload["reparented_ids"] == []
    assert loc_mgr.get_location("zone_pantry") is None


@pytest.mark.asyncio
async def test_locations_delete_rejects_explicit_root(hass: HomeAssistant) -> None:
    """Explicit root location is protected from delete."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    explicit_root = next(
        (loc for loc in loc_mgr.all_locations() if bool(getattr(loc, "is_explicit_root", False))),
        None,
    )
    assert explicit_root is not None

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 112,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": explicit_root.id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "operation_not_supported"


@pytest.mark.asyncio
async def test_locations_delete_reparents_direct_children(hass: HomeAssistant) -> None:
    """Deleting a topology node reparents direct children one level up."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="area_parent", name="Parent Area", parent_id=None)
    loc_mgr.set_module_config("area_parent", "_meta", {"type": "area", "sync_source": "topology"})

    loc_mgr.create_location(id="area_child", name="Child Area", parent_id="area_parent")
    loc_mgr.set_module_config("area_child", "_meta", {"type": "area", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 13,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "area_parent",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == "area_parent"
    assert payload["reparented_ids"] == ["area_child"]
    assert loc_mgr.get_location("area_parent") is None
    child = loc_mgr.get_location("area_child")
    assert child is not None
    assert child.parent_id is None


@pytest.mark.asyncio
async def test_locations_delete_schedules_persist(hass: HomeAssistant) -> None:
    """Successful delete should schedule debounced persistence."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    schedule_persist = Mock()
    hass.data[DOMAIN][entry.entry_id]["schedule_persist"] = schedule_persist

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="zone_storage", name="Storage Zone", parent_id=None)
    loc_mgr.set_module_config("zone_storage", "_meta", {"type": "subarea", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 14,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "zone_storage",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    schedule_persist.assert_called_once_with("locations/delete")


@pytest.mark.asyncio
async def test_locations_reorder_is_allowed(hass: HomeAssistant) -> None:
    """locations/reorder is allowed for topology hierarchy overlay."""
    area_registry = ar.async_get(hass)
    floor_registry = fr.async_get(hass)

    first_floor = floor_registry.async_create("First Floor")
    ground_floor = floor_registry.async_create("Ground Floor")
    kitchen = area_registry.async_create("Kitchen", floor_id=ground_floor.floor_id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 20,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": f"area_{kitchen.id}",
            "new_parent_id": f"floor_{first_floor.floor_id}",
            "new_index": 0,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == f"area_{kitchen.id}"
    assert payload["parent_id"] == f"floor_{first_floor.floor_id}"
    assert payload["ha_floor_id"] == first_floor.floor_id
    assert area_registry.async_get_area(kitchen.id).floor_id == first_floor.floor_id


@pytest.mark.asyncio
async def test_locations_reorder_rejects_reparent_for_node_with_children(
    hass: HomeAssistant,
) -> None:
    """Locations with children may only be reordered within their current parent."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="building_a", name="Building A", parent_id=None)
    loc_mgr.set_module_config("building_a", "_meta", {"type": "building", "sync_source": "topology"})
    loc_mgr.create_location(id="building_b", name="Building B", parent_id=None)
    loc_mgr.set_module_config("building_b", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="floor_a", name="Floor A", parent_id="building_a")
    loc_mgr.set_module_config("floor_a", "_meta", {"type": "floor", "sync_source": "topology"})
    loc_mgr.create_location(id="area_a", name="Area A", parent_id="floor_a")
    loc_mgr.set_module_config("area_a", "_meta", {"type": "area", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 201,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "floor_a",
            "new_parent_id": "building_b",
            "new_index": 0,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"

    unchanged = loc_mgr.get_location("floor_a")
    assert unchanged is not None
    assert unchanged.parent_id == "building_a"


@pytest.mark.asyncio
async def test_locations_reorder_marks_manual_order_and_preserves_user_sequence(
    hass: HomeAssistant,
) -> None:
    """After drag/drop, sibling order is persisted and no longer alphabetized."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Main Building", parent_id=None)
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="child_z", name="Zulu", parent_id="building_main")
    loc_mgr.set_module_config("child_z", "_meta", {"type": "subarea", "sync_source": "topology"})
    loc_mgr.create_location(id="child_a", name="Alpha", parent_id="building_main")
    loc_mgr.set_module_config("child_a", "_meta", {"type": "subarea", "sync_source": "topology"})
    loc_mgr.create_location(id="child_m", name="Middle", parent_id="building_main")
    loc_mgr.set_module_config("child_m", "_meta", {"type": "subarea", "sync_source": "topology"})

    reorder_conn = _fake_connection()
    handle_locations_reorder(
        hass,
        reorder_conn,
        {
            "id": 26,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "child_z",
            "new_parent_id": "building_main",
            "new_index": 0,
        },
    )

    assert reorder_conn.send_error.call_count == 0
    reorder_conn.send_result.assert_called_once()

    # Siblings are now explicitly in manual-order mode.
    for child_id in ("child_z", "child_a", "child_m"):
        child_meta = loc_mgr.get_module_config(child_id, "_meta")
        assert child_meta.get("manual_order") is True

    list_conn = _fake_connection()
    handle_locations_list(
        hass,
        list_conn,
        {"id": 27, "type": WS_TYPE_LOCATIONS_LIST},
    )
    payload = list_conn.send_result.call_args[0][1]
    children = [loc for loc in payload["locations"] if loc["parent_id"] == "building_main"]
    assert [loc["name"] for loc in children] == ["Zulu", "Alpha", "Middle"]

    # New children append at end when a sibling set is manual-ordered.
    loc_mgr.create_location(id="child_d", name="Delta", parent_id="building_main")
    loc_mgr.set_module_config("child_d", "_meta", {"type": "subarea", "sync_source": "topology"})

    list_after_create = _fake_connection()
    handle_locations_list(
        hass,
        list_after_create,
        {"id": 28, "type": WS_TYPE_LOCATIONS_LIST},
    )
    payload = list_after_create.send_result.call_args[0][1]
    children = [loc for loc in payload["locations"] if loc["parent_id"] == "building_main"]
    assert [loc["name"] for loc in children] == ["Zulu", "Alpha", "Middle", "Delta"]


@pytest.mark.asyncio
async def test_locations_reorder_schedules_persist(hass: HomeAssistant) -> None:
    """Successful reorder should schedule debounced persistence."""
    area_registry = ar.async_get(hass)
    floor_registry = fr.async_get(hass)

    first_floor = floor_registry.async_create("First Floor")
    ground_floor = floor_registry.async_create("Ground Floor")
    kitchen = area_registry.async_create("Kitchen", floor_id=ground_floor.floor_id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    schedule_persist = Mock()
    hass.data[DOMAIN][entry.entry_id]["schedule_persist"] = schedule_persist

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 24,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": f"area_{kitchen.id}",
            "new_parent_id": f"floor_{first_floor.floor_id}",
            "new_index": 0,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    schedule_persist.assert_called_once_with("locations/reorder")


@pytest.mark.asyncio
async def test_locations_reorder_allows_ha_area_without_floor_ancestor(
    hass: HomeAssistant,
) -> None:
    """HA-backed areas may move to root and clear HA floor assignment."""
    area_registry = ar.async_get(hass)
    floor_registry = fr.async_get(hass)

    ground_floor = floor_registry.async_create("Ground Floor")
    kitchen = area_registry.async_create("Kitchen", floor_id=ground_floor.floor_id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 22,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": f"area_{kitchen.id}",
            "new_parent_id": None,
            "new_index": 0,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == f"area_{kitchen.id}"
    assert payload["parent_id"] is None
    assert payload["ha_floor_id"] is None
    assert area_registry.async_get_area(kitchen.id).floor_id is None

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    kitchen_loc = loc_mgr.get_location(f"area_{kitchen.id}")
    assert kitchen_loc.parent_id is None


@pytest.mark.asyncio
async def test_locations_reorder_allows_topology_only_custom_types(
    hass: HomeAssistant,
) -> None:
    """Topology-only nodes with ADR-HA-020 types can be reordered."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Main Building", parent_id=None)
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="patio_zone", name="Patio Zone", parent_id=None)
    loc_mgr.set_module_config("patio_zone", "_meta", {"type": "subarea", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 23,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "patio_zone",
            "new_parent_id": "building_main",
            "new_index": 0,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location_id"] == "patio_zone"
    assert payload["parent_id"] == "building_main"
    assert payload["ha_floor_id"] is None

    moved = loc_mgr.get_location("patio_zone")
    assert moved is not None
    assert moved.parent_id == "building_main"


@pytest.mark.asyncio
async def test_locations_reorder_rejects_floor_under_grounds(
    hass: HomeAssistant,
) -> None:
    """Floor nodes cannot be reparented under grounds wrappers."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    explicit_root = next(
        (loc for loc in loc_mgr.all_locations() if bool(getattr(loc, "is_explicit_root", False))),
        None,
    )
    assert explicit_root is not None
    assert loc_mgr.get_location("grounds") is not None

    loc_mgr.create_location(id="floor_test", name="Test Floor", parent_id=explicit_root.id)
    loc_mgr.set_module_config("floor_test", "_meta", {"type": "floor", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 29,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "floor_test",
            "new_parent_id": "grounds",
            "new_index": 0,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"

    unchanged = loc_mgr.get_location("floor_test")
    assert unchanged is not None
    assert unchanged.parent_id == explicit_root.id


@pytest.mark.asyncio
async def test_locations_reorder_rejects_floor_under_floor(
    hass: HomeAssistant,
) -> None:
    """Floor nodes cannot be reparented under other floor nodes."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    root = next(
        (loc for loc in loc_mgr.all_locations() if bool(getattr(loc, "is_explicit_root", False))),
        None,
    )
    assert root is not None

    loc_mgr.create_location(id="building_test", name="Test Building", parent_id=root.id)
    loc_mgr.set_module_config("building_test", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="floor_a", name="Floor A", parent_id="building_test")
    loc_mgr.set_module_config("floor_a", "_meta", {"type": "floor", "sync_source": "topology"})

    loc_mgr.create_location(id="floor_b", name="Floor B", parent_id="building_test")
    loc_mgr.set_module_config("floor_b", "_meta", {"type": "floor", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 30,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "floor_b",
            "new_parent_id": "floor_a",
            "new_index": 0,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"

    unchanged = loc_mgr.get_location("floor_b")
    assert unchanged is not None
    assert unchanged.parent_id == "building_test"


@pytest.mark.asyncio
async def test_locations_reorder_rejects_nested_grounds(
    hass: HomeAssistant,
) -> None:
    """Grounds wrappers must stay root-level."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    explicit_root = next(
        (loc for loc in loc_mgr.all_locations() if bool(getattr(loc, "is_explicit_root", False))),
        None,
    )
    assert explicit_root is not None

    building = loc_mgr.get_location("building_home")
    if building is None:
        building = loc_mgr.create_location(
            id="building_home",
            name="Home Building",
            parent_id=None,
        )
    loc_mgr.set_module_config("building_home", "_meta", {"type": "building", "sync_source": "topology"})

    grounds = loc_mgr.get_location("grounds")
    assert grounds is not None
    original_parent_id = grounds.parent_id

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 30,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "grounds",
            "new_parent_id": "building_home",
            "new_index": 0,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_parent"

    unchanged = loc_mgr.get_location("grounds")
    assert unchanged is not None
    assert unchanged.parent_id == original_parent_id


@pytest.mark.asyncio
async def test_locations_update_allows_rename(hass: HomeAssistant) -> None:
    """locations/update supports rename for topology-managed nodes."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="area_foo", name="Old Name", parent_id=None)
    loc_mgr.set_module_config("area_foo", "_meta", {"type": "area", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_update(
        hass,
        connection,
        {
            "id": 21,
            "type": WS_TYPE_LOCATIONS_UPDATE,
            "location_id": "area_foo",
            "changes": {"name": "Renamed Area"},
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["location"]["name"] == "Renamed Area"


@pytest.mark.asyncio
async def test_set_module_config_rejects_floor_occupancy_sources(hass: HomeAssistant) -> None:
    """Occupancy source config is blocked for floor locations."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="main_floor", name="Main Floor", parent_id=None)
    loc_mgr.set_module_config("main_floor", "_meta", {"type": "floor"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 30,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "main_floor",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [
                    {
                        "entity_id": "binary_sensor.kitchen_motion",
                        "mode": "specific_states",
                        "on_event": "trigger",
                        "on_timeout": 300,
                        "off_event": "none",
                        "off_trailing": 0,
                    }
                ],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_schedules_persist(hass: HomeAssistant) -> None:
    """Successful module config updates should schedule debounced persistence."""
    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    schedule_persist = Mock()
    hass.data[DOMAIN][entry.entry_id]["schedule_persist"] = schedule_persist

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 31,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": f"area_{kitchen.id}",
            "module_id": "occupancy",
            "config": {"enabled": True, "default_timeout": 120},
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    schedule_persist.assert_called_once_with("locations/set_module_config")


@pytest.mark.asyncio
async def test_sync_enable_is_rejected_for_ha_backed_location(hass: HomeAssistant) -> None:
    """sync/enable is blocked for HA-backed floor/area wrappers."""
    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_sync_enable(
        hass,
        connection,
        {
            "id": 40,
            "type": WS_TYPE_SYNC_ENABLE,
            "location_id": f"area_{kitchen.id}",
            "enabled": False,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "operation_not_supported"


@pytest.mark.asyncio
async def test_sync_enable_is_allowed_for_topology_only_location(hass: HomeAssistant) -> None:
    """sync/enable can update topology-only locations."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="custom_zone", name="Custom Zone", parent_id=None)
    loc_mgr.set_module_config(
        "custom_zone",
        "_meta",
        {
            "type": "area",
            "sync_source": "topology",
            "sync_enabled": True,
        },
    )

    connection = _fake_connection()
    handle_sync_enable(
        hass,
        connection,
        {
            "id": 41,
            "type": WS_TYPE_SYNC_ENABLE,
            "location_id": "custom_zone",
            "enabled": False,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["sync_enabled"] is False

    updated = loc_mgr.get_location("custom_zone")
    assert updated.modules.get("_meta", {}).get("sync_enabled") is False


@pytest.mark.asyncio
async def test_sync_status_reports_canonical_linkage(hass: HomeAssistant) -> None:
    """sync/status returns ha_area_id, ha_floor_id, sync_source, sync_enabled for locations."""
    area_registry = ar.async_get(hass)
    floor_registry = fr.async_get(hass)

    ground_floor = floor_registry.async_create("Ground Floor")
    kitchen = area_registry.async_create("Kitchen", floor_id=ground_floor.floor_id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_sync_status(
        hass,
        connection,
        {
            "id": 50,
            "type": WS_TYPE_SYNC_STATUS,
            "location_id": f"area_{kitchen.id}",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["location_id"] == f"area_{kitchen.id}"
    assert payload["ha_area_id"] == kitchen.id
    assert payload["ha_floor_id"] == ground_floor.floor_id
    assert payload["sync_source"] == "homeassistant"
    assert payload["sync_enabled"] is True
    assert payload["type"] == "area"


@pytest.mark.asyncio
async def test_sync_status_reports_custom_and_legacy_normalized_types(
    hass: HomeAssistant,
) -> None:
    """sync/status should expose custom types and normalize legacy room->area."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Main Building", parent_id=None)
    loc_mgr.set_module_config(
        "building_main",
        "_meta",
        {"type": "building", "sync_source": "topology", "sync_enabled": True},
    )

    loc_mgr.create_location(id="legacy_room", name="Legacy Room", parent_id=None)
    loc_mgr.set_module_config(
        "legacy_room",
        "_meta",
        {"type": "room", "sync_source": "topology", "sync_enabled": True},
    )

    building_conn = _fake_connection()
    handle_sync_status(
        hass,
        building_conn,
        {
            "id": 60,
            "type": WS_TYPE_SYNC_STATUS,
            "location_id": "building_main",
        },
    )
    assert building_conn.send_error.call_count == 0
    assert building_conn.send_result.call_args[0][1]["type"] == "building"

    legacy_conn = _fake_connection()
    handle_sync_status(
        hass,
        legacy_conn,
        {
            "id": 61,
            "type": WS_TYPE_SYNC_STATUS,
            "location_id": "legacy_room",
        },
    )
    assert legacy_conn.send_error.call_count == 0
    assert legacy_conn.send_result.call_args[0][1]["type"] == "area"


@pytest.mark.asyncio
async def test_action_rules_list_uses_managed_runtime(hass: HomeAssistant) -> None:
    """actions/rules/list returns manager-provided rules for one location."""
    expected_rules = [
        {
            "id": "rule_1",
            "entity_id": "automation.rule_1",
            "name": "Bathroom Vacant: Bathroom Light (turn off)",
            "trigger_type": "vacant",
            "action_entity_id": "light.bathroom",
            "action_service": "turn_off",
            "require_dark": False,
            "enabled": True,
        }
    ]
    managed_action_rules = AsyncMock()
    managed_action_rules.async_list_rules = AsyncMock(return_value=expected_rules)
    hass.data[DOMAIN] = {
        "entry_1": {
            "managed_action_rules": managed_action_rules,
        }
    }

    connection = _fake_connection()
    handle_action_rules_list(
        hass,
        connection,
        {
            "id": 90,
            "type": WS_TYPE_ACTION_RULES_LIST,
            "location_id": "bathroom",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_list_rules.assert_awaited_once_with("bathroom")
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(90, {"rules": expected_rules})


@pytest.mark.asyncio
async def test_action_rules_list_resolves_by_location_with_multiple_entries(
    hass: HomeAssistant,
) -> None:
    """actions/rules/list can resolve runtime by unique location_id when entry_id is omitted."""
    expected_rules = [
        {
            "id": "rule_1",
            "entity_id": "automation.rule_1",
            "name": "Interior Vacant: Garage (turn off)",
            "trigger_type": "vacant",
            "action_entity_id": "light.garage",
            "action_service": "turn_off",
            "require_dark": False,
            "enabled": True,
        }
    ]
    managed_action_rules_1 = AsyncMock()
    managed_action_rules_1.async_list_rules = AsyncMock(return_value=expected_rules)
    managed_action_rules_2 = AsyncMock()
    managed_action_rules_2.async_list_rules = AsyncMock(return_value=[])

    location_manager_1 = Mock()
    location_manager_1.get_location.side_effect = (
        lambda location_id: object() if location_id == "interior" else None
    )
    location_manager_2 = Mock()
    location_manager_2.get_location.return_value = None

    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": location_manager_1,
            "managed_action_rules": managed_action_rules_1,
        },
        "entry_2": {
            "location_manager": location_manager_2,
            "managed_action_rules": managed_action_rules_2,
        },
    }

    connection = _fake_connection()
    handle_action_rules_list(
        hass,
        connection,
        {
            "id": 190,
            "type": WS_TYPE_ACTION_RULES_LIST,
            "location_id": "interior",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules_1.async_list_rules.assert_awaited_once_with("interior")
    managed_action_rules_2.async_list_rules.assert_not_called()
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(190, {"rules": expected_rules})


@pytest.mark.asyncio
async def test_action_rules_list_requires_entry_id_when_location_ambiguous(
    hass: HomeAssistant,
) -> None:
    """actions/rules/list rejects ambiguous multi-entry location_id routing."""
    managed_action_rules_1 = AsyncMock()
    managed_action_rules_1.async_list_rules = AsyncMock(return_value=[])
    managed_action_rules_2 = AsyncMock()
    managed_action_rules_2.async_list_rules = AsyncMock(return_value=[])

    location_manager_1 = Mock()
    location_manager_1.get_location.side_effect = (
        lambda location_id: object() if location_id == "interior" else None
    )
    location_manager_2 = Mock()
    location_manager_2.get_location.side_effect = (
        lambda location_id: object() if location_id == "interior" else None
    )

    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": location_manager_1,
            "managed_action_rules": managed_action_rules_1,
        },
        "entry_2": {
            "location_manager": location_manager_2,
            "managed_action_rules": managed_action_rules_2,
        },
    }

    connection = _fake_connection()
    handle_action_rules_list(
        hass,
        connection,
        {
            "id": 191,
            "type": WS_TYPE_ACTION_RULES_LIST,
            "location_id": "interior",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules_1.async_list_rules.assert_not_called()
    managed_action_rules_2.async_list_rules.assert_not_called()
    connection.send_result.assert_not_called()
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[0] == 191
    assert err_args[1] == "entry_required"
    assert "contain location 'interior'" in err_args[2]


@pytest.mark.asyncio
async def test_locations_list_uses_connection_entry_hint_after_location_scoped_call(
    hass: HomeAssistant,
) -> None:
    """No-location websocket commands reuse the last resolved entry for the same connection."""
    managed_action_rules_1 = AsyncMock()
    managed_action_rules_1.async_list_rules = AsyncMock(return_value=[])
    managed_action_rules_2 = AsyncMock()
    managed_action_rules_2.async_list_rules = AsyncMock(return_value=[])

    location = type(
        "Location",
        (),
        {
            "id": "interior",
            "name": "Interior",
            "parent_id": None,
            "is_explicit_root": False,
            "order": 0,
            "ha_area_id": None,
            "entity_ids": [],
            "modules": {},
        },
    )()

    location_manager_1 = Mock()
    location_manager_1.get_location.side_effect = (
        lambda location_id: location if location_id == "interior" else None
    )
    location_manager_1.all_locations.return_value = [location]

    location_manager_2 = Mock()
    location_manager_2.get_location.return_value = None
    location_manager_2.all_locations.return_value = []

    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": location_manager_1,
            "managed_action_rules": managed_action_rules_1,
        },
        "entry_2": {
            "location_manager": location_manager_2,
            "managed_action_rules": managed_action_rules_2,
        },
    }

    connection = _fake_connection()
    handle_action_rules_list(
        hass,
        connection,
        {
            "id": 290,
            "type": WS_TYPE_ACTION_RULES_LIST,
            "location_id": "interior",
        },
    )
    await hass.async_block_till_done()

    handle_locations_list(
        hass,
        connection,
        {
            "id": 291,
            "type": WS_TYPE_LOCATIONS_LIST,
        },
    )

    connection.send_error.assert_not_called()
    assert connection.send_result.call_count == 2
    managed_action_rules_1.async_list_rules.assert_awaited_once_with("interior")
    managed_action_rules_2.async_list_rules.assert_not_called()
    second_result = connection.send_result.call_args_list[1][0]
    assert second_result[0] == 291
    assert second_result[1]["locations"][0]["id"] == "interior"


@pytest.mark.asyncio
async def test_action_rules_create_uses_managed_runtime(hass: HomeAssistant) -> None:
    """actions/rules/create resolves location and schedules persistence."""
    location = type("Location", (), {"id": "bathroom", "name": "Bathroom"})()
    loc_mgr = Mock()
    loc_mgr.get_location.return_value = location
    schedule_persist = Mock()
    created_rule = {
        "id": "topomation_bathroom_vacant_1",
        "entity_id": "automation.topomation_bathroom_vacant_1",
        "name": "Bathroom Vacant: Bathroom Light (turn off)",
        "trigger_type": "vacant",
        "action_entity_id": "light.bathroom",
        "action_service": "turn_off",
        "require_dark": True,
        "enabled": True,
    }
    managed_action_rules = AsyncMock()
    managed_action_rules.async_create_rule = AsyncMock(return_value=created_rule)
    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": loc_mgr,
            "managed_action_rules": managed_action_rules,
            "schedule_persist": schedule_persist,
        }
    }

    connection = _fake_connection()
    handle_action_rules_create(
        hass,
        connection,
        {
            "id": 91,
            "type": WS_TYPE_ACTION_RULES_CREATE,
            "location_id": "bathroom",
            "name": "Bathroom Vacant: Bathroom Light (turn off)",
            "trigger_type": "vacant",
            "action_entity_id": "light.bathroom",
            "action_service": "turn_off",
            "require_dark": True,
        },
    )
    await hass.async_block_till_done()

    loc_mgr.get_location.assert_called_once_with("bathroom")
    managed_action_rules.async_create_rule.assert_awaited_once_with(
        location=location,
        name="Bathroom Vacant: Bathroom Light (turn off)",
        trigger_type="vacant",
        action_entity_id="light.bathroom",
        action_service="turn_off",
        require_dark=True,
    )
    schedule_persist.assert_called_once_with("actions/rules/create")
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(91, {"rule": created_rule})


@pytest.mark.asyncio
async def test_action_rules_delete_uses_managed_runtime(hass: HomeAssistant) -> None:
    """actions/rules/delete calls manager and schedules persistence."""
    managed_action_rules = AsyncMock()
    managed_action_rules.async_delete_rule = AsyncMock(return_value=None)
    schedule_persist = Mock()
    hass.data[DOMAIN] = {
        "entry_1": {
            "managed_action_rules": managed_action_rules,
            "schedule_persist": schedule_persist,
        }
    }

    connection = _fake_connection()
    handle_action_rules_delete(
        hass,
        connection,
        {
            "id": 92,
            "type": WS_TYPE_ACTION_RULES_DELETE,
            "automation_id": "topomation_bathroom_vacant_1",
            "entity_id": "automation.topomation_bathroom_vacant_1",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_delete_rule.assert_awaited_once_with(
        automation_id="topomation_bathroom_vacant_1",
        entity_id="automation.topomation_bathroom_vacant_1",
    )
    schedule_persist.assert_called_once_with("actions/rules/delete")
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(92, {"success": True})


@pytest.mark.asyncio
async def test_action_rules_set_enabled_uses_managed_runtime(hass: HomeAssistant) -> None:
    """actions/rules/set_enabled delegates on/off mutation to manager."""
    managed_action_rules = AsyncMock()
    managed_action_rules.async_set_rule_enabled = AsyncMock(return_value=None)
    hass.data[DOMAIN] = {
        "entry_1": {
            "managed_action_rules": managed_action_rules,
        }
    }

    connection = _fake_connection()
    handle_action_rules_set_enabled(
        hass,
        connection,
        {
            "id": 93,
            "type": WS_TYPE_ACTION_RULES_SET_ENABLED,
            "entity_id": "automation.topomation_bathroom_vacant_1",
            "enabled": False,
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_set_rule_enabled.assert_awaited_once_with(
        entity_id="automation.topomation_bathroom_vacant_1",
        enabled=False,
    )
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(93, {"success": True})


def _add_floors(hass: HomeAssistant, floors: Iterable[FloorDef]) -> None:
    """Inject floors into the floor registry for deterministic IDs in tests."""
    floor_registry = fr.async_get(hass)
    floor_registry.floors = {
        floor.floor_id: type("Floor", (), {"floor_id": floor.floor_id, "name": floor.name})()
        for floor in floors
    }


def _create_area(area_registry: ar.AreaRegistry, name: str, floor_id: str):
    """Create an HA area with an assigned floor."""
    return area_registry.async_create(name=name, floor_id=floor_id)


def _create_entity(entity_registry: er.EntityRegistry, entity_id: str, area_entry) -> None:
    """Create an entity assigned to an area."""
    domain, object_id = entity_id.split(".")
    entry = entity_registry.async_get_or_create(
        domain=domain,
        platform="test",
        unique_id=entity_id,
        suggested_object_id=object_id,
    )
    entity_registry.async_update_entity(entry.entity_id, area_id=area_entry.id)


def _fake_connection() -> Mock:
    """Minimal ActiveConnection stub for WS handlers."""
    conn = Mock()
    conn.send_result = Mock()
    conn.send_error = Mock()
    return conn
