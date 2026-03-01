"""Provide integration diagnostics for Home Assistant system health."""

from __future__ import annotations

from importlib import metadata
from typing import Any

from home_topology import __version__ as home_topology_runtime_version
from homeassistant.components import system_health
from homeassistant.core import HomeAssistant, callback

from .const import VERSION


@callback
def async_register(hass: HomeAssistant, register: system_health.SystemHealthRegistration) -> None:
    """Register system health callbacks."""
    register.async_register_info(system_health_info)


async def system_health_info(_hass: HomeAssistant) -> dict[str, Any]:
    """Return diagnostics surfaced in the integration info window."""
    installed_home_topology_version = "unknown"
    try:
        installed_home_topology_version = metadata.version("home-topology")
    except metadata.PackageNotFoundError:
        pass

    return {
        "integration_version": VERSION,
        "home_topology_runtime_version": home_topology_runtime_version,
        "home_topology_installed_version": installed_home_topology_version,
    }
