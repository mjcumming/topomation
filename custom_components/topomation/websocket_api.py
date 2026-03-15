"""WebSocket API for Topomation."""

from __future__ import annotations

import logging
import re
from typing import Any
from weakref import WeakKeyDictionary

import voluptuous as vol
from home_topology import Event
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er

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
    WS_TYPE_ADJACENCY_CREATE,
    WS_TYPE_ADJACENCY_DELETE,
    WS_TYPE_ADJACENCY_LIST,
    WS_TYPE_ADJACENCY_UPDATE,
    WS_TYPE_AMBIENT_AUTO_DISCOVER,
    WS_TYPE_AMBIENT_GET_READING,
    WS_TYPE_AMBIENT_SET_SENSOR,
    WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
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
_META_ROLE_KEY = "role"
_META_SHADOW_AREA_ID_KEY = "shadow_area_id"
_META_SHADOW_FOR_LOCATION_ID_KEY = "shadow_for_location_id"
_MANAGED_SHADOW_ROLE = "managed_shadow"
_SHADOW_HOST_TYPES = frozenset({"floor", "building", "grounds"})
_OCCUPANCY_LINKED_LOCATIONS_KEY = "linked_locations"
_OCCUPANCY_SYNC_LOCATIONS_KEY = "sync_locations"
_DUSK_DAWN_TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
_ACTION_TRIGGER_TYPES = frozenset({"on_occupied", "on_vacant", "on_dark", "on_bright"})
_ACTION_LEGACY_TRIGGER_MAP: dict[str, str] = {
    "occupied": "on_occupied",
    "vacant": "on_vacant",
}
_ACTION_AMBIENT_CONDITIONS = frozenset({"any", "dark", "bright"})


def _normalize_action_trigger_type(raw_value: Any) -> str:
    """Normalize legacy/new action trigger aliases to canonical values."""
    normalized = str(raw_value or "").strip().lower()
    normalized = _ACTION_LEGACY_TRIGGER_MAP.get(normalized, normalized)
    if normalized in _ACTION_TRIGGER_TYPES:
        return normalized
    raise ValueError(f"Invalid action trigger_type '{raw_value}'")


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
    raw_domain_data: Any = hass.data.get(DOMAIN, {})
    if not isinstance(raw_domain_data, dict) or not raw_domain_data:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return None

    # DOMAIN data may include non-kernel integration metadata (for example
    # managed-actions API tokens). Only route against dict-based runtime kernels.
    domain_data: dict[str, dict[str, Any]] = {
        str(entry_id): kernel
        for entry_id, kernel in raw_domain_data.items()
        if isinstance(kernel, dict)
    }
    if not domain_data:
        connection.send_error(msg["id"], "not_loaded", "Integration not loaded")
        return None

    requested_entry_id = msg.get("entry_id")
    if requested_entry_id is not None:
        kernel = domain_data.get(str(requested_entry_id))
        if kernel is None:
            connection.send_error(
                msg["id"],
                "entry_not_found",
                f"Config entry '{requested_entry_id}' not found",
            )
            return None
        _remember_connection_entry_hint(connection, str(requested_entry_id))
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


def _linked_room_parent_floor_id(location_manager: object, location: object) -> str | None:
    """Return parent floor id when location is an area directly under a floor."""
    if _location_type(location) != "area":
        return None

    parent_id = getattr(location, "parent_id", None)
    if not isinstance(parent_id, str) or not parent_id:
        return None

    get_location = getattr(location_manager, "get_location", None)
    if not callable(get_location):
        return None

    try:
        parent = get_location(parent_id)
    except Exception:  # pragma: no cover - defensive lookup
        return None
    if parent is None:
        return None
    if _location_type(parent) != "floor":
        return None
    return parent_id


def _allowed_linked_room_neighbors(location_manager: object, location: object) -> set[str]:
    """Return valid linked-room neighbor ids for one location."""
    if _is_managed_shadow_area(location):
        return set()

    floor_parent_id = _linked_room_parent_floor_id(location_manager, location)
    if not floor_parent_id:
        return set()

    all_locations = getattr(location_manager, "all_locations", None)
    if not callable(all_locations):
        return set()

    location_id = getattr(location, "id", None)
    allowed: set[str] = set()
    for candidate in all_locations():
        candidate_id = getattr(candidate, "id", None)
        if not isinstance(candidate_id, str) or not candidate_id:
            continue
        if candidate_id == location_id:
            continue
        if getattr(candidate, "parent_id", None) != floor_parent_id:
            continue
        if _location_type(candidate) != "area":
            continue
        if _is_managed_shadow_area(candidate):
            continue
        allowed.add(candidate_id)
    return allowed


def _normalize_neighbor_location_ids(
    *,
    location_manager: object,
    location: object,
    config: dict[str, Any],
    config_key: str,
    noun: str,
    empty_scope_message: str,
) -> tuple[list[str] | None, str | None]:
    """Validate and normalize room-neighbor config lists against scope policy."""
    raw_values = config.get(config_key)
    if raw_values is None:
        return None, None
    if not isinstance(raw_values, list):
        return None, f"{config_key} must be a list of location IDs."

    normalized: list[str] = []
    seen: set[str] = set()
    for item in raw_values:
        if not isinstance(item, str):
            return None, f"{config_key} must contain string location IDs."
        location_id = item.strip()
        if not location_id or location_id in seen:
            continue
        seen.add(location_id)
        normalized.append(location_id)

    allowed = _allowed_linked_room_neighbors(location_manager, location)
    if not allowed:
        if normalized:
            return None, empty_scope_message
        return [], None

    invalid = [location_id for location_id in normalized if location_id not in allowed]
    if invalid:
        preview = ", ".join(invalid[:3])
        return (
            None,
            f"{noun} must be sibling area locations under the same floor. "
            f"Invalid: {preview}",
        )

    return normalized, None


def _normalize_linked_locations_config(
    location_manager: object,
    location: object,
    config: dict[str, Any],
) -> tuple[list[str] | None, str | None]:
    """Validate and normalize occupancy linked_locations against product policy."""
    return _normalize_neighbor_location_ids(
        location_manager=location_manager,
        location=location,
        config=config,
        config_key=_OCCUPANCY_LINKED_LOCATIONS_KEY,
        noun="Linked rooms",
        empty_scope_message="Linked rooms are only supported for area locations directly under a floor.",
    )


def _normalize_sync_locations_config(
    location_manager: object,
    location: object,
    config: dict[str, Any],
) -> tuple[list[str] | None, str | None]:
    """Validate and normalize occupancy sync_locations against product policy."""
    raw_values = config.get(_OCCUPANCY_SYNC_LOCATIONS_KEY)
    if raw_values is None:
        return None, None
    if not isinstance(raw_values, list):
        return None, f"{_OCCUPANCY_SYNC_LOCATIONS_KEY} must be a list of location IDs."

    normalized: list[str] = []
    seen: set[str] = set()
    for item in raw_values:
        if not isinstance(item, str):
            return None, f"{_OCCUPANCY_SYNC_LOCATIONS_KEY} must contain string location IDs."
        location_id = item.strip()
        if not location_id or location_id in seen:
            continue
        seen.add(location_id)
        normalized.append(location_id)

    scope = _sync_location_scope(location_manager, location)
    allowed = _allowed_sync_location_neighbors(location_manager, location, scope)
    if not allowed:
        if normalized:
            if scope is None:
                return (
                    None,
                    "Sync locations are available for area locations whose parent is an area, "
                    "floor, or building, and for floor locations under the same building.",
                )
            candidate_type, _, parent_type = scope
            return (
                None,
                f"Sync locations must be sibling {candidate_type} locations under the same {parent_type}.",
            )
        return [], None

    invalid = [location_id for location_id in normalized if location_id not in allowed]
    if invalid:
        preview = ", ".join(invalid[:3])
        if scope is None:
            return None, f"Invalid sync location(s): {preview}"
        candidate_type, _, parent_type = scope
        return (
            None,
            f"Sync locations must be sibling {candidate_type} locations under the same {parent_type}. "
            f"Invalid: {preview}",
        )

    return normalized, None


def _sync_locations_from_config(config: object) -> list[str]:
    """Return normalized sync peer IDs from a stored occupancy config."""
    if not isinstance(config, dict):
        return []

    raw_values = config.get(_OCCUPANCY_SYNC_LOCATIONS_KEY)
    if not isinstance(raw_values, list):
        return []

    normalized: list[str] = []
    seen: set[str] = set()
    for item in raw_values:
        if not isinstance(item, str):
            continue
        location_id = item.strip()
        if not location_id or location_id in seen:
            continue
        seen.add(location_id)
        normalized.append(location_id)
    return normalized


def _effective_sync_locations_for_target(
    location_manager: object,
    target_location_id: str,
    config: object,
) -> list[str]:
    """Return sync peers filtered by current topology policy."""
    get_location = getattr(location_manager, "get_location", None)
    if not callable(get_location):
        return []
    try:
        location = get_location(target_location_id)
    except Exception:  # pragma: no cover - defensive lookup
        return []
    if location is None:
        return []

    synced = _sync_locations_from_config(config)
    if not synced:
        return []

    scope = _sync_location_scope(location_manager, location)
    allowed = _allowed_sync_location_neighbors(location_manager, location, scope)
    if not allowed:
        return []

    return [location_id for location_id in synced if location_id in allowed]


def _sync_peer_location_ids(location_manager: object, source_location_id: str) -> list[str]:
    """Return effective sync peers for one location (forward + reverse declarations)."""
    get_module_config = getattr(location_manager, "get_module_config", None)
    all_locations = getattr(location_manager, "all_locations", None)
    if not callable(get_module_config) or not callable(all_locations):
        return []

    peers: set[str] = set()
    source_config = get_module_config(source_location_id, "occupancy")
    peers.update(
        _effective_sync_locations_for_target(location_manager, source_location_id, source_config)
    )

    for location in all_locations():
        candidate_location_id = getattr(location, "id", None)
        if not isinstance(candidate_location_id, str) or not candidate_location_id:
            continue
        if candidate_location_id == source_location_id:
            continue
        candidate_config = get_module_config(candidate_location_id, "occupancy")
        candidate_synced = _effective_sync_locations_for_target(
            location_manager,
            candidate_location_id,
            candidate_config,
        )
        if source_location_id in candidate_synced:
            peers.add(candidate_location_id)

    return sorted(peers)


def _reconcile_sync_group_now(kernel: dict[str, Any], changed_location_ids: set[str]) -> None:
    """Re-publish current occupancy state for a sync group after config edits.

    Runtime sync mirroring is driven by ``occupancy.changed`` events. When users
    change sync peer membership while one peer is already occupied, no fresh
    occupancy event is emitted, so newly synced peers would otherwise remain out
    of alignment until the next physical change. Re-publishing the current state
    through the existing event path fixes that gap without introducing a second
    sync implementation.
    """
    if not changed_location_ids:
        return

    event_bus = kernel.get("event_bus")
    occupancy_module = kernel.get("modules", {}).get("occupancy")
    if event_bus is None or occupancy_module is None:
        return

    get_state = getattr(occupancy_module, "get_location_state", None)
    publish = getattr(event_bus, "publish", None)
    if not callable(get_state) or not callable(publish):
        return

    location_manager = kernel.get("location_manager")
    if location_manager is None:
        return

    to_reconcile: set[str] = set(changed_location_ids)
    for location_id in list(changed_location_ids):
        to_reconcile.update(_sync_peer_location_ids(location_manager, location_id))

    for location_id in sorted(to_reconcile):
        try:
            payload = get_state(location_id)
        except Exception:  # pragma: no cover - defensive runtime guard
            _LOGGER.debug(
                "Skipping sync reconciliation state read for %s after getter failure",
                location_id,
                exc_info=True,
            )
            continue
        if not isinstance(payload, dict):
            continue
        occupied = payload.get("occupied")
        if not isinstance(occupied, bool):
            continue
        publish(
            Event(
                type="occupancy.changed",
                source="occupancy_sync_config",
                location_id=location_id,
                payload=payload,
            )
        )


def _sync_location_scope(location_manager: object, location: object) -> tuple[str, str, str] | None:
    """Return sync candidate scope as (candidate_type, parent_id, parent_type)."""
    if _is_managed_shadow_area(location):
        return None

    location_type = _location_type(location)
    parent_id = getattr(location, "parent_id", None)
    if not isinstance(parent_id, str) or not parent_id:
        return None

    get_location = getattr(location_manager, "get_location", None)
    if not callable(get_location):
        return None

    try:
        parent = get_location(parent_id)
    except Exception:  # pragma: no cover - defensive lookup
        return None
    if parent is None:
        return None

    parent_type = _location_type(parent)
    if location_type == "area" and parent_type in {"area", "floor", "building"}:
        return ("area", parent_id, parent_type)
    if location_type == "floor" and parent_type == "building":
        return ("floor", parent_id, parent_type)
    return None


def _allowed_sync_location_neighbors(
    location_manager: object,
    location: object,
    scope: tuple[str, str, str] | None,
) -> set[str]:
    """Return allowed sibling sync targets for one location."""
    if scope is None:
        return set()
    candidate_type, parent_id, _ = scope

    all_locations = getattr(location_manager, "all_locations", None)
    if not callable(all_locations):
        return set()

    source_location_id = getattr(location, "id", None)
    allowed: set[str] = set()
    for candidate in all_locations():
        candidate_id = getattr(candidate, "id", None)
        if not isinstance(candidate_id, str) or not candidate_id:
            continue
        if candidate_id == source_location_id:
            continue
        if getattr(candidate, "parent_id", None) != parent_id:
            continue
        if _location_type(candidate) != candidate_type:
            continue
        if candidate_type == "area" and _is_managed_shadow_area(candidate):
            continue
        allowed.add(candidate_id)

    return allowed


def _normalize_action_brightness_pct(raw_value: Any, default_value: int) -> int:
    """Normalize brightness to an integer range of 1..100."""
    try:
        value = round(float(raw_value))
    except (TypeError, ValueError):
        value = default_value
    return max(1, min(100, value))


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


def _location_id(location: object) -> str:
    """Return canonical string location id for location-like objects."""
    return str(getattr(location, "id", "") or "")


def _is_shadow_host_location(location: object) -> bool:
    """Return True when location assignment must route through managed shadow area."""
    if bool(getattr(location, "is_explicit_root", False)):
        return False
    return _location_type(location) in _SHADOW_HOST_TYPES


def _is_managed_shadow_area(location: object) -> bool:
    """Return True when location is an integration-managed shadow area."""
    if _location_type(location) != "area":
        return False
    meta = _location_meta(location)
    return str(meta.get(_META_ROLE_KEY, "")).strip().lower() == _MANAGED_SHADOW_ROLE


def _validate_managed_shadow_area_candidate(
    location_manager: object,
    host_location: object,
    shadow_location: object,
) -> tuple[bool, str | None]:
    """Validate whether an area location may act as managed shadow for a host."""
    host_id = _location_id(host_location)
    host_type = _location_type(host_location)
    if not host_id:
        return False, "Host location is missing an id."
    if not _is_shadow_host_location(host_location):
        return False, f"Location '{host_id}' ({host_type}) does not support managed shadow mapping."

    shadow_id = _location_id(shadow_location)
    if not shadow_id:
        return False, "Shadow location is missing an id."
    if _location_type(shadow_location) != "area":
        return False, "Managed shadow must reference an area location."
    if not _location_ha_area_id(shadow_location):
        return False, "Managed shadow must reference an HA-backed area location."
    if getattr(shadow_location, "parent_id", None) != host_id:
        return False, "Managed shadow area must be parented directly under the host location."

    if location_manager.get_location(shadow_id) is None:
        return False, f"Managed shadow area '{shadow_id}' not found."

    return True, None


def _reconcile_managed_shadow_areas(kernel: dict[str, Any]) -> None:
    """Invoke SyncManager managed-shadow reconciliation when available."""
    sync_manager = kernel.get("sync_manager")
    if sync_manager is None:
        return
    reconcile = getattr(sync_manager, "reconcile_managed_shadow_areas", None)
    if callable(reconcile):
        reconcile()


def _normalize_meta_config(
    location_manager: object,
    location: object,
    config: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None]:
    """Validate and normalize _meta updates.

    Managed shadow metadata is integration-owned and cannot be edited via WS.
    """
    if not isinstance(config, dict):
        return None, "_meta config must be an object."
    _ = location_manager

    existing = _location_meta(location)
    existing_role = str(existing.get(_META_ROLE_KEY, "")).strip().lower()
    if existing_role == _MANAGED_SHADOW_ROLE:
        return None, "Managed shadow area metadata is integration-owned and cannot be edited manually."

    if (
        _META_SHADOW_AREA_ID_KEY in config
        or _META_SHADOW_FOR_LOCATION_ID_KEY in config
    ):
        return None, "Managed shadow metadata is integration-owned and cannot be set manually."

    requested_role = config.get(_META_ROLE_KEY)
    if isinstance(requested_role, str) and requested_role.strip().lower() == _MANAGED_SHADOW_ROLE:
        return None, "Managed shadow metadata is integration-owned and cannot be set manually."

    merged = {**existing, **config}
    merged_type = _normalize_location_type(merged.get("type") or _location_type(location))
    merged["type"] = merged_type

    if merged_type not in _SHADOW_HOST_TYPES:
        merged.pop(_META_SHADOW_AREA_ID_KEY, None)
    if merged_type != "area":
        merged.pop(_META_SHADOW_FOR_LOCATION_ID_KEY, None)
        normalized_role = str(merged.get(_META_ROLE_KEY, "")).strip().lower()
        if normalized_role == _MANAGED_SHADOW_ROLE:
            merged.pop(_META_ROLE_KEY, None)

    return merged, None


def _resolve_shadow_assignment_target(
    location_manager: object,
    host_location: object,
) -> tuple[object | None, str | None]:
    """Resolve aggregate-node assignment targets to managed shadow areas."""
    host_id = _location_id(host_location)
    host_type = _location_type(host_location)
    host_meta = _location_meta(host_location)
    raw_shadow_area_id = host_meta.get(_META_SHADOW_AREA_ID_KEY)
    shadow_area_id = str(raw_shadow_area_id).strip() if isinstance(raw_shadow_area_id, str) else ""
    if not shadow_area_id:
        return None, (
            f"{host_type.title()} '{host_id}' has no managed shadow area configured. "
            "Run sync/reconciliation to create it."
        )

    shadow_location = location_manager.get_location(shadow_area_id)
    if shadow_location is None:
        return None, (
            f"Configured managed shadow area '{shadow_area_id}' for '{host_id}' was not found. "
            "Run sync/reconciliation to recreate it."
        )

    valid_shadow, shadow_error = _validate_managed_shadow_area_candidate(
        location_manager,
        host_location,
        shadow_location,
    )
    if not valid_shadow:
        return None, shadow_error

    shadow_meta = _location_meta(shadow_location)
    shadow_role = str(shadow_meta.get(_META_ROLE_KEY, "")).strip().lower()
    shadow_for_location_id = str(shadow_meta.get(_META_SHADOW_FOR_LOCATION_ID_KEY, "")).strip()
    if shadow_role != _MANAGED_SHADOW_ROLE or shadow_for_location_id != host_id:
        return None, (
            f"Configured managed shadow area '{shadow_area_id}' metadata is inconsistent for '{host_id}'. "
            f"Ensure role is '{_MANAGED_SHADOW_ROLE}' and "
            f"{_META_SHADOW_FOR_LOCATION_ID_KEY} matches."
        )

    return shadow_location, None


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


def _supports_adjacency_api(location_manager: object) -> bool:
    """Return True when adjacency CRUD APIs are available on manager."""
    manager_type = location_manager.__class__
    required = (
        "all_adjacency_edges",
        "create_adjacency_edge",
        "update_adjacency_edge",
        "delete_adjacency_edge",
    )
    return all(callable(getattr(manager_type, name, None)) for name in required)


def _serialize_adjacency_edge(edge: object) -> dict[str, Any] | None:
    """Convert an edge object to a response-safe dict."""
    to_dict = getattr(edge, "to_dict", None)
    if callable(to_dict):
        payload = to_dict()
        if isinstance(payload, dict):
            return dict(payload)
        return None

    if isinstance(edge, dict):
        return dict(edge)

    edge_id = getattr(edge, "edge_id", None)
    from_location_id = getattr(edge, "from_location_id", None)
    to_location_id = getattr(edge, "to_location_id", None)
    if (
        not isinstance(edge_id, str)
        or not edge_id
        or not isinstance(from_location_id, str)
        or not from_location_id
        or not isinstance(to_location_id, str)
        or not to_location_id
    ):
        return None

    crossing_sources = getattr(edge, "crossing_sources", [])
    if not isinstance(crossing_sources, list):
        crossing_sources = []

    return {
        "edge_id": edge_id,
        "from_location_id": from_location_id,
        "to_location_id": to_location_id,
        "directionality": str(getattr(edge, "directionality", "bidirectional")),
        "boundary_type": str(getattr(edge, "boundary_type", "virtual")),
        "crossing_sources": [str(source) for source in crossing_sources if isinstance(source, str)],
        "handoff_window_sec": int(getattr(edge, "handoff_window_sec", 12)),
        "priority": int(getattr(edge, "priority", 50)),
    }


def _list_adjacency_edges(location_manager: object) -> list[dict[str, Any]]:
    """Return serialized adjacency edges when supported."""
    if not _supports_adjacency_api(location_manager):
        return []

    list_edges = getattr(location_manager, "all_adjacency_edges", None)
    if not callable(list_edges):
        return []

    raw_edges = list_edges()
    if not isinstance(raw_edges, list):
        return []

    edges: list[dict[str, Any]] = []
    for edge in raw_edges:
        payload = _serialize_adjacency_edge(edge)
        if payload is None:
            continue
        edges.append(payload)
    return edges


def _next_edge_id(location_manager: object, from_location_id: str, to_location_id: str) -> str:
    """Build a deterministic unique edge id for adjacency/create when omitted."""
    stem = f"edge_{_slugify_location_id(from_location_id)}_{_slugify_location_id(to_location_id)}"
    candidate = stem
    suffix = 2

    get_edge = getattr(location_manager, "get_adjacency_edge", None)
    if not callable(get_edge):
        return stem

    while get_edge(candidate) is not None:
        candidate = f"{stem}_{suffix}"
        suffix += 1
    return candidate




def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    # Location management
    websocket_api.async_register_command(hass, handle_locations_list)
    websocket_api.async_register_command(hass, handle_locations_create)
    websocket_api.async_register_command(hass, handle_locations_update)
    websocket_api.async_register_command(hass, handle_locations_delete)
    websocket_api.async_register_command(hass, handle_locations_reorder)
    websocket_api.async_register_command(hass, handle_locations_set_module_config)
    websocket_api.async_register_command(hass, handle_locations_assign_entity)
    websocket_api.async_register_command(hass, handle_adjacency_list)
    websocket_api.async_register_command(hass, handle_adjacency_create)
    websocket_api.async_register_command(hass, handle_adjacency_update)
    websocket_api.async_register_command(hass, handle_adjacency_delete)

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

    connection.send_result(
        msg["id"],
        {
            "locations": locations,
            "adjacency_edges": _list_adjacency_edges(loc_mgr),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ADJACENCY_LIST,
        vol.Optional("location_id"): str,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_adjacency_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle adjacency/list command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    if not _supports_adjacency_api(loc_mgr):
        connection.send_result(msg["id"], {"adjacency_edges": []})
        return

    location_id = msg.get("location_id")
    edges = _list_adjacency_edges(loc_mgr)
    if isinstance(location_id, str) and location_id:
        edges = [
            edge
            for edge in edges
            if edge.get("from_location_id") == location_id or edge.get("to_location_id") == location_id
        ]

    connection.send_result(msg["id"], {"adjacency_edges": edges})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ADJACENCY_CREATE,
        vol.Required("from_location_id"): str,
        vol.Required("to_location_id"): str,
        vol.Optional("edge_id"): str,
        vol.Optional("directionality"): str,
        vol.Optional("boundary_type"): str,
        vol.Optional("crossing_sources"): [str],
        vol.Optional("handoff_window_sec"): int,
        vol.Optional("priority"): int,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_adjacency_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle adjacency/create command."""
    kernel_hint = dict(msg)
    kernel_hint["location_id"] = msg.get("from_location_id")
    kernel = _get_kernel(hass, connection, kernel_hint)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    if not _supports_adjacency_api(loc_mgr):
        connection.send_error(
            msg["id"],
            "not_supported",
            "Adjacency APIs are unavailable in the loaded home-topology runtime",
        )
        return

    from_location_id = msg.get("from_location_id")
    to_location_id = msg.get("to_location_id")
    if not isinstance(from_location_id, str) or not from_location_id:
        connection.send_error(msg["id"], "invalid_from_location", "from_location_id is required")
        return
    if not isinstance(to_location_id, str) or not to_location_id:
        connection.send_error(msg["id"], "invalid_to_location", "to_location_id is required")
        return

    edge_id_raw = msg.get("edge_id")
    edge_id = (
        edge_id_raw
        if isinstance(edge_id_raw, str) and edge_id_raw.strip()
        else _next_edge_id(loc_mgr, from_location_id, to_location_id)
    )

    create_edge = getattr(loc_mgr, "create_adjacency_edge")
    try:
        edge = create_edge(
            edge_id=edge_id,
            from_location_id=from_location_id,
            to_location_id=to_location_id,
            directionality=str(msg.get("directionality", "bidirectional")),
            boundary_type=str(msg.get("boundary_type", "virtual")),
            crossing_sources=(
                list(msg.get("crossing_sources", []))
                if isinstance(msg.get("crossing_sources"), list)
                else None
            ),
            handoff_window_sec=int(msg.get("handoff_window_sec", 12)),
            priority=int(msg.get("priority", 50)),
        )
        payload = _serialize_adjacency_edge(edge)
        if payload is None:
            connection.send_error(msg["id"], "create_failed", "Could not serialize created edge")
            return

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("adjacency/create")

        connection.send_result(msg["id"], {"success": True, "adjacency_edge": payload})
    except (TypeError, ValueError) as err:
        connection.send_error(msg["id"], "create_failed", str(err))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ADJACENCY_UPDATE,
        vol.Required("edge_id"): str,
        vol.Optional("from_location_id"): str,
        vol.Optional("to_location_id"): str,
        vol.Optional("directionality"): str,
        vol.Optional("boundary_type"): str,
        vol.Optional("crossing_sources"): [str],
        vol.Optional("handoff_window_sec"): int,
        vol.Optional("priority"): int,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_adjacency_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle adjacency/update command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    if not _supports_adjacency_api(loc_mgr):
        connection.send_error(
            msg["id"],
            "not_supported",
            "Adjacency APIs are unavailable in the loaded home-topology runtime",
        )
        return

    update_edge = getattr(loc_mgr, "update_adjacency_edge")
    edge_id = msg["edge_id"]

    update_kwargs: dict[str, Any] = {}
    for field in (
        "from_location_id",
        "to_location_id",
        "directionality",
        "boundary_type",
        "handoff_window_sec",
        "priority",
    ):
        if field in msg:
            update_kwargs[field] = msg[field]
    if "crossing_sources" in msg:
        update_kwargs["crossing_sources"] = list(msg["crossing_sources"])

    if not update_kwargs:
        get_edge = getattr(loc_mgr, "get_adjacency_edge", None)
        if callable(get_edge):
            existing = get_edge(edge_id)
            payload = _serialize_adjacency_edge(existing)
            if payload is not None:
                connection.send_result(msg["id"], {"success": True, "adjacency_edge": payload})
                return
        connection.send_error(msg["id"], "not_found", f"Adjacency edge '{edge_id}' not found")
        return

    try:
        edge = update_edge(edge_id=edge_id, **update_kwargs)
        payload = _serialize_adjacency_edge(edge)
        if payload is None:
            connection.send_error(msg["id"], "update_failed", "Could not serialize updated edge")
            return

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("adjacency/update")

        connection.send_result(msg["id"], {"success": True, "adjacency_edge": payload})
    except (TypeError, ValueError) as err:
        connection.send_error(msg["id"], "update_failed", str(err))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_ADJACENCY_DELETE,
        vol.Required("edge_id"): str,
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_adjacency_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle adjacency/delete command."""
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    if not _supports_adjacency_api(loc_mgr):
        connection.send_error(
            msg["id"],
            "not_supported",
            "Adjacency APIs are unavailable in the loaded home-topology runtime",
        )
        return

    delete_edge = getattr(loc_mgr, "delete_adjacency_edge")
    edge_id = msg["edge_id"]
    try:
        edge = delete_edge(edge_id)
        payload = _serialize_adjacency_edge(edge)
        if payload is None:
            connection.send_error(msg["id"], "delete_failed", "Could not serialize deleted edge")
            return

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("adjacency/delete")

        connection.send_result(msg["id"], {"success": True, "edge_id": edge_id, "adjacency_edge": payload})
    except ValueError as err:
        connection.send_error(msg["id"], "delete_failed", str(err))


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

    requested_role = str(meta.get(_META_ROLE_KEY, "")).strip().lower()
    if (
        _META_SHADOW_AREA_ID_KEY in meta
        or _META_SHADOW_FOR_LOCATION_ID_KEY in meta
        or requested_role == _MANAGED_SHADOW_ROLE
    ):
        connection.send_error(
            msg["id"],
            "invalid_meta",
            "Managed shadow metadata is integration-owned and cannot be set manually.",
        )
        return

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
        _reconcile_managed_shadow_areas(kernel)

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
    if _is_managed_shadow_area(location):
        connection.send_error(
            msg["id"],
            "operation_not_supported",
            "Managed shadow areas are integration-owned and cannot be edited manually.",
        )
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
        _reconcile_managed_shadow_areas(kernel)

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
    if _is_managed_shadow_area(location):
        connection.send_error(
            msg["id"],
            "operation_not_supported",
            "Managed shadow areas are integration-owned and cannot be deleted manually.",
        )
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
        _reconcile_managed_shadow_areas(kernel)

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
    if _is_managed_shadow_area(location_before):
        connection.send_error(
            msg["id"],
            "operation_not_supported",
            "Managed shadow areas are integration-owned and cannot be reordered manually.",
        )
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
        _reconcile_managed_shadow_areas(kernel)
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

        if module_id == "occupancy":
            normalized_linked, linked_error = _normalize_linked_locations_config(
                loc_mgr,
                location,
                config,
            )
            if linked_error:
                connection.send_error(msg["id"], "invalid_config", linked_error)
                return
            normalized_sync, sync_error = _normalize_sync_locations_config(
                loc_mgr,
                location,
                config,
            )
            if sync_error:
                connection.send_error(msg["id"], "invalid_config", sync_error)
                return
            if normalized_linked is not None or normalized_sync is not None:
                config = dict(config)
            if normalized_linked is not None:
                config["linked_locations"] = normalized_linked
            if normalized_sync is not None:
                config["sync_locations"] = normalized_sync
        elif module_id == "_meta":
            normalized_meta, meta_error = _normalize_meta_config(loc_mgr, location, config)
            if meta_error:
                connection.send_error(msg["id"], "invalid_config", meta_error)
                return
            if normalized_meta is None:
                connection.send_error(msg["id"], "invalid_config", "Invalid _meta config")
                return
            config = normalized_meta

        # Set config in LocationManager
        loc_mgr.set_module_config(location_id, module_id, config)
        if module_id == "_meta":
            _reconcile_managed_shadow_areas(kernel)

        # Notify module of config change
        if module_id in modules:
            module = modules[module_id]
            if hasattr(module, "on_location_config_changed"):
                module.on_location_config_changed(location_id, config)

        if module_id == "occupancy":
            changed_location_ids = {location_id}
            if isinstance(config, dict):
                changed_location_ids.update(_sync_locations_from_config(config))
            _reconcile_sync_group_now(kernel, changed_location_ids)

        coordinator = kernel.get("coordinator")
        if coordinator and hasattr(coordinator, "schedule_next_timeout"):
            coordinator.schedule_next_timeout()

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/set_module_config")

        connection.send_result(msg["id"], {"success": True})
    except (ValueError, KeyError) as e:
        connection.send_error(msg["id"], "config_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
        vol.Required("entity_id"): str,
        vol.Required("target_location_id"): vol.Any(str, None),
        vol.Optional("entry_id"): str,
    }
)
@callback
def handle_locations_assign_entity(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Assign an entity to exactly one topology location.

    Policy:
    - Entity is removed from every location before assignment.
    - Assigning to an HA-backed area also updates HA entity registry `area_id`.
    - Assigning to non-area topology nodes is integration-only metadata.
    """
    kernel = _get_kernel(hass, connection, msg)
    if kernel is None:
        return

    loc_mgr = kernel["location_manager"]
    entity_id = str(msg.get("entity_id", "")).strip()
    raw_target = msg.get("target_location_id")
    target_location_id = str(raw_target).strip() if isinstance(raw_target, str) and raw_target.strip() else None
    requested_target_location_id = target_location_id

    if not entity_id:
        connection.send_error(msg["id"], "invalid_entity", "entity_id is required")
        return

    target_location = loc_mgr.get_location(target_location_id) if target_location_id else None
    if target_location_id and target_location is None:
        connection.send_error(
            msg["id"],
            "target_not_found",
            f"Target location '{target_location_id}' not found",
        )
        return
    if target_location is not None and _is_shadow_host_location(target_location):
        shadow_target, shadow_error = _resolve_shadow_assignment_target(loc_mgr, target_location)
        if shadow_error:
            connection.send_error(msg["id"], "invalid_target", shadow_error)
            return
        if shadow_target is None:
            connection.send_error(msg["id"], "invalid_target", "Could not resolve managed shadow target")
            return
        target_location = shadow_target
        target_location_id = _location_id(shadow_target)

    previous_location_ids = [
        str(getattr(location, "id", ""))
        for location in loc_mgr.all_locations()
        if entity_id in (getattr(location, "entity_ids", []) or [])
    ]

    try:
        # Enforce single-assignment invariant.
        if previous_location_ids:
            loc_mgr.remove_entities_from_location([entity_id])

        if target_location_id:
            loc_mgr.add_entity_to_location(entity_id, target_location_id)

        synced_ha_area_id: str | None = None
        if target_location is not None:
            synced_ha_area_id = _location_ha_area_id(target_location)
            if synced_ha_area_id:
                entity_registry = er.async_get(hass)
                entity_entry = entity_registry.async_get(entity_id)
                if entity_entry is not None and entity_entry.area_id != synced_ha_area_id:
                    entity_registry.async_update_entity(entity_id, area_id=synced_ha_area_id)

        schedule_persist = kernel.get("schedule_persist")
        if callable(schedule_persist):
            schedule_persist("locations/assign_entity")

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "entity_id": entity_id,
                "previous_location_ids": previous_location_ids,
                "requested_target_location_id": requested_target_location_id,
                "target_location_id": target_location_id,
                "ha_area_id": synced_ha_area_id,
            },
        )
    except (ValueError, KeyError) as err:
        connection.send_error(msg["id"], "assign_failed", str(err))


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
        vol.Required("trigger_type"): vol.In(
            (
                "occupied",
                "vacant",
                "on_occupied",
                "on_vacant",
                "on_dark",
                "on_bright",
            )
        ),
        vol.Optional("action_entity_id"): str,
        vol.Optional("action_service"): str,
        vol.Optional("action_data"): dict,
        vol.Optional("actions"): [dict],
        vol.Optional("ambient_condition"): vol.In(("any", "dark", "bright")),
        vol.Optional("must_be_occupied"): vol.Any(bool, None),
        vol.Optional("time_condition_enabled", default=False): bool,
        vol.Optional("start_time"): str,
        vol.Optional("end_time"): str,
        vol.Optional("run_on_startup"): bool,
        vol.Optional("require_dark", default=False): bool,
        vol.Optional("automation_id"): str,
        vol.Optional("rule_uuid"): str,
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
        trigger_type = _normalize_action_trigger_type(msg.get("trigger_type"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_payload", str(err))
        return

    ambient_condition_raw = msg.get("ambient_condition")
    ambient_condition = (
        str(ambient_condition_raw).strip().lower()
        if isinstance(ambient_condition_raw, str) and ambient_condition_raw.strip()
        else None
    )
    if ambient_condition and ambient_condition not in _ACTION_AMBIENT_CONDITIONS:
        connection.send_error(msg["id"], "invalid_payload", "Invalid ambient_condition")
        return

    time_condition_enabled = bool(msg.get("time_condition_enabled", False))
    start_time = msg.get("start_time")
    end_time = msg.get("end_time")
    if time_condition_enabled:
        if isinstance(start_time, str) and start_time.strip() and not _DUSK_DAWN_TIME_PATTERN.match(start_time.strip()):
            connection.send_error(msg["id"], "invalid_payload", "start_time must be HH:MM")
            return
        if isinstance(end_time, str) and end_time.strip() and not _DUSK_DAWN_TIME_PATTERN.match(end_time.strip()):
            connection.send_error(msg["id"], "invalid_payload", "end_time must be HH:MM")
            return

    action_entity_id = str(msg.get("action_entity_id", "")).strip()
    action_service = str(msg.get("action_service", "")).strip()
    action_data_raw = msg.get("action_data")
    action_data: dict[str, Any] | None = None
    if action_data_raw is not None:
        if not isinstance(action_data_raw, dict):
            connection.send_error(msg["id"], "invalid_payload", "action_data must be an object")
            return
        normalized_action_data: dict[str, Any] = {}
        brightness_pct_raw = action_data_raw.get("brightness_pct")
        if brightness_pct_raw is not None:
            try:
                normalized_action_data["brightness_pct"] = _normalize_action_brightness_pct(
                    brightness_pct_raw,
                    30,
                )
            except ValueError:
                connection.send_error(msg["id"], "invalid_payload", "brightness_pct must be between 1 and 100")
                return
        for key, value in action_data_raw.items():
            if key in {"brightness_pct", "entity_id"}:
                continue
            if value is not None:
                normalized_action_data[key] = value
        if normalized_action_data:
            action_data = normalized_action_data

    actions_raw = msg.get("actions")
    actions: list[dict[str, Any]] = []
    if actions_raw is not None:
        if not isinstance(actions_raw, list):
            connection.send_error(msg["id"], "invalid_payload", "actions must be a list")
            return
        for index, raw_action in enumerate(actions_raw):
            if not isinstance(raw_action, dict):
                connection.send_error(msg["id"], "invalid_payload", f"actions[{index}] must be an object")
                return
            entity_id = str(raw_action.get("entity_id", "")).strip()
            if not entity_id:
                connection.send_error(msg["id"], "invalid_payload", f"actions[{index}].entity_id is required")
                return
            service = str(raw_action.get("service", "")).strip()
            only_if_off_raw = raw_action.get("only_if_off")
            data_raw = raw_action.get("data")
            normalized_data: dict[str, Any] | None = None
            if data_raw is not None:
                if not isinstance(data_raw, dict):
                    connection.send_error(msg["id"], "invalid_payload", f"actions[{index}].data must be an object")
                    return
                cleaned_data: dict[str, Any] = {}
                brightness_pct_raw = data_raw.get("brightness_pct")
                if brightness_pct_raw is not None:
                    try:
                        cleaned_data["brightness_pct"] = _normalize_action_brightness_pct(
                            brightness_pct_raw,
                            30,
                        )
                    except ValueError:
                        connection.send_error(
                            msg["id"],
                            "invalid_payload",
                            f"actions[{index}].brightness_pct must be between 1 and 100",
                        )
                        return
                for key, value in data_raw.items():
                    if key in {"brightness_pct", "entity_id"}:
                        continue
                    if value is not None:
                        cleaned_data[key] = value
                if cleaned_data:
                    normalized_data = cleaned_data
            actions.append(
                {
                    "entity_id": entity_id,
                    "service": service,
                    **({"data": normalized_data} if normalized_data else {}),
                    **(
                        {"only_if_off": bool(only_if_off_raw)}
                        if entity_id.startswith("light.")
                        and service == "turn_on"
                        and isinstance(only_if_off_raw, bool)
                        else {}
                    ),
                }
            )

    if not actions and action_entity_id:
        actions.append(
            {
                "entity_id": action_entity_id,
                "service": action_service,
                **({"data": action_data} if action_data else {}),
            }
        )

    if not actions:
        connection.send_error(msg["id"], "invalid_payload", "At least one action target is required")
        return

    try:
        rule = await managed_action_rules.async_create_rule(
            location=location,
            name=msg["name"],
            trigger_type=trigger_type,
            action_entity_id=action_entity_id or None,
            action_service=action_service or None,
            actions=actions,
            require_dark=bool(msg.get("require_dark", False)),
            ambient_condition=ambient_condition,
            must_be_occupied=(
                msg.get("must_be_occupied")
                if isinstance(msg.get("must_be_occupied"), bool)
                else None
            ),
            time_condition_enabled=time_condition_enabled,
            start_time=start_time.strip() if isinstance(start_time, str) else None,
            end_time=end_time.strip() if isinstance(end_time, str) else None,
            run_on_startup=msg.get("run_on_startup") if isinstance(msg.get("run_on_startup"), bool) else None,
            action_data=action_data,
            automation_id=str(msg.get("automation_id", "")).strip() or None,
            rule_uuid=str(msg.get("rule_uuid", "")).strip() or None,
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
