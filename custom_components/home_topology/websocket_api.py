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


def _get_kernel(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> dict[str, Any] | None:
    """Resolve the integration runtime data for a WebSocket command."""
    domain_data: dict[str, Any] = hass.data.get(DOMAIN, {})
    if not domain_data:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return None

    requested_entry_id = msg.get("entry_id")
    if requested_entry_id is not None:
        kernel = domain_data.get(requested_entry_id)
        if kernel is None:
            connection.send_error(
                msg["id"],
                "entry_not_found",
                f"Config entry '{requested_entry_id}' not found",
            )
            return None
        return kernel

    if len(domain_data) == 1:
        return next(iter(domain_data.values()))

    connection.send_error(
        msg["id"],
        "entry_required",
        "Multiple Home Topology entries loaded; include 'entry_id'",
    )
    return None


def _location_type(location: Any) -> str:
    """Read integration location type from _meta module (defaults to area)."""
    modules = getattr(location, "modules", {}) or {}
    meta = modules.get("_meta", {}) if isinstance(modules, dict) else {}
    return str(meta.get("type", "area"))


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


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_LIST,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/list command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/create command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

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
                    "ha_area_id": location.ha_area_id,
                    "entity_ids": location.entity_ids,
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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/update command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]
    changes = msg["changes"]

    try:
        location = loc_mgr.get_location(location_id)
        if not location:
            connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
            return

        # Extract update parameters
        update_kwargs = {}
        if "name" in changes:
            update_kwargs["name"] = changes["name"]
        if "parent_id" in changes:
            update_kwargs["parent_id"] = changes["parent_id"]

        # Update location using LocationManager.update_location()
        if update_kwargs:
            updated = loc_mgr.update_location(location_id, **update_kwargs)
        else:
            updated = location

        # Handle meta updates (per ADR-HA-005)
        if "meta" in changes:
            meta = changes["meta"]
            # Merge with existing meta
            existing_meta = location.modules.get("_meta", {})
            merged_meta = {**existing_meta, **meta}
            loc_mgr.set_module_config(location_id, "_meta", merged_meta)
            # Reload to get updated modules
            updated = loc_mgr.get_location(location_id)

        # Return updated location
        connection.send_result(
            msg["id"],
            {
                "location": {
                    "id": updated.id,
                    "name": updated.name,
                    "parent_id": updated.parent_id,
                    "is_explicit_root": updated.is_explicit_root,
                    "ha_area_id": updated.ha_area_id,
                    "entity_ids": updated.entity_ids,
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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/delete command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_reorder(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/reorder command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]
    new_parent_id = msg["new_parent_id"]
    new_index = msg["new_index"]

    try:
        location = loc_mgr.get_location(location_id)
        if not location:
            connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
            return

        updated = loc_mgr.reorder_location(location_id, new_parent_id, new_index)
        resolved_parent_id = updated.parent_id

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location_id": location_id,
                "parent_id": resolved_parent_id,
                "index": new_index,
            },
        )
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "reorder_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
        vol.Required("location_id"): str,
        vol.Required("module_id"): str,
        vol.Required("config"): dict,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_set_module_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations/set_module_config command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    modules = kernel["modules"]

    location_id = msg["location_id"]
    module_id = msg["module_id"]
    config = msg["config"]

    try:
        location = loc_mgr.get_location(location_id)
        if not location:
            connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
            return

        # Product policy: occupancy sensors are area-only (no floor-level sources).
        if module_id == "occupancy" and _location_type(location) == "floor":
            sources = config.get("occupancy_sources", []) if isinstance(config, dict) else []
            if sources:
                connection.send_error(
                    msg["id"],
                    "invalid_config",
                    "Floor locations cannot have occupancy sources. Configure sensors on areas.",
                )
                return

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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_ambient_get_reading(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/get_reading command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(msg["id"], "module_not_loaded", "Ambient module not loaded")
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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_ambient_set_sensor(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/set_sensor command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(msg["id"], "module_not_loaded", "Ambient module not loaded")
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
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_ambient_auto_discover(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle ambient/auto_discover command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    modules = kernel["modules"]

    if "ambient" not in modules:
        connection.send_error(msg["id"], "module_not_loaded", "Ambient module not loaded")
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
        vol.Optional("entry_id"): str,
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
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    sync_manager = kernel.get("sync_manager")

    if not sync_manager:
        connection.send_error(msg["id"], "sync_not_available", "Sync manager not available")
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
        vol.Optional("entry_id"): str,
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
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    sync_manager = kernel.get("sync_manager")
    loc_mgr = kernel["location_manager"]

    if not sync_manager:
        connection.send_error(msg["id"], "sync_not_available", "Sync manager not available")
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
        vol.Optional("entry_id"): str,
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
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]

    location_id = msg["location_id"]
    enabled = msg["enabled"]

    location = loc_mgr.get_location(location_id)
    if not location:
        connection.send_error(msg["id"], "location_not_found", f"Location {location_id} not found")
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
