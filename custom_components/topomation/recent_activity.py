"""Property recent-activity runtime for Topomation."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from typing import Any

from home_topology.core.bus import Event, EventBus, EventFilter

_LOGGER = logging.getLogger(__name__)

MODULE_ID = "recent_activity"
EVENT_RECENT_ACTIVITY_CHANGED = "recent_activity.changed"
DEFAULT_ACTIVITY_WINDOW_HOURS = 48


class TopomationRecentActivityModule:
    """Track property-level recent human/use activity.

    This is deliberately separate from occupancy. Occupancy answers "probably
    occupied now"; recent activity answers "this property has qualifying use
    evidence within the configured window".
    """

    CURRENT_CONFIG_VERSION = 1

    def __init__(self) -> None:
        """Initialize recent-activity state."""
        self._bus: EventBus | None = None
        self._loc_mgr: Any | None = None
        self._state: dict[str, dict[str, Any]] = {}

    def attach(self, bus: EventBus, loc_mgr: Any) -> None:
        """Attach to the kernel event bus and location manager."""
        self._bus = bus
        self._loc_mgr = loc_mgr
        bus.subscribe(self._on_occupancy_changed, EventFilter(event_type="occupancy.changed"))

    def default_config(self) -> dict[str, Any]:
        """Return default recent-activity config."""
        return {
            "enabled": False,
            "window_hours": DEFAULT_ACTIVITY_WINDOW_HOURS,
            "include_descendant_occupancy": True,
        }

    def dump_state(self) -> dict[str, Any]:
        """Persist recent-activity runtime state."""
        return {location_id: dict(state) for location_id, state in self._state.items()}

    def restore_state(self, payload: Any) -> None:
        """Restore persisted recent-activity runtime state."""
        if not isinstance(payload, Mapping):
            return

        restored: dict[str, dict[str, Any]] = {}
        for location_id, raw_state in payload.items():
            if not isinstance(location_id, str) or not isinstance(raw_state, Mapping):
                continue
            normalized = self._normalize_state(raw_state)
            if normalized:
                restored[location_id] = normalized
        self._state = restored

    def get_next_timeout(self) -> datetime | None:
        """Return the next activity expiry that should wake the coordinator."""
        next_timeout: datetime | None = None
        now = datetime.now(UTC)
        for property_id, state in self._state.items():
            if not self._property_activity_config(property_id).get("enabled", False):
                continue
            if not bool(state.get("active", False)):
                continue
            active_until = self._parse_datetime(state.get("active_until"))
            if active_until is None or active_until <= now:
                return now
            if next_timeout is None or active_until < next_timeout:
                next_timeout = active_until
        return next_timeout

    def check_timeouts(self, now: datetime) -> None:
        """Expire active properties whose activity window elapsed."""
        now_utc = now.astimezone(UTC) if now.tzinfo else now.replace(tzinfo=UTC)
        for property_id, state in list(self._state.items()):
            if not bool(state.get("active", False)):
                continue
            active_until = self._parse_datetime(state.get("active_until"))
            if active_until is None or active_until > now_utc:
                continue
            next_state = dict(state)
            next_state["active"] = False
            self._state[property_id] = next_state
            self._publish_changed(property_id, previous_active=True, reason="expired")

    def on_location_config_changed(self, location_id: str, config: Mapping[str, Any]) -> None:
        """React to recent-activity config edits."""
        del config
        if self._location_type_by_id(location_id) != "property":
            self._state.pop(location_id, None)
            return

        state = self._state.get(location_id)
        if state is None:
            self._state[location_id] = self._empty_state()
        self._publish_changed(location_id, previous_active=None, reason="config_changed")

    def get_state(self, property_id: str) -> dict[str, Any]:
        """Return normalized recent-activity state for one property."""
        state = self._normalize_state(self._state.get(property_id, {})) or self._empty_state()
        config = self._property_activity_config(property_id)
        enabled = bool(config.get("enabled", False))
        active_until = self._parse_datetime(state.get("active_until"))
        now = datetime.now(UTC)
        active = enabled and bool(state.get("active", False)) and active_until is not None and active_until > now

        return {
            **state,
            "enabled": enabled,
            "active": active,
            "recently_active": active,
            "window_hours": self._activity_window_hours(config),
        }

    def is_active(self, property_id: str) -> bool:
        """Return True when the property is currently recently active."""
        return bool(self.get_state(property_id).get("active", False))

    def refresh(
        self,
        property_id: str,
        *,
        reason: str,
        source_location_id: str | None = None,
        source_id: str | None = None,
        now: datetime | None = None,
    ) -> None:
        """Mark a property recently active from qualifying evidence."""
        if self._location_type_by_id(property_id) != "property":
            raise ValueError("Recent activity can only be refreshed for property locations")

        config = self._property_activity_config(property_id)
        if not bool(config.get("enabled", False)):
            return

        now_utc = (now or datetime.now(UTC)).astimezone(UTC)
        previous_active = bool(self.get_state(property_id).get("active", False))
        active_until = now_utc + timedelta(hours=self._activity_window_hours(config))
        self._state[property_id] = {
            "active": True,
            "last_activity_at": now_utc.isoformat(),
            "active_until": active_until.isoformat(),
            "reason": reason,
            "source_location_id": source_location_id,
            "source_id": source_id,
        }
        self._publish_changed(property_id, previous_active=previous_active, reason=reason)

    def _on_occupancy_changed(self, event: Event) -> None:
        """Refresh ancestor property activity from descendant occupancy edges."""
        payload = event.payload if isinstance(event.payload, Mapping) else {}
        if payload.get("occupied") is not True:
            return

        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return

        for property_id in self._ancestor_property_ids(location_id):
            config = self._property_activity_config(property_id)
            if not bool(config.get("include_descendant_occupancy", True)):
                continue
            self.refresh(
                property_id,
                reason="descendant_occupancy",
                source_location_id=location_id,
                source_id=str(payload.get("source_id", "") or "") or None,
                now=event.timestamp,
            )

    def _ancestor_property_ids(self, location_id: str) -> list[str]:
        if self._loc_mgr is None:
            return []
        try:
            ancestors = list(self._loc_mgr.ancestors_of(location_id))
        except Exception:  # pragma: no cover - defensive adapter boundary
            _LOGGER.debug("Failed to read ancestors for %s", location_id, exc_info=True)
            return []

        return [
            str(getattr(ancestor, "id", ""))
            for ancestor in ancestors
            if self._location_type(ancestor) == "property"
        ]

    def _property_activity_config(self, property_id: str) -> dict[str, Any]:
        if self._loc_mgr is None:
            return self.default_config()
        location = self._loc_mgr.get_location(property_id)
        if location is None:
            return self.default_config()
        modules = getattr(location, "modules", {}) or {}
        config = modules.get(MODULE_ID, {}) if isinstance(modules, Mapping) else {}
        if not isinstance(config, Mapping):
            config = {}
        merged = self.default_config()
        merged.update(dict(config))
        return merged

    def _location_type_by_id(self, location_id: str) -> str:
        if self._loc_mgr is None:
            return ""
        location = self._loc_mgr.get_location(location_id)
        return self._location_type(location)

    @staticmethod
    def _location_type(location: Any) -> str:
        modules = getattr(location, "modules", {}) or {}
        meta = modules.get("_meta", {}) if isinstance(modules, Mapping) else {}
        if not isinstance(meta, Mapping):
            return ""
        return str(meta.get("type", "") or "").strip().lower()

    @staticmethod
    def _activity_window_hours(config: Mapping[str, Any]) -> float:
        try:
            value = float(config.get("window_hours", DEFAULT_ACTIVITY_WINDOW_HOURS))
        except (TypeError, ValueError):
            value = DEFAULT_ACTIVITY_WINDOW_HOURS
        return max(1.0, min(value, 24.0 * 30.0))

    @staticmethod
    def _parse_datetime(value: Any) -> datetime | None:
        if isinstance(value, datetime):
            return value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)
        if not isinstance(value, str) or not value.strip():
            return None
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        return parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)

    @classmethod
    def _normalize_state(cls, raw_state: Mapping[str, Any]) -> dict[str, Any]:
        last_activity_at = cls._parse_datetime(raw_state.get("last_activity_at"))
        active_until = cls._parse_datetime(raw_state.get("active_until"))
        state: dict[str, Any] = {
            "active": bool(raw_state.get("active", False)),
            "last_activity_at": last_activity_at.isoformat() if last_activity_at else None,
            "active_until": active_until.isoformat() if active_until else None,
        }
        for key in ("reason", "source_location_id", "source_id"):
            value = raw_state.get(key)
            state[key] = str(value).strip() if isinstance(value, str) and value.strip() else None
        return state

    @staticmethod
    def _empty_state() -> dict[str, Any]:
        return {
            "active": False,
            "last_activity_at": None,
            "active_until": None,
            "reason": None,
            "source_location_id": None,
            "source_id": None,
        }

    def _publish_changed(
        self,
        property_id: str,
        *,
        previous_active: bool | None,
        reason: str,
    ) -> None:
        if self._bus is None:
            return
        state = self.get_state(property_id)
        self._bus.publish(
            Event(
                type=EVENT_RECENT_ACTIVITY_CHANGED,
                source="topomation_recent_activity",
                location_id=property_id,
                payload={
                    **state,
                    "previous_active": previous_active,
                    "reason": state.get("reason") or reason,
                },
            )
        )
