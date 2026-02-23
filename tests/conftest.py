"""Test configuration for Home Topology integration.

This module provides fixtures and configuration for testing the home-topology
integration. It follows patterns from successful HA integrations like WiiM.

Structure:
- Autouse Fixtures: Applied to all tests automatically
- Live HA Testing Support: Fixtures for testing against real HA
- Mock Fixtures: Standard mocked components for unit tests
- Helper Fixtures: Utilities for specific test scenarios
"""

from __future__ import annotations

import os
from collections.abc import Generator
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.const import CONF_ID
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.home_topology.const import DOMAIN

# Make pytest-homeassistant-custom-component plugin available
pytest_plugins = "pytest_homeassistant_custom_component"


# =============================================================================
# Autouse Fixtures (applied to all tests automatically)
# =============================================================================


@pytest.fixture(name="skip_notifications", autouse=True)
def skip_notifications_fixture():
    """Skip notification calls to prevent test failures."""
    with (
        patch("homeassistant.components.persistent_notification.async_create"),
        patch("homeassistant.components.persistent_notification.async_dismiss"),
    ):
        yield


@pytest.fixture(autouse=True)
def allow_unwatched_threads() -> bool:
    """Tell pytest-homeassistant that background threads are expected."""
    return True


# =============================================================================
# Live HA Testing Support
# =============================================================================


def pytest_addoption(parser):
    """Add command-line options for live HA testing."""
    parser.addoption(
        "--live-ha",
        action="store_true",
        default=False,
        help="Run tests against live Home Assistant instance",
    )


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers",
        "live_ha: Tests that require a live Home Assistant instance",
    )
    config.addinivalue_line(
        "markers",
        "mock_only: Tests that only work with mocked HA",
    )
    config.addinivalue_line(
        "markers",
        "realworld: Real-world integration tests with realistic scenarios",
    )


def pytest_collection_modifyitems(config, items):
    """Skip tests based on --live-ha flag."""
    live_ha = config.getoption("--live-ha")

    for item in items:
        if "live_ha" in item.keywords and not live_ha:
            item.add_marker(pytest.mark.skip(reason="Need --live-ha option to run"))
        if "mock_only" in item.keywords and live_ha:
            item.add_marker(pytest.mark.skip(reason="Cannot run with --live-ha option"))


@pytest.fixture
def live_ha_config():
    """Load live HA configuration from environment or config file."""
    config = {
        "url": os.getenv("HA_URL", "http://localhost:8123"),
        "token": os.getenv("HA_TOKEN"),
        "mode": os.getenv("TEST_MODE", "mock"),
        "timeout": int(os.getenv("TEST_TIMEOUT", "10")),
    }

    if not config["token"] and config["mode"] == "live":
        pytest.skip("Live HA tests require HA_TOKEN environment variable")

    return config


@pytest.fixture
async def hass_live(live_ha_config):
    """Connect to live Home Assistant instance for testing."""
    if live_ha_config["mode"] != "live":
        pytest.skip("Live HA fixture requires TEST_MODE=live")

    try:
        from homeassistant_api import Client
    except ImportError:
        pytest.skip("Live HA tests require homeassistant-api package")

    client = Client(
        live_ha_config["url"],
        live_ha_config["token"],
    )

    # Verify connection
    try:
        api_status = await client.async_get_config()
        if not api_status:
            pytest.skip(f"Cannot connect to HA at {live_ha_config['url']}")
    except Exception as e:
        pytest.skip(f"HA connection failed: {e}")

    yield client

    # Optional: Cleanup test artifacts
    if os.getenv("AUTO_CLEANUP", "true").lower() == "true":
        # Clean up test areas/entities
        # (implement cleanup logic as needed)
        pass


# =============================================================================
# Standard Mock Fixtures (existing)
# =============================================================================


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(
    enable_custom_integrations: None,
) -> Generator[None]:
    """Enable custom integrations."""
    yield


@pytest.fixture
def skip_platforms() -> list[str]:
    """Skip setting up platforms."""
    return []


@pytest.fixture(name="mock_location_manager")
def mock_location_manager_fixture() -> Generator[Mock]:
    """Mock LocationManager for testing."""
    with patch("custom_components.home_topology.LocationManager") as mock_cls:
        instance = Mock()
        instance.all_locations.return_value = []
        instance.create_location = Mock()
        instance.get_location.return_value = None
        instance.get_entity_location.return_value = None
        instance.get_module_config.return_value = None
        instance.set_module_config = Mock()
        instance.add_entity_to_location = Mock()
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_event_bus")
def mock_event_bus_fixture() -> Generator[Mock]:
    """Mock EventBus for testing."""
    with patch("custom_components.home_topology.EventBus") as mock_cls:
        instance = Mock()
        instance.set_location_manager = Mock()
        instance.publish = Mock()
        instance.subscribe = Mock()
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_occupancy_module")
def mock_occupancy_module_fixture() -> Generator[Mock]:
    """Mock OccupancyModule for testing."""
    with patch("custom_components.home_topology.OccupancyModule") as mock_cls:
        instance = Mock()
        instance.attach = Mock()
        instance.default_config = Mock(return_value={"enabled": True, "timeout": 300})
        instance.CURRENT_CONFIG_VERSION = 1
        instance.restore_state = Mock()
        instance.dump_state = Mock(return_value={})
        instance.get_next_timeout = Mock(return_value=None)
        instance.check_timeouts = Mock()
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_automation_module")
def mock_automation_module_fixture() -> Generator[Mock]:
    """Mock AutomationModule for testing."""
    with patch("custom_components.home_topology.AutomationModule") as mock_cls:
        instance = Mock()
        instance.attach = Mock()
        instance.default_config = Mock(return_value={"enabled": False})
        instance.CURRENT_CONFIG_VERSION = 1
        instance.restore_state = Mock()
        instance.dump_state = Mock(return_value={})
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_lighting_module")
def mock_lighting_module_fixture() -> Generator[Mock]:
    """Mock LightingModule for testing."""
    with patch("custom_components.home_topology.LightingModule") as mock_cls:
        instance = Mock()
        instance.attach = Mock()
        instance.default_config = Mock(return_value={"enabled": False})
        instance.CURRENT_CONFIG_VERSION = 1
        instance.restore_state = Mock()
        instance.dump_state = Mock(return_value={})
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_coordinator")
def mock_coordinator_fixture() -> Generator[Mock]:
    """Mock HomeTopologyCoordinator for testing."""
    with patch("custom_components.home_topology.HomeTopologyCoordinator") as mock_cls:
        instance = Mock()
        instance.schedule_next_timeout = Mock()
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="mock_event_bridge")
def mock_event_bridge_fixture() -> Generator[Mock]:
    """Mock EventBridge for testing."""
    with patch("custom_components.home_topology.EventBridge") as mock_cls:
        instance = Mock()
        instance.async_setup = AsyncMock()
        instance.async_teardown = AsyncMock()
        mock_cls.return_value = instance
        yield instance


@pytest.fixture(name="config_entry")
def config_entry_fixture() -> MockConfigEntry:
    """Create a mock config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Home Topology",
        data={CONF_ID: "test"},
        entry_id="test_entry_id",
    )


@pytest.fixture
async def setup_integration(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
    mock_automation_module: Mock,
    mock_lighting_module: Mock,
    mock_coordinator: Mock,
    mock_event_bridge: Mock,
) -> Generator[MockConfigEntry]:
    """Set up the Home Topology integration for testing.

    This fixture provides a fully mocked integration setup for testing
    without requiring the actual home-topology library.
    """
    # Mock area and entity registries
    with (
        patch(
            "custom_components.home_topology.async_register_panel",
            new_callable=AsyncMock,
        ),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
    ):
        config_entry.add_to_hass(hass)

        # Mock forward_entry_setups to prevent platform loading
        with patch.object(
            hass.config_entries, "async_forward_entry_setups", return_value=True
        ):
            assert await hass.config_entries.async_setup(config_entry.entry_id)
            await hass.async_block_till_done()

        yield config_entry

        # Cleanup
        with patch.object(
            hass.config_entries, "async_unload_platforms", return_value=True
        ):
            await hass.config_entries.async_unload(config_entry.entry_id)
            await hass.async_block_till_done()
