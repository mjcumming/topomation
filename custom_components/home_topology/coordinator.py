"""Coordinator for module timeout scheduling."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time

if TYPE_CHECKING:
    pass

_LOGGER = logging.getLogger(__name__)


class HomeTopologyCoordinator:
    """Coordinator for scheduling module timeout checks."""

    def __init__(self, hass: HomeAssistant, modules: dict[str, Any]) -> None:
        """Initialize the coordinator."""
        self.hass = hass
        self.modules = modules
        self._timeout_cancel: callable | None = None

    def schedule_next_timeout(self) -> None:
        """Schedule the next timeout check across all modules."""
        # Cancel existing timer
        if self._timeout_cancel:
            self._timeout_cancel()
            self._timeout_cancel = None

        # Find earliest timeout across all modules
        next_timeout: datetime | None = None
        next_module: str | None = None

        for module_id, module in self.modules.items():
            if not hasattr(module, "get_next_timeout"):
                continue

            try:
                module_timeout = module.get_next_timeout()
                if module_timeout:
                    if not isinstance(module_timeout, datetime):
                        _LOGGER.warning(
                            "Ignoring non-datetime timeout from %s: %r",
                            module_id,
                            module_timeout,
                        )
                        continue
                    if next_timeout is None or module_timeout < next_timeout:
                        next_timeout = module_timeout
                        next_module = module_id
            except Exception as e:
                _LOGGER.error(
                    "Error getting timeout from %s: %s",
                    module_id,
                    e,
                    exc_info=True,
                )

        # Schedule callback
        if next_timeout:
            _LOGGER.debug(
                "Scheduling timeout check at %s (from %s)",
                next_timeout,
                next_module,
            )
            self._timeout_cancel = async_track_point_in_time(
                self.hass,
                self._handle_timeout,
                next_timeout,
            )
        else:
            _LOGGER.debug("No timeouts to schedule")

    @callback
    def _handle_timeout(self, now: datetime) -> None:
        """Handle scheduled timeout check."""
        _LOGGER.debug("Running timeout check at %s", now)

        # Call check_timeouts on all modules
        for module_id, module in self.modules.items():
            if not hasattr(module, "check_timeouts"):
                continue

            try:
                module.check_timeouts(now)
            except Exception as e:
                _LOGGER.error(
                    "Error checking timeouts in %s: %s",
                    module_id,
                    e,
                    exc_info=True,
                )

        # Schedule next check
        self.schedule_next_timeout()
