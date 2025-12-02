"""WebSocket API for Home Topology."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import (
    DOMAIN,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
)

_LOGGER = logging.getLogger(__name__)


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    websocket_api.async_register_command(hass, handle_locations_list)
    websocket_api.async_register_command(hass, handle_locations_create)
    websocket_api.async_register_command(hass, handle_locations_update)
    websocket_api.async_register_command(hass, handle_locations_delete)
    websocket_api.async_register_command(hass, handle_locations_reorder)
    websocket_api.async_register_command(hass, handle_locations_set_module_config)
    
    _LOGGER.debug("Home Topology WebSocket API registered")


@websocket_api.websocket_command({vol.Required("type"): WS_TYPE_LOCATIONS_LIST})
@callback
def handle_locations_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/list command."""
    # TODO: Get locations from LocationManager
    # location_manager = hass.data[DOMAIN][entry_id]["location_manager"]
    # locations = location_manager.get_all_locations()
    
    # Mock response for now
    locations = [
        {
            "id": "floor-1",
            "name": "First Floor",
            "parent_id": None,
            "modules": {
                "_meta": {"type": "floor"}
            },
        },
        {
            "id": "kitchen",
            "name": "Kitchen",
            "parent_id": "floor-1",
            "modules": {
                "_meta": {"type": "room", "category": "kitchen"},
                "occupancy": {"enabled": True, "default_timeout": 600},
            },
        },
        {
            "id": "living-room",
            "name": "Living Room",
            "parent_id": "floor-1",
            "modules": {
                "_meta": {"type": "room", "category": "living"},
                "occupancy": {"enabled": True, "default_timeout": 900},
            },
        },
    ]
    
    connection.send_result(msg["id"], {"locations": locations})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_CREATE,
        vol.Required("name"): str,
        vol.Optional("parent_id"): vol.Any(str, None),
        vol.Optional("meta"): dict,
    }
)
@callback
def handle_locations_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/create command."""
    name = msg["name"]
    parent_id = msg.get("parent_id")
    meta = msg.get("meta", {})
    
    # TODO: Create location via LocationManager
    # location = location_manager.create_location(name, parent_id=parent_id)
    # location_manager.set_module_config(location.id, "_meta", meta)
    
    # Mock response
    location_id = name.lower().replace(" ", "-")
    location = {
        "id": location_id,
        "name": name,
        "parent_id": parent_id,
        "modules": {"_meta": meta},
    }
    
    connection.send_result(msg["id"], {"location": location})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_UPDATE,
        vol.Required("location_id"): str,
        vol.Required("changes"): dict,
    }
)
@callback
def handle_locations_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/update command."""
    location_id = msg["location_id"]
    changes = msg["changes"]
    
    # TODO: Update location via LocationManager
    # location = location_manager.get_location(location_id)
    # if "name" in changes:
    #     location_manager.rename_location(location_id, changes["name"])
    # if "parent_id" in changes:
    #     location_manager.move_location(location_id, changes["parent_id"])
    
    # Mock response
    location = {
        "id": location_id,
        "name": changes.get("name", location_id),
        "parent_id": changes.get("parent_id"),
        "modules": {},
    }
    
    connection.send_result(msg["id"], {"location": location})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_DELETE,
        vol.Required("location_id"): str,
    }
)
@callback
def handle_locations_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/delete command."""
    location_id = msg["location_id"]
    
    # TODO: Delete location via LocationManager
    # location_manager.delete_location(location_id)
    
    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_REORDER,
        vol.Required("location_id"): str,
        vol.Required("new_parent_id"): vol.Any(str, None),
        vol.Required("new_index"): int,
    }
)
@callback
def handle_locations_reorder(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/reorder command."""
    location_id = msg["location_id"]
    new_parent_id = msg["new_parent_id"]
    new_index = msg["new_index"]
    
    # TODO: Reorder location via LocationManager
    # location_manager.move_location(location_id, new_parent_id, index=new_index)
    
    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
        vol.Required("location_id"): str,
        vol.Required("module_id"): str,
        vol.Required("config"): dict,
    }
)
@callback
def handle_locations_set_module_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/set_module_config command."""
    location_id = msg["location_id"]
    module_id = msg["module_id"]
    config = msg["config"]
    
    # TODO: Set module config via LocationManager
    # location_manager.set_module_config(location_id, module_id, config)
    
    connection.send_result(msg["id"], {"success": True})

