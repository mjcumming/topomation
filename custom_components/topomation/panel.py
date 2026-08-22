"""Panel registration for Topomation."""

from __future__ import annotations

import logging
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_DEFINITIONS

_LOGGER = logging.getLogger(__name__)

# Path to frontend build output
FRONTEND_PATH = Path(__file__).parent / "frontend"
FRONTEND_URL = f"/api/{DOMAIN}/static"
_PANEL_STATIC_PATH_FLAG = f"{DOMAIN}_panel_static_paths_registered"


def _panel_url_path(panel: Mapping[str, Any]) -> str:
    """Return the HA frontend_url_path for a panel definition."""
    return str(panel["url"]).lstrip("/")


async def async_register_panel(hass: HomeAssistant, entry_id: str | None = None) -> None:
    """Register the Topomation panel.

    Idempotent: HA forbids overwriting an existing panel unless ``update=True``.
    Reload leftover routes must not abort setup (C-025 / ADR-HA-098). Static
    asset paths are registered once per Home Assistant process.
    """
    if not hass.data.get(_PANEL_STATIC_PATH_FLAG):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    FRONTEND_URL,
                    str(FRONTEND_PATH),
                    cache_headers=False,  # Disable caching during development
                )
            ]
        )
        hass.data[_PANEL_STATIC_PATH_FLAG] = True

    # Cache busting for development - add timestamp to module URL
    cache_bust = int(time.time())

    # Register one visible sidebar panel plus alias routes for deep links.
    for panel in PANEL_DEFINITIONS:
        frontend.async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title=panel["title"],
            sidebar_icon=panel["icon"],
            frontend_url_path=_panel_url_path(panel),
            require_admin=True,
            update=True,
            config={
                "topomation_view": panel["view"],
                "entry_id": entry_id,
                "_panel_custom": {
                    "name": "topomation-panel",
                    "embed_iframe": False,
                    "trust_external": False,
                    "module_url": f"{FRONTEND_URL}/topomation-panel.js?v={cache_bust}",
                },
            },
        )
        _LOGGER.debug(
            "Topomation panel registered at %s (view=%s, sidebar_visible=%s)",
            panel["url"],
            panel["view"],
            panel.get("sidebar_visible", True),
        )


def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove Topomation panel routes when the last config entry unloads."""
    for panel in PANEL_DEFINITIONS:
        frontend.async_remove_panel(
            hass,
            _panel_url_path(panel),
            warn_if_unknown=False,
        )
