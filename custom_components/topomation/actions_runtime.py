"""Runtime observers for Topomation occupied/vacant action automations."""

from __future__ import annotations

import json
import logging
from collections.abc import Mapping
from dataclasses import dataclass
from time import monotonic
from typing import TYPE_CHECKING, Any, Literal, cast

from home_topology import Event as KernelEvent
from home_topology import EventBus, EventFilter
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CALLBACK_TYPE, CoreState, HomeAssistant, callback
from homeassistant.core import Event as HAEvent
from homeassistant.helpers.event import async_call_later

from .const import (
    AUTOMATION_STARTUP_BUFFER_SECONDS,
    EVENT_TOPOMATION_ACTIONS_SUMMARY,
    TOPOMATION_AUTOMATION_METADATA_PREFIX,
)

if TYPE_CHECKING:
    from home_topology import LocationManager

ManagedActionTriggerType = Literal["on_occupied", "on_vacant", "on_dark", "on_bright"]
OccupancyActionTriggerType = Literal["on_occupied", "on_vacant"]

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class _TopomationAutomation:
    """Parsed Topomation-owned automation metadata."""

    entity_id: str
    location_id: str
    trigger_type: ManagedActionTriggerType
    run_on_startup: bool | None


@dataclass(slots=True)
class _TopomationMetadata:
    """Metadata embedded in Topomation-managed automation descriptions."""

    location_id: str
    trigger_type: ManagedActionTriggerType
    run_on_startup: bool | None


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
        """Apply startup-eligible automations for opted-in locations."""
        automations = self._iter_topomation_automations()
        automations_by_location: dict[str, list[_TopomationAutomation]] = {}
        for automation in automations:
            automations_by_location.setdefault(automation.location_id, []).append(automation)

        for location in self._loc_mgr.all_locations():
            location_automations = automations_by_location.get(location.id, [])
            if not any(
                automation.run_on_startup is True for automation in location_automations
            ):
                continue
            await self._async_reapply_location(
                location.id,
                automations=location_automations,
            )

    async def _async_reapply_location(
        self,
        location_id: str,
        *,
        automations: list[_TopomationAutomation] | None = None,
    ) -> None:
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

        trigger_type: OccupancyActionTriggerType = (
            "on_occupied" if occupancy_state.state == "on" else "on_vacant"
        )
        transition_label = "occupied" if trigger_type == "on_occupied" else "vacant"
        matched_automations = self._startup_automations_for(
            location_id,
            trigger_type=trigger_type,
            automations=automations,
        )
        failures: list[dict[str, str]] = []
        triggered = 0

        for automation_entity_id in matched_automations:
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
            "transition": transition_label,
            "occupancy_entity_id": occupancy_entity_id,
            "total_automations": len(matched_automations),
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
            transition_label,
            len(matched_automations),
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

        trigger_type: OccupancyActionTriggerType = "on_occupied" if occupied else "on_vacant"
        transition_label = "occupied" if trigger_type == "on_occupied" else "vacant"
        automations = self._automations_for(location_id, trigger_type)
        summary = {
            "phase": "occupancy_transition",
            "location_id": location_id,
            "transition": transition_label,
            "total_automations": len(automations),
            "automations": automations,
        }
        self._emit_summary(summary)
        _LOGGER.info(
            "Occupancy action summary: location=%s transition=%s total=%d",
            location_id,
            transition_label,
            len(automations),
        )

    def _emit_summary(self, payload: dict[str, Any]) -> None:
        """Emit a Home Assistant bus event for action summary observability."""
        self.hass.bus.async_fire(EVENT_TOPOMATION_ACTIONS_SUMMARY, payload)

    def _has_startup_reapply_enabled(self) -> bool:
        """Return True when at least one rule opts into startup reapply."""
        return any(
            automation.run_on_startup is True
            for automation in self._iter_topomation_automations()
        )

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
        trigger_type: OccupancyActionTriggerType,
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

    def _startup_automations_for(
        self,
        location_id: str,
        *,
        trigger_type: OccupancyActionTriggerType,
        automations: list[_TopomationAutomation] | None = None,
    ) -> list[str]:
        """Collect startup-eligible automations for a location/current occupancy state."""
        matched: list[str] = []
        source_automations = (
            automations if automations is not None else self._iter_topomation_automations()
        )
        for automation in source_automations:
            if automation.location_id != location_id:
                continue
            if automation.run_on_startup is False:
                continue
            if automation.trigger_type == "on_occupied" and trigger_type != "on_occupied":
                continue
            if automation.trigger_type == "on_vacant" and trigger_type != "on_vacant":
                continue
            if automation.run_on_startup is True:
                matched.append(automation.entity_id)
        return matched

    def _iter_topomation_automations(self) -> list[_TopomationAutomation]:
        """Parse Topomation-managed automation entities from HA automation component."""
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        if component is None:
            return []

        raw_entities = getattr(component, "entities", [])
        automation_entities = (
            list(raw_entities.values())
            if isinstance(raw_entities, Mapping)
            else list(raw_entities)
        )
        parsed: list[_TopomationAutomation] = []
        for automation_entity in automation_entities:
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
                    run_on_startup=metadata.run_on_startup,
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
            normalized_trigger_type = str(trigger_type or "").strip().lower()
            if normalized_trigger_type == "occupied":
                normalized_trigger_type = "on_occupied"
            elif normalized_trigger_type == "vacant":
                normalized_trigger_type = "on_vacant"
            if normalized_trigger_type not in (
                "on_occupied",
                "on_vacant",
                "on_dark",
                "on_bright",
            ):
                continue
            run_on_startup = parsed.get("run_on_startup")
            return _TopomationMetadata(
                location_id=location_id,
                trigger_type=cast(ManagedActionTriggerType, normalized_trigger_type),
                run_on_startup=run_on_startup if isinstance(run_on_startup, bool) else None,
            )

        return None
