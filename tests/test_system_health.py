"""Tests for Topomation system health diagnostics."""

from __future__ import annotations

from importlib import metadata as importlib_metadata
from unittest.mock import Mock, patch

from home_topology import __version__ as home_topology_version
from homeassistant.core import HomeAssistant

from custom_components.topomation.const import VERSION
from custom_components.topomation.system_health import async_register, system_health_info


def test_async_register_registers_callback(hass: HomeAssistant) -> None:
    """System health registration should wire the info callback."""
    register = Mock()

    async_register(hass, register)

    register.async_register_info.assert_called_once_with(system_health_info)


async def test_system_health_info_reports_versions(hass: HomeAssistant) -> None:
    """Diagnostics should include integration and home-topology versions."""
    with patch(
        "custom_components.topomation.system_health.metadata.version",
        return_value="1.0.2",
    ):
        info = await system_health_info(hass)

    assert info["integration_version"] == VERSION
    assert info["home_topology_runtime_version"] == home_topology_version
    assert info["home_topology_installed_version"] == "1.0.2"


async def test_system_health_info_handles_missing_distribution(
    hass: HomeAssistant,
) -> None:
    """Missing package metadata should not break diagnostics output."""
    with patch(
        "custom_components.topomation.system_health.metadata.version",
        side_effect=importlib_metadata.PackageNotFoundError,
    ):
        info = await system_health_info(hass)

    assert info["home_topology_installed_version"] == "unknown"
