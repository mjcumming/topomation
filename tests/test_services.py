"""Tests for Home Topology service wrappers."""

from __future__ import annotations

import logging
from unittest.mock import Mock

from homeassistant.core import HomeAssistant

from custom_components.home_topology.const import DOMAIN
from custom_components.home_topology.services import (
    async_register_services,
    async_unregister_services,
)


def _kernel_with_occupancy(occupancy: Mock) -> dict:
    return {
        "modules": {
            "occupancy": occupancy,
        }
    }


async def test_clear_service_maps_to_clear(hass: HomeAssistant) -> None:
    """clear service should call occupancy.clear with current core API."""
    occupancy = Mock()
    hass.data[DOMAIN] = {"entry_1": _kernel_with_occupancy(occupancy)}
    async_register_services(hass)

    await hass.services.async_call(
        DOMAIN,
        "clear",
        {
            "location_id": "kitchen",
            "source_id": "manual_test",
            "trailing_timeout": 45,
        },
        blocking=True,
    )

    occupancy.clear.assert_called_once_with("kitchen", "manual_test", 45)
    async_unregister_services(hass)


async def test_clear_service_falls_back_to_release_for_legacy_core(
    hass: HomeAssistant,
) -> None:
    """clear service should fall back to release for older occupancy module APIs."""

    class LegacyOccupancy:
        def __init__(self) -> None:
            self.release = Mock()

    occupancy = LegacyOccupancy()
    hass.data[DOMAIN] = {"entry_1": _kernel_with_occupancy(occupancy)}
    async_register_services(hass)

    await hass.services.async_call(
        DOMAIN,
        "clear",
        {
            "location_id": "kitchen",
            "source_id": "manual_test",
            "trailing_timeout": 45,
        },
        blocking=True,
    )

    occupancy.release.assert_called_once_with("kitchen", "manual_test", 45)
    async_unregister_services(hass)


async def test_lock_and_unlock_use_source_id(hass: HomeAssistant) -> None:
    """lock/unlock services should pass source_id required by core API."""
    occupancy = Mock()
    hass.data[DOMAIN] = {"entry_1": _kernel_with_occupancy(occupancy)}
    async_register_services(hass)

    await hass.services.async_call(
        DOMAIN,
        "lock",
        {
            "location_id": "office",
            "source_id": "away_automation",
        },
        blocking=True,
    )
    await hass.services.async_call(
        DOMAIN,
        "unlock",
        {
            "location_id": "office",
            "source_id": "away_automation",
        },
        blocking=True,
    )

    occupancy.lock.assert_called_once_with("office", "away_automation")
    occupancy.unlock.assert_called_once_with("office", "away_automation")
    async_unregister_services(hass)


async def test_vacate_area_passes_source_and_include_locked(hass: HomeAssistant) -> None:
    """vacate_area service should pass all command parameters through."""
    occupancy = Mock()
    hass.data[DOMAIN] = {"entry_1": _kernel_with_occupancy(occupancy)}
    async_register_services(hass)

    await hass.services.async_call(
        DOMAIN,
        "vacate_area",
        {
            "location_id": "house",
            "source_id": "night_mode",
            "include_locked": True,
        },
        blocking=True,
    )

    occupancy.vacate_area.assert_called_once_with("house", "night_mode", True)
    async_unregister_services(hass)


async def test_service_entry_id_required_with_multiple_entries(hass: HomeAssistant) -> None:
    """Without entry_id, service should not dispatch when multiple entries are loaded."""
    occupancy_one = Mock()
    occupancy_two = Mock()
    hass.data[DOMAIN] = {
        "entry_1": _kernel_with_occupancy(occupancy_one),
        "entry_2": _kernel_with_occupancy(occupancy_two),
    }
    async_register_services(hass)

    await hass.services.async_call(
        DOMAIN,
        "trigger",
        {
            "location_id": "kitchen",
            "source_id": "manual",
            "timeout": 60,
        },
        blocking=True,
    )

    occupancy_one.trigger.assert_not_called()
    occupancy_two.trigger.assert_not_called()

    await hass.services.async_call(
        DOMAIN,
        "trigger",
        {
            "entry_id": "entry_2",
            "location_id": "kitchen",
            "source_id": "manual",
            "timeout": 60,
        },
        blocking=True,
    )

    occupancy_one.trigger.assert_not_called()
    occupancy_two.trigger.assert_called_once_with("kitchen", "manual", 60)
    async_unregister_services(hass)


async def test_service_invalid_entry_id_logs_and_noops(
    hass: HomeAssistant,
    caplog,
) -> None:
    """Invalid entry_id should not dispatch to occupancy and should log."""
    occupancy = Mock()
    hass.data[DOMAIN] = {"entry_1": _kernel_with_occupancy(occupancy)}
    async_register_services(hass)

    caplog.set_level(logging.ERROR)

    await hass.services.async_call(
        DOMAIN,
        "trigger",
        {
            "entry_id": "missing_entry",
            "location_id": "kitchen",
            "source_id": "manual",
            "timeout": 60,
        },
        blocking=True,
    )

    occupancy.trigger.assert_not_called()
    assert "Config entry 'missing_entry' not found" in caplog.text
    async_unregister_services(hass)


async def test_service_not_loaded_logs_and_noops(
    hass: HomeAssistant,
    caplog,
) -> None:
    """Service call when integration is not loaded should no-op with error log."""
    async_register_services(hass)
    caplog.set_level(logging.ERROR)

    await hass.services.async_call(
        DOMAIN,
        "trigger",
        {
            "location_id": "kitchen",
            "source_id": "manual",
            "timeout": 60,
        },
        blocking=True,
    )

    assert "Integration not loaded" in caplog.text
    async_unregister_services(hass)
