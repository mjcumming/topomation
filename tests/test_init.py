"""Tests for Topomation integration initialization.

Following Home Assistant integration testing best practices:
- Use real HA fixtures (hass, config_entry)
- Test actual setup/unload flows
- Use GIVEN-WHEN-THEN structure
- Mock external dependencies (home-topology kernel)
"""

from __future__ import annotations

import copy
from datetime import UTC, datetime, timedelta
from unittest.mock import Mock, patch

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation import _prune_hidden_entities
from custom_components.topomation.const import (
    DOMAIN,
    EVENT_TOPOMATION_OCCUPANCY_CHANGED,
    EVENT_TOPOMATION_OCCUPANCY_STATE_CHANGED,
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

    matched = next(
        item for item in forwarded_events if item.get("location_id") == "area_mud_room"
    )
    assert matched["entry_id"] == config_entry.entry_id
    assert matched["occupied"] is True
    assert matched["previous_occupied"] is False
    assert matched["reason"] == "event:trigger"
    assert matched["recent_changes"][0]["kind"] == "state"
    assert matched["recent_changes"][0]["event"] == "occupied"


async def test_setup_entry_forwards_minimal_occupancy_projection_event(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bus: Mock,
) -> None:
    """Live occupancy projection events should not publish full snapshots."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    occupancy_forwarders = []
    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if (
            getattr(event_filter, "event_type", None) == "occupancy.changed"
            and getattr(callback, "__name__", None) == "_forward_occupancy_changed"
        ):
            occupancy_forwarders.append(callback)

    forwarded_projection_events: list[dict] = []
    unsub = hass.bus.async_listen(
        EVENT_TOPOMATION_OCCUPANCY_STATE_CHANGED,
        lambda evt: forwarded_projection_events.append(dict(evt.data or {})),
    )

    event = Mock()
    event.location_id = "area_kitchen"
    event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
    }
    with patch(
        "custom_components.topomation.build_occupancy_projection_states",
        return_value=[
            {
                "location_id": "area_kitchen",
                "occupied": True,
                "occupancy_group_id": "main_open_area",
                "explanation": {"basis": "held_by"},
            },
            {
                "location_id": "area_front_entry",
                "occupied": True,
                "occupancy_group_id": "main_open_area",
                "explanation": {"basis": "held_by"},
            },
            {
                "location_id": "area_guest_bedroom",
                "occupied": False,
                "explanation": {"basis": "none"},
            },
        ],
    ):
        for callback in occupancy_forwarders:
            callback(event)

    await hass.async_block_till_done()
    unsub()

    assert len(forwarded_projection_events) == 1
    states = forwarded_projection_events[0]["states"]
    assert {state["location_id"] for state in states} == {
        "area_kitchen",
        "area_front_entry",
    }


async def test_setup_entry_throttles_stayed_occupied_explainability_within_window(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bus: Mock,
) -> None:
    """Stayed-occupied state rows should not flood recent_changes within a short window."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    occupancy_forwarders: list = []
    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) != "occupancy.changed":
            continue
        # Other occupancy.changed subscribers (linked propagation, actions runtime, etc.)
        # run against a real OccupancyModule here and can perturb this scenario; the buffer
        # under test lives only in _forward_occupancy_changed.
        if getattr(callback, "__name__", None) == "_forward_occupancy_changed":
            occupancy_forwarders.append(callback)

    assert occupancy_forwarders, "expected HA occupancy forwarder to be registered"

    forwarded_events: list[dict] = []
    unsub = hass.bus.async_listen(
        EVENT_TOPOMATION_OCCUPANCY_CHANGED,
        lambda evt: forwarded_events.append(copy.deepcopy(dict(evt.data or {}))),
    )

    # Fixed anchor avoids wall-clock drift vs. event timestamps under slow CI runners.
    t0 = datetime(2026, 4, 12, 12, 0, 0, tzinfo=UTC)
    edge = Mock()
    edge.location_id = "room_burst"
    edge.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
    }
    edge.timestamp = t0

    ext1 = Mock()
    ext1.location_id = "room_burst"
    ext1.payload = {
        "occupied": True,
        "previous_occupied": True,
        "reason": "event:child",
    }
    ext1.timestamp = t0 + timedelta(seconds=2)

    ext2 = Mock()
    ext2.location_id = "room_burst"
    ext2.payload = {
        "occupied": True,
        "previous_occupied": True,
        "reason": "event:child",
    }
    ext2.timestamp = t0 + timedelta(seconds=3)

    ext_late = Mock()
    ext_late.location_id = "room_burst"
    ext_late.payload = {
        "occupied": True,
        "previous_occupied": True,
        "reason": "event:child",
    }
    ext_late.timestamp = t0 + timedelta(seconds=30)

    # Deliver like a real bus: one kernel publication, then all subscribers,
    # before the next publication (not each subscriber consuming the whole burst).
    for event in (edge, ext1, ext2, ext_late):
        for callback in occupancy_forwarders:
            callback(event)

    await hass.async_block_till_done()
    unsub()

    burst_events = [item for item in forwarded_events if item.get("location_id") == "room_burst"]
    assert len(burst_events) == 4
    # Only the last forward should include both the stayed-occupied row and the edge transition;
    # do not assume listener callback order matches fire order on all HA runners.
    with_two_states = [
        item
        for item in burst_events
        if len([r for r in item.get("recent_changes", []) if r.get("kind") == "state"]) == 2
    ]
    assert len(with_two_states) == 1
    final = with_two_states[0]
    state_rows = [row for row in final["recent_changes"] if row.get("kind") == "state"]
    assert len(state_rows) == 2
    assert state_rows[0]["event"] == "occupied"
    assert state_rows[0]["previous_occupied"] is True
    assert state_rows[1]["event"] == "occupied"
    assert state_rows[1]["previous_occupied"] is False


async def test_setup_entry_tracks_signal_events_in_recent_changes(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_event_bus: Mock,
) -> None:
    """Signal events should be captured for inspector explainability history."""
    config_entry.add_to_hass(hass)

    with (
        patch("custom_components.topomation.async_register_panel"),
        patch("custom_components.topomation.async_register_websocket_api"),
        patch("custom_components.topomation.async_register_services"),
        patch.object(hass.config_entries, "async_forward_entry_setups", return_value=True),
    ):
        await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    signal_callbacks = []
    occupancy_callbacks = []
    for call in mock_event_bus.subscribe.call_args_list:
        if len(call.args) < 2:
            continue
        callback = call.args[0]
        event_filter = call.args[1]
        if getattr(event_filter, "event_type", None) == "occupancy.signal":
            signal_callbacks.append(callback)
        if getattr(event_filter, "event_type", None) == "occupancy.changed":
            occupancy_callbacks.append(callback)

    forwarded_events: list[dict] = []
    unsub = hass.bus.async_listen(
        EVENT_TOPOMATION_OCCUPANCY_CHANGED,
        lambda evt: forwarded_events.append(dict(evt.data or {})),
    )

    signal_event = Mock()
    signal_event.location_id = "area_mud_room"
    signal_event.payload = {
        "event_type": "trigger",
        "source_id": "binary_sensor.mud_room_motion",
    }
    signal_event.timestamp = datetime.now(UTC)
    for callback in signal_callbacks:
        callback(signal_event)

    changed_event = Mock()
    changed_event.location_id = "area_mud_room"
    changed_event.payload = {
        "occupied": True,
        "previous_occupied": False,
        "reason": "event:trigger",
    }
    changed_event.timestamp = datetime.now(UTC)
    for callback in occupancy_callbacks:
        callback(changed_event)

    await hass.async_block_till_done()
    unsub()

    matched = next(
        item for item in forwarded_events if item.get("location_id") == "area_mud_room"
    )
    assert matched["recent_changes"][0]["kind"] == "state"
    assert matched["recent_changes"][1]["kind"] == "signal"
    assert matched["recent_changes"][1]["source_id"] == "binary_sensor.mud_room_motion"


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
    assert home_call.kwargs.get("is_explicit_root") is False

    # Default building wrapper is Home.
    building_call = next(
        call for call in mock_location_manager.create_location.call_args_list if call.kwargs.get("id") == "building_main"
    )
    assert building_call.kwargs.get("name") == "Home"
    assert building_call.kwargs.get("parent_id") == "home"

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

    home_meta_payload: dict | None = None
    for call in mock_location_manager.set_module_config.call_args_list:
        args, kwargs = call.args or (), call.kwargs or {}
        loc = kwargs.get("location_id") or (args[0] if len(args) > 0 else None)
        mod = kwargs.get("module_id") or (args[1] if len(args) > 1 else None)
        if loc != "home" or mod != "_meta":
            continue
        cfg = kwargs.get("config")
        if cfg is None and len(args) > 2:
            cfg = args[2]
        home_meta_payload = cfg if isinstance(cfg, dict) else None
        break
    assert isinstance(home_meta_payload, dict)
    assert home_meta_payload.get("type") == "property"
    assert home_meta_payload.get("topology_anchor") is True


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
