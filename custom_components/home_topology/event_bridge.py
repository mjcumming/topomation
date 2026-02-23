"""Event bridge for translating HA state changes to occupancy v3 signals."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from homeassistant.const import (
    EVENT_STATE_CHANGED,
    STATE_OFF,
    STATE_ON,
    STATE_PAUSED,
    STATE_PLAYING,
)
from homeassistant.core import HomeAssistant, callback

from home_topology import Event, EventBus, LocationManager

if TYPE_CHECKING:
    from homeassistant.core import Event as HAEvent

_LOGGER = logging.getLogger(__name__)


class EventBridge:
    """Bridge HA state changes to normalized occupancy.signal events."""

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
        self._unsub = self.hass.bus.async_listen(
            EVENT_STATE_CHANGED,
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
        domain = entity_id.split(".", 1)[0]
        normalized_old = self._normalize_state(
            old_state.state if old_state else None,
            old_state.attributes if old_state else {},
        )
        normalized_new = self._normalize_state(new_state.state, new_state.attributes)
        signal_type = None
        if domain == "media_player":
            signal_type = self._media_state_to_signal_type(
                old_state=old_state,
                new_state=new_state,
                old_normalized=normalized_old,
                new_normalized=normalized_new,
            )
        if signal_type is None:
            signal_type = self._state_to_signal_type(normalized_old, normalized_new)
        if signal_type is None:
            return

        # Create kernel occupancy signal event (core occupancy v3 API)
        kernel_event = Event(
            type="occupancy.signal",
            source="ha",
            entity_id=entity_id,
            location_id=location_id,
            payload={
                "event_type": signal_type,
                "source_id": entity_id,
                "old_state": normalized_old,
                "new_state": normalized_new,
                "attributes": dict(new_state.attributes),
            },
            timestamp=new_state.last_changed or datetime.now(UTC),
        )

        # Publish to kernel
        try:
            self.bus.publish(kernel_event)
        except Exception as e:  # noqa: BLE001
            _LOGGER.error(
                "Error publishing event for %s: %s",
                entity_id,
                e,
                exc_info=True,
            )

    def _state_to_signal_type(
        self,
        old_state: str | None,
        new_state: str | None,
    ) -> str | None:
        """Map normalized HA states to occupancy v3 trigger/clear signals."""
        if old_state == new_state or new_state is None:
            return None

        trigger_states = {
            STATE_ON,
            "open",
            STATE_PLAYING,
            "home",
            "occupied",
            "active",
            "detected",
            "motion",
            "true",
        }
        clear_states = {
            STATE_OFF,
            "closed",
            "away",
            "not_home",
            "unoccupied",
            "inactive",
            "clear",
            "false",
        }

        if new_state in trigger_states:
            return "trigger"
        if new_state in clear_states:
            return "clear"
        return None

    def _media_state_to_signal_type(
        self,
        old_state: Any,
        new_state: Any,
        old_normalized: str | None,
        new_normalized: str | None,
    ) -> str | None:
        """Map media player changes to occupancy signals.

        Media occupancy should come from user interactions:
        - playback transition into playing
        - volume or mute changes
        """
        if old_normalized != STATE_PLAYING and new_normalized == STATE_PLAYING:
            return "trigger"

        old_attrs = dict(old_state.attributes) if old_state else {}
        new_attrs = dict(new_state.attributes) if new_state else {}
        if self._media_interaction_changed(old_attrs, new_attrs):
            return "trigger"

        return None

    def _media_interaction_changed(
        self,
        old_attrs: dict[str, Any],
        new_attrs: dict[str, Any],
    ) -> bool:
        """Return true when media interaction attributes changed."""
        for key in ("volume_level", "is_volume_muted"):
            if old_attrs.get(key) != new_attrs.get(key):
                return True
        return False

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
