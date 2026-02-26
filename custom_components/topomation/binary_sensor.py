"""Binary sensor platform for Topomation."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from home_topology.core.bus import Event, EventBus, EventFilter
from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

if TYPE_CHECKING:
    from home_topology.modules.occupancy import OccupancyModule

_LOGGER = logging.getLogger(__name__)


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
    entities = []
    for location in loc_mgr.all_locations():
        entities.append(
            OccupancyBinarySensor(
                location.id,
                location.name,
                bus,
                occupancy_module=occupancy_module,
            )
        )

    async_add_entities(entities)
    _LOGGER.info("Created %d binary sensors", len(entities))


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
    ) -> None:
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._bus = bus
        self._occupancy_module = occupancy_module

        self._attr_unique_id = f"occupancy_{location_id}"
        self._attr_name = f"{location_name} Occupancy"

        self._attr_is_on = False
        self._attr_extra_state_attributes = {
            "location_id": self._location_id,
            "location_name": self._location_name,
        }

    async def async_added_to_hass(self) -> None:
        """Subscribe to occupancy events when added."""
        _LOGGER.debug("Binary sensor added: %s", self._location_id)

        @callback
        def on_occupancy_changed(event: Event) -> None:
            """Update state when occupancy changes."""
            if event.location_id == self._location_id:
                payload = event.payload
                effective_timeout_at = None
                seconds_until_vacant = None
                if self._occupancy_module is not None:
                    try:
                        effective_timeout = self._occupancy_module.get_effective_timeout(
                            self._location_id
                        )
                    except Exception:  # pragma: no cover - defensive logging
                        _LOGGER.debug(
                            "Failed to read effective timeout for %s",
                            self._location_id,
                            exc_info=True,
                        )
                        effective_timeout = None
                    if effective_timeout is not None:
                        effective_timeout_at = effective_timeout.isoformat()
                        now = datetime.now(UTC)
                        seconds_until_vacant = max(
                            0,
                            int((effective_timeout - now).total_seconds()),
                        )

                self._attr_is_on = payload.get("occupied", False)
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
