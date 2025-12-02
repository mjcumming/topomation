"""Panel registration for Home Topology."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_ICON, PANEL_TITLE, PANEL_URL

_LOGGER = logging.getLogger(__name__)

# Path to frontend build output
FRONTEND_PATH = Path(__file__).parent / "frontend"
FRONTEND_URL = f"/api/{DOMAIN}/static"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the Home Topology panel."""
    
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
    
    # Register the panel in the sidebar
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL.lstrip("/"),
        require_admin=False,
        config={
            "_panel_custom": {
                "name": "home-topology-panel",
                "embed_iframe": False,
                "trust_external": False,
                "module_url": f"{FRONTEND_URL}/home-topology-panel.js",
            }
        },
    )
    
    _LOGGER.debug("Home Topology panel registered at %s", PANEL_URL)

