"""Panel registration for Topomation."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_DEFINITIONS

_LOGGER = logging.getLogger(__name__)

# Path to frontend build output
FRONTEND_PATH = Path(__file__).parent / "frontend"
FRONTEND_URL = f"/api/{DOMAIN}/static"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the Topomation panel."""
    import time

    # Register static path for frontend assets
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                FRONTEND_URL,
                str(FRONTEND_PATH),
                cache_headers=False,  # Disable caching during development
            )
        ]
    )

    # Cache busting for development - add timestamp to module URL
    cache_bust = int(time.time())

    # Register one visible sidebar panel plus alias routes for deep links.
    for panel in PANEL_DEFINITIONS:
        frontend.async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title=panel["title"],
            sidebar_icon=panel["icon"],
            frontend_url_path=panel["url"].lstrip("/"),
            require_admin=False,
            config={
                "topomation_view": panel["view"],
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
