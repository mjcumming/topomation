"""Runtime observers for Topomation occupied/vacant action automations."""

from __future__ import annotations

import json
import logging
from collections.abc import Mapping
from dataclasses import dataclass
from time import monotonic
from typing import TYPE_CHECKING, Any, Literal

from home_topology import Event as KernelEvent
from home_topology import EventBus, EventFilter
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CALLBACK_TYPE, CoreState, HomeAssistant, callback
from homeassistant.core import Event as HAEvent
from homeassistant.helpers.event import async_call_later

from .const import (
    AUTOMATION_REAPPLY_CONFIG_KEY,
    AUTOMATION_STARTUP_BUFFER_SECONDS,
    EVENT_TOPOMATION_ACTIONS_SUMMARY,
    TOPOMATION_AUTOMATION_METADATA_PREFIX,
)

if TYPE_CHECKING:
    from home_topology import LocationManager

ActionTriggerType = Literal["occupied", "vacant"]

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class _TopomationAutomation:
    """Parsed Topomation-owned automation metadata."""

    entity_id: str
    location_id: str
    trigger_type: ActionTriggerType


@dataclass(slots=True)
class _TopomationMetadata:
    """Metadata embedded in Topomation-managed automation descriptions."""

    location_id: str
    trigger_type: ActionTriggerType


def ensure_automation_config_defaults(loc_mgr: LocationManager) -> bool:
    """Ensure per-location automation defaults exist for this integration version."""
    updated = False
    for location in loc_mgr.all_locations():
        config = loc_mgr.get_module_config(location.id, "automation")
        if not isinstance(config, dict):
            continue
        if AUTOMATION_REAPPLY_CONFIG_KEY in config:
            continue

        loc_mgr.set_module_config(
            location.id,
            "automation",
            {
                **config,
                AUTOMATION_REAPPLY_CONFIG_KEY: False,
            },
        )
        updated = True
    return updated


class TopomationActionsRuntime:
    """Observe occupied/vacant transitions and startup reapply for action automations."""

    def __init__(
        self,
        hass: HomeAssistant,
        loc_mgr: LocationManager,
        bus: EventBus,
        *,
        startup_delay_seconds: int = AUTOMATION_STARTUP_BUFFER_SECONDS,
    ) -> None:
        """Initialize runtime helpers."""
        self.hass = hass
        self._loc_mgr = loc_mgr
        self._bus = bus
        self._startup_delay_seconds = startup_delay_seconds
        self._startup_listener_unsub: CALLBACK_TYPE | None = None
        self._startup_delay_unsub: CALLBACK_TYPE | None = None
        self._bus_subscribed = False

    async def async_setup(self) -> None:
        """Set up occupancy transition summaries and optional startup reapply."""
        if not self._bus_subscribed:
            self._bus.subscribe(
                self._handle_occupancy_changed,
                EventFilter(event_type="occupancy.changed"),
            )
            self._bus_subscribed = True

        if not self._has_startup_reapply_enabled():
            return

        if self.hass.state is CoreState.running:
            self._schedule_startup_reapply()
            return

        self._startup_listener_unsub = self.hass.bus.async_listen_once(
            EVENT_HOMEASSISTANT_STARTED,
            self._handle_homeassistant_started,
        )

    async def async_teardown(self) -> None:
        """Tear down event listeners and timers."""
        if self._bus_subscribed:
            self._bus.unsubscribe(self._handle_occupancy_changed)
            self._bus_subscribed = False

        if callable(self._startup_listener_unsub):
            self._startup_listener_unsub()
            self._startup_listener_unsub = None

        if callable(self._startup_delay_unsub):
            self._startup_delay_unsub()
            self._startup_delay_unsub = None

    @callback
    def _handle_homeassistant_started(self, _: HAEvent) -> None:
        """Schedule startup reapply after Home Assistant is fully started."""
        self._schedule_startup_reapply()

    def _schedule_startup_reapply(self) -> None:
        """Delay startup reapply to let entities restore and become available."""
        if callable(self._startup_delay_unsub):
            return

        @callback
        def _run_startup_reapply(_: object) -> None:
            self._startup_delay_unsub = None
            self.hass.async_create_task(self.async_reapply_startup_actions())

        self._startup_delay_unsub = async_call_later(
            self.hass,
            self._startup_delay_seconds,
            _run_startup_reapply,
        )

    async def async_reapply_startup_actions(self) -> None:
        """Apply current occupied/vacant action automations for opted-in locations."""
        for location in self._loc_mgr.all_locations():
            config = self._loc_mgr.get_module_config(location.id, "automation")
            if not isinstance(config, dict):
                continue
            if not bool(config.get(AUTOMATION_REAPPLY_CONFIG_KEY, False)):
                continue
            await self._async_reapply_location(location.id)

    async def _async_reapply_location(self, location_id: str) -> None:
        """Reapply automations for one location based on current occupancy state."""
        start = monotonic()
        occupancy_entity_id = self._find_occupancy_entity(location_id)
        if occupancy_entity_id is None:
            self._emit_summary(
                {
                    "phase": "startup_reapply",
                    "location_id": location_id,
                    "skipped": True,
                    "reason": "missing_occupancy_entity",
                }
            )
            _LOGGER.info(
                "Startup reapply summary: location=%s skipped=missing_occupancy_entity",
                location_id,
            )
            return

        occupancy_state = self.hass.states.get(occupancy_entity_id)
        if occupancy_state is None or occupancy_state.state not in {"on", "off"}:
            self._emit_summary(
                {
                    "phase": "startup_reapply",
                    "location_id": location_id,
                    "skipped": True,
                    "reason": "unknown_occupancy_state",
                    "occupancy_entity_id": occupancy_entity_id,
                    "occupancy_state": occupancy_state.state if occupancy_state else None,
                }
            )
            _LOGGER.info(
                "Startup reapply summary: location=%s skipped=unknown_occupancy_state",
                location_id,
            )
            return

        trigger_type: ActionTriggerType = (
            "occupied" if occupancy_state.state == "on" else "vacant"
        )
        automations = self._automations_for(location_id, trigger_type)
        failures: list[dict[str, str]] = []
        triggered = 0

        for automation_entity_id in automations:
            try:
                await self.hass.services.async_call(
                    "automation",
                    "trigger",
                    {
                        "entity_id": automation_entity_id,
                        "skip_condition": False,
                    },
                    blocking=True,
                )
                triggered += 1
            except Exception as err:
                failures.append(
                    {
                        "automation_entity_id": automation_entity_id,
                        "error": str(err),
                    }
                )
                _LOGGER.warning(
                    "Startup reapply automation failed: location=%s automation=%s error=%s",
                    location_id,
                    automation_entity_id,
                    err,
                )

        duration_ms = int((monotonic() - start) * 1000)
        summary: dict[str, Any] = {
            "phase": "startup_reapply",
            "location_id": location_id,
            "transition": trigger_type,
            "occupancy_entity_id": occupancy_entity_id,
            "total_automations": len(automations),
            "triggered_automations": triggered,
            "failed_automations": len(failures),
            "duration_ms": duration_ms,
        }
        if failures:
            summary["failure_details"] = failures

        self._emit_summary(summary)
        _LOGGER.info(
            (
                "Startup reapply summary: location=%s transition=%s total=%d "
                "triggered=%d failed=%d duration_ms=%d"
            ),
            location_id,
            trigger_type,
            len(automations),
            triggered,
            len(failures),
            duration_ms,
        )

    @callback
    def _handle_occupancy_changed(self, event: KernelEvent) -> None:
        """Log summary for each occupancy transition and matching action automations."""
        location_id = event.location_id
        occupied = event.payload.get("occupied")
        if not isinstance(location_id, str) or not isinstance(occupied, bool):
            return

        trigger_type: ActionTriggerType = "occupied" if occupied else "vacant"
        automations = self._automations_for(location_id, trigger_type)
        summary = {
            "phase": "occupancy_transition",
            "location_id": location_id,
            "transition": trigger_type,
            "total_automations": len(automations),
            "automations": automations,
        }
        self._emit_summary(summary)
        _LOGGER.info(
            "Occupancy action summary: location=%s transition=%s total=%d",
            location_id,
            trigger_type,
            len(automations),
        )

    def _emit_summary(self, payload: dict[str, Any]) -> None:
        """Emit a Home Assistant bus event for action summary observability."""
        self.hass.bus.async_fire(EVENT_TOPOMATION_ACTIONS_SUMMARY, payload)

    def _has_startup_reapply_enabled(self) -> bool:
        """Return True when at least one location opts into startup reapply."""
        for location in self._loc_mgr.all_locations():
            config = self._loc_mgr.get_module_config(location.id, "automation")
            if not isinstance(config, dict):
                continue
            if bool(config.get(AUTOMATION_REAPPLY_CONFIG_KEY, False)):
                return True
        return False

    def _find_occupancy_entity(self, location_id: str) -> str | None:
        """Resolve the occupancy binary sensor entity for a location."""
        for state in self.hass.states.async_all("binary_sensor"):
            entity_id = state.entity_id
            attrs = state.attributes
            if attrs.get("device_class") != "occupancy":
                continue
            if attrs.get("location_id") != location_id:
                continue
            return entity_id
        return None

    def _automations_for(
        self,
        location_id: str,
        trigger_type: ActionTriggerType,
    ) -> list[str]:
        """Collect enabled Topomation automation entity IDs for a location/trigger."""
        matched: list[str] = []
        for automation in self._iter_topomation_automations():
            if automation.location_id != location_id:
                continue
            if automation.trigger_type != trigger_type:
                continue
            matched.append(automation.entity_id)
        return matched

    def _iter_topomation_automations(self) -> list[_TopomationAutomation]:
        """Parse Topomation-managed automation entities from HA automation component."""
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        if component is None:
            return []

        parsed: list[_TopomationAutomation] = []
        for automation_entity in getattr(component, "entities", []):
            entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            if not isinstance(entity_id, str) or not entity_id:
                continue
            if not isinstance(raw_config, Mapping):
                continue
            if not self._is_automation_enabled(entity_id):
                continue

            metadata = self._parse_topomation_metadata(raw_config.get("description"))
            if metadata is None:
                continue
            parsed.append(
                _TopomationAutomation(
                    entity_id=entity_id,
                    location_id=metadata.location_id,
                    trigger_type=metadata.trigger_type,
                )
            )
        return parsed

    def _is_automation_enabled(self, entity_id: str) -> bool:
        """Return True when automation entity is currently enabled."""
        state = self.hass.states.get(entity_id)
        if state is None:
            return True
        return state.state != "off"

    def _parse_topomation_metadata(
        self,
        description: object,
    ) -> _TopomationMetadata | None:
        """Parse topomation metadata JSON from automation description."""
        if not isinstance(description, str):
            return None
        if TOPOMATION_AUTOMATION_METADATA_PREFIX not in description:
            return None

        lines = (
            line.strip()
            for line in description.splitlines()
        )
        for line in lines:
            if not line.startswith(TOPOMATION_AUTOMATION_METADATA_PREFIX):
                continue

            raw_payload = line[len(TOPOMATION_AUTOMATION_METADATA_PREFIX) :].strip()
            if not raw_payload:
                return None
            try:
                parsed = json.loads(raw_payload)
            except json.JSONDecodeError:
                return None

            location_id = parsed.get("location_id")
            trigger_type = parsed.get("trigger_type")
            if not isinstance(location_id, str) or not location_id:
                return None
            if trigger_type not in ("occupied", "vacant"):
                return None
            return _TopomationMetadata(
                location_id=location_id,
                trigger_type=trigger_type,
            )

        return None
