"""Sensor platform for Topomation.

Topomation currently exposes occupancy via binary sensors only.
"""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor platform.

    This platform intentionally publishes no entities.
    """
    _LOGGER.debug("Sensor platform disabled for %s", DOMAIN)
    _ = hass, entry
    async_add_entities([])
