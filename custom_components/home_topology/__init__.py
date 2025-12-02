"""Home Topology integration for Home Assistant."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .panel import async_register_panel
from .websocket_api import async_register_websocket_api

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    # Platform.BINARY_SENSOR,  # Future: occupancy binary sensors
    # Platform.SENSOR,         # Future: occupancy state sensors
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Home Topology from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # Store entry data
    hass.data[DOMAIN][entry.entry_id] = {
        "entry": entry,
        # TODO: Initialize LocationManager from home-topology library
        # "location_manager": LocationManager(),
    }
    
    # Register the panel (sidebar UI)
    await async_register_panel(hass)
    
    # Register WebSocket API commands
    async_register_websocket_api(hass)
    
    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    _LOGGER.info("Home Topology integration loaded")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    
    return unload_ok

