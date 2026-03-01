"""Binary sensor platform for Topomation."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from home_topology.core.bus import Event, EventBus, EventFilter
from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

if TYPE_CHECKING:
    from home_topology.modules.occupancy import OccupancyModule

_LOGGER = logging.getLogger(__name__)


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


def _remove_occupancy_entity_for_location(
    hass: HomeAssistant,
    entry: ConfigEntry,
    location_id: str,
) -> str | None:
    """Remove occupancy entity registry entry for one location ID."""
    registry = er.async_get(hass)
    unique_id = f"occupancy_{location_id}"

    entity_id = registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
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
    """Set up binary sensors."""
    _LOGGER.debug("Setting up binary sensor platform")

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    bus = kernel["event_bus"]
    modules = kernel["modules"]
    occupancy_module = modules.get("occupancy")

    # Create occupancy sensor for each location
    entities: list[OccupancyBinarySensor] = []
    sensors_by_location_id: dict[str, OccupancyBinarySensor] = {}
    for location in loc_mgr.all_locations():
        sensor = OccupancyBinarySensor(
            location.id,
            location.name,
            bus,
            occupancy_module=occupancy_module,
            ha_area_id=_location_ha_area_id(location),
        )
        sensors_by_location_id[location.id] = sensor
        entities.append(sensor)

    async_add_entities(entities)
    _LOGGER.info("Created %d binary sensors", len(entities))

    @callback
    def _on_location_created(event: Event) -> None:
        """Add occupancy entities for topology locations created after startup."""
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return
        if location_id in sensors_by_location_id:
            return

        location = loc_mgr.get_location(location_id)
        if location is None:
            return

        sensor = OccupancyBinarySensor(
            location.id,
            location.name,
            bus,
            occupancy_module=occupancy_module,
            ha_area_id=_location_ha_area_id(location),
        )
        sensors_by_location_id[location_id] = sensor
        async_add_entities([sensor])

    @callback
    def _on_location_deleted(event: Event) -> None:
        """Remove occupancy entities when their topology location is deleted."""
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return

        sensors_by_location_id.pop(location_id, None)
        removed_entity = _remove_occupancy_entity_for_location(hass, entry, location_id)
        if removed_entity:
            _LOGGER.debug(
                "Removed occupancy entity %s for deleted location %s",
                removed_entity,
                location_id,
            )

    bus.subscribe(_on_location_created, EventFilter(event_type="location.created"))
    bus.subscribe(_on_location_deleted, EventFilter(event_type="location.deleted"))

    entry.async_on_unload(lambda: bus.unsubscribe(_on_location_created))
    entry.async_on_unload(lambda: bus.unsubscribe(_on_location_deleted))


class OccupancyBinarySensor(BinarySensorEntity):
    """Binary sensor representing location occupancy state."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_should_poll = False

    def __init__(
        self,
        location_id: str,
        location_name: str,
        bus: EventBus,
        occupancy_module: OccupancyModule | None = None,
        ha_area_id: str | None = None,
    ) -> None:
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._bus = bus
        self._occupancy_module = occupancy_module
        self._ha_area_id = ha_area_id

        self._attr_unique_id = f"occupancy_{location_id}"
        self._attr_name = f"{location_name} Occupancy"
        if ha_area_id:
            self._attr_suggested_area = ha_area_id

        self._attr_is_on = False
        self._attr_extra_state_attributes = {
            "location_id": self._location_id,
            "location_name": self._location_name,
        }

    def _effective_timeout_details(self) -> tuple[str | None, int | None]:
        """Read current timeout details for this location."""
        effective_timeout_at = None
        seconds_until_vacant = None
        if self._occupancy_module is None:
            return effective_timeout_at, seconds_until_vacant

        try:
            effective_timeout = self._occupancy_module.get_effective_timeout(self._location_id)
        except Exception:  # pragma: no cover - defensive logging
            _LOGGER.debug(
                "Failed to read effective timeout for %s",
                self._location_id,
                exc_info=True,
            )
            return effective_timeout_at, seconds_until_vacant

        if effective_timeout is not None:
            effective_timeout_at = effective_timeout.isoformat()
            now = datetime.now(UTC)
            seconds_until_vacant = max(
                0,
                int((effective_timeout - now).total_seconds()),
            )
        return effective_timeout_at, seconds_until_vacant

    def _apply_state_payload(self, payload: Mapping[str, Any]) -> None:
        """Apply occupancy payload to HA entity fields."""
        effective_timeout_at, seconds_until_vacant = self._effective_timeout_details()

        self._attr_is_on = bool(payload.get("occupied", False))
        self._attr_extra_state_attributes = {
            "location_id": self._location_id,
            "location_name": self._location_name,
            "locked_by": payload.get("locked_by", []),
            "is_locked": payload.get("is_locked", False),
            "lock_modes": payload.get("lock_modes", []),
            "direct_locks": payload.get("direct_locks", []),
            "contributions": payload.get("contributions", []),
            "effective_timeout_at": effective_timeout_at,
            "vacant_at": effective_timeout_at,
            "seconds_until_vacant": seconds_until_vacant,
            "previous_occupied": payload.get("previous_occupied", False),
            "reason": payload.get("reason"),
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
                "Failed to hydrate occupancy state for %s",
                self._location_id,
                exc_info=True,
            )
            return False

        if not isinstance(payload, Mapping):
            return False

        self._apply_state_payload(payload)
        self.async_write_ha_state()
        _LOGGER.debug(
            "Hydrated occupancy for %s: %s",
            self._location_id,
            "occupied" if self._attr_is_on else "vacant",
        )
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
                "Failed to assign occupancy entity %s to area %s",
                self.entity_id,
                self._ha_area_id,
                exc_info=True,
            )

    async def async_added_to_hass(self) -> None:
        """Subscribe to occupancy events when added."""
        _LOGGER.debug("Binary sensor added: %s", self._location_id)
        self._ensure_registry_area_assignment()
        self._hydrate_from_module_state()

        @callback
        def on_occupancy_changed(event: Event) -> None:
            """Update state when occupancy changes."""
            if event.location_id == self._location_id:
                payload = event.payload
                if not isinstance(payload, Mapping):
                    return
                self._apply_state_payload(payload)
                self.async_write_ha_state()
                _LOGGER.debug(
                    "Updated occupancy for %s: %s",
                    self._location_id,
                    "occupied" if self._attr_is_on else "vacant",
                )

        # Subscribe to occupancy changed events
        self._bus.subscribe(
            on_occupancy_changed,
            EventFilter(event_type="occupancy.changed"),
        )
