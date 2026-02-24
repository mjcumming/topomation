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
SERVICE_NAMES = ("trigger", "clear", "lock", "unlock", "vacate_area")

# Service schemas
SERVICE_TRIGGER_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("timeout", default=300): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional("entry_id"): str,
    }
)

SERVICE_CLEAR_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("trailing_timeout", default=0): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional("entry_id"): str,
    }
)

SERVICE_LOCK_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("entry_id"): str,
    }
)

SERVICE_UNLOCK_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("entry_id"): str,
    }
)

SERVICE_VACATE_AREA_SCHEMA = vol.Schema(
    {
        vol.Required("location_id"): str,
        vol.Optional("source_id", default="manual"): str,
        vol.Optional("include_locked", default=False): bool,
        vol.Optional("entry_id"): str,
    }
)


def _resolve_kernel(hass: HomeAssistant, call: ServiceCall) -> dict[str, object] | None:
    """Resolve integration runtime data for a service call."""
    domain_data: dict[str, dict[str, object]] = hass.data.get(DOMAIN, {})
    if not domain_data:
        _LOGGER.error("Integration not loaded")
        return None

    requested_entry_id = call.data.get("entry_id")
    if requested_entry_id is not None:
        kernel = domain_data.get(requested_entry_id)
        if kernel is None:
            _LOGGER.error("Config entry '%s' not found", requested_entry_id)
            return None
        return kernel

    if len(domain_data) == 1:
        return next(iter(domain_data.values()))

    _LOGGER.error(
        "Multiple Home Topology entries loaded (%s); include service field 'entry_id'",
        ", ".join(domain_data),
    )
    return None


def _get_occupancy_module(kernel: dict[str, object]) -> object | None:
    """Get occupancy module from kernel runtime data."""
    modules = kernel.get("modules")
    if not isinstance(modules, dict):
        _LOGGER.error("Invalid runtime state: modules dictionary missing")
        return None

    occupancy = modules.get("occupancy")
    if occupancy is None:
        _LOGGER.warning("Occupancy module not loaded")
        return None
    return occupancy


def async_register_services(hass: HomeAssistant) -> None:
    """Register Home Topology services."""
    if hass.services.has_service(DOMAIN, "trigger"):
        _LOGGER.debug("Services already registered")
        return

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

        kernel = _resolve_kernel(hass, call)
        if kernel is None:
            return

        occupancy = _get_occupancy_module(kernel)
        if occupancy is None:
            return

        try:
            occupancy.trigger(location_id, source_id, timeout)
        except Exception as err:
            _LOGGER.error("Failed to trigger occupancy: %s", err, exc_info=True)

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

        kernel = _resolve_kernel(hass, call)
        if kernel is None:
            return

        occupancy = _get_occupancy_module(kernel)
        if occupancy is None:
            return

        try:
            if hasattr(occupancy, "clear"):
                occupancy.clear(location_id, source_id, trailing_timeout)
            elif hasattr(occupancy, "release"):
                occupancy.release(location_id, source_id, trailing_timeout)
            else:
                raise AttributeError("occupancy module has neither clear nor release")
        except Exception as err:
            _LOGGER.error("Failed to clear occupancy: %s", err, exc_info=True)

    @callback
    def handle_lock(call: ServiceCall) -> None:
        """Handle lock service call."""
        location_id = call.data["location_id"]
        source_id = call.data.get("source_id", "manual")

        _LOGGER.info("Lock location: %s (source=%s)", location_id, source_id)

        kernel = _resolve_kernel(hass, call)
        if kernel is None:
            return

        occupancy = _get_occupancy_module(kernel)
        if occupancy is None:
            return

        try:
            occupancy.lock(location_id, source_id)
        except Exception as err:
            _LOGGER.error("Failed to lock location: %s", err, exc_info=True)

    @callback
    def handle_unlock(call: ServiceCall) -> None:
        """Handle unlock service call."""
        location_id = call.data["location_id"]
        source_id = call.data.get("source_id", "manual")

        _LOGGER.info("Unlock location: %s (source=%s)", location_id, source_id)

        kernel = _resolve_kernel(hass, call)
        if kernel is None:
            return

        occupancy = _get_occupancy_module(kernel)
        if occupancy is None:
            return

        try:
            occupancy.unlock(location_id, source_id)
        except Exception as err:
            _LOGGER.error("Failed to unlock location: %s", err, exc_info=True)

    @callback
    def handle_vacate_area(call: ServiceCall) -> None:
        """Handle vacate_area service call."""
        location_id = call.data["location_id"]
        source_id = call.data.get("source_id", "manual")
        include_locked = call.data.get("include_locked", False)

        _LOGGER.info(
            "Vacate area (cascading): %s (source=%s, include_locked=%s)",
            location_id,
            source_id,
            include_locked,
        )

        kernel = _resolve_kernel(hass, call)
        if kernel is None:
            return

        occupancy = _get_occupancy_module(kernel)
        if occupancy is None:
            return

        try:
            occupancy.vacate_area(location_id, source_id, include_locked)
        except Exception as err:
            _LOGGER.error("Failed to vacate area: %s", err, exc_info=True)

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


def async_unregister_services(hass: HomeAssistant) -> None:
    """Unregister Home Topology services."""
    for service_name in SERVICE_NAMES:
        if hass.services.has_service(DOMAIN, service_name):
            hass.services.async_remove(DOMAIN, service_name)
