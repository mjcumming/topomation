"""Tests for Home Topology integration initialization.

Following Home Assistant integration testing best practices:
- Use real HA fixtures (hass, config_entry)
- Test actual setup/unload flows
- Use GIVEN-WHEN-THEN structure
- Mock external dependencies (home-topology kernel)
"""

from __future__ import annotations

from unittest.mock import Mock, patch

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.home_topology.const import DOMAIN


async def test_setup_entry_creates_kernel_components(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
) -> None:
    """Test that setup creates and initializes kernel components.

    GIVEN: A Home Assistant instance and config entry
    WHEN: The integration is set up
    THEN: LocationManager and EventBus are created and configured
    """
    config_entry.add_to_hass(hass)

    with (
        patch(
            "custom_components.home_topology.async_register_panel",
            return_value=None,
        ),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # WHEN
        result = await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        assert result is True
        assert DOMAIN in hass.data
        assert config_entry.entry_id in hass.data[DOMAIN]

        # Verify kernel components were created
        kernel_data = hass.data[DOMAIN][config_entry.entry_id]
        assert "location_manager" in kernel_data
        assert "event_bus" in kernel_data
        assert "modules" in kernel_data


async def test_setup_entry_attaches_modules(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
    mock_automation_module: Mock,
) -> None:
    """Test that all modules are attached to the kernel.

    GIVEN: Mocked kernel modules
    WHEN: The integration is set up
    THEN: Each module's attach() method is called
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # WHEN
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        mock_occupancy_module.attach.assert_called_once()
        mock_automation_module.attach.assert_called_once()


async def test_setup_entry_initializes_coordinator(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_coordinator: Mock,
) -> None:
    """Test that the timeout coordinator is created and scheduled.

    GIVEN: A mock coordinator
    WHEN: The integration is set up
    THEN: Coordinator schedules initial timeout check
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # WHEN
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        mock_coordinator.schedule_next_timeout.assert_called_once()


async def test_setup_entry_starts_event_bridge(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bridge: Mock,
) -> None:
    """Test that the event bridge is initialized.

    GIVEN: A mock event bridge
    WHEN: The integration is set up
    THEN: Event bridge async_setup is called
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # WHEN
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        mock_event_bridge.async_setup.assert_called_once()


async def test_unload_entry_tears_down_bridge(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bridge: Mock,
) -> None:
    """Test that unload tears down the event bridge.

    GIVEN: A set up integration
    WHEN: The integration is unloaded
    THEN: Event bridge async_teardown is called
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # Setup first
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    # WHEN - Unload
    with patch.object(hass.config_entries, "async_unload_platforms", return_value=True):
        result = await hass.config_entries.async_unload(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        assert result
        mock_event_bridge.async_teardown.assert_called_once()


async def test_unload_entry_saves_state(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_occupancy_module: Mock,
    mock_automation_module: Mock,
) -> None:
    """Test that unload saves module state.

    GIVEN: A set up integration with running modules
    WHEN: The integration is unloaded
    THEN: Each module's dump_state() is called
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # Setup first
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    # WHEN - Unload
    with patch.object(hass.config_entries, "async_unload_platforms", return_value=True):
        await hass.config_entries.async_unload(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        mock_occupancy_module.dump_state.assert_called_once()
        mock_automation_module.dump_state.assert_called_once()


async def test_unload_entry_cleans_up_data(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
) -> None:
    """Test that unload removes integration data from hass.data.

    GIVEN: A set up integration
    WHEN: The integration is unloaded
    THEN: Integration data is removed from hass.data
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # Setup first
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # Verify data exists
        assert config_entry.entry_id in hass.data[DOMAIN]

    # WHEN - Unload
    with patch.object(hass.config_entries, "async_unload_platforms", return_value=True):
        await hass.config_entries.async_unload(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        assert config_entry.entry_id not in hass.data[DOMAIN]


async def test_unload_last_entry_unregisters_services(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
) -> None:
    """Unloading the last entry should unregister domain services."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.home_topology.async_register_panel"),
        patch("custom_components.home_topology.async_register_websocket_api"),
        patch("custom_components.home_topology.async_register_services"),
        patch("custom_components.home_topology.async_unregister_services") as mock_unregister,
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        with patch.object(hass.config_entries, "async_unload_platforms", return_value=True):
            await hass.config_entries.async_unload(config_entry.entry_id)
            await hass.async_block_till_done()

    mock_unregister.assert_called_once_with(hass)
