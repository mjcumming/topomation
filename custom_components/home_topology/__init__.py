"""Home Topology integration for Home Assistant."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import (
    area_registry as ar,
)
from homeassistant.helpers import (
    entity_registry as er,
)
from homeassistant.helpers.storage import Store

from home_topology import EventBus, LocationManager
from home_topology.modules.automation import AutomationModule
from home_topology.modules.occupancy import OccupancyModule

from .const import DOMAIN, STORAGE_KEY_CONFIG, STORAGE_KEY_STATE, STORAGE_VERSION
from .coordinator import HomeTopologyCoordinator
from .event_bridge import EventBridge
from .panel import async_register_panel
from .services import async_register_services
from .websocket_api import async_register_websocket_api

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,  # Occupancy binary sensors
    Platform.SENSOR,  # Occupancy state sensors
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Home Topology from a config entry."""
    _LOGGER.info("Setting up Home Topology integration")

    hass.data.setdefault(DOMAIN, {})

    # 1. Create kernel components
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)

    # 2. Build topology from HA areas
    await _build_topology_from_ha(hass, loc_mgr)

    # 3. Load saved configuration
    await _load_configuration(hass, loc_mgr)

    # 4. Initialize modules
    modules = {
        "occupancy": OccupancyModule(),
        "automation": AutomationModule(),
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

    # 9. Set up event bridge (HA → kernel)
    event_bridge = EventBridge(hass, bus, loc_mgr)
    await event_bridge.async_setup()

    # 10. Store kernel in hass.data
    hass.data[DOMAIN][entry.entry_id] = {
        "entry": entry,
        "location_manager": loc_mgr,
        "event_bus": bus,
        "modules": modules,
        "coordinator": coordinator,
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
        # Clean up event bridge
        event_bridge: EventBridge = kernel["event_bridge"]
        await event_bridge.async_teardown()

        # Remove from hass.data
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok


async def _build_topology_from_ha(hass: HomeAssistant, loc_mgr: LocationManager) -> None:
    """Build location topology from Home Assistant areas."""
    _LOGGER.info("Building topology from HA areas")

    # Create root location (house)
    try:
        loc_mgr.create_location(
            id="house",
            name="House",
            is_explicit_root=True,
        )
    except ValueError:
        # Already exists (from saved config)
        pass

    # Import HA areas as locations
    area_registry = ar.async_get(hass)
    for area in area_registry.areas.values():
        location_id = f"area_{area.id}"
        try:
            loc_mgr.create_location(
                id=location_id,
                name=area.name,
                parent_id="house",
                ha_area_id=area.id,
                is_explicit_root=False,
            )
        except ValueError:
            # Already exists
            pass

    # Map entities to locations based on HA area assignments
    entity_registry = er.async_get(hass)
    for entity in entity_registry.entities.values():
        if entity.area_id:
            location_id = f"area_{entity.area_id}"
            try:
                loc_mgr.add_entity_to_location(entity.entity_id, location_id)
            except (ValueError, KeyError):
                # Location or entity doesn't exist or already mapped
                pass


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

    # TODO: Restore locations from saved config
    # This would restore user-created locations, hierarchy changes, etc.
    _LOGGER.debug("Configuration loading not yet implemented")


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
                _LOGGER.error("Failed to restore state for %s: %s", module_id, e, exc_info=True)


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
            _LOGGER.error("Failed to dump state for %s: %s", module_id, e, exc_info=True)

    state_store = Store(hass, STORAGE_VERSION, STORAGE_KEY_STATE)
    await state_store.async_save(state_data)

    # TODO: Save configuration (locations, hierarchy, module configs)
    # config_store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    # await config_store.async_save(config_data)

    _LOGGER.info("Kernel state saved")
