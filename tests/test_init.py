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
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation import _prune_hidden_entities
from custom_components.topomation.const import (
    DOMAIN,
    EVENT_TOPOMATION_OCCUPANCY_CHANGED,
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
        mock_automation_module.set_platform.assert_called_once()
        mock_automation_module.set_occupancy_module.assert_called_once_with(
            mock_occupancy_module
        )
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


async def test_setup_entry_forwards_occupancy_changed_to_ha_bus(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bus: Mock,
) -> None:
    """Kernel occupancy.changed events should be mirrored to HA bus."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    occupancy_callbacks = []
    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            occupancy_callbacks.append(callback)

    forwarded_events: list[dict] = []
    unsub = hass.bus.async_listen(
        EVENT_TOPOMATION_OCCUPANCY_CHANGED,
        lambda evt: forwarded_events.append(dict(evt.data or {})),
    )

    event = Mock()
    event.location_id = "area_mud_room"
    event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
    }
    for callback in occupancy_callbacks:
        callback(event)

    await hass.async_block_till_done()
    unsub()

    assert {
        "entry_id": config_entry.entry_id,
        "location_id": "area_mud_room",
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
    } in forwarded_events


async def test_setup_entry_propagates_linked_location_trigger(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
) -> None:
    """occupied=True on source location should trigger configured linked targets."""
    config_entry.add_to_hass(hass)

    family_room = Mock()
    family_room.id = "area_family_room"
    family_room.name = "Family Room"
    family_room.parent_id = "floor_main"
    family_room.is_explicit_root = False
    family_room.entity_ids = []
    family_room.order = 0
    family_room.aliases = []
    family_room.ha_area_id = None
    family_room.ha_floor_id = None
    family_room.modules = {"_meta": {"type": "area"}}
    kitchen = Mock()
    kitchen.id = "area_kitchen"
    kitchen.name = "Kitchen"
    kitchen.parent_id = "floor_main"
    kitchen.is_explicit_root = False
    kitchen.entity_ids = []
    kitchen.order = 1
    kitchen.aliases = []
    kitchen.ha_area_id = None
    kitchen.ha_floor_id = None
    kitchen.modules = {"_meta": {"type": "area"}}
    floor = Mock()
    floor.id = "floor_main"
    floor.name = "Main Floor"
    floor.parent_id = None
    floor.is_explicit_root = False
    floor.entity_ids = []
    floor.order = 0
    floor.aliases = []
    floor.ha_area_id = None
    floor.ha_floor_id = None
    floor.modules = {"_meta": {"type": "floor"}}
    mock_location_manager.all_locations.return_value = [floor, family_room, kitchen]
    locations_by_id = {location.id: location for location in [floor, family_room, kitchen]}
    mock_location_manager.get_location.side_effect = lambda location_id: locations_by_id.get(location_id)

    def _module_config(location_id: str, module_id: str):
        if module_id == "occupancy":
            if location_id == "area_kitchen":
                return {
                    "enabled": True,
                    "occupancy_sources": [],
                    "linked_locations": ["area_family_room"],
                }
            return {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": [],
            }
        if module_id == "automation":
            return {"enabled": False, "reapply_last_state_on_startup": False}
        if module_id == "ambient":
            return {"enabled": False}
        return None

    mock_location_manager.get_module_config.side_effect = _module_config
    mock_occupancy_module.get_location_state.side_effect = lambda location_id: {
        "contributions": [],
    }

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    event = Mock()
    event.location_id = "area_family_room"
    event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
        "contributions": [{"source_id": "binary_sensor.family_room_motion", "expires_at": None}],
    }

    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            callback(event)

    mock_occupancy_module.trigger.assert_called_once_with(
        "area_kitchen",
        "linked:area_family_room",
        0,
    )


async def test_setup_entry_propagates_linked_location_clear(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
) -> None:
    """occupied=False on source location should clear linked contribution on targets."""
    config_entry.add_to_hass(hass)

    family_room = Mock()
    family_room.id = "area_family_room"
    family_room.name = "Family Room"
    family_room.parent_id = "floor_main"
    family_room.is_explicit_root = False
    family_room.entity_ids = []
    family_room.order = 0
    family_room.aliases = []
    family_room.ha_area_id = None
    family_room.ha_floor_id = None
    family_room.modules = {"_meta": {"type": "area"}}
    kitchen = Mock()
    kitchen.id = "area_kitchen"
    kitchen.name = "Kitchen"
    kitchen.parent_id = "floor_main"
    kitchen.is_explicit_root = False
    kitchen.entity_ids = []
    kitchen.order = 1
    kitchen.aliases = []
    kitchen.ha_area_id = None
    kitchen.ha_floor_id = None
    kitchen.modules = {"_meta": {"type": "area"}}
    floor = Mock()
    floor.id = "floor_main"
    floor.name = "Main Floor"
    floor.parent_id = None
    floor.is_explicit_root = False
    floor.entity_ids = []
    floor.order = 0
    floor.aliases = []
    floor.ha_area_id = None
    floor.ha_floor_id = None
    floor.modules = {"_meta": {"type": "floor"}}
    mock_location_manager.all_locations.return_value = [floor, family_room, kitchen]
    locations_by_id = {location.id: location for location in [floor, family_room, kitchen]}
    mock_location_manager.get_location.side_effect = lambda location_id: locations_by_id.get(location_id)

    def _module_config(location_id: str, module_id: str):
        if module_id == "occupancy":
            if location_id == "area_kitchen":
                return {
                    "enabled": True,
                    "occupancy_sources": [],
                    "linked_locations": ["area_family_room"],
                }
            return {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": [],
            }
        if module_id == "automation":
            return {"enabled": False, "reapply_last_state_on_startup": False}
        if module_id == "ambient":
            return {"enabled": False}
        return None

    mock_location_manager.get_module_config.side_effect = _module_config
    mock_occupancy_module.get_location_state.side_effect = lambda location_id: {
        "contributions": (
            [{"source_id": "linked:area_family_room", "expires_at": None}]
            if location_id == "area_kitchen"
            else []
        ),
    }

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    event = Mock()
    event.location_id = "area_family_room"
    event.payload = {
        "occupied": False,
        "previous_occupied": True,
        "reason": "event:vacate",
        "contributions": [],
    }

    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            callback(event)

    mock_occupancy_module.clear.assert_called_once_with(
        "area_kitchen",
        "linked:area_family_room",
        0,
    )


async def test_setup_entry_skips_linked_feedback_loops(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
) -> None:
    """Linked propagation should not echo back when source already depends on target."""
    config_entry.add_to_hass(hass)

    family_room = Mock()
    family_room.id = "area_family_room"
    family_room.name = "Family Room"
    family_room.parent_id = "floor_main"
    family_room.is_explicit_root = False
    family_room.entity_ids = []
    family_room.order = 0
    family_room.aliases = []
    family_room.ha_area_id = None
    family_room.ha_floor_id = None
    family_room.modules = {"_meta": {"type": "area"}}
    kitchen = Mock()
    kitchen.id = "area_kitchen"
    kitchen.name = "Kitchen"
    kitchen.parent_id = "floor_main"
    kitchen.is_explicit_root = False
    kitchen.entity_ids = []
    kitchen.order = 1
    kitchen.aliases = []
    kitchen.ha_area_id = None
    kitchen.ha_floor_id = None
    kitchen.modules = {"_meta": {"type": "area"}}
    floor = Mock()
    floor.id = "floor_main"
    floor.name = "Main Floor"
    floor.parent_id = None
    floor.is_explicit_root = False
    floor.entity_ids = []
    floor.order = 0
    floor.aliases = []
    floor.ha_area_id = None
    floor.ha_floor_id = None
    floor.modules = {"_meta": {"type": "floor"}}
    mock_location_manager.all_locations.return_value = [floor, family_room, kitchen]
    locations_by_id = {location.id: location for location in [floor, family_room, kitchen]}
    mock_location_manager.get_location.side_effect = lambda location_id: locations_by_id.get(location_id)

    def _module_config(location_id: str, module_id: str):
        if module_id == "occupancy":
            if location_id == "area_kitchen":
                return {
                    "enabled": True,
                    "occupancy_sources": [],
                    "linked_locations": ["area_family_room"],
                }
            return {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": [],
            }
        if module_id == "automation":
            return {"enabled": False, "reapply_last_state_on_startup": False}
        if module_id == "ambient":
            return {"enabled": False}
        return None

    mock_location_manager.get_module_config.side_effect = _module_config
    mock_occupancy_module.get_location_state.side_effect = lambda location_id: {
        "contributions": [],
    }

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    event = Mock()
    event.location_id = "area_family_room"
    event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
        "contributions": [{"source_id": "linked:area_kitchen", "expires_at": None}],
    }

    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            callback(event)

    mock_occupancy_module.trigger.assert_not_called()


async def test_setup_entry_ignores_linked_locations_when_target_not_area_under_floor(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_location_manager: Mock,
    mock_event_bus: Mock,
    mock_occupancy_module: Mock,
) -> None:
    """Linked propagation should be ignored when target is not an area directly under floor."""
    config_entry.add_to_hass(hass)

    family_room = Mock()
    family_room.id = "area_family_room"
    family_room.name = "Family Room"
    family_room.parent_id = None
    family_room.is_explicit_root = False
    family_room.entity_ids = []
    family_room.order = 0
    family_room.aliases = []
    family_room.ha_area_id = None
    family_room.ha_floor_id = None
    family_room.modules = {"_meta": {"type": "area"}}
    kitchen = Mock()
    kitchen.id = "area_kitchen"
    kitchen.name = "Kitchen"
    kitchen.parent_id = None
    kitchen.is_explicit_root = False
    kitchen.entity_ids = []
    kitchen.order = 1
    kitchen.aliases = []
    kitchen.ha_area_id = None
    kitchen.ha_floor_id = None
    kitchen.modules = {"_meta": {"type": "area"}}
    mock_location_manager.all_locations.return_value = [family_room, kitchen]
    locations_by_id = {location.id: location for location in [family_room, kitchen]}
    mock_location_manager.get_location.side_effect = lambda location_id: locations_by_id.get(location_id)

    def _module_config(location_id: str, module_id: str):
        if module_id == "occupancy":
            if location_id == "area_kitchen":
                return {
                    "enabled": True,
                    "occupancy_sources": [],
                    "linked_locations": ["area_family_room"],
                }
            return {
                "enabled": True,
                "occupancy_sources": [],
                "linked_locations": [],
            }
        if module_id == "automation":
            return {"enabled": False, "reapply_last_state_on_startup": False}
        if module_id == "ambient":
            return {"enabled": False}
        return None

    mock_location_manager.get_module_config.side_effect = _module_config
    mock_occupancy_module.get_location_state.side_effect = lambda location_id: {"contributions": []}

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    event = Mock()
    event.location_id = "area_family_room"
    event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
        "contributions": [{"source_id": "binary_sensor.family_room_motion", "expires_at": None}],
    }

    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            callback(event)

    mock_occupancy_module.trigger.assert_not_called()


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


async def test_prune_hidden_entities_removes_ambient_entities(
    hass: HomeAssistant,
) -> None:
    """Ambient entities should always be removed."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Topomation",
        data={},
        entry_id="ambient_prune_test",
    )
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    ambient_sensor = registry.async_get_or_create(
        domain="sensor",
        platform=DOMAIN,
        unique_id="ambient_light_kitchen",
        suggested_object_id="kitchen_ambient_light",
        config_entry=entry,
    )
    ambient_binary = registry.async_get_or_create(
        domain="binary_sensor",
        platform=DOMAIN,
        unique_id="ambient_is_dark_kitchen",
        suggested_object_id="kitchen_is_dark",
        config_entry=entry,
    )
    occupancy_sensor = registry.async_get_or_create(
        domain="binary_sensor",
        platform=DOMAIN,
        unique_id="occupancy_kitchen",
        suggested_object_id="kitchen_occupancy",
        config_entry=entry,
    )

    _prune_hidden_entities(hass, entry)

    assert registry.async_get(ambient_sensor.entity_id) is None
    assert registry.async_get(ambient_binary.entity_id) is None
    assert registry.async_get(occupancy_sensor.entity_id) is not None
