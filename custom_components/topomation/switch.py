"""Switch platform for Topomation lock control."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

from home_topology.core.bus import Event, EventBus, EventFilter
from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .sync_manager import _is_shadow_host

if TYPE_CHECKING:
    from home_topology.modules.occupancy import OccupancyModule

_LOGGER = logging.getLogger(__name__)

LOCK_SWITCH_SOURCE_ID = "switch_entity"


def _location_ha_area_id(location: object) -> str | None:
    """Resolve canonical HA area linkage for a location-like object."""
    linked = getattr(location, "ha_area_id", None)
    if linked:
        return str(linked)

    modules = getattr(location, "modules", {}) or {}
    if not isinstance(modules, dict):
        return None
    meta = modules.get("_meta", {})
    if not isinstance(meta, dict):
        return None
    raw_area_id = meta.get("ha_area_id")
    return str(raw_area_id) if raw_area_id else None


def _remove_lock_switch_entity_for_location(
    hass: HomeAssistant,
    entry: ConfigEntry,
    location_id: str,
) -> str | None:
    """Remove lock switch entity registry entry for one location ID."""
    registry = er.async_get(hass)
    unique_id = f"lock_{location_id}"

    entity_id = registry.async_get_entity_id("switch", DOMAIN, unique_id)
    if entity_id is None:
        for reg_entry in er.async_entries_for_config_entry(registry, entry.entry_id):
            if str(reg_entry.unique_id or "") == unique_id:
                entity_id = reg_entry.entity_id
                break

    if not entity_id:
        return None

    registry.async_remove(entity_id)
    return entity_id


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up lock switches."""
    _LOGGER.debug("Setting up switch platform")

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    bus = kernel["event_bus"]
    modules = kernel["modules"]
    occupancy_module = modules.get("occupancy")

    # Shadow hosts (floor / building / grounds / property) get their lock switch via the
    # managed shadow area instead, mirroring the binary_sensor pattern.
    for location in loc_mgr.all_locations():
        if _is_shadow_host(location):
            removed = _remove_lock_switch_entity_for_location(hass, entry, location.id)
            if removed:
                _LOGGER.debug(
                    "Removed legacy host lock switch entity %s for shadow host %s",
                    removed,
                    location.id,
                )

    entities: list[LocationLockSwitch] = []
    switches_by_location_id: dict[str, LocationLockSwitch] = {}
    for location in loc_mgr.all_locations():
        if _is_shadow_host(location):
            continue
        switch = LocationLockSwitch(
            entry.entry_id,
            location.id,
            location.name,
            bus,
            occupancy_module=occupancy_module,
            ha_area_id=_location_ha_area_id(location),
        )
        switches_by_location_id[location.id] = switch
        entities.append(switch)

    async_add_entities(entities)
    _LOGGER.info("Created %d lock switches", len(entities))

    @callback
    def _on_location_created(event: Event) -> None:
        """Add lock switch entities for topology locations created after startup."""
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return
        if location_id in switches_by_location_id:
            return

        location = loc_mgr.get_location(location_id)
        if location is None:
            return
        if _is_shadow_host(location):
            return

        switch = LocationLockSwitch(
            entry.entry_id,
            location.id,
            location.name,
            bus,
            occupancy_module=occupancy_module,
            ha_area_id=_location_ha_area_id(location),
        )
        switches_by_location_id[location_id] = switch
        async_add_entities([switch])

    @callback
    def _on_location_deleted(event: Event) -> None:
        """Remove lock switch entities when their topology location is deleted."""
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return

        switches_by_location_id.pop(location_id, None)
        removed_entity = _remove_lock_switch_entity_for_location(hass, entry, location_id)
        if removed_entity:
            _LOGGER.debug(
                "Removed lock switch entity %s for deleted location %s",
                removed_entity,
                location_id,
            )

    bus.subscribe(_on_location_created, EventFilter(event_type="location.created"))
    bus.subscribe(_on_location_deleted, EventFilter(event_type="location.deleted"))

    entry.async_on_unload(lambda: bus.unsubscribe(_on_location_created))
    entry.async_on_unload(lambda: bus.unsubscribe(_on_location_deleted))


class LocationLockSwitch(SwitchEntity):
    """Switch representing per-location lock state.

    On `turn_on`, applies a `freeze + subtree` lock with a stable `switch_entity`
    source_id. On `turn_off`, force-clears every lock source on the location, matching
    the tree row's unlock semantics. State mirrors the location's `is_locked`
    attribute so manual UI locks and service-based locks are reflected here.
    """

    _attr_should_poll = False

    def __init__(
        self,
        entry_id: str,
        location_id: str,
        location_name: str,
        bus: EventBus,
        occupancy_module: OccupancyModule | None = None,
        ha_area_id: str | None = None,
    ) -> None:
        """Initialize the switch."""
        self._entry_id = entry_id
        self._location_id = location_id
        self._location_name = location_name
        self._bus = bus
        self._occupancy_module = occupancy_module
        self._ha_area_id = ha_area_id

        self._attr_unique_id = f"lock_{location_id}"
        self._attr_name = f"{location_name} Lock"
        if ha_area_id:
            self._attr_suggested_area = ha_area_id

        self._attr_is_on = False
        self._attr_extra_state_attributes = {
            "location_id": self._location_id,
            "location_name": self._location_name,
            "locked_by": [],
            "lock_modes": [],
            "direct_locks": [],
        }

    @property
    def icon(self) -> str:
        """Return a closed-padlock icon when locked, open-padlock when unlocked."""
        return "mdi:lock" if self._attr_is_on else "mdi:lock-open-variant-outline"

    def _apply_lock_state(self, payload: Mapping[str, Any]) -> None:
        """Apply lock-related fields from an occupancy payload."""
        self._attr_is_on = bool(payload.get("is_locked", False))
        self._attr_extra_state_attributes = {
            "location_id": self._location_id,
            "location_name": self._location_name,
            "locked_by": payload.get("locked_by", []),
            "lock_modes": payload.get("lock_modes", []),
            "direct_locks": payload.get("direct_locks", []),
        }

    def _hydrate_from_module_state(self) -> bool:
        """Initialize entity state from current occupancy module state."""
        if self._occupancy_module is None:
            return False

        get_state = getattr(self._occupancy_module, "get_location_state", None)
        if not callable(get_state):
            return False

        try:
            payload = get_state(self._location_id)
        except Exception:  # pragma: no cover - defensive logging
            _LOGGER.debug(
                "Failed to hydrate lock state for %s",
                self._location_id,
                exc_info=True,
            )
            return False

        if not isinstance(payload, Mapping):
            return False

        self._apply_lock_state(payload)
        self.async_write_ha_state()
        return True

    def _ensure_registry_area_assignment(self) -> None:
        """Assign this entity to its HA area when location linkage exists."""
        if not self._ha_area_id or self.hass is None or not self.entity_id:
            return

        registry = er.async_get(self.hass)
        entry = registry.async_get(self.entity_id)
        if entry is None or entry.area_id == self._ha_area_id:
            return

        try:
            registry.async_update_entity(self.entity_id, area_id=self._ha_area_id)
        except Exception:  # pragma: no cover - defensive logging
            _LOGGER.debug(
                "Failed to assign lock switch %s to area %s",
                self.entity_id,
                self._ha_area_id,
                exc_info=True,
            )

    async def async_added_to_hass(self) -> None:
        """Subscribe to occupancy events when added."""
        _LOGGER.debug("Lock switch added: %s", self._location_id)
        self._ensure_registry_area_assignment()
        self._hydrate_from_module_state()

        @callback
        def on_occupancy_changed(event: Event) -> None:
            """Update lock state when occupancy events fire (lock state is in the payload)."""
            if event.location_id != self._location_id:
                return
            payload = event.payload
            if not isinstance(payload, Mapping):
                return
            self._apply_lock_state(payload)
            self.async_write_ha_state()

        @callback
        def on_occupancy_signal(event: Event) -> None:
            """Refresh lock state on source-level occupancy activity."""
            if event.location_id != self._location_id:
                return
            self._hydrate_from_module_state()

        self._bus.subscribe(
            on_occupancy_changed,
            EventFilter(event_type="occupancy.changed"),
        )
        self._bus.subscribe(
            on_occupancy_signal,
            EventFilter(event_type="occupancy.signal"),
        )

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Lock the location with freeze + subtree."""
        if self.hass is None:
            return
        await self.hass.services.async_call(
            DOMAIN,
            "lock",
            {
                "entry_id": self._entry_id,
                "location_id": self._location_id,
                "source_id": LOCK_SWITCH_SOURCE_ID,
                "mode": "freeze",
                "scope": "subtree",
            },
            blocking=True,
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Force-clear all lock sources on the location, matching the tree row."""
        if self.hass is None:
            return
        await self.hass.services.async_call(
            DOMAIN,
            "unlock_all",
            {
                "entry_id": self._entry_id,
                "location_id": self._location_id,
            },
            blocking=True,
        )
