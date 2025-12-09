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
    # Get first entry (we only support one integration instance for now)
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]

    # Get all locations and convert to dicts
    locations = []
    for loc in loc_mgr.all_locations():
        locations.append(
            {
                "id": loc.id,
                "name": loc.name,
                "parent_id": loc.parent_id,
                "is_explicit_root": loc.is_explicit_root,
                "ha_area_id": loc.ha_area_id,
                "entity_ids": loc.entity_ids,
                "modules": loc.modules,
            }
        )

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
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]

    name = msg["name"]
    parent_id = msg.get("parent_id")
    meta = msg.get("meta", {})

    # Generate ID from name
    location_id = name.lower().replace(" ", "_")

    try:
        # Create location
        loc_mgr.create_location(
            id=location_id,
            name=name,
            parent_id=parent_id,
            is_explicit_root=(parent_id is None),
        )

        # Set meta config if provided
        if meta:
            loc_mgr.set_module_config(location_id, "_meta", meta)

        # Return created location
        location = loc_mgr.get_location(location_id)
        connection.send_result(
            msg["id"],
            {
                "location": {
                    "id": location.id,
                    "name": location.name,
                    "parent_id": location.parent_id,
                    "is_explicit_root": location.is_explicit_root,
                    "modules": location.modules,
                }
            },
        )
    except ValueError as e:
        connection.send_error(msg["id"], "invalid_format", str(e))


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
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]
    changes = msg["changes"]

    try:
        location = loc_mgr.get_location(location_id)
        if not location:
            connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
            return

        # Apply changes (name, parent_id)
        if "name" in changes:
            # Update name via recreating location
            loc_mgr.delete_location(location_id)
            loc_mgr.create_location(
                id=location_id,
                name=changes["name"],
                parent_id=changes.get("parent_id", location.parent_id),
                is_explicit_root=location.is_explicit_root,
                ha_area_id=location.ha_area_id,
            )
        elif "parent_id" in changes:
            # Update parent by recreating
            loc_mgr.delete_location(location_id)
            loc_mgr.create_location(
                id=location_id,
                name=location.name,
                parent_id=changes["parent_id"],
                is_explicit_root=location.is_explicit_root,
                ha_area_id=location.ha_area_id,
            )

        # Return updated location
        updated = loc_mgr.get_location(location_id)
        connection.send_result(
            msg["id"],
            {
                "location": {
                    "id": updated.id,
                    "name": updated.name,
                    "parent_id": updated.parent_id,
                    "is_explicit_root": updated.is_explicit_root,
                    "modules": updated.modules,
                }
            },
        )
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "update_failed", str(e))


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
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]

    try:
        loc_mgr.delete_location(location_id)
        connection.send_result(msg["id"], {"success": True})
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "delete_failed", str(e))


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
    # TODO: Reorder location via LocationManager
    # location_id = msg["location_id"]
    # new_parent_id = msg["new_parent_id"]
    # new_index = msg["new_index"]
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
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]
    modules = kernel["modules"]

    location_id = msg["location_id"]
    module_id = msg["module_id"]
    config = msg["config"]

    try:
        # Set config in LocationManager
        loc_mgr.set_module_config(location_id, module_id, config)

        # Notify module of config change
        if module_id in modules:
            module = modules[module_id]
            if hasattr(module, "on_location_config_changed"):
                module.on_location_config_changed(location_id, config)

        connection.send_result(msg["id"], {"success": True})
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "config_failed", str(e))
