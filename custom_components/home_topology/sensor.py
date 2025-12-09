"""Sensor platform for Home Topology."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
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
    """Set up sensor platform."""
    _LOGGER.debug("Setting up sensor platform")

    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["location_manager"]
    bus = kernel["event_bus"]
    modules = kernel["modules"]

    # Create ambient light sensors for each location
    entities = []
    if "ambient" in modules:
        ambient_module = modules["ambient"]
        for location in loc_mgr.all_locations():
            entities.append(
                AmbientLightSensor(location.id, location.name, ambient_module, bus, hass)
            )

    async_add_entities(entities)
    _LOGGER.info("Created %d sensor entities", len(entities))


class AmbientLightSensor(SensorEntity):
    """Sensor showing ambient light level for a location."""

    _attr_device_class = SensorDeviceClass.ILLUMINANCE
    _attr_native_unit_of_measurement = "lx"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_should_poll = False

    def __init__(
        self,
        location_id: str,
        location_name: str,
        ambient_module: AmbientLightModule,
        bus: EventBus,
        hass: HomeAssistant,
    ) -> None:
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._ambient_module = ambient_module
        self._bus = bus
        self._hass = hass

        self._attr_unique_id = f"ambient_light_{location_id}"
        self._attr_name = f"{location_name} Ambient Light"

        self._attr_native_value = None
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        """Subscribe to state changes when added."""
        _LOGGER.debug("Ambient light sensor added: %s", self._location_id)

        @callback
        def on_state_changed(event: Event) -> None:
            """Update when any lux sensor changes."""
            entity_id = event.data.get("entity_id")
            if not entity_id:
                return

            # Get effective sensor for this location
            effective_sensor = self._ambient_module.get_lux_sensor(self._location_id, inherit=True)

            # Update if this is the sensor that changed
            if entity_id == effective_sensor:
                self.update_reading()
                self.async_write_ha_state()
                _LOGGER.debug(
                    "Updated ambient light for %s: %s lx",
                    self._location_id,
                    self._attr_native_value,
                )

        # Subscribe to HA state changes
        self.async_on_remove(self._hass.bus.async_listen("state_changed", on_state_changed))

        # Subscribe to sun.sun changes (for fallback)
        @callback
        def on_sun_changed(event: Event) -> None:
            """Update when sun state changes (for fallback)."""
            entity_id = event.data.get("entity_id")
            if entity_id == "sun.sun":
                # Only update if we're using sun fallback
                reading = self._ambient_module.get_ambient_light(self._location_id)
                if reading.fallback_method == "sun_position":
                    self.update_reading()
                    self.async_write_ha_state()

        self.async_on_remove(self._hass.bus.async_listen("state_changed", on_sun_changed))

        # Initial update
        self.update_reading()

    def update_reading(self) -> None:
        """Update reading from ambient module."""
        reading = self._ambient_module.get_ambient_light(self._location_id)

        self._attr_native_value = reading.lux
        self._attr_extra_state_attributes = {
            "source_sensor": reading.source_sensor,
            "source_location": reading.source_location,
            "is_inherited": reading.is_inherited,
            "is_dark": reading.is_dark,
            "is_bright": reading.is_bright,
            "dark_threshold": reading.dark_threshold,
            "bright_threshold": reading.bright_threshold,
            "fallback_method": reading.fallback_method,
        }
