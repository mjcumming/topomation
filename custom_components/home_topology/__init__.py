"""Home Topology integration for Home Assistant."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.storage import Store

from home_topology import EventBus, LocationManager
from home_topology.modules.ambient import AmbientLightModule
from home_topology.modules.automation import AutomationModule
from home_topology.modules.occupancy import OccupancyModule

from .const import DOMAIN, STORAGE_KEY_CONFIG, STORAGE_KEY_STATE, STORAGE_VERSION
from .coordinator import HomeTopologyCoordinator
from .event_bridge import EventBridge
from .panel import async_register_panel
from .services import async_register_services
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
    """Set up Home Topology from a config entry."""
    _LOGGER.info("Setting up Home Topology integration")

    hass.data.setdefault(DOMAIN, {})

    # 1. Create kernel components
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    if hasattr(loc_mgr, "set_event_bus"):
        loc_mgr.set_event_bus(bus)

    # 2. Create root location
    try:
        loc_mgr.create_location(
            id="house",
            name="House",
            is_explicit_root=True,
        )
    except ValueError:
        # Already exists (from saved config)
        pass

    # 3. Load saved configuration
    await _load_configuration(hass, loc_mgr)

    # 4. Initialize modules
    platform_adapter = HAPlatformAdapter(hass)
    modules = {
        "occupancy": OccupancyModule(),
        "automation": AutomationModule(),
        "ambient": AmbientLightModule(platform_adapter=platform_adapter),
    }

    # 5. Attach modules to kernel
    for module in modules.values():
        module.attach(bus, loc_mgr)

    # 6. Set up default configs for new locations
    _setup_default_configs(loc_mgr, modules)

    # 7. Restore module runtime state
    await _restore_module_state(hass, modules)

    # 8. Create coordinator for timeout scheduling
    coordinator = HomeTopologyCoordinator(hass, modules)

    # 9. Set up sync manager for bidirectional HA ↔ Topology sync
    sync_manager = SyncManager(hass, loc_mgr, bus)
    await sync_manager.async_setup()

    # 10. Set up event bridge (HA → kernel)
    event_bridge = EventBridge(hass, bus, loc_mgr)
    await event_bridge.async_setup()

    # 11. Store kernel in hass.data
    hass.data[DOMAIN][entry.entry_id] = {
        "entry": entry,
        "location_manager": loc_mgr,
        "event_bus": bus,
        "modules": modules,
        "coordinator": coordinator,
        "sync_manager": sync_manager,
        "event_bridge": event_bridge,
    }

    # 11. Register panel, WebSocket API, and services
    await async_register_panel(hass)
    async_register_websocket_api(hass)
    async_register_services(hass)

    # 12. Set up platforms (entities)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # 13. Schedule initial timeout check
    coordinator.schedule_next_timeout()

    # 14. Register shutdown handler
    @callback
    async def save_state_on_shutdown(_: Event) -> None:
        """Save state before shutdown."""
        await _save_state(hass, entry.entry_id, loc_mgr, modules)

    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, save_state_on_shutdown)
    )

    _LOGGER.info("Home Topology integration setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Home Topology integration")

    # Save state before unloading
    kernel = hass.data[DOMAIN][entry.entry_id]
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

        # Remove from hass.data
        hass.data[DOMAIN].pop(entry.entry_id)

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

            # Store in LocationManager
            loc_mgr.set_module_config(
                location_id=location.id,
                module_id=module_id,
                config=default_config,
            )


async def _load_configuration(hass: HomeAssistant, loc_mgr: LocationManager) -> None:
    """Load saved location configuration."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    data = await store.async_load()

    if not data:
        _LOGGER.debug("No saved configuration found")
        return

    locations = data.get("locations")
    if not isinstance(locations, list):
        _LOGGER.warning("Invalid saved configuration format; expected locations list")
        return

    # Create locations in parent-first order where possible.
    pending: dict[str, dict[str, Any]] = {}
    for item in locations:
        if not isinstance(item, Mapping):
            continue
        location_id = item.get("id")
        if not isinstance(location_id, str) or not location_id:
            continue
        pending[location_id] = dict(item)

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
        if not isinstance(location_id, str) or loc_mgr.get_location(location_id) is None:
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


async def _restore_module_state(hass: HomeAssistant, modules: dict[str, Any]) -> None:
    """Restore runtime state for all modules."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY_STATE)
    data = await store.async_load()

    if not data:
        _LOGGER.debug("No saved state found")
        return

    for module_id, module in modules.items():
        if module_id in data:
            try:
                module.restore_state(data[module_id])
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
