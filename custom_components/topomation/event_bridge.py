"""Event bridge for translating HA state changes to occupancy v3 signals."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from home_topology import Event, EventBus, LocationManager
from homeassistant.const import (
    EVENT_STATE_CHANGED,
    STATE_OFF,
    STATE_ON,
    STATE_PAUSED,
    STATE_PLAYING,
)
from homeassistant.core import HomeAssistant, callback

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
        occupancy_module: Any | None = None,
    ) -> None:
        """Initialize the event bridge."""
        self.hass = hass
        self.bus = bus
        self.loc_mgr = loc_mgr
        self.occupancy = occupancy_module
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

    async def async_reconcile_policy_sources(self) -> None:
        """Apply policy mappings against current HA state at startup."""
        if self.occupancy is None:
            return

        for entity_id in self._policy_entity_ids():
            state = self.hass.states.get(entity_id)
            if state is None:
                continue
            actions = self._resolve_policy_actions(entity_id, state.state)
            self._execute_policy_actions(actions)

    @callback
    def _state_changed_listener(self, event: HAEvent) -> None:
        """Handle HA state change events."""
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")

        if not entity_id or new_state is None:
            return

        policy_actions = self._resolve_policy_actions(entity_id, new_state.state)
        self._execute_policy_actions(policy_actions)

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
        signal_type: str | None = None
        signal_key: str | None = None
        if domain == "media_player":
            media_signal = self._media_state_to_signal(
                old_state=old_state,
                new_state=new_state,
                old_normalized=normalized_old,
                new_normalized=normalized_new,
            )
            if media_signal is not None:
                signal_type, signal_key = media_signal
        elif domain == "light":
            light_signal = self._light_state_to_signal(
                old_state=old_state,
                new_state=new_state,
                old_normalized=normalized_old,
                new_normalized=normalized_new,
            )
            if light_signal is not None:
                signal_type, signal_key = light_signal
        if signal_type is None:
            signal_type = self._state_to_signal_type(normalized_old, normalized_new)
        if signal_type is None:
            return

        occupancy_config = self.loc_mgr.get_module_config(location_id, "occupancy")
        if not isinstance(occupancy_config, dict):
            return
        configured_sources = occupancy_config.get("occupancy_sources")
        if not isinstance(configured_sources, list) or not configured_sources:
            return

        source_events = self._resolve_source_events(
            configured_sources=configured_sources,
            entity_id=entity_id,
            signal_type=signal_type,
            signal_key=signal_key,
        )
        if not source_events:
            return

        for source_event in source_events:
            payload = {
                "event_type": source_event["event_type"],
                "source_id": source_event["source_id"],
                "signal_key": signal_key,
                "old_state": normalized_old,
                "new_state": normalized_new,
                "attributes": dict(new_state.attributes),
            }
            if source_event["timeout_set"]:
                payload["timeout"] = source_event["timeout"]

            kernel_event = Event(
                type="occupancy.signal",
                source="ha",
                entity_id=entity_id,
                location_id=location_id,
                payload=payload,
                timestamp=new_state.last_changed or datetime.now(UTC),
            )

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

    def _media_state_to_signal(
        self,
        old_state: Any,
        new_state: Any,
        old_normalized: str | None,
        new_normalized: str | None,
    ) -> tuple[str, str] | None:
        """Map media player changes to occupancy signals and signal keys.

        Media occupancy can come from:
        - playback transition into playing (trigger/playback)
        - playback transition out of playing into paused/idle/standby/off (clear/playback)
        - volume changes (trigger/volume)
        - mute changes (trigger/mute)
        """
        if old_normalized != STATE_PLAYING and new_normalized == STATE_PLAYING:
            return ("trigger", "playback")

        clear_states = {STATE_PAUSED, "idle", "standby", STATE_OFF}
        old_is_clear = old_normalized in clear_states
        new_is_clear = new_normalized in clear_states
        if not old_is_clear and new_is_clear:
            return ("clear", "playback")

        old_attrs = dict(old_state.attributes) if old_state else {}
        new_attrs = dict(new_state.attributes) if new_state else {}
        if old_attrs.get("volume_level") != new_attrs.get("volume_level"):
            return ("trigger", "volume")
        if old_attrs.get("is_volume_muted") != new_attrs.get("is_volume_muted"):
            return ("trigger", "mute")

        return None

    def _light_state_to_signal(
        self,
        old_state: Any,
        new_state: Any,
        old_normalized: str | None,
        new_normalized: str | None,
    ) -> tuple[str, str] | None:
        """Map light/dimmer changes to occupancy signals with signal keys.

        Light occupancy can come from:
        - power ON transition (trigger/power)
        - power OFF transition (clear/power)
        - level/brightness changes while ON (trigger/level)
        - color changes while ON (trigger/color)
        """
        if old_normalized != new_normalized:
            if new_normalized == STATE_ON:
                return ("trigger", "power")
            if new_normalized == STATE_OFF:
                return ("clear", "power")

        old_attrs = dict(old_state.attributes) if old_state else {}
        new_attrs = dict(new_state.attributes) if new_state else {}
        old_brightness = old_attrs.get("brightness")
        new_brightness = new_attrs.get("brightness")
        if (
            old_normalized == STATE_ON
            and new_normalized == STATE_ON
            and old_brightness is not None
            and new_brightness is not None
            and old_brightness != new_brightness
        ):
            return ("trigger", "level")

        if old_normalized == STATE_ON and new_normalized == STATE_ON:
            color_attrs = (
                "rgb_color",
                "hs_color",
                "xy_color",
                "color_temp",
                "color_temp_kelvin",
            )
            for attr in color_attrs:
                if old_attrs.get(attr) != new_attrs.get(attr):
                    return ("trigger", "color")

        return None

    def _resolve_source_events(
        self,
        configured_sources: list[Any],
        entity_id: str,
        signal_type: str,
        signal_key: str | None,
    ) -> list[dict[str, Any]]:
        """Resolve configured source records for an incoming entity signal."""
        resolved: list[dict[str, Any]] = []

        for source in configured_sources:
            if not isinstance(source, dict):
                continue
            if source.get("entity_id") != entity_id:
                continue

            configured_signal_key = source.get("signal_key")
            is_media_entity = entity_id.startswith("media_player.")
            if is_media_entity:
                if configured_signal_key not in {"playback", "volume", "mute"}:
                    continue
                if configured_signal_key != signal_key:
                    continue
            elif configured_signal_key and configured_signal_key != signal_key:
                continue

            if signal_type == "trigger":
                if source.get("on_event", "trigger") != "trigger":
                    continue
                timeout_set = "on_timeout" in source
                timeout = source.get("on_timeout") if timeout_set else None
            elif signal_type == "clear":
                if source.get("off_event", "none") != "clear":
                    continue
                off_trailing = source.get("off_trailing", 0)
                try:
                    off_trailing = int(off_trailing)
                except (TypeError, ValueError):
                    off_trailing = 0
                if off_trailing <= 0:
                    timeout_set = False
                    timeout = None
                    signal_event_type = "vacate"
                else:
                    timeout_set = True
                    timeout = off_trailing
                    signal_event_type = "clear"
            else:
                continue

            source_id = source.get("source_id")
            if not source_id:
                source_id = entity_id if not configured_signal_key else f"{entity_id}::{configured_signal_key}"

            resolved.append(
                {
                    "event_type": signal_event_type if signal_type == "clear" else signal_type,
                    "source_id": source_id,
                    "timeout_set": timeout_set,
                    "timeout": timeout,
                }
            )

        return resolved

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

    def _policy_entity_ids(self) -> set[str]:
        """Collect configured policy source entities across all locations."""
        entity_ids: set[str] = set()
        for location in self._all_locations():
            occupancy_config = self.loc_mgr.get_module_config(location.id, "occupancy")
            if not isinstance(occupancy_config, dict):
                continue
            policy_sources = occupancy_config.get("policy_sources")
            if not isinstance(policy_sources, list):
                continue
            for source in policy_sources:
                if not isinstance(source, dict):
                    continue
                entity_id = source.get("entity_id")
                if isinstance(entity_id, str) and entity_id:
                    entity_ids.add(entity_id)
        return entity_ids

    def _resolve_policy_actions(
        self,
        entity_id: str,
        new_state: str | None,
    ) -> list[dict[str, Any]]:
        """Resolve configured policy actions for a state change."""
        if new_state is None:
            return []

        normalized_state = str(new_state).strip().lower()
        resolved: list[dict[str, Any]] = []
        for location in self._all_locations():
            occupancy_config = self.loc_mgr.get_module_config(location.id, "occupancy")
            if not isinstance(occupancy_config, dict):
                continue

            policy_sources = occupancy_config.get("policy_sources")
            if not isinstance(policy_sources, list):
                continue

            for source in policy_sources:
                if not isinstance(source, dict):
                    continue
                if source.get("entity_id") != entity_id:
                    continue

                state_map = source.get("state_map")
                if not isinstance(state_map, dict):
                    continue

                mapping = state_map.get(new_state)
                if mapping is None:
                    mapping = state_map.get(normalized_state)
                if mapping is None:
                    continue

                mapping_config: dict[str, Any]
                if isinstance(mapping, str):
                    mapping_config = {"action": mapping}
                elif isinstance(mapping, dict):
                    mapping_config = mapping
                else:
                    continue

                action = str(mapping_config.get("action", "")).strip().lower()
                if action != "vacate_area":
                    continue

                source_id = source.get("source_id")
                if not isinstance(source_id, str) or not source_id:
                    source_id = f"policy::{entity_id}"

                include_locked = bool(mapping_config.get("include_locked", True))
                for target in self._resolve_policy_targets(source, default_target=location.id):
                    resolved.append(
                        {
                            "action": "vacate_area",
                            "location_id": target,
                            "source_id": source_id,
                            "include_locked": include_locked,
                        }
                    )

        return resolved

    def _resolve_policy_targets(
        self,
        source: dict[str, Any],
        *,
        default_target: str,
    ) -> list[str]:
        """Resolve policy target location IDs from source configuration."""
        targets = source.get("targets")
        if not isinstance(targets, list) or not targets:
            return [default_target]

        if any(str(item).strip().lower() == "all_roots" for item in targets):
            root_targets = self._root_location_ids()
            return root_targets or [default_target]

        resolved: list[str] = []
        seen: set[str] = set()
        for target in targets:
            if not isinstance(target, str) or not target:
                continue
            if target in seen:
                continue
            if self.loc_mgr.get_location(target) is None:
                continue
            seen.add(target)
            resolved.append(target)

        return resolved or [default_target]

    def _execute_policy_actions(self, actions: list[dict[str, Any]]) -> None:
        """Execute resolved policy actions against occupancy module."""
        if not actions or self.occupancy is None:
            return

        for action in actions:
            if action.get("action") != "vacate_area":
                continue
            location_id = action.get("location_id")
            source_id = action.get("source_id", "policy")
            include_locked = bool(action.get("include_locked", True))
            if not isinstance(location_id, str) or not location_id:
                continue
            if not isinstance(source_id, str) or not source_id:
                source_id = "policy"
            try:
                self.occupancy.vacate_area(location_id, source_id, include_locked)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error(
                    "Failed policy vacate for %s (source=%s): %s",
                    location_id,
                    source_id,
                    err,
                    exc_info=True,
                )

    def _all_locations(self) -> list[Any]:
        """Safely return all known locations."""
        try:
            all_locations = self.loc_mgr.all_locations()
        except Exception:  # noqa: BLE001
            return []
        if isinstance(all_locations, list):
            return all_locations
        try:
            return list(all_locations)
        except TypeError:
            return []

    def _root_location_ids(self) -> list[str]:
        """Return location IDs for all top-level roots in the topology."""
        roots: list[str] = []
        for location in self._all_locations():
            if getattr(location, "parent_id", None) is None:
                loc_id = getattr(location, "id", None)
                if isinstance(loc_id, str) and loc_id:
                    roots.append(loc_id)
        return roots
