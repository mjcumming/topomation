"""WebSocket API for Topomation."""

from __future__ import annotations

import logging
import re
from typing import Any
from weakref import WeakKeyDictionary

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry as ar

try:  # Floor registry is optional on older HA builds.
    from homeassistant.helpers import floor_registry as fr
except Exception:  # pragma: no cover - compatibility import
    fr = None  # type: ignore[assignment]

from .const import (
    DOMAIN,
    WS_TYPE_ACTION_RULES_CREATE,
    WS_TYPE_ACTION_RULES_DELETE,
    WS_TYPE_ACTION_RULES_LIST,
    WS_TYPE_ACTION_RULES_SET_ENABLED,
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
_CONNECTION_ENTRY_HINTS: WeakKeyDictionary[object, str] = WeakKeyDictionary()

_SUPPORTED_LOCATION_TYPES = frozenset(
    {
        "floor",
        "area",
        "building",
        "grounds",
        "subarea",
    }
)
_LEGACY_LOCATION_TYPE_ALIASES: dict[str, str] = {
    "room": "area",
}


def _remember_connection_entry_hint(
    connection: websocket_api.ActiveConnection,
    entry_id: str,
) -> None:
    """Cache a best-effort entry hint for this websocket connection."""
    try:
        _CONNECTION_ENTRY_HINTS[connection] = entry_id
    except TypeError:
        # Some connection objects may not be weakref-able; skip hinting.
        return


def _connection_entry_hint(
    connection: websocket_api.ActiveConnection,
) -> str | None:
    """Return cached entry hint for this websocket connection, if any."""
    try:
        hint = _CONNECTION_ENTRY_HINTS.get(connection)
    except TypeError:
        return None
    if isinstance(hint, str) and hint:
        return hint
    return None


def _normalize_location_type(raw_type: Any) -> str:
    """Normalize stored location type strings to adapter-supported values."""
    if raw_type is None:
        return "area"

    normalized = str(raw_type).strip().lower()
    normalized = _LEGACY_LOCATION_TYPE_ALIASES.get(normalized, normalized)
    if normalized in _SUPPORTED_LOCATION_TYPES:
        return normalized
    return "area"


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
        _remember_connection_entry_hint(connection, requested_entry_id)
        return kernel

    if len(domain_data) == 1:
        entry_id, kernel = next(iter(domain_data.items()))
        _remember_connection_entry_hint(connection, str(entry_id))
        return kernel

    location_id = msg.get("location_id")
    if isinstance(location_id, str) and location_id:
        matching_kernels: list[tuple[str, dict[str, Any]]] = []
        for entry_id, kernel in domain_data.items():
            loc_mgr = kernel.get("location_manager")
            get_location = getattr(loc_mgr, "get_location", None)
            if not callable(get_location):
                continue
            try:
                if get_location(location_id) is not None:
                    matching_kernels.append((str(entry_id), kernel))
            except Exception:  # pragma: no cover - defensive logging
                _LOGGER.debug(
                    "Failed location lookup for websocket kernel resolution: %s",
                    location_id,
                    exc_info=True,
                )

        if len(matching_kernels) == 1:
            matched_entry_id, matched_kernel = matching_kernels[0]
            _remember_connection_entry_hint(connection, matched_entry_id)
            return matched_kernel

        if len(matching_kernels) > 1:
            connection.send_error(
                msg["id"],
                "entry_required",
                f"Multiple Topomation entries contain location '{location_id}'; include 'entry_id'",
            )
            return None

    hinted_entry_id = _connection_entry_hint(connection)
    if hinted_entry_id and hinted_entry_id in domain_data:
        return domain_data[hinted_entry_id]

    connection.send_error(
        msg["id"],
        "entry_required",
        "Multiple Topomation entries loaded; include 'entry_id'",
    )
    return None


def _location_type(location: object) -> str:
    """Read integration location type from _meta module (defaults to area)."""
    modules = getattr(location, "modules", {}) or {}
    meta = modules.get("_meta", {}) if isinstance(modules, dict) else {}
    return _normalize_location_type(meta.get("type"))


def _location_meta(location: object) -> dict[str, Any]:
    """Return normalized _meta dict from a location-like object."""
    modules = getattr(location, "modules", {}) or {}
    if not isinstance(modules, dict):
        return {}
    meta = modules.get("_meta", {})
    return meta if isinstance(meta, dict) else {}


def _location_ha_area_id(location: object) -> str | None:
    """Resolve canonical HA area linkage for a location."""
    linked = getattr(location, "ha_area_id", None)
    if linked:
        return str(linked)
    return _location_meta(location).get("ha_area_id")


def _is_ha_backed_location(location: object) -> bool:
    """Return True when a location is sourced from HA floor/area registries."""
    meta = _location_meta(location)
    if meta.get("sync_source") == "homeassistant":
        return True
    if meta.get("ha_floor_id"):
        return True
    if _location_ha_area_id(location):
        return True
    return False


def _nearest_floor_id(location_manager: object, start_parent_id: str | None) -> str | None:
    """Find nearest ancestor carrying an HA floor linkage."""
    current_id = start_parent_id
    visited: set[str] = set()

    while current_id and current_id not in visited:
        visited.add(current_id)
        current = location_manager.get_location(current_id)
        if current is None:
            return None

        meta = _location_meta(current)
        floor_id = meta.get("ha_floor_id")
        if floor_id:
            return str(floor_id)

        current_id = getattr(current, "parent_id", None)

    return None


def _sync_ha_area_floor_assignment(
    hass: HomeAssistant,
    location_manager: object,
    location: object,
) -> str | None:
    """Sync moved HA-backed area to nearest floor ancestor (or clear floor)."""
    ha_area_id = _location_ha_area_id(location)
    if not ha_area_id:
        return None

    new_floor_id = _nearest_floor_id(location_manager, location.parent_id)

    area_registry = ar.async_get(hass)
    area_entry = area_registry.async_get_area(ha_area_id)
    if area_entry is None:
        raise ValueError(f"HA area '{ha_area_id}' not found for reordered location")

    current_floor_id = getattr(area_entry, "floor_id", None)
    if current_floor_id != new_floor_id:
        area_registry.async_update(ha_area_id, floor_id=new_floor_id)

    return new_floor_id


def _slugify_location_id(name: str) -> str:
    """Convert a display name to a stable ID-safe slug."""
    slug = re.sub(r"[^a-z0-9]+", "_", name.strip().lower())
    slug = slug.strip("_")
    return slug or "location"


def _next_location_id(location_manager: object, location_type: str, name: str) -> str:
    """Generate a unique topology location ID."""
    stem = f"{location_type}_{_slugify_location_id(name)}"
    candidate = stem
    suffix = 2
    while location_manager.get_location(candidate) is not None:
        candidate = f"{stem}_{suffix}"
        suffix += 1
    return candidate


def _validate_parent_for_type(
    location_manager: object,
    location_type: str,
    parent_id: str | None,
) -> tuple[bool, str | None]:
    """Validate parent assignment for create/update policy."""
    if parent_id is None:
        return True, None

    parent = location_manager.get_location(parent_id)
    if parent is None:
        return False, f"Parent location '{parent_id}' not found"
    if bool(getattr(parent, "is_explicit_root", False)):
        return False, "Home root cannot be used as a parent location"

    parent_type = _location_type(parent)

    if location_type in {"building", "grounds"}:
        return False, f"{location_type.capitalize()} locations must be root-level"

    if location_type == "floor" and parent_type != "building":
        return False, "Floor parent must be root-level or Building"

    return True, None


def _rename_ha_backed_location(
    hass: HomeAssistant,
    location: object,
    new_name: str,
) -> None:
    """Propagate rename to HA registry when location is HA-backed."""
    ha_area_id = _location_ha_area_id(location)
    if ha_area_id:
        area_registry = ar.async_get(hass)
        if area_registry.async_get_area(ha_area_id) is not None:
            area_registry.async_update(ha_area_id, name=new_name)
        return

    meta = _location_meta(location)
    floor_id = meta.get("ha_floor_id")
    if floor_id and fr is not None:
        floor_registry = fr.async_get(hass)
        update_floor = getattr(floor_registry, "async_update", None)
        get_floor = getattr(floor_registry, "async_get_floor", None)
        if callable(update_floor) and callable(get_floor) and get_floor(floor_id) is not None:
            update_floor(floor_id, name=new_name)


def _siblings_of(location_manager: object, parent_id: str | None) -> list[object]:
    """Return direct children under a parent ID."""
    return [
        loc
        for loc in location_manager.all_locations()
        if getattr(loc, "parent_id", None) == parent_id
    ]


def _subtree_location_ids(location_manager: object, root_id: str) -> list[str]:
    """Return root + descendant IDs for a location subtree."""
    all_locations = list(location_manager.all_locations())
    by_parent: dict[str | None, list[object]] = {}
    for loc in all_locations:
        by_parent.setdefault(getattr(loc, "parent_id", None), []).append(loc)

    result: list[str] = []
    stack = [root_id]
    visited: set[str] = set()
    while stack:
        current = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        result.append(current)
        for child in by_parent.get(current, []):
            child_id = str(getattr(child, "id", ""))
            if child_id and child_id not in visited:
                stack.append(child_id)

    return result


def _sibling_group_uses_manual_order(siblings: list[object]) -> bool:
    """True when sibling ordering should use persisted `order` indexes."""
    return any(bool(_location_meta(loc).get("manual_order")) for loc in siblings)


def _sorted_siblings(siblings: list[object]) -> list[object]:
    """Sort sibling nodes per policy: A-Z by default, persisted order when manual."""
    if _sibling_group_uses_manual_order(siblings):
        return sorted(
            siblings,
            key=lambda loc: (
                int(getattr(loc, "order", 0) or 0),
                str(getattr(loc, "name", "")).casefold(),
                str(getattr(loc, "id", "")),
            ),
        )

    return sorted(
        siblings,
        key=lambda loc: (
            str(getattr(loc, "name", "")).casefold(),
            str(getattr(loc, "id", "")),
        ),
    )


def _ordered_locations_for_list(location_manager: object) -> list[object]:
    """Return depth-first locations with deterministic sibling ordering."""
    all_locations = list(location_manager.all_locations())
    by_parent: dict[str | None, list[object]] = {}
    for loc in all_locations:
        by_parent.setdefault(getattr(loc, "parent_id", None), []).append(loc)

    ordered: list[object] = []
    visited: set[str] = set()

    def walk(parent_id: str | None) -> None:
        for child in _sorted_siblings(by_parent.get(parent_id, [])):
            child_id = str(getattr(child, "id", ""))
            if not child_id or child_id in visited:
                continue
            visited.add(child_id)
            ordered.append(child)
            walk(child_id)

    # Canonical root walk
    walk(None)

    # Best-effort fallback for corrupted/orphaned graph segments.
    for loc in sorted(
        (entry for entry in all_locations if str(getattr(entry, "id", "")) not in visited),
        key=lambda entry: (
            str(getattr(entry, "parent_id", "")).casefold(),
            str(getattr(entry, "name", "")).casefold(),
            str(getattr(entry, "id", "")),
        ),
    ):
        loc_id = str(getattr(loc, "id", ""))
        if not loc_id or loc_id in visited:
            continue
        visited.add(loc_id)
        ordered.append(loc)
        walk(loc_id)

    return ordered


def _mark_sibling_group_manual_order(location_manager: object, parent_id: str | None) -> None:
    """Persist manual ordering marker for all siblings under a parent."""
    for sibling in _siblings_of(location_manager, parent_id):
        meta = _location_meta(sibling)
        if meta.get("manual_order") is True:
            continue
        location_manager.set_module_config(
            getattr(sibling, "id"),
            "_meta",
            {**meta, "manual_order": True},
        )


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    # Location management
    websocket_api.async_register_command(hass, handle_locations_list)
    websocket_api.async_register_command(hass, handle_locations_create)
    websocket_api.async_register_command(hass, handle_locations_update)
    websocket_api.async_register_command(hass, handle_locations_delete)
    websocket_api.async_register_command(hass, handle_locations_reorder)
    websocket_api.async_register_command(hass, handle_locations_set_module_config)

    # Managed actions
    websocket_api.async_register_command(hass, handle_action_rules_list)
    websocket_api.async_register_command(hass, handle_action_rules_create)
    websocket_api.async_register_command(hass, handle_action_rules_delete)
    websocket_api.async_register_command(hass, handle_action_rules_set_enabled)

    # Ambient light module
    websocket_api.async_register_command(hass, handle_ambient_get_reading)
    websocket_api.async_register_command(hass, handle_ambient_set_sensor)
    websocket_api.async_register_command(hass, handle_ambient_auto_discover)

    # Sync manager
    websocket_api.async_register_command(hass, handle_sync_import)
    websocket_api.async_register_command(hass, handle_sync_status)
    websocket_api.async_register_command(hass, handle_sync_enable)

    _LOGGER.debug("Topomation WebSocket API registered")


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
    for loc in _ordered_locations_for_list(loc_mgr):
        locations.append(
            {
                "id": loc.id,
                "name": loc.name,
                "parent_id": loc.parent_id,
                "is_explicit_root": loc.is_explicit_root,
                "order": getattr(loc, "order", 0),
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
        vol.Optional("ha_area_id"): vol.Any(str, None),
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
    """Handle locations/create command.

    Adapter policy:
    - All location classes are creatable from topology UI.
    - Parent constraints still apply (e.g., floor under building/root).
    """
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    raw_meta = msg.get("meta")
    meta = raw_meta if isinstance(raw_meta, dict) else {}
    location_type = _normalize_location_type(meta.get("type"))
    name = str(msg.get("name", "")).strip()
    parent_id = msg.get("parent_id")

    if not name:
        connection.send_error(msg["id"], "invalid_name", "Location name is required")
        return

    if parent_id is not None and loc_mgr.get_location(parent_id) is None:
        connection.send_error(msg["id"], "parent_not_found", f"Parent location '{parent_id}' not found")
        return

    is_parent_valid, parent_error = _validate_parent_for_type(loc_mgr, location_type, parent_id)
    if not is_parent_valid:
        connection.send_error(msg["id"], "invalid_parent", parent_error or "Invalid parent for type")
        return

    area_registry: ar.AreaRegistry | None = None
    created_ha_area_id: str | None = None

    try:
        ha_area_id = msg.get("ha_area_id")
        if location_type != "area":
            ha_area_id = None
            location_id = _next_location_id(loc_mgr, location_type, name)
        else:
            area_registry = ar.async_get(hass)
            if isinstance(ha_area_id, str) and ha_area_id:
                if area_registry.async_get_area(ha_area_id) is None:
                    connection.send_error(
                        msg["id"],
                        "ha_area_not_found",
                        f"HA area '{ha_area_id}' not found",
                    )
                    return
            else:
                nearest_floor_id = _nearest_floor_id(loc_mgr, parent_id)
                created_area = area_registry.async_create(name=name, floor_id=nearest_floor_id)
                ha_area_id = str(created_area.id)
                created_ha_area_id = ha_area_id
            location_id = f"area_{ha_area_id}"

        existing = loc_mgr.get_location(location_id)
        if existing is not None:
            update_kwargs: dict[str, Any] = {}
            if getattr(existing, "name", None) != name:
                update_kwargs["name"] = name
            if getattr(existing, "parent_id", None) != parent_id:
                update_kwargs["parent_id"] = parent_id if parent_id is not None else ""
            if location_type == "area" and getattr(existing, "ha_area_id", None) != ha_area_id:
                update_kwargs["ha_area_id"] = ha_area_id

            location = (
                loc_mgr.update_location(location_id, **update_kwargs)
                if update_kwargs
                else existing
            )
        else:
            location = loc_mgr.create_location(
                id=location_id,
                name=name,
                parent_id=parent_id,
                is_explicit_root=False,
                ha_area_id=ha_area_id,
            )

        merged_meta = {
            **meta,
            "type": location_type,
            "sync_source": "topology",
            "sync_enabled": True,
        }
        if location_type == "area" and ha_area_id:
            merged_meta["ha_area_id"] = ha_area_id
        loc_mgr.set_module_config(location_id, "_meta", merged_meta)

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/create")

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location": {
                    "id": location.id,
                    "name": location.name,
                    "parent_id": location.parent_id,
                    "is_explicit_root": location.is_explicit_root,
                    "ha_area_id": location.ha_area_id,
                    "entity_ids": location.entity_ids,
                    "modules": location.modules,
                },
            },
        )
    except ValueError as err:
        if area_registry is not None and created_ha_area_id:
            if area_registry.async_get_area(created_ha_area_id) is not None:
                area_registry.async_delete(created_ha_area_id)
        connection.send_error(msg["id"], "create_failed", str(err))


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
    changes = msg.get("changes")
    if not isinstance(changes, dict):
        connection.send_error(msg["id"], "invalid_changes", "changes payload must be an object")
        return

    location = loc_mgr.get_location(location_id)
    if location is None:
        connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
        return

    rename = None
    if "name" in changes:
        candidate = str(changes.get("name", "")).strip()
        if not candidate:
            connection.send_error(msg["id"], "invalid_name", "Location name is required")
            return
        rename = candidate

    parent_arg: str | None = None
    if "parent_id" in changes:
        requested_parent = changes.get("parent_id")
        if requested_parent is not None and not isinstance(requested_parent, str):
            connection.send_error(msg["id"], "invalid_parent", "parent_id must be string or null")
            return

        requested_parent_id = requested_parent if isinstance(requested_parent, str) else None
        location_type = _location_type(location)

        is_parent_valid, parent_error = _validate_parent_for_type(
            loc_mgr, location_type, requested_parent_id
        )
        if not is_parent_valid:
            connection.send_error(msg["id"], "invalid_parent", parent_error or "Invalid parent for type")
            return

        parent_arg = requested_parent_id if requested_parent_id is not None else ""

    if rename is None and "parent_id" not in changes:
        connection.send_result(msg["id"], {"success": True, "location_id": location_id})
        return

    try:
        if rename is not None and _is_ha_backed_location(location):
            _rename_ha_backed_location(hass, location, rename)

        updated = loc_mgr.update_location(
            location_id,
            name=rename,
            parent_id=parent_arg,
        )

        synced_floor_id: str | None = None
        if "parent_id" in changes:
            synced_floor_id = _sync_ha_area_floor_assignment(hass, loc_mgr, updated)

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/update")

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location": {
                    "id": updated.id,
                    "name": updated.name,
                    "parent_id": updated.parent_id,
                    "is_explicit_root": updated.is_explicit_root,
                    "ha_area_id": updated.ha_area_id,
                    "entity_ids": updated.entity_ids,
                    "modules": updated.modules,
                },
                "ha_floor_id": synced_floor_id,
            },
        )
    except (ValueError, KeyError) as err:
        connection.send_error(msg["id"], "update_failed", str(err))


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
    location = loc_mgr.get_location(location_id)
    if location is None:
        connection.send_error(msg["id"], "not_found", f"Location {location_id} not found")
        return

    if bool(getattr(location, "is_explicit_root", False)):
        connection.send_error(
            msg["id"],
            "operation_not_supported",
            "Cannot delete the Home root location.",
        )
        return

    ha_area_id = _location_ha_area_id(location)
    floor_id: str | None = None
    if ha_area_id is None:
        meta = _location_meta(location)
        floor_meta_id = meta.get("ha_floor_id")
        if floor_meta_id:
            floor_id = str(floor_meta_id)
        elif location_id.startswith("floor_"):
            floor_id = location_id.removeprefix("floor_")

    parent_id = getattr(location, "parent_id", None)
    children = _siblings_of(loc_mgr, location_id)
    child_ids = [str(getattr(child, "id", "")) for child in children if getattr(child, "id", None)]

    # Validate reparent constraints before mutating anything.
    for child in children:
        child_id = str(getattr(child, "id", ""))
        child_type = _location_type(child)
        is_parent_valid, parent_error = _validate_parent_for_type(
            loc_mgr,
            child_type,
            parent_id,
        )
        if not is_parent_valid:
            connection.send_error(
                msg["id"],
                "invalid_parent",
                (
                    f"Cannot delete '{getattr(location, 'name', location_id)}': "
                    f"child '{getattr(child, 'name', child_id)}' cannot move to parent '{parent_id}'. "
                    f"{parent_error or ''}".strip()
                ),
            )
            return

    # Track impacted subtree locations so HA-backed descendants can recompute floor linkage.
    impacted_ids: set[str] = set()
    for child_id in child_ids:
        impacted_ids.update(_subtree_location_ids(loc_mgr, child_id))

    reparented_ids: list[str] = []
    try:
        for child_id in child_ids:
            updated_child = loc_mgr.update_location(
                child_id,
                parent_id=parent_id if parent_id is not None else "",
            )
            reparented_ids.append(updated_child.id)

        # For HA-backed wrappers, delete from HA registry first.
        if ha_area_id is not None:
            area_registry = ar.async_get(hass)
            if area_registry.async_get_area(ha_area_id) is not None:
                area_registry.async_delete(ha_area_id)
        elif floor_id is not None and fr is not None:
            floor_registry = fr.async_get(hass)
            get_floor = getattr(floor_registry, "async_get_floor", None)
            if callable(get_floor):
                if get_floor(floor_id) is not None:
                    floor_registry.async_delete(floor_id)

        # Sync listeners may already remove HA-backed wrappers. Delete directly if still present.
        deleted_ids = (
            loc_mgr.delete_location(location_id)
            if loc_mgr.get_location(location_id) is not None
            else [location_id]
        )

        synced_floor_updates = 0
        for impacted_id in impacted_ids:
            impacted = loc_mgr.get_location(impacted_id)
            if impacted is None:
                continue
            if _location_ha_area_id(impacted):
                _sync_ha_area_floor_assignment(hass, loc_mgr, impacted)
                synced_floor_updates += 1

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/delete")

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location_id": location_id,
                "deleted_ids": deleted_ids,
                "reparented_ids": reparented_ids,
                "ha_floor_sync_count": synced_floor_updates,
            },
        )
    except (ValueError, KeyError) as err:
        connection.send_error(msg["id"], "delete_failed", str(err))


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
    """Handle locations/reorder command.

    Reorder/re-parent in topology hierarchy is allowed as an overlay model.
    For HA-backed areas, this also synchronizes HA `area.floor_id` from
    nearest floor ancestor (or clears it at root/no-floor lineage).
    """
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]

    location_before = loc_mgr.get_location(msg["location_id"])
    if location_before is None:
        connection.send_error(msg["id"], "not_found", f"Location {msg['location_id']} not found")
        return

    requested_parent_id = msg["new_parent_id"]
    if requested_parent_id is not None and loc_mgr.get_location(requested_parent_id) is None:
        connection.send_error(
            msg["id"],
            "parent_not_found",
            f"Parent location '{requested_parent_id}' not found",
        )
        return

    location_type = _location_type(location_before)
    is_parent_valid, parent_error = _validate_parent_for_type(
        loc_mgr, location_type, requested_parent_id
    )
    if not is_parent_valid:
        connection.send_error(msg["id"], "invalid_parent", parent_error or "Invalid parent for type")
        return

    old_parent_id = location_before.parent_id if location_before else None
    old_order = location_before.order if location_before else 0

    has_direct_children = len(_siblings_of(loc_mgr, location_before.id)) > 0
    if has_direct_children and requested_parent_id != old_parent_id:
        connection.send_error(
            msg["id"],
            "invalid_parent",
            "Locations with children cannot be moved under a different parent. Reorder within the current parent instead.",
        )
        return

    reordered = False

    try:
        location = loc_mgr.reorder_location(
            msg["location_id"],
            requested_parent_id,
            msg["new_index"],
        )
        reordered = True
        _mark_sibling_group_manual_order(loc_mgr, old_parent_id)
        _mark_sibling_group_manual_order(loc_mgr, location.parent_id)
        synced_floor_id = _sync_ha_area_floor_assignment(hass, loc_mgr, location)
        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/reorder")
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "location_id": location.id,
                "parent_id": location.parent_id,
                "order": location.order,
                "ha_floor_id": synced_floor_id,
            },
        )
    except (ValueError, KeyError) as e:
        if reordered and location_before is not None:
            try:
                loc_mgr.reorder_location(location_before.id, old_parent_id, old_order)
            except Exception:  # pragma: no cover - rollback best effort
                _LOGGER.warning("Failed rollback after reorder error for %s", msg["location_id"])
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

        coordinator = kernel.get("coordinator")
        if coordinator and hasattr(coordinator, "schedule_next_timeout"):
            coordinator.schedule_next_timeout()

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/set_module_config")

        connection.send_result(msg["id"], {"success": True})
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "config_failed", str(e))


# =============================================================================
# Managed Action Rules Commands
# =============================================================================


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ACTION_RULES_LIST,
        vol.Required("location_id"): str,
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def handle_action_rules_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle actions/rules/list command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    managed_action_rules = kernel.get("managed_action_rules")
    if managed_action_rules is None:
        connection.send_error(msg["id"], "module_not_loaded", "Managed action rules runtime not loaded")
        return

    try:
        rules = await managed_action_rules.async_list_rules(msg["location_id"])
    except ValueError as err:
        _LOGGER.warning(
            "Managed action rule listing rejected for location '%s': %s",
            msg.get("location_id"),
            err,
        )
        connection.send_error(msg["id"], "list_failed", str(err))
        return
    except Exception as err:  # pragma: no cover - defensive runtime boundary
        _LOGGER.error("Failed to list managed rules: %s", err, exc_info=True)
        connection.send_error(msg["id"], "list_failed", "Failed to list managed action rules")
        return

    connection.send_result(msg["id"], {"rules": rules})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ACTION_RULES_CREATE,
        vol.Required("location_id"): str,
        vol.Required("name"): str,
        vol.Required("trigger_type"): vol.In(("occupied", "vacant")),
        vol.Required("action_entity_id"): str,
        vol.Required("action_service"): str,
        vol.Optional("require_dark", default=False): bool,
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def handle_action_rules_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle actions/rules/create command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    managed_action_rules = kernel.get("managed_action_rules")
    if managed_action_rules is None:
        connection.send_error(msg["id"], "module_not_loaded", "Managed action rules runtime not loaded")
        return

    loc_mgr = kernel["location_manager"]
    location = loc_mgr.get_location(msg["location_id"])
    if location is None:
        connection.send_error(msg["id"], "location_not_found", f"Location {msg['location_id']} not found")
        return

    try:
        rule = await managed_action_rules.async_create_rule(
            location=location,
            name=msg["name"],
            trigger_type=msg["trigger_type"],
            action_entity_id=msg["action_entity_id"],
            action_service=msg["action_service"],
            require_dark=bool(msg.get("require_dark", False)),
        )
    except ValueError as err:
        _LOGGER.warning(
            "Managed action rule create rejected for location '%s' target '%s': %s",
            msg.get("location_id"),
            msg.get("action_entity_id"),
            err,
        )
        connection.send_error(msg["id"], "create_failed", str(err))
        return
    except Exception as err:  # pragma: no cover - defensive runtime boundary
        _LOGGER.error("Failed to create managed rule: %s", err, exc_info=True)
        msg_text = str(err) if str(err) else "Failed to create managed action rule"
        connection.send_error(msg["id"], "create_failed", msg_text)
        return

    schedule_persist = kernel.get("schedule_persist")
    if callable(schedule_persist):
        schedule_persist("actions/rules/create")

    connection.send_result(msg["id"], {"rule": rule})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ACTION_RULES_DELETE,
        vol.Optional("automation_id"): str,
        vol.Optional("entity_id"): str,
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def handle_action_rules_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle actions/rules/delete command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    managed_action_rules = kernel.get("managed_action_rules")
    if managed_action_rules is None:
        connection.send_error(msg["id"], "module_not_loaded", "Managed action rules runtime not loaded")
        return

    automation_id = str(msg.get("automation_id", "")).strip()
    entity_id = str(msg.get("entity_id", "")).strip() or None
    if not automation_id and not entity_id:
        connection.send_error(
            msg["id"],
            "invalid_payload",
            "automation_id or entity_id is required",
        )
        return

    try:
        await managed_action_rules.async_delete_rule(
            automation_id=automation_id,
            entity_id=entity_id,
        )
    except ValueError as err:
        _LOGGER.warning(
            "Managed action rule delete rejected for automation_id='%s' entity_id='%s': %s",
            automation_id,
            entity_id,
            err,
        )
        connection.send_error(msg["id"], "delete_failed", str(err))
        return
    except Exception as err:  # pragma: no cover - defensive runtime boundary
        _LOGGER.error("Failed to delete managed rule: %s", err, exc_info=True)
        connection.send_error(msg["id"], "delete_failed", "Failed to delete managed action rule")
        return

    schedule_persist = kernel.get("schedule_persist")
    if callable(schedule_persist):
        schedule_persist("actions/rules/delete")

    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ACTION_RULES_SET_ENABLED,
        vol.Required("entity_id"): str,
        vol.Required("enabled"): bool,
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def handle_action_rules_set_enabled(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle actions/rules/set_enabled command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    managed_action_rules = kernel.get("managed_action_rules")
    if managed_action_rules is None:
        connection.send_error(msg["id"], "module_not_loaded", "Managed action rules runtime not loaded")
        return

    try:
        await managed_action_rules.async_set_rule_enabled(
            entity_id=msg["entity_id"],
            enabled=msg["enabled"],
        )
    except ValueError as err:
        _LOGGER.warning(
            "Managed action rule set_enabled rejected for entity '%s' enabled=%s: %s",
            msg.get("entity_id"),
            msg.get("enabled"),
            err,
        )
        connection.send_error(msg["id"], "set_enabled_failed", str(err))
        return
    except Exception as err:  # pragma: no cover - defensive runtime boundary
        _LOGGER.error("Failed to set managed rule state: %s", err, exc_info=True)
        connection.send_error(msg["id"], "set_enabled_failed", "Failed to update managed action rule")
        return

    connection.send_result(msg["id"], {"success": True})


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
                "ha_area_id": location.ha_area_id or meta.get("ha_area_id"),
                "ha_floor_id": meta.get("ha_floor_id"),
                "sync_source": meta.get("sync_source"),
                "sync_enabled": meta.get("sync_enabled", True),
                "last_synced": meta.get("last_synced"),
                "type": _normalize_location_type(meta.get("type")),
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
    """Handle sync/enable command - enable/disable sync for topology-only location.

    Payload:
      - location_id: str - Topology-only location to configure
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

    if _is_ha_backed_location(location):
        connection.send_error(
            msg["id"],
            "operation_not_supported",
            (
                "Sync cannot be disabled for HA-backed floor/area wrappers. "
                "Home Assistant is authoritative for these locations."
            ),
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
