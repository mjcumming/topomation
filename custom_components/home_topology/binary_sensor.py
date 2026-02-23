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
    from home_topology.modules.ambient import AmbientLightModule

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

    # Create occupancy sensor for each location
    entities = []
    for location in loc_mgr.all_locations():
        entities.append(OccupancyBinarySensor(location.id, location.name, bus))

    # Create ambient light binary sensors for each location
    if "ambient" in modules:
        ambient_module = modules["ambient"]
        for location in loc_mgr.all_locations():
            # Add is_dark sensor
            entities.append(
                AmbientLightBinarySensor(
                    location.id,
                    location.name,
                    "is_dark",
                    ambient_module,
                    bus,
                    hass,
                )
            )
            # Add is_bright sensor
            entities.append(
                AmbientLightBinarySensor(
                    location.id,
                    location.name,
                    "is_bright",
                    ambient_module,
                    bus,
                    hass,
                )
            )

    async_add_entities(entities)
    _LOGGER.info("Created %d binary sensors", len(entities))


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
                self._attr_is_on = payload.get("occupied", False)
                self._attr_extra_state_attributes = {
                    "location_id": self._location_id,
                    "location_name": self._location_name,
                    "locked_by": payload.get("locked_by", []),
                    "is_locked": payload.get("is_locked", False),
                    "contributions": payload.get("contributions", []),
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


class AmbientLightBinarySensor(BinarySensorEntity):
    """Binary sensor for is_dark or is_bright state."""

    _attr_device_class = BinarySensorDeviceClass.LIGHT
    _attr_should_poll = False

    def __init__(
        self,
        location_id: str,
        location_name: str,
        sensor_type: str,
        ambient_module: AmbientLightModule,
        bus: EventBus,
        hass: HomeAssistant,
    ) -> None:
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._sensor_type = sensor_type
        self._ambient_module = ambient_module
        self._bus = bus
        self._hass = hass

        self._attr_unique_id = f"ambient_{sensor_type}_{location_id}"
        self._attr_name = f"{location_name} {sensor_type.replace('_', ' ').title()}"

        self._attr_is_on = False
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        """Subscribe to state changes when added."""
        _LOGGER.debug("Ambient binary sensor added: %s (%s)", self._location_id, self._sensor_type)

        @callback
        def on_state_changed(event: Event) -> None:
            """Update when any lux sensor changes."""
            entity_id = event.data.get("entity_id")
            if not entity_id:
                return

            # Get effective sensor for this location
            effective_sensor = self._ambient_module.get_lux_sensor(self._location_id, inherit=True)

            # Update if this is the sensor that changed or if sun changed
            if entity_id == effective_sensor or entity_id == "sun.sun":
                self.update_reading()
                self.async_write_ha_state()
                _LOGGER.debug(
                    "Updated ambient %s for %s: %s",
                    self._sensor_type,
                    self._location_id,
                    "on" if self._attr_is_on else "off",
                )

        # Subscribe to HA state changes
        self.async_on_remove(self._hass.bus.async_listen("state_changed", on_state_changed))

        # Initial update
        self.update_reading()

    def update_reading(self) -> None:
        """Update reading from ambient module."""
        reading = self._ambient_module.get_ambient_light(self._location_id)

        if self._sensor_type == "is_dark":
            self._attr_is_on = reading.is_dark
        elif self._sensor_type == "is_bright":
            self._attr_is_on = reading.is_bright

        self._attr_extra_state_attributes = {
            "lux": reading.lux,
            "source_sensor": reading.source_sensor,
            "source_location": reading.source_location,
            "is_inherited": reading.is_inherited,
            "dark_threshold": reading.dark_threshold,
            "bright_threshold": reading.bright_threshold,
            "fallback_method": reading.fallback_method,
        }
