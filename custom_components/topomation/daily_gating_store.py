"""Persistent fired-today state for daily-gated action rules (ADR-HA-091).

Keeps last-fired ISO local-date per ``rule_uuid``. Separated from rule
metadata so dispatch doesn't rewrite the automation YAML on every fire.
"""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_STORAGE_VERSION = 1
_STORAGE_KEY = f"{DOMAIN}.daily_gating"
_FIRED_TODAY_KEY = "fired_today"

_LOGGER = logging.getLogger(__name__)


class DailyGatingStore:
    """Async-loaded, in-memory cache of per-rule last-fired dates."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store wrapper."""
        self._store: Store[dict] = Store(hass, _STORAGE_VERSION, _STORAGE_KEY)
        self._fired_today: dict[str, str] = {}
        self._loaded = False

    async def async_load(self) -> None:
        """Load persisted fired-today state into memory."""
        data = await self._store.async_load()
        if data and isinstance(data.get(_FIRED_TODAY_KEY), dict):
            self._fired_today = {
                str(rule_uuid): str(iso_date)
                for rule_uuid, iso_date in data[_FIRED_TODAY_KEY].items()
                if isinstance(rule_uuid, str) and isinstance(iso_date, str)
            }
        else:
            self._fired_today = {}
        self._loaded = True

    def get_last_fired(self, rule_uuid: str) -> str | None:
        """Return the ISO local-date the given rule last fired, or None."""
        return self._fired_today.get(rule_uuid)

    async def async_mark_fired(self, rule_uuid: str, today_local_date: str) -> None:
        """Record a successful dispatch for the given rule and persist."""
        self._fired_today[rule_uuid] = today_local_date
        await self._async_save()

    async def async_clear_rule(self, rule_uuid: str) -> None:
        """Drop fired-today state for a rule (call when rule is deleted)."""
        if self._fired_today.pop(rule_uuid, None) is not None:
            await self._async_save()

    async def _async_save(self) -> None:
        await self._store.async_save({_FIRED_TODAY_KEY: dict(self._fired_today)})
