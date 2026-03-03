"""HA registry sync manager for Topomation.

Projects Home Assistant area/floor/entity registry changes into topology
locations. Topology-originated registry mutations are intentionally out of
scope (ADR-HA-017).
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from home_topology import EventBus, LocationManager
from homeassistant.core import Event as HAEvent
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

fr: Any | None
try:
    from homeassistant.helpers import floor_registry as fr
except ImportError:  # pragma: no cover - older HA without floor registry
    fr = None

if TYPE_CHECKING:
    from home_topology import Location
    from homeassistant.helpers.area_registry import AreaEntry

_LOGGER = logging.getLogger(__name__)

_META_ROLE_KEY = "role"
_META_SHADOW_AREA_ID_KEY = "shadow_area_id"
_META_SHADOW_FOR_LOCATION_ID_KEY = "shadow_for_location_id"
_MANAGED_SHADOW_ROLE = "managed_shadow"
_SHADOW_HOST_TYPES = frozenset({"floor", "building", "grounds"})


def _location_type(location: object) -> str:
    """Read normalized integration location type from _meta (defaults to area)."""
    modules = getattr(location, "modules", {}) or {}
    if not isinstance(modules, dict):
        return "area"
    meta = modules.get("_meta", {}) if isinstance(modules, dict) else {}
    if not isinstance(meta, dict):
        return "area"
    raw = str(meta.get("type", "")).strip().lower()
    if raw == "room":
        return "area"
    if raw in {"floor", "area", "building", "grounds", "subarea"}:
        return raw
    return "area"


def _is_shadow_host(location: object) -> bool:
    """Return True when location must have a managed shadow area."""
    if bool(getattr(location, "is_explicit_root", False)):
        return False
    return _location_type(location) in _SHADOW_HOST_TYPES

class SyncManager:
    """Sync Home Assistant registries into topology locations."""

    def __init__(
        self,
        hass: HomeAssistant,
        loc_mgr: LocationManager,
        event_bus: EventBus,
    ) -> None:
        """Initialize the sync manager.

        Args:
            hass: Home Assistant instance
            loc_mgr: Location manager from home-topology kernel
            event_bus: Event bus from home-topology kernel
        """
        self.hass = hass
        self.loc_mgr = loc_mgr
        self.event_bus = event_bus
        self.loc_mgr.set_event_bus(event_bus)

        # Registries
        self.area_registry = ar.async_get(hass)
        self.device_registry = dr.async_get(hass)
        self.entity_registry = er.async_get(hass)
        self.floor_registry = fr.async_get(hass) if fr else None

        # Event unsubscribers
        self._ha_unsubs: list[callable] = []
        self._entity_map_reconcile_scheduled = False
        self._managed_shadow_reconcile_in_progress = False

    async def async_setup(self) -> None:
        """Set up the sync manager and start syncing."""
        _LOGGER.info("Setting up HA registry sync manager")

        # Phase 1: Initial import
        await self.import_all_areas_and_floors()

        # Phase 2: Live sync from HA → Topology
        self._setup_ha_listeners()

        _LOGGER.info("HA registry sync manager ready")

    async def async_teardown(self) -> None:
        """Tear down sync manager and unsubscribe from events."""
        _LOGGER.debug("Tearing down sync manager")

        # Unsubscribe from HA events
        for unsub in self._ha_unsubs:
            if callable(unsub):
                unsub()
        self._ha_unsubs.clear()

    # =========================================================================
    # Phase 1: Initial Import (HA → Topology)
    # =========================================================================

    async def import_all_areas_and_floors(self) -> None:
        """Import all HA areas and floors into topology."""
        _LOGGER.info("Importing HA areas and floors to topology")

        # Import floors first (if supported)
        await self._import_floors()

        # Import areas
        await self._import_areas()

        # Map entities to locations
        await self._map_entities()
        self._reconcile_managed_shadow_areas()

        _LOGGER.info(
            "Import complete: %d locations created",
            len(self.loc_mgr.all_locations()),
        )

    async def _import_floors(self) -> None:
        """Import HA floors as parent locations."""
        floors = self._list_floors()
        if not floors:
            _LOGGER.debug("No floors found in HA")
            return

        for floor in floors:
            self._ensure_floor_location(floor.floor_id, floor.name)
            _LOGGER.debug("Imported floor: %s (id=%s)", floor.name, floor.floor_id)

    async def _import_areas(self) -> None:
        """Import HA areas as locations."""
        areas = self.area_registry.areas.values()

        for area in areas:
            await self._import_area(area)

    async def _import_area(self, area: AreaEntry) -> None:
        """Import a single HA area as a location."""
        location_id = f"area_{area.id}"

        # Determine parent based on floor assignment
        parent_id = None
        if hasattr(area, "floor_id") and area.floor_id:
            parent_id = self._ensure_floor_location(area.floor_id)

        existing = self.loc_mgr.get_location(location_id)
        if existing is not None:
            self._reconcile_area_wrapper(existing, area, parent_id)
            return

        try:
            self.loc_mgr.create_location(
                id=location_id,
                name=area.name,
                parent_id=parent_id,
                is_explicit_root=False,
                ha_area_id=area.id,
            )

            # Store area metadata
            meta_config = {
                "type": "area",
                "ha_area_id": area.id,
                "sync_source": "homeassistant",
                "sync_enabled": True,
                "last_synced": datetime.now(UTC).isoformat(),
            }

            if hasattr(area, "floor_id") and area.floor_id:
                meta_config["ha_floor_id"] = area.floor_id

            self.loc_mgr.set_module_config(location_id, "_meta", meta_config)

            _LOGGER.debug("Imported area: %s (id=%s)", area.name, area.id)

        except ValueError as e:
            _LOGGER.warning("Failed to import area %s: %s", area.name, e)

    def _entity_area_id(self, entity: er.RegistryEntry) -> str | None:
        """Resolve area_id for entity (direct or inherited from device)."""
        if entity.area_id:
            return entity.area_id
        if entity.device_id:
            device = self.device_registry.async_get(entity.device_id)
            if device and device.area_id:
                return device.area_id
        return None

    async def _map_entities(self) -> None:
        """Reconcile entity mapping from HA area assignments.

        Includes entities with direct area_id and those inheriting area from their device.
        """
        # Integration-owned structural assignment (floor/building/grounds/subarea) is
        # an explicit override. Keep those entities out of HA-area wrapper reconciliation.
        topology_override_by_entity: dict[str, str] = {}
        for location in sorted(self.loc_mgr.all_locations(), key=lambda item: str(item.id)):
            if self._is_ha_area_wrapper(location):
                continue
            for entity_id in location.entity_ids:
                if entity_id and entity_id not in topology_override_by_entity:
                    topology_override_by_entity[entity_id] = location.id

        desired_by_location: dict[str, set[str]] = {}
        for entity in self.entity_registry.entities.values():
            if entity.entity_id in topology_override_by_entity:
                continue
            area_id = self._entity_area_id(entity)
            if not area_id:
                continue
            location_id = f"area_{area_id}"
            desired_by_location.setdefault(location_id, set()).add(entity.entity_id)

        # For HA-backed area wrappers, reconcile to exact HA assignment on startup/import.
        for location in self.loc_mgr.all_locations():
            if not self._is_ha_area_wrapper(location):
                continue

            desired = desired_by_location.get(location.id, set())
            current = set(location.entity_ids)

            to_remove = sorted(current - desired)
            if to_remove:
                self.loc_mgr.remove_entities_from_location(to_remove)

            to_add = sorted(desired - current)
            for entity_id in to_add:
                try:
                    self.loc_mgr.add_entity_to_location(entity_id, location.id)
                except (ValueError, KeyError) as e:
                    _LOGGER.debug(
                        "Could not map entity %s to location %s: %s",
                        entity_id,
                        location.id,
                        e,
                    )

    # =========================================================================
    # Phase 2: Live Sync (HA → Topology)
    # =========================================================================

    def _setup_ha_listeners(self) -> None:
        """Set up listeners for HA registry events."""
        _LOGGER.debug("Setting up HA registry event listeners")

        # Listen for area registry changes
        area_unsub = self.hass.bus.async_listen(
            ar.EVENT_AREA_REGISTRY_UPDATED,
            self._on_area_registry_updated,
        )
        if callable(area_unsub):
            self._ha_unsubs.append(area_unsub)

        # Listen for floor registry changes.
        floor_event = getattr(fr, "EVENT_FLOOR_REGISTRY_UPDATED", None)
        if self.floor_registry is not None and floor_event is not None:
            floor_unsub = self.hass.bus.async_listen(
                floor_event,
                self._on_floor_registry_updated,
            )
            if callable(floor_unsub):
                self._ha_unsubs.append(floor_unsub)
        else:
            _LOGGER.debug("Floor registry not available")

        # Listen for entity registry changes
        entity_unsub = self.hass.bus.async_listen(
            er.EVENT_ENTITY_REGISTRY_UPDATED,
            self._on_entity_registry_updated,
        )
        if callable(entity_unsub):
            self._ha_unsubs.append(entity_unsub)

    @callback
    def _on_area_registry_updated(self, event: HAEvent) -> None:
        """Handle area registry update events.

        Syncs HA area changes → topology locations.
        """
        action = event.data["action"]
        area_id = event.data["area_id"]
        _LOGGER.debug("Area registry updated: %s (action=%s)", area_id, action)

        try:
            if action == "create":
                self._handle_area_created(area_id)
            elif action == "update":
                self._handle_area_updated(area_id)
            elif action == "remove":
                self._handle_area_removed(area_id)
        except Exception as e:
            _LOGGER.error(
                "Error handling area registry event: %s",
                e,
                exc_info=True,
            )

    def _handle_area_created(self, area_id: str) -> None:
        """Handle new area created in HA."""
        area = self.area_registry.async_get_area(area_id)
        if not area:
            return

        # Schedule async import without blocking the event callback.
        async def _import_and_reconcile() -> None:
            await self._import_area(area)
            self._reconcile_managed_shadow_areas()

        self.hass.async_create_task(_import_and_reconcile())

    def _handle_area_updated(self, area_id: str) -> None:
        """Handle area updated in HA."""
        area = self.area_registry.async_get_area(area_id)
        location_id = f"area_{area_id}"
        location = self.loc_mgr.get_location(location_id)

        if not area or not location:
            return

        if not self._can_sync_from_ha(location):
            _LOGGER.debug("Skipping HA area update for location %s due to sync policy", location_id)
            return

        if location.ha_area_id != area_id:
            self.loc_mgr.update_location(location_id, ha_area_id=area_id)

        # Update name if changed
        if location.name != area.name:
            self.loc_mgr.update_location(location_id, name=area.name)
            _LOGGER.info(
                "Synced area rename: %s → %s",
                location.name,
                area.name,
            )

        should_reconcile_parent = self._should_reconcile_area_parent_to_floor(location)

        # Update parent if floor changed and no custom topology overlay is in use.
        if hasattr(area, "floor_id"):
            new_parent = (
                self._ensure_floor_location(area.floor_id) if area.floor_id else None
            )
            if should_reconcile_parent and location.parent_id != new_parent:
                parent_update = new_parent if new_parent is not None else ""
                self.loc_mgr.update_location(location_id, parent_id=parent_update)
                _LOGGER.info(
                    "Synced area floor change: %s → %s",
                    location_id,
                    new_parent,
                )

        # Update metadata
        meta = location.modules.get("_meta", {})
        meta["ha_area_id"] = area_id
        meta["last_synced"] = datetime.now(UTC).isoformat()
        if hasattr(area, "floor_id"):
            if area.floor_id:
                meta["ha_floor_id"] = area.floor_id
            else:
                meta.pop("ha_floor_id", None)
        self.loc_mgr.set_module_config(location_id, "_meta", meta)
        self._reconcile_managed_shadow_areas()

    def _handle_area_removed(self, area_id: str) -> None:
        """Handle area deleted in HA."""
        location_id = f"area_{area_id}"
        location = self.loc_mgr.get_location(location_id)

        if not location:
            return

        if not self._can_sync_from_ha(location):
            _LOGGER.debug("Skipping HA area remove for location %s due to sync policy", location_id)
            return

        try:
            # Delete the location
            self.loc_mgr.delete_location(location_id)
            self._reconcile_managed_shadow_areas()
            _LOGGER.info("Deleted location for removed area: %s", location_id)
        except Exception as e:
            _LOGGER.error("Failed to delete location %s: %s", location_id, e)

    @callback
    def _on_floor_registry_updated(self, event: HAEvent) -> None:
        """Handle floor registry update events."""
        action = event.data["action"]
        floor_id = event.data["floor_id"]
        _LOGGER.debug("Floor registry updated: %s (action=%s)", floor_id, action)

        try:
            if action == "create":
                self._handle_floor_created(floor_id)
            elif action == "update":
                self._handle_floor_updated(floor_id)
            elif action == "remove":
                self._handle_floor_removed(floor_id)
        except Exception as e:
            _LOGGER.error(
                "Error handling floor registry event: %s",
                e,
                exc_info=True,
            )

    def _handle_floor_created(self, floor_id: str) -> None:
        """Handle new floor created in HA."""
        floor = self._get_floor(floor_id)
        if not floor:
            return

        self._ensure_floor_location(floor_id, floor.name)
        self._reconcile_managed_shadow_areas()
        _LOGGER.info("Created floor location: %s", floor.name)

    def _handle_floor_updated(self, floor_id: str) -> None:
        """Handle floor updated in HA."""
        floor = self._get_floor(floor_id)
        location_id = f"floor_{floor_id}"
        location = self.loc_mgr.get_location(location_id)

        if not floor or not location:
            return

        if not self._can_sync_from_ha(location):
            _LOGGER.debug(
                "Skipping HA floor update for location %s due to sync policy",
                location_id,
            )
            return

        # Update name if changed
        if location.name != floor.name:
            self.loc_mgr.update_location(location_id, name=floor.name)
            _LOGGER.info("Synced floor rename: %s → %s", location.name, floor.name)

        # Update metadata
        meta = location.modules.get("_meta", {})
        meta["last_synced"] = datetime.now(UTC).isoformat()
        self.loc_mgr.set_module_config(location_id, "_meta", meta)
        self._reconcile_managed_shadow_areas()

    def _handle_floor_removed(self, floor_id: str) -> None:
        """Handle floor deleted in HA."""
        location_id = f"floor_{floor_id}"
        location = self.loc_mgr.get_location(location_id)

        if not location:
            return

        if not self._can_sync_from_ha(location):
            _LOGGER.debug(
                "Skipping HA floor remove for location %s due to sync policy",
                location_id,
            )
            return

        try:
            # Move children to root before deleting
            children = self.loc_mgr.children_of(location_id)
            for child in children:
                self.loc_mgr.update_location(child.id, parent_id="")
                meta = child.modules.get("_meta", {})
                if meta.get("ha_floor_id") == floor_id:
                    meta.pop("ha_floor_id", None)
                    meta["last_synced"] = datetime.now(UTC).isoformat()
                    self.loc_mgr.set_module_config(child.id, "_meta", meta)

            # Delete floor location
            self.loc_mgr.delete_location(location_id)
            self._reconcile_managed_shadow_areas()
            _LOGGER.info("Deleted floor location: %s", location_id)

        except Exception as e:
            _LOGGER.error("Failed to delete floor location %s: %s", location_id, e)

    @callback
    def _on_entity_registry_updated(self, event: HAEvent) -> None:
        """Handle entity registry update events.

        We re-run entity→area mapping reconciliation for changes that can affect
        location assignment:
          - area assignment changes (`area_id`)
          - entity_id renames (`entity_id`)
          - device re-linking (`device_id`, affects inherited area)
          - create/remove lifecycle events
        """
        action = event.data.get("action")
        entity_id = event.data.get("entity_id")
        if action not in {"create", "remove", "update"}:
            return

        if action in {"create", "remove"}:
            self._schedule_entity_map_reconcile(f"{action}:{entity_id}")
            return

        changes = event.data.get("changes", {}) or {}
        if not any(key in changes for key in ("area_id", "entity_id", "device_id")):
            return

        self._schedule_entity_map_reconcile(f"update:{entity_id}")

    def _schedule_entity_map_reconcile(self, reason: str) -> None:
        """Coalesce entity-mapping reconciles triggered by registry update bursts."""
        if self._entity_map_reconcile_scheduled:
            return

        self._entity_map_reconcile_scheduled = True

        async def _run() -> None:
            try:
                _LOGGER.debug("Reconcile entity mapping after registry change (%s)", reason)
                await self._map_entities()
            except Exception as err:  # pragma: no cover - defensive logging
                _LOGGER.error("Failed to reconcile entity mapping: %s", err, exc_info=True)
            finally:
                self._entity_map_reconcile_scheduled = False

        self.hass.async_create_task(_run())

    def _can_sync_from_ha(self, location: Location) -> bool:
        """Return True if Home Assistant changes may update this topology location."""
        meta = location.modules.get("_meta", {})
        if not meta.get("sync_enabled", True):
            return False
        return meta.get("sync_source", "homeassistant") == "homeassistant"

    def _is_ha_area_wrapper(self, location: Location) -> bool:
        """Return True for topology locations backed by HA areas."""
        if not location.id.startswith("area_"):
            return False
        meta = location.modules.get("_meta", {})
        return bool(location.ha_area_id or meta.get("ha_area_id"))

    def reconcile_managed_shadow_areas(self) -> None:
        """Public reconciliation hook for topology mutations."""
        self._reconcile_managed_shadow_areas()

    def _shadow_floor_id_for_host(self, host_location: Location) -> str | None:
        """Resolve floor_id to apply when creating a floor shadow area."""
        if _location_type(host_location) != "floor":
            return None
        host_meta = host_location.modules.get("_meta", {})
        if not isinstance(host_meta, dict):
            return None
        raw_floor_id = host_meta.get("ha_floor_id")
        if not raw_floor_id:
            return None
        floor_id = str(raw_floor_id).strip()
        return floor_id or None

    def _create_managed_shadow_area_for_host(self, host_location: Location) -> str | None:
        """Create and wire a managed shadow HA area for one host node."""
        host_id = str(getattr(host_location, "id", "") or "")
        if not host_id:
            return None

        floor_id = self._shadow_floor_id_for_host(host_location)
        base_name = host_location.name
        name_candidates = [base_name, f"{base_name} (System)"]
        created_area = None
        for candidate_name in name_candidates:
            try:
                created_area = self.area_registry.async_create(name=candidate_name, floor_id=floor_id)
                break
            except ValueError as err:
                if "already in use" not in str(err):
                    raise
        if created_area is None:
            suffix = 2
            while True:
                try:
                    created_area = self.area_registry.async_create(
                        name=f"{base_name} (System {suffix})",
                        floor_id=floor_id,
                    )
                    break
                except ValueError as err:
                    if "already in use" not in str(err):
                        raise
                    suffix += 1

        location_id = f"area_{created_area.id}"

        existing = self.loc_mgr.get_location(location_id)
        if existing is None:
            self.loc_mgr.create_location(
                id=location_id,
                name=created_area.name,
                parent_id=host_id,
                is_explicit_root=False,
                ha_area_id=created_area.id,
            )
            location = self.loc_mgr.get_location(location_id)
        else:
            update_kwargs: dict[str, Any] = {}
            if existing.name != created_area.name:
                update_kwargs["name"] = created_area.name
            if existing.ha_area_id != created_area.id:
                update_kwargs["ha_area_id"] = created_area.id
            if existing.parent_id != host_id:
                update_kwargs["parent_id"] = host_id
            location = (
                self.loc_mgr.update_location(location_id, **update_kwargs)
                if update_kwargs
                else existing
            )

        if location is None:
            return None

        area_meta = location.modules.get("_meta", {})
        if not isinstance(area_meta, dict):
            area_meta = {}
        next_area_meta = dict(area_meta)
        next_area_meta.update(
            {
                "type": "area",
                "ha_area_id": created_area.id,
                "sync_source": "homeassistant",
                "sync_enabled": True,
                "last_synced": datetime.now(UTC).isoformat(),
                _META_ROLE_KEY: _MANAGED_SHADOW_ROLE,
                _META_SHADOW_FOR_LOCATION_ID_KEY: host_id,
            }
        )
        if getattr(created_area, "floor_id", None):
            next_area_meta["ha_floor_id"] = created_area.floor_id
        else:
            next_area_meta.pop("ha_floor_id", None)

        # Legacy proxy keys are removed as part of managed-shadow migration.
        next_area_meta.pop("proxy_for_floor_id", None)
        self.loc_mgr.set_module_config(location_id, "_meta", next_area_meta)

        host_meta = host_location.modules.get("_meta", {})
        if not isinstance(host_meta, dict):
            host_meta = {}
        next_host_meta = dict(host_meta)
        next_host_meta[_META_SHADOW_AREA_ID_KEY] = location_id
        next_host_meta.pop("proxy_area_id", None)
        self.loc_mgr.set_module_config(host_id, "_meta", next_host_meta)

        _LOGGER.info("Created managed shadow area '%s' for %s", location_id, host_id)
        return location_id

    def _reconcile_managed_shadow_areas(self) -> None:
        """Enforce managed shadow-area policy for floor/building/grounds hosts."""
        if self._managed_shadow_reconcile_in_progress:
            return

        self._managed_shadow_reconcile_in_progress = True
        try:
            self._run_managed_shadow_reconcile()
        finally:
            self._managed_shadow_reconcile_in_progress = False

    def _run_managed_shadow_reconcile(self) -> None:
        """Internal managed-shadow reconciliation implementation."""
        all_locations = list(self.loc_mgr.all_locations())
        by_id = {str(loc.id): loc for loc in all_locations if str(getattr(loc, "id", ""))}

        host_ids = {
            location_id
            for location_id, location in by_id.items()
            if _is_shadow_host(location)
        }
        shadow_ids_by_host: dict[str, list[str]] = {}

        # Pass 1: normalize area-side managed shadow tags.
        for location_id, location in by_id.items():
            if _location_type(location) != "area":
                continue

            meta = location.modules.get("_meta", {})
            if not isinstance(meta, dict):
                continue

            role = str(meta.get(_META_ROLE_KEY, "")).strip().lower()
            shadow_for_location_id = str(
                meta.get(_META_SHADOW_FOR_LOCATION_ID_KEY, "")
            ).strip()
            has_ha_area_link = bool(location.ha_area_id or meta.get("ha_area_id"))

            is_valid_shadow = (
                role == _MANAGED_SHADOW_ROLE
                and shadow_for_location_id in host_ids
                and getattr(location, "parent_id", None) == shadow_for_location_id
                and has_ha_area_link
            )
            if is_valid_shadow:
                shadow_ids_by_host.setdefault(shadow_for_location_id, []).append(location_id)
                continue

            next_meta = dict(meta)
            changed = False
            if role in {_MANAGED_SHADOW_ROLE, "floor_proxy"}:
                if next_meta.pop(_META_ROLE_KEY, None) is not None:
                    changed = True
            if next_meta.pop(_META_SHADOW_FOR_LOCATION_ID_KEY, None) is not None:
                changed = True
            if next_meta.pop("proxy_for_floor_id", None) is not None:
                changed = True

            if changed:
                self.loc_mgr.set_module_config(location_id, "_meta", next_meta)

        # Pass 2: enforce one managed shadow per host.
        for host_id, shadow_ids in list(shadow_ids_by_host.items()):
            if len(shadow_ids) <= 1:
                continue

            host_location = by_id.get(host_id)
            preferred_shadow_id = ""
            if host_location is not None:
                host_meta = host_location.modules.get("_meta", {})
                if isinstance(host_meta, dict):
                    candidate = str(host_meta.get(_META_SHADOW_AREA_ID_KEY, "")).strip()
                    if candidate in shadow_ids:
                        preferred_shadow_id = candidate
                    if not preferred_shadow_id:
                        legacy_candidate = str(host_meta.get("proxy_area_id", "")).strip()
                        if legacy_candidate in shadow_ids:
                            preferred_shadow_id = legacy_candidate

            if not preferred_shadow_id:
                preferred_shadow_id = sorted(shadow_ids)[0]

            for shadow_id in shadow_ids:
                if shadow_id == preferred_shadow_id:
                    continue
                shadow_location = by_id.get(shadow_id)
                if shadow_location is None:
                    continue
                shadow_meta = shadow_location.modules.get("_meta", {})
                if not isinstance(shadow_meta, dict):
                    continue
                next_shadow_meta = dict(shadow_meta)
                changed = False
                if next_shadow_meta.pop(_META_ROLE_KEY, None) is not None:
                    changed = True
                if next_shadow_meta.pop(_META_SHADOW_FOR_LOCATION_ID_KEY, None) is not None:
                    changed = True
                if next_shadow_meta.pop("proxy_for_floor_id", None) is not None:
                    changed = True
                if changed:
                    self.loc_mgr.set_module_config(shadow_id, "_meta", next_shadow_meta)

            shadow_ids_by_host[host_id] = [preferred_shadow_id]

        # Pass 3: sync host pointers and clear stale pointer keys from non-host nodes.
        for location_id, location in by_id.items():
            meta = location.modules.get("_meta", {})
            if not isinstance(meta, dict):
                continue
            next_meta = dict(meta)
            changed = False

            if location_id in host_ids:
                valid_shadow_ids = shadow_ids_by_host.get(location_id, [])
                expected_shadow_id = valid_shadow_ids[0] if len(valid_shadow_ids) == 1 else ""
                current_shadow_id = str(next_meta.get(_META_SHADOW_AREA_ID_KEY, "")).strip()
                if expected_shadow_id:
                    if current_shadow_id != expected_shadow_id:
                        next_meta[_META_SHADOW_AREA_ID_KEY] = expected_shadow_id
                        changed = True
                elif next_meta.pop(_META_SHADOW_AREA_ID_KEY, None) is not None:
                    changed = True
            elif next_meta.pop(_META_SHADOW_AREA_ID_KEY, None) is not None:
                changed = True

            if next_meta.pop("proxy_area_id", None) is not None:
                changed = True

            if changed:
                self.loc_mgr.set_module_config(location_id, "_meta", next_meta)

        # Pass 4: create missing managed shadow areas.
        for host_id in sorted(host_ids):
            if shadow_ids_by_host.get(host_id):
                continue
            host_location = self.loc_mgr.get_location(host_id)
            if host_location is None:
                continue
            shadow_location_id = self._create_managed_shadow_area_for_host(host_location)
            if not shadow_location_id:
                continue
            shadow_ids_by_host[host_id] = [shadow_location_id]

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_location_for_area(self, area_id: str) -> Location | None:
        """Get topology location for HA area."""
        return self.loc_mgr.get_location(f"area_{area_id}")

    def get_area_for_location(self, location_id: str) -> AreaEntry | None:
        """Get HA area for topology location."""
        location = self.loc_mgr.get_location(location_id)
        if not location:
            return None

        meta = location.modules.get("_meta", {})
        if ha_area_id := (location.ha_area_id or meta.get("ha_area_id")):
            return self.area_registry.async_get_area(ha_area_id)

        return None

    def get_floor_for_location(self, location_id: str) -> object | None:
        """Get HA floor for topology location."""
        location = self.loc_mgr.get_location(location_id)
        if not location:
            return None

        meta = location.modules.get("_meta", {})
        if ha_floor_id := meta.get("ha_floor_id"):
            return self._get_floor(ha_floor_id)

        return None

    def _list_floors(self) -> list[object]:
        """List all known floor entries from the floor registry."""
        if self.floor_registry and hasattr(self.floor_registry, "async_list_floors"):
            return list(self.floor_registry.async_list_floors())
        return []

    def _ensure_floor_location(
        self,
        floor_id: str,
        floor_name: str | None = None,
    ) -> str | None:
        """Ensure a floor location exists and metadata is up to date."""
        location_id = f"floor_{floor_id}"
        location = self.loc_mgr.get_location(location_id)
        resolved_name = floor_name
        if resolved_name is None and location is None:
            floor = self._get_floor(floor_id)
            resolved_name = getattr(floor, "name", None) if floor else None
        elif resolved_name is None and location is not None:
            resolved_name = location.name
        if resolved_name is None:
            _LOGGER.warning("Cannot resolve floor name for %s; leaving area at root", floor_id)
            return None

        if location is None:
            default_parent_id = self._default_floor_parent_id()
            self.loc_mgr.create_location(
                id=location_id,
                name=resolved_name,
                parent_id=default_parent_id,
                is_explicit_root=False,
            )
        elif location.name != resolved_name:
            self.loc_mgr.update_location(location_id, name=resolved_name)

        floor_meta = self.loc_mgr.get_location(location_id).modules.get("_meta", {})
        floor_meta.update(
            {
                "type": "floor",
                "ha_floor_id": floor_id,
                "sync_source": "homeassistant",
                "sync_enabled": True,
                "last_synced": datetime.now(UTC).isoformat(),
            }
        )
        self.loc_mgr.set_module_config(location_id, "_meta", floor_meta)
        return location_id

    def _default_floor_parent_id(self) -> str | None:
        """Resolve default parent for new floors (Home building when present)."""
        preferred = self.loc_mgr.get_location("building_main")
        if preferred is not None and self._is_building_wrapper(preferred):
            return preferred.id

        for location in self.loc_mgr.all_locations():
            if self._is_building_wrapper(location):
                return location.id
        return None

    def _is_building_wrapper(self, location: Location) -> bool:
        """Return True when a location behaves as a non-root building wrapper."""
        if bool(getattr(location, "is_explicit_root", False)):
            return False
        meta = location.modules.get("_meta", {})
        location_type = str(meta.get("type", "")).strip().lower() if isinstance(meta, dict) else ""
        return location_type == "building"

    def _reconcile_area_wrapper(
        self,
        location: Location,
        area: AreaEntry,
        parent_id: str | None,
    ) -> None:
        """Force area wrapper to canonical HA values during import/startup."""
        update_kwargs: dict[str, str] = {}
        if location.name != area.name:
            update_kwargs["name"] = area.name
        if location.ha_area_id != area.id:
            update_kwargs["ha_area_id"] = area.id
        if self._should_reconcile_area_parent_to_floor(location) and location.parent_id != parent_id:
            update_kwargs["parent_id"] = parent_id if parent_id is not None else ""

        if update_kwargs:
            self.loc_mgr.update_location(location.id, **update_kwargs)

        meta = location.modules.get("_meta", {})
        meta.update(
            {
                "type": "area",
                "ha_area_id": area.id,
                "sync_source": "homeassistant",
                "sync_enabled": True,
                "last_synced": datetime.now(UTC).isoformat(),
            }
        )
        if hasattr(area, "floor_id") and area.floor_id:
            meta["ha_floor_id"] = area.floor_id
        else:
            meta.pop("ha_floor_id", None)
        self.loc_mgr.set_module_config(location.id, "_meta", meta)

    def _canonical_parent_for_floor(self, floor_id: str | None) -> str | None:
        """Return canonical parent location ID implied by an HA floor assignment."""
        if floor_id:
            return f"floor_{floor_id}"
        return None

    def _should_reconcile_area_parent_to_floor(self, location: Location) -> bool:
        """Return True when an HA area wrapper parent should be floor-reconciled.

        Preserve explicit topology overlays (e.g. area-under-area) across restart/live sync.
        """
        current_parent = getattr(location, "parent_id", None)
        if current_parent and self.loc_mgr.get_location(current_parent) is None:
            # Broken parent pointers should heal back to canonical floor linkage.
            return True

        meta = location.modules.get("_meta", {})
        prior_floor_id = None
        if isinstance(meta, dict):
            raw_floor_id = meta.get("ha_floor_id")
            if raw_floor_id:
                prior_floor_id = str(raw_floor_id)

        canonical_parent = self._canonical_parent_for_floor(prior_floor_id)
        return current_parent == canonical_parent

    def _get_floor(self, floor_id: str) -> object | None:
        """Get a floor entry by ID from the floor registry."""
        if not self.floor_registry or not hasattr(self.floor_registry, "async_get_floor"):
            return None
        return self.floor_registry.async_get_floor(floor_id)
