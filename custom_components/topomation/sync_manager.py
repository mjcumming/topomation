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
        self.entity_registry = er.async_get(hass)
        self.floor_registry = fr.async_get(hass) if fr else None

        # Event unsubscribers
        self._ha_unsubs: list[callable] = []

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

    async def _map_entities(self) -> None:
        """Reconcile entity mapping from HA area assignments."""
        desired_by_location: dict[str, set[str]] = {}
        for entity in self.entity_registry.entities.values():
            if not entity.area_id:
                continue
            location_id = f"area_{entity.area_id}"
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
        self.hass.async_create_task(self._import_area(area))

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

        # Update parent if floor changed
        if hasattr(area, "floor_id"):
            new_parent = (
                self._ensure_floor_location(area.floor_id) if area.floor_id else None
            )
            if location.parent_id != new_parent:
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
            _LOGGER.info("Deleted floor location: %s", location_id)

        except Exception as e:
            _LOGGER.error("Failed to delete floor location %s: %s", location_id, e)

    @callback
    def _on_entity_registry_updated(self, event: HAEvent) -> None:
        """Handle entity registry update events."""
        action = event.data["action"]
        entity_id = event.data["entity_id"]

        if action != "update":
            return

        changes = event.data.get("changes", {})
        if "area_id" not in changes:
            return

        # Entity area changed
        old_area_id = changes.get("area_id")
        entity_entry = self.entity_registry.async_get(entity_id)
        new_area_id = entity_entry.area_id if entity_entry else None

        _LOGGER.debug(
            "Entity area changed: %s (%s → %s)",
            entity_id,
            old_area_id,
            new_area_id,
        )

        try:
            # Remove from old location
            if old_area_id:
                try:
                    old_location_id = f"area_{old_area_id}"
                    old_location = self.loc_mgr.get_location(old_location_id)
                    if old_location and self._can_sync_from_ha(old_location):
                        self.loc_mgr.remove_entities_from_location([entity_id])
                except (ValueError, KeyError):
                    _LOGGER.debug(
                        "Entity %s was not mapped to old location %s during area change cleanup",
                        entity_id,
                        old_location_id,
                    )

            # Add to new location
            if new_area_id:
                new_location_id = f"area_{new_area_id}"
                try:
                    new_location = self.loc_mgr.get_location(new_location_id)
                    if new_location and self._can_sync_from_ha(new_location):
                        self.loc_mgr.add_entity_to_location(entity_id, new_location_id)
                        _LOGGER.info(
                            "Moved entity %s to location %s",
                            entity_id,
                            new_location_id,
                        )
                except (ValueError, KeyError) as e:
                    _LOGGER.warning(
                        "Could not add entity %s to location %s: %s",
                        entity_id,
                        new_location_id,
                        e,
                    )

        except Exception as e:
            _LOGGER.error(
                "Error handling entity area change: %s",
                e,
                exc_info=True,
            )

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
        if location.parent_id != parent_id:
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

    def _get_floor(self, floor_id: str) -> object | None:
        """Get a floor entry by ID from the floor registry."""
        if not self.floor_registry or not hasattr(self.floor_registry, "async_get_floor"):
            return None
        return self.floor_registry.async_get_floor(floor_id)
