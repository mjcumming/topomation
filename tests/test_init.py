"""Tests for Topomation integration initialization.

Following Home Assistant integration testing best practices:
- Use real HA fixtures (hass, config_entry)
- Test actual setup/unload flows
- Use GIVEN-WHEN-THEN structure
- Mock external dependencies (home-topology kernel)
"""

from __future__ import annotations

from unittest.mock import Mock, patch

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation.const import (
    DOMAIN,
    STORAGE_KEY_CONFIG,
    STORAGE_VERSION,
)


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
            "custom_components.topomation.async_register_panel",
            return_value=None,
        ),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        # WHEN
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        # THEN
        mock_coordinator.schedule_next_timeout.assert_called_once()


async def test_setup_entry_subscribes_timeout_reschedule_hooks(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bus: Mock,
) -> None:
    """Setup should register occupancy event hooks that reschedule timeouts.

    GIVEN: Integration setup with mocked EventBus
    WHEN: The integration is initialized
    THEN: EventBus subscriptions include occupancy.changed and occupancy.signal
    """
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    event_types = []
    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        event_filter = call.args[1]
        if hasattr(event_filter, "event_type"):
            event_types.append(event_filter.event_type)

    assert "occupancy.changed" in event_types
    assert "occupancy.signal" in event_types


async def test_setup_entry_bootstraps_building_and_grounds_on_first_install(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
) -> None:
    """First install should scaffold Home root + default wrappers."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    created_ids = [call.kwargs.get("id") for call in mock_location_manager.create_location.call_args_list]
    assert "home" in created_ids
    assert "building_main" in created_ids
    assert "grounds" in created_ids

    # Home root should use HA installation location name as default.
    home_call = next(
        call for call in mock_location_manager.create_location.call_args_list if call.kwargs.get("id") == "home"
    )
    assert home_call.kwargs.get("name") == hass.config.location_name

    # Default building wrapper is Home.
    building_call = next(
        call for call in mock_location_manager.create_location.call_args_list if call.kwargs.get("id") == "building_main"
    )
    assert building_call.kwargs.get("name") == "Home"
    assert building_call.kwargs.get("parent_id") is None

    meta_locations: set[str] = set()
    for call in mock_location_manager.set_module_config.call_args_list:
        module_id = call.kwargs.get("module_id") if call.kwargs else (
            call.args[1] if len(call.args) > 1 else None
        )
        if module_id != "_meta":
            continue
        location_id = call.kwargs.get("location_id") if call.kwargs else (
            call.args[0] if len(call.args) > 0 else None
        )
        if isinstance(location_id, str):
            meta_locations.add(location_id)

    assert "home" in meta_locations
    assert "building_main" in meta_locations
    assert "grounds" in meta_locations


async def test_setup_entry_does_not_bootstrap_when_saved_config_exists(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
) -> None:
    """Saved config with explicit Home root should skip bootstrap scaffolding."""
    config_entry.add_to_hass(hass)
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save(
        {
            "locations": [
                {
                    "id": "home",
                    "name": "Home",
                    "parent_id": None,
                    "is_explicit_root": True,
                    "entity_ids": [],
                    "modules": {"_meta": {"type": "building"}},
                }
            ]
        }
    )
    # Simulate post-restore state for mocked LocationManager (fixture is not stateful).
    restored_home = Mock()
    restored_home.is_explicit_root = True
    mock_location_manager.all_locations.return_value = [restored_home]

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    created_ids = [call.kwargs.get("id") for call in mock_location_manager.create_location.call_args_list]
    assert "building_main" not in created_ids
    assert "grounds" not in created_ids


async def test_setup_entry_bootstraps_when_saved_config_lacks_explicit_root(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
) -> None:
    """Upgrade path should create Home root when saved config has no explicit root."""
    config_entry.add_to_hass(hass)
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await store.async_save(
        {
            "locations": [
                {
                    "id": "floor_main_floor",
                    "name": "Main Floor",
                    "parent_id": None,
                    "is_explicit_root": False,
                    "entity_ids": [],
                    "modules": {"_meta": {"type": "floor"}},
                }
            ]
        }
    )

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    created_ids = [call.kwargs.get("id") for call in mock_location_manager.create_location.call_args_list]
    assert "home" in created_ids


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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
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
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch("custom_components.topomation.async_unregister_services") as mock_unregister,
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

        with patch.object(hass.config_entries, "async_unload_platforms", return_value=True):
            await hass.config_entries.async_unload(config_entry.entry_id)
            await hass.async_block_till_done()

    mock_unregister.assert_called_once_with(hass)
