"""Event bridge for translating HA state changes to kernel events."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from homeassistant.const import (
    STATE_OFF,
    STATE_ON,
    STATE_PAUSED,
    STATE_PLAYING,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event

from home_topology import Event, EventBus, LocationManager

if TYPE_CHECKING:
    from homeassistant.core import Event as HAEvent

_LOGGER = logging.getLogger(__name__)


class EventBridge:
    """Bridge HA state changes to kernel events."""

    def __init__(
        self,
        hass: HomeAssistant,
        bus: EventBus,
        loc_mgr: LocationManager,
    ) -> None:
        """Initialize the event bridge."""
        self.hass = hass
        self.bus = bus
        self.loc_mgr = loc_mgr
        self._unsub: callable | None = None

    async def async_setup(self) -> None:
        """Set up the event bridge."""
        _LOGGER.debug("Setting up event bridge")

        # Subscribe to all HA state changes
        self._unsub = async_track_state_change_event(
            self.hass,
            None,  # Listen to all entities
            self._state_changed_listener,
        )

    async def async_teardown(self) -> None:
        """Tear down the event bridge."""
        if self._unsub:
            self._unsub()
            self._unsub = None

    @callback
    def _state_changed_listener(self, event: HAEvent) -> None:
        """Handle HA state change events."""
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")

        if not entity_id or new_state is None:
            return

        # Get location for entity
        location_id = self.loc_mgr.get_entity_location(entity_id)
        if not location_id:
            # Entity not mapped to any location
            return

        # Normalize state
        normalized_old = self._normalize_state(
            old_state.state if old_state else None, new_state.attributes
        )
        normalized_new = self._normalize_state(new_state.state, new_state.attributes)

        # Create kernel event
        kernel_event = Event(
            type="sensor.state_changed",
            source="ha",
            entity_id=entity_id,
            location_id=location_id,
            payload={
                "old_state": normalized_old,
                "new_state": normalized_new,
                "attributes": dict(new_state.attributes),
            },
            timestamp=new_state.last_changed or datetime.now(UTC),
        )

        # Publish to kernel
        try:
            self.bus.publish(kernel_event)
        except Exception as e:
            _LOGGER.error(
                "Error publishing event for %s: %s",
                entity_id,
                e,
                exc_info=True,
            )

    def _normalize_state(self, state: str | None, attributes: dict) -> str | None:
        """Normalize entity state for kernel.

        Handles special cases:
        - Dimmers: brightness=0 treated as OFF
        - Media players: Map playing/paused/idle states
        """
        if state is None:
            return None

        # Handle lights/dimmers
        if state == STATE_ON and "brightness" in attributes:
            brightness = attributes.get("brightness", 0)
            if brightness == 0:
                return STATE_OFF

        # Handle media players
        if state in (STATE_PLAYING, STATE_PAUSED, "idle", "standby"):
            return state

        # Default: return as-is
        return state
