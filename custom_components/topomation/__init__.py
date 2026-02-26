"""Topomation integration for Home Assistant."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from inspect import isawaitable
from typing import TYPE_CHECKING, Any

from home_topology import EventBus, EventFilter, LocationManager
from home_topology.modules.ambient import AmbientLightModule
from home_topology.modules.automation import AutomationModule
from home_topology.modules.occupancy import OccupancyModule
from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store

from .actions_runtime import (
    TopomationActionsRuntime,
    ensure_automation_config_defaults,
)
from .const import (
    AUTOMATION_REAPPLY_CONFIG_KEY,
    AUTOSAVE_DEBOUNCE_SECONDS,
    DOMAIN,
    STORAGE_KEY_CONFIG,
    STORAGE_KEY_STATE,
    STORAGE_VERSION,
)
from .coordinator import TopomationCoordinator
from .event_bridge import EventBridge
from .panel import async_register_panel
from .services import async_register_services, async_unregister_services
from .sync_manager import SyncManager
from .websocket_api import async_register_websocket_api

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,  # Occupancy binary sensors
    Platform.SENSOR,  # Occupancy state sensors
]


class HAPlatformAdapter:
    """Platform adapter for AmbientLightModule to access HA state."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the platform adapter."""
        self.hass = hass

    def get_numeric_state(self, entity_id: str) -> float | None:
        """Get numeric state value from HA entity."""
        state = self.hass.states.get(entity_id)
        if state and state.state not in ("unknown", "unavailable"):
            try:
                return float(state.state)
            except ValueError:
                return None
        return None

    def get_state(self, entity_id: str) -> str | None:
        """Get state string from HA entity."""
        state = self.hass.states.get(entity_id)
        return state.state if state else None

    def get_device_class(self, entity_id: str) -> str | None:
        """Get device class from HA entity."""
        state = self.hass.states.get(entity_id)
        if state:
            return state.attributes.get("device_class")
        return None

    def get_unit_of_measurement(self, entity_id: str) -> str | None:
        """Get unit of measurement from HA entity."""
        state = self.hass.states.get(entity_id)
        if state:
            return state.attributes.get("unit_of_measurement")
        return None


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Topomation from a config entry."""
    _LOGGER.info("Setting up Topomation integration")

    hass.data.setdefault(DOMAIN, {})

    # 1. Create kernel components
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    loc_mgr.set_event_bus(bus)

    # 2. Load saved configuration
    has_saved_configuration = await _load_configuration(hass, loc_mgr)

    # 3. Initialize modules
    platform_adapter = HAPlatformAdapter(hass)
    modules = {
        "occupancy": OccupancyModule(),
        "automation": AutomationModule(),
        "ambient": AmbientLightModule(platform_adapter=platform_adapter),
    }

    # 4. Attach modules to kernel
    for module in modules.values():
        module.attach(bus, loc_mgr)

    # 5. Set up default configs for new locations
    _setup_default_configs(loc_mgr, modules)

    # 6. Restore module runtime state
    await _restore_module_state(hass, loc_mgr, modules)

    # 7. Create coordinator for timeout scheduling
    coordinator = TopomationCoordinator(hass, modules)

    # Keep timeout scheduling aligned with runtime occupancy changes.
    # Initial scheduling happens at startup, then this hook reschedules whenever
    # occupancy events mutate active holds/timeouts.
    @callback
    def _reschedule_timeouts(_: Event) -> None:
        coordinator.schedule_next_timeout()

    bus.subscribe(_reschedule_timeouts, EventFilter(event_type="occupancy.changed"))
    bus.subscribe(_reschedule_timeouts, EventFilter(event_type="occupancy.signal"))

    # 8. Set up sync manager for bidirectional HA ↔ Topology sync
    sync_manager = SyncManager(hass, loc_mgr, bus)
    await sync_manager.async_setup()
    has_explicit_root = any(
        bool(getattr(location, "is_explicit_root", False))
        for location in loc_mgr.all_locations()
    )
    should_bootstrap_structure = (not has_saved_configuration) or (not has_explicit_root)
    if should_bootstrap_structure:
        _bootstrap_default_structural_roots(
            hass,
            loc_mgr,
            reparent_floors_to_default_building=not has_saved_configuration,
        )
        _setup_default_configs(loc_mgr, modules)
    wrappers_normalized = _normalize_root_only_structural_wrappers(loc_mgr)
    if wrappers_normalized:
        _setup_default_configs(loc_mgr, modules)
    automation_defaults_updated = ensure_automation_config_defaults(loc_mgr)

    # 9. Set up event bridge (HA → kernel)
    event_bridge = EventBridge(hass, bus, loc_mgr, modules.get("occupancy"))
    await event_bridge.async_setup()
    reconcile = getattr(event_bridge, "async_reconcile_policy_sources", None)
    if callable(reconcile):
        maybe_awaitable = reconcile()
        if isawaitable(maybe_awaitable):
            await maybe_awaitable

    # 10. Runtime observers for occupied/vacant native HA automations.
    actions_runtime = TopomationActionsRuntime(hass, loc_mgr, bus)
    await actions_runtime.async_setup()

    # 11. Debounced persistence scheduler for runtime/config edits.
    autosave_unsub = None
    autosave_running = False
    autosave_again = False

    async def _run_autosave() -> None:
        nonlocal autosave_running, autosave_again
        if autosave_running:
            autosave_again = True
            return

        autosave_running = True
        try:
            await _save_state(hass, entry.entry_id, loc_mgr, modules)
        except Exception:  # pragma: no cover - defensive logging
            _LOGGER.exception("Debounced autosave failed")
        finally:
            autosave_running = False
            if autosave_again:
                autosave_again = False
                _schedule_persist("coalesced")

    @callback
    def _schedule_persist(reason: str = "unspecified") -> None:
        nonlocal autosave_unsub
        if autosave_unsub is not None:
            return

        _LOGGER.debug("Scheduling Topomation autosave (%s)", reason)

        @callback
        def _handle_autosave(_: Any) -> None:
            nonlocal autosave_unsub
            autosave_unsub = None
            hass.async_create_task(_run_autosave())

        autosave_unsub = async_call_later(
            hass,
            AUTOSAVE_DEBOUNCE_SECONDS,
            _handle_autosave,
        )

    @callback
    def _cancel_pending_persist() -> None:
        nonlocal autosave_unsub
        if autosave_unsub is None:
            return
        autosave_unsub()
        autosave_unsub = None

    @callback
    def _schedule_persist_on_occupancy(_: Event) -> None:
        _schedule_persist("occupancy.changed")

    bus.subscribe(_schedule_persist_on_occupancy, EventFilter(event_type="occupancy.changed"))

    # Persist topology migration updates for existing installs as soon as possible.
    if should_bootstrap_structure and has_saved_configuration:
        _schedule_persist("upgrade/ensure_home_root")
    if wrappers_normalized and has_saved_configuration:
        _schedule_persist("upgrade/root_only_wrappers")
    if automation_defaults_updated and has_saved_configuration:
        _schedule_persist("upgrade/automation_defaults")

    # 12. Store kernel in hass.data
    hass.data[DOMAIN][entry.entry_id] = {
        "entry": entry,
        "location_manager": loc_mgr,
        "event_bus": bus,
        "modules": modules,
        "coordinator": coordinator,
        "sync_manager": sync_manager,
        "event_bridge": event_bridge,
        "actions_runtime": actions_runtime,
        "schedule_persist": _schedule_persist,
        "cancel_pending_persist": _cancel_pending_persist,
    }

    # 13. Register panel, WebSocket API, and services
    await async_register_panel(hass)
    async_register_websocket_api(hass)
    async_register_services(hass)

    # 14. Set up platforms (entities)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # 15. Schedule initial timeout check
    coordinator.schedule_next_timeout()

    # 16. Register shutdown handler
    @callback
    async def save_state_on_shutdown(_: Event) -> None:
        """Save state before shutdown."""
        await _save_state(hass, entry.entry_id, loc_mgr, modules)

    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, save_state_on_shutdown)
    )

    _LOGGER.info("Topomation integration setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Topomation integration")

    # Save state before unloading
    kernel = hass.data[DOMAIN][entry.entry_id]
    cancel_pending_persist = kernel.get("cancel_pending_persist")
    if callable(cancel_pending_persist):
        cancel_pending_persist()

    await _save_state(
        hass,
        entry.entry_id,
        kernel["location_manager"],
        kernel["modules"],
    )

    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        # Clean up sync manager
        sync_manager: SyncManager = kernel["sync_manager"]
        await sync_manager.async_teardown()

        # Clean up event bridge
        event_bridge: EventBridge = kernel["event_bridge"]
        await event_bridge.async_teardown()

        # Clean up action runtime observers/timers
        actions_runtime: TopomationActionsRuntime = kernel["actions_runtime"]
        await actions_runtime.async_teardown()

        # Remove from hass.data
        hass.data[DOMAIN].pop(entry.entry_id)
        if not hass.data[DOMAIN]:
            async_unregister_services(hass)

    return unload_ok


# NOTE: _build_topology_from_ha has been replaced by SyncManager
# which handles initial import and live bidirectional sync


def _setup_default_configs(loc_mgr: LocationManager, modules: dict[str, Any]) -> None:
    """Set up default module configurations for all locations."""
    for location in loc_mgr.all_locations():
        for module_id, module in modules.items():
            # Skip if config already exists
            existing = loc_mgr.get_module_config(location.id, module_id)
            if existing:
                continue

            # Get default config from module
            default_config = module.default_config()
            default_config["version"] = module.CURRENT_CONFIG_VERSION
            if module_id == "automation":
                default_config.setdefault(AUTOMATION_REAPPLY_CONFIG_KEY, False)

            # Store in LocationManager
            loc_mgr.set_module_config(
                location_id=location.id,
                module_id=module_id,
                config=default_config,
            )


def _location_type(location: Any) -> str:
    """Return normalized topology type from location meta."""
    modules = getattr(location, "modules", {}) or {}
    if not isinstance(modules, dict):
        return ""
    meta = modules.get("_meta", {})
    if not isinstance(meta, dict):
        return ""
    return str(meta.get("type", "")).strip().lower()


def _normalize_root_only_structural_wrappers(loc_mgr: LocationManager) -> bool:
    """Ensure building/grounds wrappers are always root-level."""
    normalized = False
    for location in list(loc_mgr.all_locations()):
        if bool(getattr(location, "is_explicit_root", False)):
            continue
        if _location_type(location) not in {"building", "grounds"}:
            continue
        if getattr(location, "parent_id", None) is None:
            continue
        try:
            loc_mgr.update_location(location.id, parent_id="")
            normalized = True
        except (KeyError, ValueError) as err:
            _LOGGER.warning(
                "Failed to normalize root-only wrapper '%s': %s",
                location.id,
                err,
            )
    return normalized


async def _load_configuration(hass: HomeAssistant, loc_mgr: LocationManager) -> bool:
    """Load saved location configuration.

    Returns True when saved config payload exists (even if empty/invalid),
    False when this appears to be first install (no saved payload).
    """
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    data = await store.async_load()

    if not data:
        _LOGGER.debug("No saved configuration found")
        return False

    locations = data.get("locations")
    if not isinstance(locations, list):
        _LOGGER.warning("Invalid saved configuration format; expected locations list")
        return True

    # Legacy migration: older versions persisted a synthetic explicit root location
    # ("house"). The current model does not use a synthetic root.
    legacy_root_ids = {
        str(item.get("id"))
        for item in locations
        if isinstance(item, Mapping)
        and item.get("id")
        and item.get("is_explicit_root") is True
        and str(item.get("id")) == "house"
    }

    # Create locations in parent-first order where possible.
    pending: dict[str, dict[str, Any]] = {}
    for item in locations:
        if not isinstance(item, Mapping):
            continue
        location_id = item.get("id")
        if not isinstance(location_id, str) or not location_id:
            continue
        if location_id in legacy_root_ids:
            continue

        normalized = dict(item)
        parent_id = normalized.get("parent_id")
        if parent_id in legacy_root_ids or parent_id == "house":
            normalized["parent_id"] = None
        pending[location_id] = normalized

    created: set[str] = set()
    while pending:
        progressed = False
        for location_id, item in list(pending.items()):
            parent_id = item.get("parent_id")
            if parent_id and parent_id not in created and loc_mgr.get_location(parent_id) is None:
                continue

            if loc_mgr.get_location(location_id) is None:
                try:
                    loc_mgr.create_location(
                        id=location_id,
                        name=item.get("name", location_id),
                        parent_id=parent_id,
                        is_explicit_root=bool(item.get("is_explicit_root", False)),
                        order=item.get("order"),
                    )
                except ValueError as err:
                    _LOGGER.warning("Failed to restore location %s: %s", location_id, err)

            created.add(location_id)
            pending.pop(location_id)
            progressed = True

        if progressed:
            continue

        # Break cycles or bad parent references by forcing creation.
        location_id, item = pending.popitem()
        if loc_mgr.get_location(location_id) is None:
            try:
                loc_mgr.create_location(
                    id=location_id,
                    name=item.get("name", location_id),
                    parent_id=None,
                    is_explicit_root=False,
                    order=item.get("order"),
                )
            except ValueError as err:
                _LOGGER.warning("Failed to restore orphan location %s: %s", location_id, err)
        created.add(location_id)

    # Restore entity mappings and per-location module configs.
    for item in locations:
        if not isinstance(item, Mapping):
            continue
        location_id = item.get("id")
        if (
            not isinstance(location_id, str)
            or location_id in legacy_root_ids
            or loc_mgr.get_location(location_id) is None
        ):
            continue

        entity_ids = item.get("entity_ids", [])
        if isinstance(entity_ids, list):
            for entity_id in entity_ids:
                if not isinstance(entity_id, str):
                    continue
                try:
                    loc_mgr.add_entity_to_location(entity_id, location_id)
                except (KeyError, ValueError):
                    _LOGGER.debug(
                        "Failed to restore entity mapping %s -> %s",
                        entity_id,
                        location_id,
                    )

        modules = item.get("modules", {})
        if isinstance(modules, Mapping):
            for module_id, config in modules.items():
                if isinstance(module_id, str) and isinstance(config, Mapping):
                    loc_mgr.set_module_config(location_id, module_id, dict(config))

    _LOGGER.info("Restored %d locations from saved configuration", len(created))
    return True


def _bootstrap_default_structural_roots(
    hass: HomeAssistant,
    loc_mgr: LocationManager,
    *,
    reparent_floors_to_default_building: bool = False,
) -> None:
    """Create a single Home root plus default structural wrappers on first install."""
    all_locations = list(loc_mgr.all_locations())

    home_location = next(
        (
            loc
            for loc in all_locations
            if bool(getattr(loc, "is_explicit_root", False))
        ),
        None,
    )
    created_ids: list[str] = []

    if home_location is None:
        home_name = (getattr(hass.config, "location_name", "") or "").strip() or "Home"
        loc_mgr.create_location(
            id="home",
            name=home_name,
            parent_id=None,
            is_explicit_root=True,
        )
        loc_mgr.set_module_config(
            "home",
            "_meta",
            {
                "type": "building",
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )
        home_location = loc_mgr.get_location("home")
        created_ids.append("home")

    all_locations = list(loc_mgr.all_locations())
    has_building = any(
        _location_type(loc) == "building" and not bool(getattr(loc, "is_explicit_root", False))
        for loc in all_locations
    )
    has_grounds = any(_location_type(loc) == "grounds" for loc in all_locations)

    def _next_id(stem: str) -> str:
        if loc_mgr.get_location(stem) is None:
            return stem
        suffix = 2
        while loc_mgr.get_location(f"{stem}_{suffix}") is not None:
            suffix += 1
        return f"{stem}_{suffix}"

    if not has_building:
        building_name = "Home"
        building_id = _next_id("building_main")
        loc_mgr.create_location(
            id=building_id,
            name=building_name,
            parent_id=None,
            is_explicit_root=False,
        )
        loc_mgr.set_module_config(
            building_id,
            "_meta",
            {
                "type": "building",
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )
        created_ids.append(building_id)

    if not has_grounds:
        grounds_id = _next_id("grounds")
        loc_mgr.create_location(
            id=grounds_id,
            name="Grounds",
            parent_id=None,
            is_explicit_root=False,
        )
        loc_mgr.set_module_config(
            grounds_id,
            "_meta",
            {
                "type": "grounds",
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )
        created_ids.append(grounds_id)

    if reparent_floors_to_default_building:
        default_building_id = "building_main"
        default_building = loc_mgr.get_location(default_building_id)
        if default_building is None:
            default_building = next(
                (
                    loc
                    for loc in loc_mgr.all_locations()
                    if _location_type(loc) == "building"
                    and not bool(getattr(loc, "is_explicit_root", False))
                ),
                None,
            )
            default_building_id = getattr(default_building, "id", default_building_id)

        if default_building is not None:
            reparented_floor_ids: list[str] = []
            for location in list(loc_mgr.all_locations()):
                if _location_type(location) != "floor":
                    continue
                if getattr(location, "parent_id", None) is not None:
                    continue
                try:
                    loc_mgr.update_location(location.id, parent_id=default_building_id)
                    reparented_floor_ids.append(location.id)
                except (KeyError, ValueError) as err:
                    _LOGGER.warning(
                        "Failed to parent floor '%s' under default Home building '%s': %s",
                        location.id,
                        default_building_id,
                        err,
                    )

            if reparented_floor_ids:
                _LOGGER.info(
                    "Parented %d floor(s) under default Home building '%s': %s",
                    len(reparented_floor_ids),
                    default_building_id,
                    ", ".join(sorted(reparented_floor_ids)),
                )

    if created_ids:
        _LOGGER.info("Bootstrapped default structural roots: %s", ", ".join(created_ids))


def _allowed_occupancy_source_ids_for_location(loc_mgr: LocationManager, location_id: str) -> set[str]:
    """Return configured occupancy source IDs for a location."""
    config = loc_mgr.get_module_config(location_id, "occupancy")
    if not isinstance(config, dict):
        return set()

    sources = config.get("occupancy_sources")
    if not isinstance(sources, list):
        return set()

    allowed: set[str] = set()
    for source in sources:
        if not isinstance(source, dict):
            continue
        source_id = source.get("source_id")
        if isinstance(source_id, str) and source_id.strip():
            allowed.add(source_id.strip())
            continue

        entity_id = source.get("entity_id")
        if not isinstance(entity_id, str) or not entity_id.strip():
            continue
        entity_id = entity_id.strip()
        signal_key = source.get("signal_key")
        if isinstance(signal_key, str) and signal_key.strip():
            allowed.add(f"{entity_id}::{signal_key.strip()}")
        else:
            allowed.add(entity_id)

    return allowed


def _sanitize_occupancy_state_for_restore(
    loc_mgr: LocationManager,
    raw_state: dict[str, Any],
) -> tuple[dict[str, Any], int]:
    """Drop stale entity-based occupancy contributions no longer configured."""
    sanitized: dict[str, Any] = {}
    dropped = 0

    for location_id, entry in raw_state.items():
        if not isinstance(entry, dict):
            sanitized[location_id] = entry
            continue

        allowed_source_ids = _allowed_occupancy_source_ids_for_location(loc_mgr, location_id)
        updated_entry = dict(entry)

        for key in ("contributions", "suspended_contributions"):
            values = entry.get(key)
            if not isinstance(values, list):
                continue

            filtered: list[Any] = []
            for item in values:
                if not isinstance(item, dict):
                    filtered.append(item)
                    continue
                source_id = str(item.get("source_id", "")).strip()
                if not source_id:
                    filtered.append(item)
                    continue
                if source_id.startswith("__child__:") or source_id.startswith("__follow__:"):
                    filtered.append(item)
                    continue

                looks_like_entity_source = "." in source_id.split("::", 1)[0]
                if looks_like_entity_source and source_id not in allowed_source_ids:
                    dropped += 1
                    continue

                filtered.append(item)

            updated_entry[key] = filtered

        sanitized[location_id] = updated_entry

    return sanitized, dropped


async def _restore_module_state(
    hass: HomeAssistant,
    loc_mgr: LocationManager,
    modules: dict[str, Any],
) -> None:
    """Restore runtime state for all modules."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_STATE)
    data = await store.async_load()

    if not data:
        _LOGGER.debug("No saved state found")
        return

    for module_id, module in modules.items():
        if module_id in data:
            try:
                state_payload = data[module_id]
                if module_id == "occupancy" and isinstance(state_payload, dict):
                    state_payload, dropped = _sanitize_occupancy_state_for_restore(
                        loc_mgr,
                        state_payload,
                    )
                    if dropped > 0:
                        _LOGGER.info(
                            "Pruned %d stale occupancy contribution(s) during restore",
                            dropped,
                        )
                module.restore_state(state_payload)
                _LOGGER.info("Restored state for %s", module_id)
            except Exception as e:
                _LOGGER.error(
                    "Failed to restore state for %s: %s", module_id, e, exc_info=True
                )


async def _save_state(
    hass: HomeAssistant,
    entry_id: str,
    loc_mgr: LocationManager,
    modules: dict[str, Any],
) -> None:
    """Save kernel state to persistent storage."""
    _LOGGER.debug("Saving kernel state")

    # Save module state
    state_data = {}
    for module_id, module in modules.items():
        try:
            state_data[module_id] = module.dump_state()
        except Exception as e:
            _LOGGER.error(
                "Failed to dump state for %s: %s", module_id, e, exc_info=True
            )

    state_store = Store(hass, STORAGE_VERSION, STORAGE_KEY_STATE)
    await state_store.async_save(state_data)

    # Save topology configuration (locations, hierarchy, module configs).
    config_locations: list[dict[str, Any]] = []
    for location in loc_mgr.all_locations():
        if location.id == "house" and location.is_explicit_root:
            continue
        config_locations.append(
            {
                "id": location.id,
                "name": location.name,
                "parent_id": location.parent_id,
                "is_explicit_root": location.is_explicit_root,
                "order": location.order,
                "entity_ids": list(location.entity_ids),
                "modules": dict(location.modules),
            }
        )

    config_store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await config_store.async_save({"locations": config_locations})

    _LOGGER.info("Kernel state saved")
