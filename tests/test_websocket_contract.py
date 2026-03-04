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
    WS_TYPE_ADJACENCY_CREATE,
    WS_TYPE_ADJACENCY_DELETE,
    WS_TYPE_ADJACENCY_LIST,
    WS_TYPE_ADJACENCY_UPDATE,
    WS_TYPE_ACTION_RULES_CREATE,
    WS_TYPE_ACTION_RULES_DELETE,
    WS_TYPE_ACTION_RULES_LIST,
    WS_TYPE_ACTION_RULES_SET_ENABLED,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
    WS_TYPE_SYNC_ENABLE,
    WS_TYPE_SYNC_STATUS,
)
from custom_components.topomation.websocket_api import (  # type: ignore[import]
    handle_adjacency_create,
    handle_adjacency_delete,
    handle_adjacency_list,
    handle_adjacency_update,
    handle_action_rules_create,
    handle_action_rules_delete,
    handle_action_rules_list,
    handle_action_rules_set_enabled,
    handle_locations_create,
    handle_locations_delete,
    handle_locations_list,
    handle_locations_assign_entity,
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

    # 2 floors + 8 imported areas, plus first-install Home root/building/grounds
    # wrappers and one managed shadow area per imported floor.
    assert len(locations) == 13 + len(floors)

    # Floors exist and are grouped under default Home building.
    floor_names = {loc["name"] for loc in locations if loc["id"].startswith("floor_")}
    assert floor_names == {"Ground Floor", "First Floor"}
    assert any(loc["id"] == "home" and loc["is_explicit_root"] for loc in locations)
    assert any(loc["id"] == "building_main" for loc in locations)
    assert any(loc["id"] == "grounds" for loc in locations)
    for floor_loc in (loc for loc in locations if loc["id"].startswith("floor_")):
        assert floor_loc["parent_id"] == "building_main"

    managed_shadows = [
        loc
        for loc in locations
        if str(((loc.get("modules", {}) or {}).get("_meta", {}) or {}).get("role", "")).strip().lower()
        == "managed_shadow"
    ]
    assert len(managed_shadows) == len(floors)

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
async def test_locations_list_includes_adjacency_edges_when_supported(
    hass: HomeAssistant,
) -> None:
    """locations/list should include serialized adjacency edges when available."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if not _supports_adjacency(loc_mgr):
        pytest.skip("Loaded home-topology runtime does not expose adjacency APIs")

    loc_mgr.create_location(id="area_a", name="Area A", parent_id=None)
    loc_mgr.create_location(id="area_b", name="Area B", parent_id=None)
    loc_mgr.create_adjacency_edge(
        edge_id="edge_area_a_b",
        from_location_id="area_a",
        to_location_id="area_b",
        directionality="bidirectional",
        boundary_type="door",
        crossing_sources=["binary_sensor.a_b_door"],
        handoff_window_sec=15,
        priority=40,
    )

    connection = _fake_connection()
    handle_locations_list(
        hass,
        connection,
        {"id": 120, "type": WS_TYPE_LOCATIONS_LIST},
    )

    payload = connection.send_result.call_args[0][1]
    assert "adjacency_edges" in payload
    assert payload["adjacency_edges"] == [
        {
            "edge_id": "edge_area_a_b",
            "from_location_id": "area_a",
            "to_location_id": "area_b",
            "directionality": "bidirectional",
            "boundary_type": "door",
            "crossing_sources": ["binary_sensor.a_b_door"],
            "handoff_window_sec": 15,
            "priority": 40,
        }
    ]


@pytest.mark.asyncio
async def test_adjacency_crud_handlers_schedule_persist(
    hass: HomeAssistant,
) -> None:
    """adjacency create/update/delete handlers should mutate edges and schedule persist."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    if not _supports_adjacency(loc_mgr):
        pytest.skip("Loaded home-topology runtime does not expose adjacency APIs")

    schedule_persist = Mock()
    kernel["schedule_persist"] = schedule_persist

    loc_mgr.create_location(id="kitchen", name="Kitchen", parent_id=None)
    loc_mgr.create_location(id="hallway", name="Hallway", parent_id=None)

    create_conn = _fake_connection()
    handle_adjacency_create(
        hass,
        create_conn,
        {
            "id": 121,
            "type": WS_TYPE_ADJACENCY_CREATE,
            "from_location_id": "kitchen",
            "to_location_id": "hallway",
            "edge_id": "edge_kitchen_hallway",
            "directionality": "bidirectional",
            "boundary_type": "door",
            "crossing_sources": ["binary_sensor.kitchen_hall_door"],
            "handoff_window_sec": 20,
            "priority": 60,
        },
    )
    assert create_conn.send_error.call_count == 0
    create_payload = create_conn.send_result.call_args[0][1]
    assert create_payload["success"] is True
    assert create_payload["adjacency_edge"]["edge_id"] == "edge_kitchen_hallway"
    schedule_persist.assert_called_with("adjacency/create")

    update_conn = _fake_connection()
    handle_adjacency_update(
        hass,
        update_conn,
        {
            "id": 122,
            "type": WS_TYPE_ADJACENCY_UPDATE,
            "edge_id": "edge_kitchen_hallway",
            "handoff_window_sec": 10,
            "priority": 45,
        },
    )
    assert update_conn.send_error.call_count == 0
    update_payload = update_conn.send_result.call_args[0][1]
    assert update_payload["adjacency_edge"]["handoff_window_sec"] == 10
    assert update_payload["adjacency_edge"]["priority"] == 45
    schedule_persist.assert_called_with("adjacency/update")

    list_conn = _fake_connection()
    handle_adjacency_list(
        hass,
        list_conn,
        {
            "id": 123,
            "type": WS_TYPE_ADJACENCY_LIST,
            "location_id": "kitchen",
        },
    )
    assert list_conn.send_error.call_count == 0
    listed_edges = list_conn.send_result.call_args[0][1]["adjacency_edges"]
    assert len(listed_edges) == 1
    assert listed_edges[0]["edge_id"] == "edge_kitchen_hallway"

    delete_conn = _fake_connection()
    handle_adjacency_delete(
        hass,
        delete_conn,
        {
            "id": 124,
            "type": WS_TYPE_ADJACENCY_DELETE,
            "edge_id": "edge_kitchen_hallway",
        },
    )
    assert delete_conn.send_error.call_count == 0
    delete_payload = delete_conn.send_result.call_args[0][1]
    assert delete_payload["success"] is True
    assert delete_payload["edge_id"] == "edge_kitchen_hallway"
    schedule_persist.assert_called_with("adjacency/delete")


@pytest.mark.asyncio
async def test_locations_create_area_assigns_occupancy_entity_to_ha_area(
    hass: HomeAssistant,
) -> None:
    """New occupancy binary sensors should inherit area assignment for area locations."""
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
            "id": 203,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Library",
            "parent_id": None,
            "meta": {"type": "area"},
        },
    )
    await hass.async_block_till_done()

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    location = payload["location"]
    location_id = location["id"]
    ha_area_id = location["ha_area_id"]
    assert location_id.startswith("area_")
    assert ha_area_id is not None

    entity_registry = er.async_get(hass)
    unique_id = f"occupancy_{location_id}"
    entity_id = entity_registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
    assert entity_id is not None
    occupancy_entry = entity_registry.async_get(entity_id)
    assert occupancy_entry is not None
    assert occupancy_entry.area_id == ha_area_id


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
async def test_locations_delete_removes_occupancy_entity_for_deleted_location(
    hass: HomeAssistant,
) -> None:
    """Deleting a location should remove its Topomation occupancy entity."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="zone_storage", name="Storage Zone", parent_id=None)
    loc_mgr.set_module_config("zone_storage", "_meta", {"type": "subarea", "sync_source": "topology"})
    await hass.async_block_till_done()

    entity_registry = er.async_get(hass)
    unique_id = "occupancy_zone_storage"
    entity_id = entity_registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
    assert entity_id is not None
    assert entity_registry.async_get(entity_id) is not None

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 1201,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "zone_storage",
        },
    )
    await hass.async_block_till_done()

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    assert entity_registry.async_get(entity_id) is None


@pytest.mark.asyncio
async def test_locations_delete_triggers_managed_action_cleanup_for_location(
    hass: HomeAssistant,
) -> None:
    """Deleting a location should invoke managed-action cleanup for that location."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save({"locations": []})

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    loc_mgr.create_location(id="zone_tv_room", name="TV Room", parent_id=None)
    loc_mgr.set_module_config("zone_tv_room", "_meta", {"type": "subarea", "sync_source": "topology"})

    managed_action_rules = kernel["managed_action_rules"]
    managed_action_rules.async_delete_rules_for_location = AsyncMock(return_value=[])  # type: ignore[method-assign]

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 1202,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "zone_tv_room",
        },
    )
    await hass.async_block_till_done()

    assert connection.send_error.call_count == 0
    managed_action_rules.async_delete_rules_for_location.assert_awaited_once_with("zone_tv_room")


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
async def test_locations_delete_rejects_managed_shadow_area(hass: HomeAssistant) -> None:
    """Managed shadow areas are integration-owned and cannot be manually deleted."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
        loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})

    loc_mgr.create_location(id="area_shadow", name="Home", parent_id="building_main", ha_area_id="shadow")
    loc_mgr.set_module_config(
        "area_shadow",
        "_meta",
        {
            "type": "area",
            "ha_area_id": "shadow",
            "sync_source": "homeassistant",
            "role": "managed_shadow",
            "shadow_for_location_id": "building_main",
        },
    )

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 14,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": "area_shadow",
            "entry_id": entry.entry_id,
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
async def test_locations_reorder_allows_reparent_for_node_with_children(
    hass: HomeAssistant,
) -> None:
    """Locations with children can move as a subtree under a valid parent."""
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

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()

    moved = loc_mgr.get_location("floor_a")
    assert moved is not None
    assert moved.parent_id == "building_b"

    child = loc_mgr.get_location("area_a")
    assert child is not None
    assert child.parent_id == "floor_a"



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
    visible_children = [
        loc
        for loc in children
        if str(((loc.get("modules", {}) or {}).get("_meta", {}) or {}).get("role", "")).strip().lower()
        != "managed_shadow"
    ]
    assert [loc["name"] for loc in visible_children] == ["Zulu", "Alpha", "Middle"]

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
    visible_children = [
        loc
        for loc in children
        if str(((loc.get("modules", {}) or {}).get("_meta", {}) or {}).get("role", "")).strip().lower()
        != "managed_shadow"
    ]
    assert [loc["name"] for loc in visible_children] == ["Zulu", "Alpha", "Middle", "Delta"]


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
async def test_locations_assign_entity_updates_ha_area_for_ha_backed_target(
    hass: HomeAssistant,
) -> None:
    """Assigning to an HA-backed area updates entity registry area_id."""
    area_registry = ar.async_get(hass)
    entity_registry = er.async_get(hass)

    kitchen = area_registry.async_create("Kitchen")
    living = area_registry.async_create("Living Room")

    light_entry = entity_registry.async_get_or_create(
        domain="light",
        platform="test",
        unique_id="light_assignment_move",
        suggested_object_id="assignment_move",
    )
    entity_registry.async_update_entity(light_entry.entity_id, area_id=kitchen.id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_assign_entity(
        hass,
        connection,
        {
            "id": 301,
            "type": WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
            "entity_id": light_entry.entity_id,
            "target_location_id": f"area_{living.id}",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["success"] is True
    assert payload["target_location_id"] == f"area_{living.id}"
    assert payload["ha_area_id"] == living.id

    updated_entry = entity_registry.async_get(light_entry.entity_id)
    assert updated_entry is not None
    assert updated_entry.area_id == living.id

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    kitchen_loc = loc_mgr.get_location(f"area_{kitchen.id}")
    living_loc = loc_mgr.get_location(f"area_{living.id}")
    assert kitchen_loc is not None
    assert living_loc is not None
    assert light_entry.entity_id not in kitchen_loc.entity_ids
    assert light_entry.entity_id in living_loc.entity_ids


@pytest.mark.asyncio
async def test_locations_assign_entity_to_floor_remaps_to_managed_shadow_area(
    hass: HomeAssistant,
) -> None:
    """Assigning to a floor remaps to its configured managed shadow area."""
    area_registry = ar.async_get(hass)
    entity_registry = er.async_get(hass)

    kitchen = area_registry.async_create("Kitchen")
    floor_shadow_area = area_registry.async_create("Main Floor")
    light_entry = entity_registry.async_get_or_create(
        domain="light",
        platform="test",
        unique_id="light_assignment_floor_shadow",
        suggested_object_id="assignment_floor_shadow",
    )
    entity_registry.async_update_entity(light_entry.entity_id, area_id=kitchen.id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
        loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})
    loc_mgr.create_location(id="floor_custom", name="Custom Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_custom", "_meta", {"type": "floor", "sync_source": "topology"})
    shadow_location_id = f"area_{floor_shadow_area.id}"
    shadow_location = loc_mgr.get_location(shadow_location_id)
    assert shadow_location is not None
    loc_mgr.update_location(shadow_location_id, parent_id="floor_custom")
    loc_mgr.set_module_config(
        shadow_location_id,
        "_meta",
        {
            **shadow_location.modules.get("_meta", {}),
            "type": "area",
            "role": "managed_shadow",
            "shadow_for_location_id": "floor_custom",
        },
    )
    floor_custom = loc_mgr.get_location("floor_custom")
    assert floor_custom is not None
    loc_mgr.set_module_config(
        "floor_custom",
        "_meta",
        {
            **floor_custom.modules.get("_meta", {}),
            "type": "floor",
            "shadow_area_id": shadow_location_id,
        },
    )

    connection = _fake_connection()
    handle_locations_assign_entity(
        hass,
        connection,
        {
            "id": 302,
            "type": WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
            "entity_id": light_entry.entity_id,
            "target_location_id": "floor_custom",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["requested_target_location_id"] == "floor_custom"
    assert payload["target_location_id"] == shadow_location_id
    assert payload["ha_area_id"] == floor_shadow_area.id

    kitchen_loc = loc_mgr.get_location(f"area_{kitchen.id}")
    floor_loc = loc_mgr.get_location("floor_custom")
    shadow_loc = loc_mgr.get_location(shadow_location_id)
    assert kitchen_loc is not None
    assert floor_loc is not None
    assert shadow_loc is not None
    assert light_entry.entity_id not in kitchen_loc.entity_ids
    assert light_entry.entity_id not in floor_loc.entity_ids
    assert light_entry.entity_id in shadow_loc.entity_ids

    sync_manager = hass.data[DOMAIN][entry.entry_id]["sync_manager"]
    await sync_manager._map_entities()

    kitchen_loc = loc_mgr.get_location(f"area_{kitchen.id}")
    floor_loc = loc_mgr.get_location("floor_custom")
    shadow_loc = loc_mgr.get_location(shadow_location_id)
    entity_entry = entity_registry.async_get(light_entry.entity_id)
    assert kitchen_loc is not None
    assert floor_loc is not None
    assert shadow_loc is not None
    assert light_entry.entity_id not in kitchen_loc.entity_ids
    assert light_entry.entity_id not in floor_loc.entity_ids
    assert light_entry.entity_id in shadow_loc.entity_ids
    assert entity_entry is not None
    assert entity_entry.area_id == floor_shadow_area.id


@pytest.mark.asyncio
async def test_locations_assign_entity_to_building_remaps_to_managed_shadow_area(
    hass: HomeAssistant,
) -> None:
    """Assigning to a building remaps to its configured managed shadow area."""
    area_registry = ar.async_get(hass)
    entity_registry = er.async_get(hass)

    kitchen = area_registry.async_create("Kitchen")
    building_shadow_area = area_registry.async_create("Home")
    light_entry = entity_registry.async_get_or_create(
        domain="light",
        platform="test",
        unique_id="light_assignment_building_shadow",
        suggested_object_id="assignment_building_shadow",
    )
    entity_registry.async_update_entity(light_entry.entity_id, area_id=kitchen.id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="building_custom", name="Home", parent_id=None)
    loc_mgr.set_module_config("building_custom", "_meta", {"type": "building", "sync_source": "topology"})
    shadow_location_id = f"area_{building_shadow_area.id}"
    shadow_location = loc_mgr.get_location(shadow_location_id)
    assert shadow_location is not None
    loc_mgr.update_location(shadow_location_id, parent_id="building_custom")
    loc_mgr.set_module_config(
        shadow_location_id,
        "_meta",
        {
            **shadow_location.modules.get("_meta", {}),
            "type": "area",
            "role": "managed_shadow",
            "shadow_for_location_id": "building_custom",
        },
    )
    building_custom = loc_mgr.get_location("building_custom")
    assert building_custom is not None
    loc_mgr.set_module_config(
        "building_custom",
        "_meta",
        {
            **building_custom.modules.get("_meta", {}),
            "type": "building",
            "shadow_area_id": shadow_location_id,
        },
    )

    connection = _fake_connection()
    handle_locations_assign_entity(
        hass,
        connection,
        {
            "id": 304,
            "type": WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
            "entity_id": light_entry.entity_id,
            "target_location_id": "building_custom",
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()
    payload = connection.send_result.call_args[0][1]
    assert payload["requested_target_location_id"] == "building_custom"
    assert payload["target_location_id"] == shadow_location_id
    assert payload["ha_area_id"] == building_shadow_area.id


@pytest.mark.asyncio
async def test_locations_assign_entity_to_floor_without_shadow_is_rejected(
    hass: HomeAssistant,
) -> None:
    """Assigning to floor fails when no managed shadow area is configured."""
    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")
    entity_registry = er.async_get(hass)
    light_entry = entity_registry.async_get_or_create(
        domain="light",
        platform="test",
        unique_id="light_assignment_missing_floor_shadow",
        suggested_object_id="assignment_missing_floor_shadow",
    )
    entity_registry.async_update_entity(light_entry.entity_id, area_id=kitchen.id)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
        loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})
    loc_mgr.create_location(id="floor_custom", name="Custom Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_custom", "_meta", {"type": "floor", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_assign_entity(
        hass,
        connection,
        {
            "id": 303,
            "type": WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
            "entity_id": light_entry.entity_id,
            "target_location_id": "floor_custom",
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    error_args = connection.send_error.call_args[0]
    assert error_args[1] == "invalid_target"


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
async def test_set_module_config_rejects_manual_shadow_metadata_writes(hass: HomeAssistant) -> None:
    """Managed shadow metadata is integration-owned and cannot be set via WS."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    if loc_mgr.get_location("building_main") is None:
        loc_mgr.create_location(id="building_main", name="Home", parent_id=None)
        loc_mgr.set_module_config("building_main", "_meta", {"type": "building", "sync_source": "topology"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor", "sync_source": "topology"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 33,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "floor_main",
            "module_id": "_meta",
            "config": {
                "type": "floor",
                "shadow_area_id": "area_system",
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_rejects_linked_rooms_for_non_area_floor_rooted_targets(
    hass: HomeAssistant,
) -> None:
    """Linked rooms are not allowed on non-area or non-floor-rooted targets."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_kitchen", name="Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_kitchen", "_meta", {"type": "area"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 31,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "building_main",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": ["area_kitchen"],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_rejects_linked_rooms_outside_same_floor_siblings(
    hass: HomeAssistant,
) -> None:
    """Linked rooms must be immediate sibling areas under the same floor parent."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="floor_second", name="Second Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_second", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_kitchen", name="Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_kitchen", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_family_room", name="Family Room", parent_id="floor_main")
    loc_mgr.set_module_config("area_family_room", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_guest_bedroom", name="Guest Bedroom", parent_id="floor_second")
    loc_mgr.set_module_config("area_guest_bedroom", "_meta", {"type": "area"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 32,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "area_kitchen",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": ["area_guest_bedroom"],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_rejects_sync_rooms_for_non_area_floor_rooted_targets(
    hass: HomeAssistant,
) -> None:
    """Sync rooms are not allowed on non-area or non-floor-rooted targets."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_kitchen", name="Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_kitchen", "_meta", {"type": "area"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 37,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "building_main",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [],
                "sync_locations": ["area_kitchen"],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_rejects_sync_rooms_outside_same_floor_siblings(
    hass: HomeAssistant,
) -> None:
    """Sync rooms must be immediate sibling areas under the same floor parent."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="floor_second", name="Second Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_second", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_kitchen", name="Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_kitchen", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_family_room", name="Family Room", parent_id="floor_main")
    loc_mgr.set_module_config("area_family_room", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_guest_bedroom", name="Guest Bedroom", parent_id="floor_second")
    loc_mgr.set_module_config("area_guest_bedroom", "_meta", {"type": "area"})

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 38,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "area_kitchen",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [],
                "sync_locations": ["area_guest_bedroom"],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_rejects_sync_rooms_with_managed_shadow_area_targets(
    hass: HomeAssistant,
) -> None:
    """Sync rooms must not reference integration-managed shadow areas."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.set_module_config("building_main", "_meta", {"type": "building"})
    loc_mgr.create_location(id="floor_main", name="Main Floor", parent_id="building_main")
    loc_mgr.set_module_config("floor_main", "_meta", {"type": "floor"})
    loc_mgr.create_location(id="area_kitchen", name="Kitchen", parent_id="floor_main")
    loc_mgr.set_module_config("area_kitchen", "_meta", {"type": "area"})
    loc_mgr.create_location(id="area_main_floor_shadow", name="Main Floor", parent_id="floor_main")
    loc_mgr.set_module_config(
        "area_main_floor_shadow",
        "_meta",
        {"type": "area", "role": "managed_shadow", "shadow_for_location_id": "floor_main"},
    )

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 39,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": "area_kitchen",
            "module_id": "occupancy",
            "config": {
                "enabled": True,
                "occupancy_sources": [],
                "sync_locations": ["area_main_floor_shadow"],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_result.call_count == 0
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[1] == "invalid_config"


@pytest.mark.asyncio
async def test_set_module_config_accepts_dusk_dawn_config_and_normalizes_blocks(
    hass: HomeAssistant,
) -> None:
    """Lighting config writes are accepted and normalized to v3 block shape."""
    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 310,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": f"area_{kitchen.id}",
            "module_id": "dusk_dawn",
            "config": {
                "blocks": [
                    {
                        "id": "late",
                        "name": "Block 4",
                        "start_time": "22:00",
                        "end_time": "01:30",
                        "time_condition_enabled": True,
                        "trigger_mode": "on_dark",
                        "ambient_condition": "dark",
                        "must_be_occupied": True,
                        "already_on_behavior": "set_target",
                        "light_targets": [
                            {
                                "entity_id": "light.kitchen_main",
                                "power": "on",
                                "brightness_pct": 18,
                                "color_hex": "#FFAA00",
                                "already_on_behavior": "set_target",
                            },
                            {
                                "entity_id": "light.kitchen_main",
                                "power": "on",
                                "brightness_pct": 25,
                            },
                            {
                                "entity_id": "light.kitchen_island",
                                "power": "off",
                                "brightness_pct": 80,
                                "already_on_behavior": "leave_unchanged",
                            },
                        ],
                    },
                    {
                        "id": "dinner",
                        "name": "Dinner",
                        "start_time": "16:00",
                        "trigger_mode": "on_dark",
                        "ambient_condition": "dark",
                        "must_be_occupied": False,
                        "already_on_behavior": "leave_unchanged",
                        "light_targets": [
                            {
                                "entity_id": "light.kitchen_main",
                                "power": "on",
                                "brightness_pct": 120,
                            }
                        ],
                    },
                ],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    stored = loc_mgr.get_module_config(f"area_{kitchen.id}", "dusk_dawn")
    assert stored["version"] == 3
    assert stored["blocks"][0]["id"] == "late"
    assert stored["blocks"][0]["start_time"] == "22:00"
    assert stored["blocks"][0]["end_time"] == "01:30"
    assert stored["blocks"][0]["time_condition_enabled"] is True
    assert stored["blocks"][0]["trigger_mode"] == "on_dark"
    assert stored["blocks"][0]["ambient_condition"] == "dark"
    assert stored["blocks"][0]["must_be_occupied"] is True
    assert stored["blocks"][0]["already_on_behavior"] == "set_target"
    assert stored["blocks"][0]["name"] == "Rule 4"
    assert stored["blocks"][0]["light_targets"][0] == {
        "entity_id": "light.kitchen_main",
        "power": "on",
        "brightness_pct": 18,
        "color_hex": "#ffaa00",
        "already_on_behavior": "set_target",
    }
    assert stored["blocks"][0]["light_targets"][1] == {
        "entity_id": "light.kitchen_island",
        "power": "off",
        "already_on_behavior": "leave_unchanged",
    }
    assert stored["blocks"][1]["id"] == "dinner"
    assert stored["blocks"][1]["trigger_mode"] == "on_dark"
    assert stored["blocks"][1]["ambient_condition"] == "dark"
    assert stored["blocks"][1]["must_be_occupied"] is False
    assert stored["blocks"][1]["already_on_behavior"] == "leave_unchanged"
    assert stored["blocks"][1]["time_condition_enabled"] is False
    assert stored["blocks"][1]["end_time"] == "23:59"
    assert stored["blocks"][1]["light_targets"][0]["brightness_pct"] == 100


@pytest.mark.asyncio
async def test_set_module_config_accepts_dusk_dawn_duplicate_start_times(
    hass: HomeAssistant,
) -> None:
    """Lighting blocks may share start times in v3 dev schema."""
    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.topomation.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    connection = _fake_connection()
    handle_locations_set_module_config(
        hass,
        connection,
        {
            "id": 311,
            "type": WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
            "location_id": f"area_{kitchen.id}",
            "module_id": "dusk_dawn",
            "config": {
                "blocks": [
                    {
                        "id": "evening",
                        "name": "Evening",
                        "start_time": "16:00",
                        "trigger_mode": "on_dark",
                        "already_on_behavior": "leave_unchanged",
                        "light_targets": [],
                    },
                    {
                        "id": "late",
                        "name": "Late",
                        "start_time": "16:00",
                        "trigger_mode": "on_dark",
                        "already_on_behavior": "leave_unchanged",
                        "light_targets": [],
                    },
                ],
            },
            "entry_id": entry.entry_id,
        },
    )

    assert connection.send_error.call_count == 0
    connection.send_result.assert_called_once()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    stored = loc_mgr.get_module_config(f"area_{kitchen.id}", "dusk_dawn")
    assert stored["version"] == 3
    assert len(stored["blocks"]) == 2
    assert stored["blocks"][0]["id"] == "evening"
    assert stored["blocks"][1]["id"] == "late"


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
async def test_action_rules_list_ignores_non_kernel_domain_metadata(
    hass: HomeAssistant,
) -> None:
    """actions/rules/list should ignore non-dict metadata under DOMAIN storage."""
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
    managed_action_rules = AsyncMock()
    managed_action_rules.async_list_rules = AsyncMock(return_value=expected_rules)
    location_manager = Mock()
    location_manager.get_location.side_effect = (
        lambda location_id: object() if location_id == "interior" else None
    )

    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": location_manager,
            "managed_action_rules": managed_action_rules,
        },
        "_automation_api_refresh_token": object(),
    }

    connection = _fake_connection()
    handle_action_rules_list(
        hass,
        connection,
        {
            "id": 192,
            "type": WS_TYPE_ACTION_RULES_LIST,
            "location_id": "interior",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_list_rules.assert_awaited_once_with("interior")
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(192, {"rules": expected_rules})


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
        "trigger_type": "on_vacant",
        "action_entity_id": "light.bathroom",
        "action_service": "turn_off",
        "ambient_condition": "dark",
        "must_be_occupied": False,
        "time_condition_enabled": False,
        "start_time": "18:00",
        "end_time": "23:59",
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
        trigger_type="on_vacant",
        action_entity_id="light.bathroom",
        action_service="turn_off",
        require_dark=True,
        ambient_condition=None,
        must_be_occupied=False,
        time_condition_enabled=False,
        start_time=None,
        end_time=None,
    )
    schedule_persist.assert_called_once_with("actions/rules/create")
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once_with(91, {"rule": created_rule})


@pytest.mark.asyncio
async def test_action_rules_create_forwards_rule_conditions(hass: HomeAssistant) -> None:
    """actions/rules/create forwards trigger+conditions contract fields."""
    location = type("Location", (), {"id": "kitchen", "name": "Kitchen"})()
    loc_mgr = Mock()
    loc_mgr.get_location.return_value = location
    managed_action_rules = AsyncMock()
    managed_action_rules.async_create_rule = AsyncMock(
        return_value={
            "id": "topomation_kitchen_on_dark_1",
            "entity_id": "automation.topomation_kitchen_on_dark_1",
            "name": "Kitchen dark safety",
            "trigger_type": "on_dark",
            "action_entity_id": "fan.kitchen_fan",
            "action_service": "turn_on",
            "ambient_condition": "dark",
            "must_be_occupied": True,
            "time_condition_enabled": True,
            "start_time": "22:00",
            "end_time": "05:30",
            "enabled": True,
        }
    )
    hass.data[DOMAIN] = {
        "entry_1": {
            "location_manager": loc_mgr,
            "managed_action_rules": managed_action_rules,
        }
    }

    connection = _fake_connection()
    handle_action_rules_create(
        hass,
        connection,
        {
            "id": 912,
            "type": WS_TYPE_ACTION_RULES_CREATE,
            "location_id": "kitchen",
            "name": "Kitchen dark safety",
            "trigger_type": "on_dark",
            "action_entity_id": "fan.kitchen_fan",
            "action_service": "turn_on",
            "ambient_condition": "dark",
            "must_be_occupied": True,
            "time_condition_enabled": True,
            "start_time": "22:00",
            "end_time": "05:30",
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_create_rule.assert_awaited_once_with(
        location=location,
        name="Kitchen dark safety",
        trigger_type="on_dark",
        action_entity_id="fan.kitchen_fan",
        action_service="turn_on",
        require_dark=False,
        ambient_condition="dark",
        must_be_occupied=True,
        time_condition_enabled=True,
        start_time="22:00",
        end_time="05:30",
    )
    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()


@pytest.mark.asyncio
async def test_action_rules_create_rejects_light_owned_by_lighting_policy(
    hass: HomeAssistant,
) -> None:
    """actions/rules/create blocks light targets already owned by lighting policy."""
    location = type("Location", (), {"id": "kitchen", "name": "Kitchen"})()
    loc_mgr = Mock()
    loc_mgr.get_location.return_value = location
    loc_mgr.get_module_config.return_value = {
        "version": 3,
        "blocks": [
            {
                "id": "evening",
                "name": "Evening",
                "start_time": "16:00",
                "trigger_mode": "on_dark",
                "already_on_behavior": "leave_unchanged",
                "light_targets": [
                    {"entity_id": "light.kitchen_ceiling", "power": "on", "brightness_pct": 40}
                ],
            }
        ],
    }
    schedule_persist = Mock()
    managed_action_rules = AsyncMock()
    managed_action_rules.async_create_rule = AsyncMock()
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
            "id": 911,
            "type": WS_TYPE_ACTION_RULES_CREATE,
            "location_id": "kitchen",
            "name": "Kitchen Occupied: Ceiling on",
            "trigger_type": "occupied",
            "action_entity_id": "light.kitchen_ceiling",
            "action_service": "turn_on",
            "require_dark": False,
        },
    )
    await hass.async_block_till_done()

    managed_action_rules.async_create_rule.assert_not_called()
    schedule_persist.assert_not_called()
    connection.send_result.assert_not_called()
    connection.send_error.assert_called_once()
    err_args = connection.send_error.call_args[0]
    assert err_args[0] == 911
    assert err_args[1] == "create_failed"
    assert "owned by Lighting policy" in err_args[2]


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


def _supports_adjacency(location_manager: object) -> bool:
    """Return True when the loaded LocationManager supports adjacency CRUD."""
    required = (
        "all_adjacency_edges",
        "create_adjacency_edge",
        "update_adjacency_edge",
        "delete_adjacency_edge",
    )
    return all(callable(getattr(location_manager, name, None)) for name in required)


def _fake_connection() -> Mock:
    """Minimal ActiveConnection stub for WS handlers."""
    conn = Mock()
    conn.send_result = Mock()
    conn.send_error = Mock()
    return conn
