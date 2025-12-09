"""Test utilities and helpers for Home Topology integration tests.

Provides common helper functions used across test files to reduce boilerplate
and improve test readability.
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, Mock

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import area_registry as ar


def setup_mock_http(hass: HomeAssistant) -> None:
    """Mock hass.http to prevent AttributeError in tests.

    Many integrations try to register static paths during setup.
    This helper prevents those calls from failing in tests.

    Args:
        hass: Home Assistant instance
    """
    hass.http = Mock()
    hass.http.async_register_static_paths = AsyncMock()


async def create_test_area(
    hass: HomeAssistant,
    name: str,
    floor_id: str | None = None,
) -> ar.AreaEntry:
    """Create a test area in HA's area registry.

    Helper for tests that need to create areas dynamically.

    Args:
        hass: Home Assistant instance
        name: Area name (e.g., "Living Room")
        floor_id: Optional floor ID to associate with

    Returns:
        Created AreaEntry
    """
    from homeassistant.helpers import area_registry as ar

    area_reg = ar.async_get(hass)
    return area_reg.async_create(name=name)  # floor_id when HA supports it


async def wait_for_state(
    hass: HomeAssistant,
    entity_id: str,
    expected_state: str,
    timeout: float = 5.0,
) -> bool:
    """Wait for entity to reach expected state.

    Useful for testing async state changes with a timeout.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to monitor
        expected_state: Expected state value
        timeout: Maximum seconds to wait

    Returns:
        True if state reached, False if timeout
    """
    deadline = asyncio.get_event_loop().time() + timeout

    while asyncio.get_event_loop().time() < deadline:
        state = hass.states.get(entity_id)
        if state and state.state == expected_state:
            return True
        await asyncio.sleep(0.1)

    return False


async def wait_for_occupancy(
    hass: HomeAssistant,
    location_id: str,
    occupied: bool,
    timeout: float = 5.0,
) -> bool:
    """Wait for occupancy sensor to reach expected state.

    Convenience wrapper around wait_for_state for occupancy sensors.

    Args:
        hass: Home Assistant instance
        location_id: Location ID (e.g., "living_room")
        occupied: True for occupied, False for vacant
        timeout: Maximum seconds to wait

    Returns:
        True if state reached, False if timeout
    """
    entity_id = f"binary_sensor.home_topology_{location_id}_occupancy"
    expected = "on" if occupied else "off"
    return await wait_for_state(hass, entity_id, expected, timeout)


def assert_state_attributes(
    hass: HomeAssistant,
    entity_id: str,
    expected_attrs: dict,
) -> None:
    """Assert entity has expected attribute values.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to check
        expected_attrs: Dict of attribute_name: expected_value

    Raises:
        AssertionError: If attributes don't match
    """
    state = hass.states.get(entity_id)
    assert state is not None, f"Entity {entity_id} not found"

    for attr_name, expected_value in expected_attrs.items():
        actual_value = state.attributes.get(attr_name)
        assert actual_value == expected_value, (
            f"Entity {entity_id} attribute '{attr_name}': "
            f"expected {expected_value!r}, got {actual_value!r}"
        )


def get_integration_data(hass: HomeAssistant, entry_id: str) -> dict:
    """Get integration data from hass.data.

    Helper to safely access integration data structure.

    Args:
        hass: Home Assistant instance
        entry_id: Config entry ID

    Returns:
        Integration data dict

    Raises:
        KeyError: If integration not loaded
    """
    from custom_components.home_topology.const import DOMAIN

    if DOMAIN not in hass.data:
        raise KeyError(f"Integration {DOMAIN} not loaded")

    if entry_id not in hass.data[DOMAIN]:
        raise KeyError(f"Entry {entry_id} not found in {DOMAIN} data")

    return hass.data[DOMAIN][entry_id]


def print_test_separator(title: str) -> None:
    """Print a visual separator for test output.

    Useful for debugging test output when running with -s flag.

    Args:
        title: Test section title
    """
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


class TestTimer:
    """Context manager for timing test sections.

    Usage:
        with TestTimer("Loading integration"):
            await hass.config_entries.async_setup(entry.entry_id)
    """

    def __init__(self, description: str):
        """Initialize timer.

        Args:
            description: What is being timed
        """
        self.description = description
        self.start_time = 0.0

    def __enter__(self):
        """Start timer."""
        self.start_time = asyncio.get_event_loop().time()
        return self

    def __exit__(self, *args):
        """Stop timer and print elapsed time."""
        elapsed = asyncio.get_event_loop().time() - self.start_time
        print(f"⏱️  {self.description}: {elapsed:.3f}s")


# Constants for common test values
TEST_TIMEOUT_SHORT = 1.0    # 1 second for fast tests
TEST_TIMEOUT_MEDIUM = 5.0   # 5 seconds for normal tests
TEST_TIMEOUT_LONG = 10.0    # 10 seconds for slow tests

