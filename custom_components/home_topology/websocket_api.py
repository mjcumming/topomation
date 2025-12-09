"""WebSocket API for Home Topology."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import (
    DOMAIN,
    WS_TYPE_AMBIENT_AUTO_DISCOVER,
    WS_TYPE_AMBIENT_GET_READING,
    WS_TYPE_AMBIENT_SET_SENSOR,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
    WS_TYPE_SYNC_ENABLE,
    WS_TYPE_SYNC_IMPORT,
    WS_TYPE_SYNC_STATUS,
)

_LOGGER = logging.getLogger(__name__)


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    # Location management
    websocket_api.async_register_command(hass, handle_locations_list)
    websocket_api.async_register_command(hass, handle_locations_create)
    websocket_api.async_register_command(hass, handle_locations_update)
    websocket_api.async_register_command(hass, handle_locations_delete)
    websocket_api.async_register_command(hass, handle_locations_reorder)
    websocket_api.async_register_command(hass, handle_locations_set_module_config)

    # Ambient light module
    websocket_api.async_register_command(hass, handle_ambient_get_reading)
    websocket_api.async_register_command(hass, handle_ambient_set_sensor)
    websocket_api.async_register_command(hass, handle_ambient_auto_discover)

    # Sync manager
    websocket_api.async_register_command(hass, handle_sync_import)
    websocket_api.async_register_command(hass, handle_sync_status)
    websocket_api.async_register_command(hass, handle_sync_enable)

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
            connection.send_error(
                msg["id"], "not_found", f"Location {location_id} not found"
            )
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


# =============================================================================
# Ambient Light Module Commands
# =============================================================================


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_AMBIENT_GET_READING,
        vol.Required("location_id"): str,
        vol.Optional("dark_threshold"): vol.Coerce(float),
        vol.Optional("bright_threshold"): vol.Coerce(float),
    }
)
@callback
def handle_ambient_get_reading(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/get_reading command."""
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(
            msg["id"], "module_not_loaded", "Ambient module not loaded"
        )
        return

    ambient_module = modules["ambient"]
    location_id = msg["location_id"]

    try:
        reading = ambient_module.get_ambient_light(
            location_id,
            dark_threshold=msg.get("dark_threshold"),
            bright_threshold=msg.get("bright_threshold"),
        )

        connection.send_result(msg["id"], reading.to_dict())
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "read_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_AMBIENT_SET_SENSOR,
        vol.Required("location_id"): str,
        vol.Required("entity_id"): str,
    }
)
@callback
def handle_ambient_set_sensor(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/set_sensor command."""
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(
            msg["id"], "module_not_loaded", "Ambient module not loaded"
        )
        return

    ambient_module = modules["ambient"]
    location_id = msg["location_id"]
    entity_id = msg["entity_id"]

    try:
        ambient_module.set_lux_sensor(location_id, entity_id)
        connection.send_result(msg["id"], {"success": True})
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "set_sensor_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_AMBIENT_AUTO_DISCOVER,
    }
)
@callback
def handle_ambient_auto_discover(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/auto_discover command."""
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(
            msg["id"], "module_not_loaded", "Ambient module not loaded"
        )
        return

    ambient_module = modules["ambient"]

    try:
        discovered = ambient_module.auto_discover_sensors()
        connection.send_result(msg["id"], {"discovered": discovered})
    except Exception as e:
        connection.send_error(msg["id"], "discover_failed", str(e))


# =============================================================================
# Sync Manager Commands
# =============================================================================


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_SYNC_IMPORT,
        vol.Optional("force", default=False): bool,
    }
)
@websocket_api.async_response
async def handle_sync_import(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle sync/import command - force reimport from HA.

    Payload:
      - force: bool (optional) - Force reimport even if already imported
    """
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    sync_manager = kernel.get("sync_manager")

    if not sync_manager:
        connection.send_error(
            msg["id"], "sync_not_available", "Sync manager not available"
        )
        return

    try:
        # Re-import all areas and floors
        await sync_manager.import_all_areas_and_floors()

        # Get count of imported locations
        loc_mgr = kernel["location_manager"]
        location_count = len(loc_mgr.all_locations())

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location_count": location_count,
                "message": f"Imported {location_count} locations from Home Assistant",
            },
        )
    except Exception as e:
        _LOGGER.error("Sync import failed: %s", e, exc_info=True)
        connection.send_error(msg["id"], "import_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_SYNC_STATUS,
        vol.Optional("location_id"): str,
    }
)
@callback
def handle_sync_status(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle sync/status command - get sync status.

    Payload:
      - location_id: str (optional) - Get status for specific location
    """
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    sync_manager = kernel.get("sync_manager")
    loc_mgr = kernel["location_manager"]

    if not sync_manager:
        connection.send_error(
            msg["id"], "sync_not_available", "Sync manager not available"
        )
        return

    location_id = msg.get("location_id")

    if location_id:
        # Get status for specific location
        location = loc_mgr.get_location(location_id)
        if not location:
            connection.send_error(
                msg["id"], "location_not_found", f"Location {location_id} not found"
            )
            return

        meta = location.modules.get("_meta", {})
        connection.send_result(
            msg["id"],
            {
                "location_id": location_id,
                "name": location.name,
                "ha_area_id": meta.get("ha_area_id"),
                "ha_floor_id": meta.get("ha_floor_id"),
                "sync_source": meta.get("sync_source"),
                "sync_enabled": meta.get("sync_enabled", True),
                "last_synced": meta.get("last_synced"),
                "type": meta.get("type"),
            },
        )
    else:
        # Get overall sync status
        locations = loc_mgr.all_locations()
        synced_count = 0
        topology_only_count = 0

        for loc in locations:
            meta = loc.modules.get("_meta", {})
            if meta.get("sync_source") == "homeassistant":
                synced_count += 1
            elif meta.get("sync_source") == "topology":
                topology_only_count += 1

        connection.send_result(
            msg["id"],
            {
                "total_locations": len(locations),
                "synced_from_ha": synced_count,
                "topology_only": topology_only_count,
                "sync_active": True,
            },
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_SYNC_ENABLE,
        vol.Required("location_id"): str,
        vol.Required("enabled"): bool,
    }
)
@callback
def handle_sync_enable(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle sync/enable command - enable/disable sync for location.

    Payload:
      - location_id: str - Location to configure
      - enabled: bool - Enable or disable sync
    """
    entry_ids = list(hass.data[DOMAIN].keys())
    if not entry_ids:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return

    kernel = hass.data[DOMAIN][entry_ids[0]]
    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]
    enabled = msg["enabled"]

    location = loc_mgr.get_location(location_id)
    if not location:
        connection.send_error(
            msg["id"], "location_not_found", f"Location {location_id} not found"
        )
        return

    try:
        # Update metadata
        meta = location.modules.get("_meta", {})
        meta["sync_enabled"] = enabled
        loc_mgr.set_module_config(location_id, "_meta", meta)

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location_id": location_id,
                "sync_enabled": enabled,
                "message": f"Sync {'enabled' if enabled else 'disabled'} for {location.name}",
            },
        )
    except Exception as e:
        _LOGGER.error("Failed to update sync setting: %s", e, exc_info=True)
        connection.send_error(msg["id"], "update_failed", str(e))
