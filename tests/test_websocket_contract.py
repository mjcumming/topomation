"""WebSocket contract tests for Home Topology.

These tests verify that the integration:
- Imports HA floors/areas/entities into topology locations
- Exposes the expected shape via the WebSocket list endpoint
- Creates new locations via the WebSocket create endpoint
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.home_topology.const import (  # type: ignore[import]
    DOMAIN,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
)
from custom_components.home_topology.websocket_api import (  # type: ignore[import]
    handle_locations_create,
    handle_locations_delete,
    handle_locations_list,
    handle_locations_reorder,
    handle_locations_set_module_config,
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
    _add_floors(area_registry, floors)

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

    with patch("custom_components.home_topology.async_register_panel", AsyncMock()):
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

    # Root + 2 floors + 8 rooms = 11 locations
    assert len(locations) == 11

    # Floors exist
    floor_names = {loc["name"] for loc in locations if loc["id"].startswith("floor_")}
    assert floor_names == {"Ground Floor", "First Floor"}

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


@pytest.mark.asyncio
async def test_locations_create_adds_new_location(hass: HomeAssistant) -> None:
    """locations/create creates a new location with underscore id and meta."""

    area_registry = ar.async_get(hass)
    entity_registry = er.async_get(hass)

    # Minimal seed: one floor + one area to ensure house is set up
    _add_floors(area_registry, [FloorDef("ground", "Ground Floor")])
    area_entry = _create_area(area_registry, "Living Room", "ground")
    _create_entity(entity_registry, "binary_sensor.living_room_motion", area_entry)

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.home_topology.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]

    initial_count = len(loc_mgr.all_locations())

    connection = _fake_connection()
    handle_locations_create(
        hass,
        connection,
        {
            "id": 2,
            "type": WS_TYPE_LOCATIONS_CREATE,
            "name": "Bonus Room",
            "parent_id": "house",
            "meta": {"type": "room"},
        },
    )

    payload = connection.send_result.call_args[0][1]["location"]
    assert payload["id"] == "bonus_room"  # underscores from spaces
    assert payload["parent_id"] == "house"

    created = loc_mgr.get_location("bonus_room")
    assert created is not None
    assert created.parent_id == "house"
    assert len(loc_mgr.all_locations()) == initial_count + 1


@pytest.mark.asyncio
async def test_locations_delete_removes_location(hass: HomeAssistant) -> None:
    """locations/delete removes a location and returns success."""

    area_registry = ar.async_get(hass)
    kitchen = area_registry.async_create("Kitchen")

    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.home_topology.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]

    if not hasattr(loc_mgr, "delete_location"):
        pytest.skip("LocationManager delete_location not available in this version")

    # Import areas to create locations
    connection_list = _fake_connection()
    handle_locations_list(
        hass,
        connection_list,
        {"id": 10, "type": WS_TYPE_LOCATIONS_LIST},
    )

    location_id = f"area_{kitchen.id}"
    assert loc_mgr.get_location(location_id) is not None

    connection = _fake_connection()
    handle_locations_delete(
        hass,
        connection,
        {
            "id": 11,
            "type": WS_TYPE_LOCATIONS_DELETE,
            "location_id": location_id,
        },
    )

    result = connection.send_result.call_args[0][1]
    assert result["success"] is True
    assert loc_mgr.get_location(location_id) is None


@pytest.mark.asyncio
async def test_locations_reorder_applies_sibling_index(hass: HomeAssistant) -> None:
    """locations/reorder should persist sibling order via core reorder API."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.home_topology.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="alpha", name="Alpha", parent_id="house")
    loc_mgr.create_location(id="beta", name="Beta", parent_id="house")
    loc_mgr.create_location(id="gamma", name="Gamma", parent_id="house")

    connection = _fake_connection()
    handle_locations_reorder(
        hass,
        connection,
        {
            "id": 20,
            "type": WS_TYPE_LOCATIONS_REORDER,
            "location_id": "gamma",
            "new_parent_id": "house",
            "new_index": 0,
        },
    )

    result = connection.send_result.call_args[0][1]
    assert result["success"] is True
    assert result["index"] == 0

    children = [loc.id for loc in loc_mgr.children_of("house")]
    assert children[:3] == ["gamma", "alpha", "beta"]


@pytest.mark.asyncio
async def test_set_module_config_rejects_floor_occupancy_sources(hass: HomeAssistant) -> None:
    """Occupancy source config is blocked for floor locations."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="test_entry")
    entry.add_to_hass(hass)

    with patch("custom_components.home_topology.async_register_panel", AsyncMock()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    loc_mgr = hass.data[DOMAIN][entry.entry_id]["location_manager"]
    loc_mgr.create_location(id="main_floor", name="Main Floor", parent_id="house")
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


def _add_floors(area_registry: ar.AreaRegistry, floors: Iterable[FloorDef]) -> None:
    """Inject floors into the registry (HA may not expose floor registry in tests)."""
    area_registry.floors = {
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
