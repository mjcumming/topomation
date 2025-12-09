"""Service handlers for Home Topology."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, callback

from .const import DOMAIN

if TYPE_CHECKING:
    pass

_LOGGER = logging.getLogger(__name__)

# Service schemas
SERVICE_TRIGGER_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("timeout", default=300): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)

SERVICE_CLEAR_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("trailing_timeout", default=0): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)

SERVICE_LOCK_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
    }
)

SERVICE_UNLOCK_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
    }
)

SERVICE_VACATE_AREA_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
    }
)


def async_register_services(hass: HomeAssistant) -> None:
    """Register Home Topology services."""
    _LOGGER.debug("Registering services")

    @callback
    def handle_trigger(call: ServiceCall) -> None:
        """Handle trigger service call."""
        location_id = call.data["location_id"]
        source_id = call.data.get("source_id", "manual")
        timeout = call.data.get("timeout", 300)

        _LOGGER.info(
            "Manual trigger: location=%s, source=%s, timeout=%d",
            location_id,
            source_id,
            timeout,
        )

        # Get kernel
        entry_ids = list(hass.data[DOMAIN].keys())
        if not entry_ids:
            _LOGGER.error("Integration not loaded")
            return

        kernel = hass.data[DOMAIN][entry_ids[0]]
        modules = kernel["modules"]

        # Call occupancy module
        if "occupancy" in modules:
            occupancy = modules["occupancy"]
            try:
                occupancy.trigger(location_id, source_id, timeout)
            except Exception as e:
                _LOGGER.error("Failed to trigger occupancy: %s", e, exc_info=True)
        else:
            _LOGGER.warning("Occupancy module not loaded")

    @callback
    def handle_clear(call: ServiceCall) -> None:
        """Handle clear service call."""
        location_id = call.data["location_id"]
        source_id = call.data.get("source_id", "manual")
        trailing_timeout = call.data.get("trailing_timeout", 0)

        _LOGGER.info(
            "Manual clear: location=%s, source=%s, trailing=%d",
            location_id,
            source_id,
            trailing_timeout,
        )

        entry_ids = list(hass.data[DOMAIN].keys())
        if not entry_ids:
            _LOGGER.error("Integration not loaded")
            return

        kernel = hass.data[DOMAIN][entry_ids[0]]
        modules = kernel["modules"]

        if "occupancy" in modules:
            occupancy = modules["occupancy"]
            try:
                occupancy.clear(location_id, source_id, trailing_timeout)
            except Exception as e:
                _LOGGER.error("Failed to clear occupancy: %s", e, exc_info=True)
        else:
            _LOGGER.warning("Occupancy module not loaded")

    @callback
    def handle_lock(call: ServiceCall) -> None:
        """Handle lock service call."""
        location_id = call.data["location_id"]

        _LOGGER.info("Lock location: %s", location_id)

        entry_ids = list(hass.data[DOMAIN].keys())
        if not entry_ids:
            _LOGGER.error("Integration not loaded")
            return

        kernel = hass.data[DOMAIN][entry_ids[0]]
        modules = kernel["modules"]

        if "occupancy" in modules:
            occupancy = modules["occupancy"]
            try:
                occupancy.lock(location_id)
            except Exception as e:
                _LOGGER.error("Failed to lock location: %s", e, exc_info=True)
        else:
            _LOGGER.warning("Occupancy module not loaded")

    @callback
    def handle_unlock(call: ServiceCall) -> None:
        """Handle unlock service call."""
        location_id = call.data["location_id"]

        _LOGGER.info("Unlock location: %s", location_id)

        entry_ids = list(hass.data[DOMAIN].keys())
        if not entry_ids:
            _LOGGER.error("Integration not loaded")
            return

        kernel = hass.data[DOMAIN][entry_ids[0]]
        modules = kernel["modules"]

        if "occupancy" in modules:
            occupancy = modules["occupancy"]
            try:
                occupancy.unlock(location_id)
            except Exception as e:
                _LOGGER.error("Failed to unlock location: %s", e, exc_info=True)
        else:
            _LOGGER.warning("Occupancy module not loaded")

    @callback
    def handle_vacate_area(call: ServiceCall) -> None:
        """Handle vacate_area service call."""
        location_id = call.data["location_id"]

        _LOGGER.info("Vacate area (cascading): %s", location_id)

        entry_ids = list(hass.data[DOMAIN].keys())
        if not entry_ids:
            _LOGGER.error("Integration not loaded")
            return

        kernel = hass.data[DOMAIN][entry_ids[0]]
        modules = kernel["modules"]

        if "occupancy" in modules:
            occupancy = modules["occupancy"]
            try:
                occupancy.vacate_area(location_id)
            except Exception as e:
                _LOGGER.error("Failed to vacate area: %s", e, exc_info=True)
        else:
            _LOGGER.warning("Occupancy module not loaded")

    # Register services
    hass.services.async_register(
        DOMAIN,
        "trigger",
        handle_trigger,
        schema=SERVICE_TRIGGER_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "clear",
        handle_clear,
        schema=SERVICE_CLEAR_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "lock",
        handle_lock,
        schema=SERVICE_LOCK_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "unlock",
        handle_unlock,
        schema=SERVICE_UNLOCK_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "vacate_area",
        handle_vacate_area,
        schema=SERVICE_VACATE_AREA_SCHEMA,
    )

    _LOGGER.info("Services registered: trigger, clear, lock, unlock, vacate_area")
