"""Binary sensor platform for Home Topology."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from home_topology.core.bus import Event, EventBus, EventFilter

from .const import DOMAIN

if TYPE_CHECKING:
    pass

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up occupancy binary sensors."""
    _LOGGER.debug("Setting up binary sensor platform")

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    bus = kernel["event_bus"]

    # Create occupancy sensor for each location
    entities = []
    for location in loc_mgr.all_locations():
        entities.append(OccupancyBinarySensor(location.id, location.name, bus))

    async_add_entities(entities)
    _LOGGER.info("Created %d occupancy binary sensors", len(entities))


class OccupancyBinarySensor(BinarySensorEntity):
    """Binary sensor representing location occupancy state."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_should_poll = False

    def __init__(self, location_id: str, location_name: str, bus: EventBus) -> None:
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._bus = bus

        self._attr_unique_id = f"occupancy_{location_id}"
        self._attr_name = f"{location_name} Occupancy"

        self._attr_is_on = False
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        """Subscribe to occupancy events when added."""
        _LOGGER.debug("Binary sensor added: %s", self._location_id)

        @callback
        def on_occupancy_changed(event: Event) -> None:
            """Update state when occupancy changes."""
            if event.location_id == self._location_id:
                payload = event.payload
                self._attr_is_on = payload.get("occupied", False)
                self._attr_extra_state_attributes = {
                    "confidence": payload.get("confidence", 0.0),
                    "active_holds": payload.get("active_holds", []),
                    "expires_at": payload.get("expires_at"),
                    "is_locked": payload.get("is_locked", False),
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
