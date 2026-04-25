"""Topomation integration for Home Assistant."""

from __future__ import annotations

import logging
from collections import defaultdict, deque
from collections.abc import Mapping
from datetime import UTC, datetime
from inspect import isawaitable
from typing import TYPE_CHECKING, Any

from home_topology import EventBus, EventFilter, LocationManager
from home_topology.modules.ambient import AmbientLightModule
from home_topology.modules.automation import AutomationModule
from home_topology.modules.occupancy import OccupancyModule
from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .actions_runtime import (
    TopomationActionsRuntime,
)
from .const import (
    AUTOSAVE_DEBOUNCE_SECONDS,
    DOMAIN,
    EVENT_TOPOMATION_HANDOFF_TRACE,
    EVENT_TOPOMATION_OCCUPANCY_CHANGED,
    META_TOPOLOGY_ANCHOR_KEY,
    STORAGE_KEY_CONFIG,
    STORAGE_KEY_STATE,
    STORAGE_VERSION,
)
from .coordinator import TopomationCoordinator
from .event_bridge import EventBridge
from .managed_actions import TopomationManagedActions
from .panel import async_register_panel
from .services import async_register_services, async_unregister_services
from .sync_manager import SyncManager, managed_shadow_entity_ids_for_ambient
from .websocket_api import async_register_websocket_api

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

_LOGGER = logging.getLogger(__name__)
_LINKED_LOCATION_SOURCE_PREFIX = "linked:"
_OCCUPANCY_LINKED_LOCATIONS_KEY = "linked_locations"
_META_ROLE_KEY = "role"
_MANAGED_SHADOW_ROLE = "managed_shadow"
_MAX_PROPAGATION_EVENTS_PER_DRAIN = 4096
_MAX_OCCUPANCY_EXPLAINABILITY_EVENTS = 20
# Drop stayed-occupied explainability rows when another occupied state row was
# logged moments ago (motion + lights + propagation bursts).
_OCCUPANCY_EXTENSION_EXPLAINABILITY_THROTTLE_SECONDS = 10

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,  # Occupancy binary sensors
    Platform.SWITCH,  # Per-location lock switches
]


@callback
def _prune_hidden_entities(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove previously-created ambient entities no longer exposed by Topomation."""
    registry = er.async_get(hass)
    for reg_entry in list(er.async_entries_for_config_entry(registry, entry.entry_id)):
        unique_id = str(reg_entry.unique_id or "")
        if (
            unique_id.startswith("ambient_light_")
            or unique_id.startswith("ambient_is_dark_")
            or unique_id.startswith("ambient_is_bright_")
        ):
            registry.async_remove(reg_entry.entity_id)


def _event_timestamp_iso(event: Event) -> str:
    """Return a stable ISO timestamp for an event."""
    timestamp = getattr(event, "timestamp", None)
    if isinstance(timestamp, datetime):
        return timestamp.astimezone(UTC).isoformat()
    return dt_util.utcnow().isoformat()


def _parse_explainability_changed_at_iso(value: str) -> datetime | None:
    """Parse a changed_at value from explainability buffers."""
    raw = value.strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(UTC)
    except ValueError:
        return None


def _should_skip_occupied_extension_explainability(
    recent_changes: deque[dict[str, Any]],
    *,
    occupied: bool,
    previous_occupied: bool | None,
    new_changed_at: str,
) -> bool:
    """Return True when a stayed-occupied state row should not be buffered."""
    if not (occupied is True and previous_occupied is True):
        return False
    if not recent_changes:
        return False
    last = recent_changes[0]
    if last.get("kind") != "state" or last.get("event") != "occupied":
        return False
    if last.get("occupied") is not True:
        return False
    last_ts = last.get("changed_at")
    if not isinstance(last_ts, str):
        return False
    last_dt = _parse_explainability_changed_at_iso(last_ts)
    new_dt = _parse_explainability_changed_at_iso(new_changed_at)
    if last_dt is None or new_dt is None:
        return False
    delta = (new_dt - last_dt).total_seconds()
    if delta < 0:
        return False
    return delta < _OCCUPANCY_EXTENSION_EXPLAINABILITY_THROTTLE_SECONDS


async def _async_handle_options_update(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload integration when options change."""
    await hass.config_entries.async_reload(entry.entry_id)


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

    def call_service(
        self,
        domain: str,
        service: str,
        entity_id: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> bool:
        """Schedule a Home Assistant service call for automation engine actions."""
        payload = dict(data or {})
        if entity_id and "entity_id" not in payload:
            payload["entity_id"] = entity_id

        try:
            self.hass.async_create_task(
                self.hass.services.async_call(
                    domain,
                    service,
                    payload,
                    blocking=False,
                )
            )
            return True
        except Exception:  # pragma: no cover - defensive around runtime service dispatch
            _LOGGER.exception(
                "Failed to schedule automation action service %s.%s for %s",
                domain,
                service,
                entity_id or "<none>",
            )
            return False

    def get_current_time(self) -> datetime:
        """Return timezone-aware current time for automation engine conditions."""
        return dt_util.utcnow()


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
    topology_migrated = _migrate_topology_property_model(loc_mgr)

    # 3. Initialize modules
    platform_adapter = HAPlatformAdapter(hass)
    occupancy_module = OccupancyModule()
    automation_module = AutomationModule()
    automation_module.set_platform(platform_adapter)
    automation_module.set_occupancy_module(occupancy_module)
    modules = {
        "occupancy": occupancy_module,
        "automation": automation_module,
        "ambient": AmbientLightModule(
            platform_adapter=platform_adapter,
            extra_lux_entity_ids=lambda lid: managed_shadow_entity_ids_for_ambient(
                loc_mgr, lid
            ),
        ),
    }
    occupancy_recent_changes: dict[str, deque[dict[str, Any]]] = defaultdict(
        lambda: deque(maxlen=_MAX_OCCUPANCY_EXPLAINABILITY_EVENTS)
    )

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

    @callback
    def _forward_occupancy_changed(event: Event) -> None:
        """Mirror kernel occupancy changes onto HA event bus for panel live updates."""
        payload = event.payload if isinstance(event.payload, Mapping) else {}
        occupied = payload.get("occupied")
        location_id = event.location_id
        if not isinstance(location_id, str) or not isinstance(occupied, bool):
            return

        ha_payload: dict[str, Any] = {
            "entry_id": entry.entry_id,
            "location_id": location_id,
            "occupied": occupied,
        }
        previous_occupied = payload.get("previous_occupied")
        if isinstance(previous_occupied, bool):
            ha_payload["previous_occupied"] = previous_occupied
        reason = payload.get("reason")
        if isinstance(reason, str) and reason:
            ha_payload["reason"] = reason
        changed_at = _event_timestamp_iso(event)
        recent_changes = occupancy_recent_changes[location_id]
        previous_occupied_bool = (
            previous_occupied if isinstance(previous_occupied, bool) else None
        )
        if not _should_skip_occupied_extension_explainability(
            recent_changes,
            occupied=occupied,
            previous_occupied=previous_occupied_bool,
            new_changed_at=changed_at,
        ):
            recent_changes.appendleft(
                {
                    "kind": "state",
                    "event": "occupied" if occupied else "vacant",
                    "occupied": occupied,
                    "previous_occupied": previous_occupied_bool,
                    "reason": reason if isinstance(reason, str) and reason else None,
                    "changed_at": changed_at,
                }
            )
        ha_payload["recent_changes"] = list(recent_changes)

        hass.bus.async_fire(EVENT_TOPOMATION_OCCUPANCY_CHANGED, ha_payload)

    bus.subscribe(_forward_occupancy_changed, EventFilter(event_type="occupancy.changed"))

    @callback
    def _record_occupancy_signal(event: Event) -> None:
        """Track recent source-level occupancy activity for inspector explainability."""
        payload = event.payload if isinstance(event.payload, Mapping) else {}
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return

        raw_event_type = payload.get("event_type")
        event_type = str(raw_event_type).strip().lower() if raw_event_type is not None else ""
        source_id = payload.get("source_id")
        signal_key = payload.get("signal_key")

        occupancy_recent_changes[location_id].appendleft(
            {
                "kind": "signal",
                "event": event_type or "signal",
                "source_id": str(source_id).strip() if isinstance(source_id, str) and source_id.strip() else None,
                "signal_key": str(signal_key).strip()
                if isinstance(signal_key, str) and signal_key.strip()
                else None,
                "changed_at": _event_timestamp_iso(event),
            }
        )

    bus.subscribe(_record_occupancy_signal, EventFilter(event_type="occupancy.signal"))

    @callback
    def _apply_linked_location_contributors(event: Event) -> None:
        """Propagate directional linked-location occupancy contributors."""
        nonlocal linked_propagation_active

        linked_event_queue.append(event)
        if linked_propagation_active:
            return

        linked_propagation_active = True
        if occupancy_module is None:
            linked_event_queue.clear()
            linked_propagation_active = False
            return

        try:
            drained = 0
            while linked_event_queue:
                drained += 1
                if drained > _MAX_PROPAGATION_EVENTS_PER_DRAIN:
                    _LOGGER.error(
                        "Linked-room propagation exceeded %d queued events in one drain;"
                        " dropping remaining events to avoid recursive startup failure",
                        _MAX_PROPAGATION_EVENTS_PER_DRAIN,
                    )
                    linked_event_queue.clear()
                    break

                queued_event = linked_event_queue.popleft()
                payload = (
                    queued_event.payload
                    if isinstance(queued_event.payload, Mapping)
                    else {}
                )
                source_location_id = queued_event.location_id
                occupied = payload.get("occupied")
                if not isinstance(source_location_id, str) or not source_location_id:
                    continue
                if not isinstance(occupied, bool):
                    continue

                linked_targets = _linked_target_location_ids(loc_mgr, source_location_id)
                if not linked_targets:
                    continue

                source_contributions = _contribution_source_ids(payload)
                source_link_id = _linked_location_source_id(source_location_id)

                for target_location_id in linked_targets:
                    target_state = _occupancy_state_for_location(
                        occupancy_module,
                        target_location_id,
                    )
                    if target_state is None:
                        continue

                    target_contributions = _contribution_source_ids(target_state)
                    reverse_link_id = _linked_location_source_id(target_location_id)

                    if occupied:
                        # Feedback guard for reciprocal links: if source currently depends on
                        # target's linked contribution, do not back-propagate.
                        if reverse_link_id in source_contributions:
                            continue
                        if source_link_id in target_contributions:
                            continue
                        # Mirror the source's remaining hold so the linked contribution on
                        # siblings expires alongside the origin. Passing ``None`` would
                        # create an indefinite contribution that cannot clear once the
                        # occupancy-group mesh mirrors it across members.
                        now = datetime.now(UTC)
                        source_timeout_at = occupancy_module.get_effective_timeout(
                            source_location_id, now
                        )
                        if source_timeout_at is None:
                            propagated_timeout: int | None = None
                        else:
                            propagated_timeout = max(
                                0, int((source_timeout_at - now).total_seconds())
                            )
                        try:
                            occupancy_module.trigger(
                                target_location_id, source_link_id, propagated_timeout
                            )
                        except Exception as err:  # noqa: BLE001
                            _LOGGER.error(
                                "Failed linked-room trigger %s -> %s: %s",
                                source_location_id,
                                target_location_id,
                                err,
                                exc_info=True,
                            )
                    else:
                        if source_link_id not in target_contributions:
                            continue
                        try:
                            occupancy_module.clear(target_location_id, source_link_id, 0)
                        except Exception as err:  # noqa: BLE001
                            _LOGGER.error(
                                "Failed linked-room clear %s -> %s: %s",
                                source_location_id,
                                target_location_id,
                                err,
                                exc_info=True,
                            )
        finally:
            linked_propagation_active = False

    linked_event_queue: deque[Event] = deque()
    linked_propagation_active = False
    bus.subscribe(
        _apply_linked_location_contributors,
        EventFilter(event_type="occupancy.changed"),
    )

    @callback
    def _forward_handoff_trace(event: Event) -> None:
        """Mirror adjacency handoff traces to HA bus for UI diagnostics."""
        payload = event.payload if isinstance(event.payload, Mapping) else {}
        from_location_id = payload.get("from_location_id")
        to_location_id = payload.get("to_location_id")
        if not isinstance(from_location_id, str) or not isinstance(to_location_id, str):
            return

        ha_payload: dict[str, Any] = {
            "entry_id": entry.entry_id,
            "edge_id": str(payload.get("edge_id", "")),
            "from_location_id": from_location_id,
            "to_location_id": to_location_id,
            "trigger_entity_id": str(payload.get("trigger_entity_id", "")),
            "trigger_source_id": str(payload.get("trigger_source_id", "")),
            "boundary_type": str(payload.get("boundary_type", "virtual")),
            "handoff_window_sec": int(payload.get("handoff_window_sec", 12)),
            "status": str(payload.get("status", "provisional_triggered")),
            "timestamp": payload.get("timestamp") or event.timestamp.isoformat(),
        }
        hass.bus.async_fire(EVENT_TOPOMATION_HANDOFF_TRACE, ha_payload)

    bus.subscribe(_forward_handoff_trace, EventFilter(event_type="occupancy.handoff"))

    # 8. Set up sync manager for bidirectional HA ↔ Topology sync
    sync_manager = SyncManager(hass, loc_mgr, bus)
    await sync_manager.async_setup()
    has_explicit_root = any(
        bool(getattr(location, "is_explicit_root", False))
        for location in loc_mgr.all_locations()
    )
    has_structural_scaffold = any(
        _location_type(loc) == "building" and not bool(getattr(loc, "is_explicit_root", False))
        for loc in loc_mgr.all_locations()
    ) or any(_location_type(loc) == "grounds" for loc in loc_mgr.all_locations())
    should_bootstrap_structure = (not has_saved_configuration) or (
        (not has_explicit_root) and not has_structural_scaffold
    )
    if should_bootstrap_structure:
        _bootstrap_default_structural_roots(
            hass,
            loc_mgr,
            reparent_floors_to_default_building=not has_saved_configuration,
        )
        _setup_default_configs(loc_mgr, modules)

    # Managed shadow areas for floor/building/grounds/property hosts must exist before
    # platforms register occupancy entities (hosts no longer expose their own sensors).
    sync_manager.reconcile_managed_shadow_areas()
    # Rebuild occupancy runtime after managed-shadow reconcile because SyncManager may
    # stamp shadow occupancy strategy/contribution config post-create.
    occupancy_rebuild = getattr(occupancy_module, "on_location_config_changed", None)
    if callable(occupancy_rebuild):
        occupancy_rebuild("__managed_shadow_reconcile__", {})

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
    managed_action_rules = TopomationManagedActions(hass)

    @callback
    def _cleanup_managed_entities_on_location_deleted(event: Event) -> None:
        """Delete Topomation-owned automation entities for deleted locations."""
        location_id = event.location_id
        if not isinstance(location_id, str) or not location_id:
            return

        async def _async_cleanup() -> None:
            deleted_ids = await managed_action_rules.async_delete_rules_for_location(location_id)
            if deleted_ids:
                _LOGGER.info(
                    "Deleted %d Topomation managed automation(s) for location %s",
                    len(deleted_ids),
                    location_id,
                )

        hass.async_create_task(_async_cleanup())

    bus.subscribe(
        _cleanup_managed_entities_on_location_deleted,
        EventFilter(event_type="location.deleted"),
    )

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
    if topology_migrated and has_saved_configuration:
        _schedule_persist("upgrade/property_topology")

    # 12. Store kernel in hass.data
    hass.data[DOMAIN][entry.entry_id] = {
        "entry": entry,
        "location_manager": loc_mgr,
        "event_bus": bus,
        "modules": modules,
        "coordinator": coordinator,
        "occupancy_recent_changes": occupancy_recent_changes,
        "sync_manager": sync_manager,
        "event_bridge": event_bridge,
        "actions_runtime": actions_runtime,
        "managed_action_rules": managed_action_rules,
        "schedule_persist": _schedule_persist,
        "cancel_pending_persist": _cancel_pending_persist,
    }

    # Apply options to existing registry entries before platform setup.
    _prune_hidden_entities(hass, entry)

    entry.async_on_unload(entry.add_update_listener(_async_handle_options_update))

    # 13. Register panel, WebSocket API, and services
    await async_register_panel(hass, entry.entry_id)
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

    # TODO(mjcumming): one-off rule-name migration — remove once run successfully on all installs.
    # Runs every integration load until deleted; stomps every rule's alias with the generated
    # auto-name, ignoring user_named. Intentional: establishes the naming baseline.
    async def _run_rule_name_migration(_event: Any = None) -> None:
        try:
            renamed = await managed_action_rules.async_migrate_rule_names(loc_mgr)
            if renamed:
                _LOGGER.info(
                    "[migration] regenerated names for %d Topomation rule(s)",
                    renamed,
                )
        except Exception:  # pragma: no cover - defensive
            _LOGGER.exception("[migration] rule-name migration failed")

    from homeassistant.const import EVENT_HOMEASSISTANT_STARTED  # local import — migration code

    if hass.is_running:
        hass.async_create_task(_run_rule_name_migration())
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _run_rule_name_migration)

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
            existing = loc_mgr.get_module_config(location.id, module_id)
            if isinstance(existing, dict):
                if module_id == "ambient" and existing.get("auto_discover") is not False:
                    loc_mgr.set_module_config(
                        location_id=location.id,
                        module_id=module_id,
                        config={
                            **existing,
                            "auto_discover": False,
                        },
                    )
                continue
            if existing:
                continue

            # Get default config from module
            default_config = module.default_config()
            default_config["version"] = module.CURRENT_CONFIG_VERSION
            if module_id == "occupancy":
                default_config.setdefault(_OCCUPANCY_LINKED_LOCATIONS_KEY, [])
            if module_id == "ambient":
                default_config["auto_discover"] = False

            # Store in LocationManager
            loc_mgr.set_module_config(
                location_id=location.id,
                module_id=module_id,
                config=default_config,
            )


def _location_type(location: Any) -> str:
    """Return normalized topology type from location meta."""
    meta = _location_meta(location)
    return str(meta.get("type", "")).strip().lower()


def _location_meta(location: Any) -> dict[str, Any]:
    """Return normalized topology meta for one location."""
    modules = getattr(location, "modules", {}) or {}
    if not isinstance(modules, dict):
        return {}
    meta = modules.get("_meta", {})
    if not isinstance(meta, dict):
        return {}
    return meta


def _is_managed_shadow_area(location: Any) -> bool:
    """Return True when location is an integration-managed shadow area."""
    if _location_type(location) != "area":
        return False
    meta = _location_meta(location)
    return str(meta.get(_META_ROLE_KEY, "")).strip().lower() == _MANAGED_SHADOW_ROLE


def _topology_anchor_location_ids(loc_mgr: LocationManager) -> list[str]:
    """Return ids of locations tagged as the primary topology anchor(s)."""
    anchors: list[str] = []
    for loc in loc_mgr.all_locations():
        meta = _location_meta(loc)
        if meta.get(META_TOPOLOGY_ANCHOR_KEY) is True:
            anchors.append(str(getattr(loc, "id", "") or ""))
    return [aid for aid in anchors if aid]


def _migrate_topology_property_model(loc_mgr: LocationManager) -> bool:
    """Upgrade legacy hidden Home root to visible property + reparent wrappers.

    Returns True when persisted topology likely changed and should be autosaved.
    """
    changed = False
    home = loc_mgr.get_location("home")
    if home is not None:
        meta = dict(_location_meta(home))
        was_explicit = bool(getattr(home, "is_explicit_root", False))
        old_type = str(meta.get("type", "")).strip().lower()
        if was_explicit or (home.id == "home" and old_type == "building"):
            if was_explicit:
                try:
                    loc_mgr.update_location(home.id, is_explicit_root=False)
                    changed = True
                except (KeyError, ValueError, TypeError) as err:
                    _LOGGER.warning("Failed clearing explicit root on 'home': %s", err)
            meta["type"] = "property"
            meta.setdefault("sync_source", "topology")
            meta.setdefault("sync_enabled", True)
            meta[META_TOPOLOGY_ANCHOR_KEY] = True
            loc_mgr.set_module_config(home.id, "_meta", meta)
            changed = True
            _LOGGER.info("Migrated 'home' location to visible property topology")

    anchors = _topology_anchor_location_ids(loc_mgr)
    if len(anchors) != 1:
        return changed

    anchor = anchors[0]
    for loc in list(loc_mgr.all_locations()):
        if str(getattr(loc, "id", "") or "") == anchor:
            continue
        if bool(getattr(loc, "is_explicit_root", False)):
            continue
        if _location_type(loc) not in {"building", "grounds"}:
            continue
        parent_id = getattr(loc, "parent_id", None)
        if parent_id not in (None, ""):
            continue
        try:
            loc_mgr.update_location(loc.id, parent_id=anchor)
            changed = True
            _LOGGER.info("Reparented '%s' under topology anchor '%s'", loc.id, anchor)
        except (KeyError, ValueError, TypeError) as err:
            _LOGGER.warning("Failed reparenting '%s' under '%s': %s", loc.id, anchor, err)

    return changed


def _supports_adjacency_restore(loc_mgr: LocationManager) -> bool:
    """Return True when the location manager exposes adjacency restore APIs."""
    create_method = getattr(loc_mgr.__class__, "create_adjacency_edge", None)
    return callable(create_method)


def _supports_adjacency_dump(loc_mgr: LocationManager) -> bool:
    """Return True when the location manager exposes adjacency dump APIs."""
    list_method = getattr(loc_mgr.__class__, "all_adjacency_edges", None)
    return callable(list_method)


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

    def _pending_restore_key(location_id: str, item: Mapping[str, Any]) -> tuple[str, int, str, str]:
        """Stable create ordering that preserves sibling order indexes on restore."""
        parent_id = item.get("parent_id")
        parent_key = str(parent_id) if isinstance(parent_id, str) and parent_id else ""
        raw_order = item.get("order")
        order_key = raw_order if isinstance(raw_order, int) else 10**9
        name_key = str(item.get("name", location_id)).casefold()
        return parent_key, order_key, name_key, location_id

    created: set[str] = set()
    while pending:
        progressed = False
        for location_id, item in sorted(
            pending.items(),
            key=lambda entry: _pending_restore_key(entry[0], entry[1]),
        ):
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
        location_id, item = min(
            pending.items(),
            key=lambda entry: _pending_restore_key(entry[0], entry[1]),
        )
        pending.pop(location_id)
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

    restored_edges = 0
    adjacency_edges = data.get("adjacency_edges")
    if _supports_adjacency_restore(loc_mgr) and isinstance(adjacency_edges, list):
        for item in adjacency_edges:
            if not isinstance(item, Mapping):
                continue

            edge_id = item.get("edge_id")
            from_location_id = item.get("from_location_id")
            to_location_id = item.get("to_location_id")
            if (
                not isinstance(edge_id, str)
                or not edge_id
                or not isinstance(from_location_id, str)
                or not from_location_id
                or not isinstance(to_location_id, str)
                or not to_location_id
            ):
                continue

            create_edge = getattr(loc_mgr, "create_adjacency_edge")
            try:
                create_edge(
                    edge_id=edge_id,
                    from_location_id=from_location_id,
                    to_location_id=to_location_id,
                    directionality=str(item.get("directionality", "bidirectional")),
                    boundary_type=str(item.get("boundary_type", "virtual")),
                    crossing_sources=(
                        list(item.get("crossing_sources", []))
                        if isinstance(item.get("crossing_sources"), list)
                        else None
                    ),
                    handoff_window_sec=int(item.get("handoff_window_sec", 12)),
                    priority=int(item.get("priority", 50)),
                )
                restored_edges += 1
            except (TypeError, ValueError) as err:
                _LOGGER.warning("Failed to restore adjacency edge %s: %s", edge_id, err)

    _LOGGER.info(
        "Restored %d locations and %d adjacency edge(s) from saved configuration",
        len(created),
        restored_edges,
    )
    return True


def _bootstrap_default_structural_roots(
    hass: HomeAssistant,
    loc_mgr: LocationManager,
    *,
    reparent_floors_to_default_building: bool = False,
) -> None:
    """Create default property anchor (id ``home``) plus building/grounds children."""
    all_locations = list(loc_mgr.all_locations())

    home_location = loc_mgr.get_location("home")
    if home_location is None:
        home_location = next(
            (loc for loc in all_locations if bool(getattr(loc, "is_explicit_root", False))),
            None,
        )
    created_ids: list[str] = []

    if home_location is None:
        home_name = (getattr(hass.config, "location_name", "") or "").strip() or "Home"
        loc_mgr.create_location(
            id="home",
            name=home_name,
            parent_id=None,
            is_explicit_root=False,
        )
        loc_mgr.set_module_config(
            "home",
            "_meta",
            {
                "type": "property",
                "topology_anchor": True,
                "sync_source": "topology",
                "sync_enabled": True,
            },
        )
        home_location = loc_mgr.get_location("home")
        created_ids.append("home")
    else:
        meta = dict(_location_meta(home_location))
        meta["type"] = "property"
        meta.setdefault("sync_source", "topology")
        meta.setdefault("sync_enabled", True)
        meta[META_TOPOLOGY_ANCHOR_KEY] = True
        loc_mgr.set_module_config(str(home_location.id), "_meta", meta)
        if bool(getattr(home_location, "is_explicit_root", False)):
            try:
                loc_mgr.update_location(str(home_location.id), is_explicit_root=False)
            except (KeyError, ValueError, TypeError) as err:
                _LOGGER.warning("Failed clearing explicit root on '%s': %s", home_location.id, err)

    anchor_id = str(getattr(home_location, "id", "") or "home")

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
            parent_id=anchor_id,
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
            parent_id=anchor_id,
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

    for linked_location_id in _effective_linked_locations_for_target(loc_mgr, location_id, config):
        allowed.add(_linked_location_source_id(linked_location_id))

    return allowed


def _linked_location_source_id(location_id: str) -> str:
    """Return synthetic occupancy source ID used for linked room contributions."""
    return f"{_LINKED_LOCATION_SOURCE_PREFIX}{location_id}"


def _linked_locations_from_config(config: object) -> list[str]:
    """Return normalized directional linked-location contributor IDs."""
    if not isinstance(config, dict):
        return []

    raw_linked = config.get(_OCCUPANCY_LINKED_LOCATIONS_KEY)
    if not isinstance(raw_linked, list):
        return []

    linked: list[str] = []
    seen: set[str] = set()
    for item in raw_linked:
        if not isinstance(item, str):
            continue
        location_id = item.strip()
        if not location_id or location_id in seen:
            continue
        seen.add(location_id)
        linked.append(location_id)
    return linked


def _allowed_linked_room_neighbors_for_target(
    loc_mgr: LocationManager,
    target_location_id: str,
) -> set[str]:
    """Return valid linked-room neighbor IDs for one target location."""
    target = loc_mgr.get_location(target_location_id)
    if (
        target is None
        or _location_type(target) != "area"
        or _is_managed_shadow_area(target)
    ):
        return set()

    parent_id = getattr(target, "parent_id", None)
    if not isinstance(parent_id, str) or not parent_id:
        return set()

    parent = loc_mgr.get_location(parent_id)
    if parent is None or _location_type(parent) != "floor":
        return set()

    allowed: set[str] = set()
    for candidate in loc_mgr.all_locations():
        candidate_id = getattr(candidate, "id", None)
        if not isinstance(candidate_id, str) or not candidate_id:
            continue
        if candidate_id == target_location_id:
            continue
        if getattr(candidate, "parent_id", None) != parent_id:
            continue
        if _location_type(candidate) != "area":
            continue
        if _is_managed_shadow_area(candidate):
            continue
        allowed.add(candidate_id)
    return allowed


def _effective_linked_locations_for_target(
    loc_mgr: LocationManager,
    target_location_id: str,
    config: object,
) -> list[str]:
    """Return linked locations filtered by current linked-room topology policy."""
    linked = _linked_locations_from_config(config)
    if not linked:
        return []

    allowed = _allowed_linked_room_neighbors_for_target(loc_mgr, target_location_id)
    if not allowed:
        return []

    return [location_id for location_id in linked if location_id in allowed]


def _linked_target_location_ids(loc_mgr: LocationManager, source_location_id: str) -> list[str]:
    """Return locations configured to consume source occupancy via linked rooms."""
    targets: list[str] = []
    seen: set[str] = set()

    for location in loc_mgr.all_locations():
        target_location_id = getattr(location, "id", None)
        if not isinstance(target_location_id, str) or not target_location_id:
            continue
        if target_location_id == source_location_id:
            continue
        if target_location_id in seen:
            continue

        config = loc_mgr.get_module_config(target_location_id, "occupancy")
        linked = _effective_linked_locations_for_target(loc_mgr, target_location_id, config)
        if source_location_id not in linked:
            continue

        seen.add(target_location_id)
        targets.append(target_location_id)

    return targets


def _occupancy_state_for_location(
    occupancy_module: object,
    location_id: str,
) -> Mapping[str, Any] | None:
    """Read occupancy state payload for one location when available."""
    get_state = getattr(occupancy_module, "get_location_state", None)
    if not callable(get_state):
        return None
    try:
        state = get_state(location_id)
    except Exception:  # noqa: BLE001
        return None
    if isinstance(state, Mapping):
        return state
    return None


def _contribution_source_ids(payload: Mapping[str, Any]) -> set[str]:
    """Extract normalized contribution source IDs from an occupancy payload.

    Also surfaces ``origin_source_id``: when a location is in an occupancy group,
    home_topology's group mesh wraps every contribution as
    ``__group_member__:<origin>::<origin_source_id>``, so the raw form (e.g.
    ``linked:area_kitchen``) is only reachable via ``origin_source_id``. Without
    this, the linked-room feedback guard never matches in grouped rooms and
    propagation recurses until the 4096-event circuit breaker trips.
    """
    contributions = payload.get("contributions")
    if not isinstance(contributions, list):
        return set()

    source_ids: set[str] = set()
    for contribution in contributions:
        if not isinstance(contribution, Mapping):
            continue
        for key in ("source_id", "origin_source_id"):
            value = contribution.get(key)
            if not isinstance(value, str):
                continue
            normalized = value.strip()
            if not normalized:
                continue
            source_ids.add(normalized)
    return source_ids


def _normalize_utc_datetime(value: object) -> datetime:
    """Normalize an arbitrary datetime-like value into UTC."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime.now(UTC)


def _parse_iso_datetime(value: object) -> datetime | None:
    """Parse an ISO datetime string into UTC, returning None when missing/invalid."""
    if not isinstance(value, str):
        return None
    raw = value.strip()
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
    return _normalize_utc_datetime(parsed)


def _contribution_expiration_by_source_id(payload: Mapping[str, Any]) -> dict[str, datetime | None]:
    """Return contribution expirations keyed by source ID."""
    contributions = payload.get("contributions")
    if not isinstance(contributions, list):
        return {}

    mapped: dict[str, datetime | None] = {}
    for contribution in contributions:
        if not isinstance(contribution, Mapping):
            continue
        source_id = contribution.get("source_id")
        if not isinstance(source_id, str):
            continue
        normalized = source_id.strip()
        if not normalized:
            continue
        mapped[normalized] = _parse_iso_datetime(contribution.get("expires_at"))
    return mapped


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
                if source_id.startswith(_LINKED_LOCATION_SOURCE_PREFIX):
                    if source_id not in allowed_source_ids:
                        dropped += 1
                        continue
                    filtered.append(item)
                    continue

                if source_id.startswith("sync:"):
                    dropped += 1
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

    config_payload: dict[str, Any] = {"locations": config_locations}

    if _supports_adjacency_dump(loc_mgr):
        serialized_edges: list[dict[str, Any]] = []
        list_edges = getattr(loc_mgr, "all_adjacency_edges")
        for edge in list_edges():
            to_dict = getattr(edge, "to_dict", None)
            if callable(to_dict):
                payload = to_dict()
                if isinstance(payload, dict):
                    serialized_edges.append(dict(payload))
                continue

            if isinstance(edge, Mapping):
                serialized_edges.append(dict(edge))
                continue

            edge_id = getattr(edge, "edge_id", None)
            from_location_id = getattr(edge, "from_location_id", None)
            to_location_id = getattr(edge, "to_location_id", None)
            if (
                not isinstance(edge_id, str)
                or not isinstance(from_location_id, str)
                or not isinstance(to_location_id, str)
            ):
                continue
            serialized_edges.append(
                {
                    "edge_id": edge_id,
                    "from_location_id": from_location_id,
                    "to_location_id": to_location_id,
                    "directionality": str(getattr(edge, "directionality", "bidirectional")),
                    "boundary_type": str(getattr(edge, "boundary_type", "virtual")),
                    "crossing_sources": list(getattr(edge, "crossing_sources", [])),
                    "handoff_window_sec": int(getattr(edge, "handoff_window_sec", 12)),
                    "priority": int(getattr(edge, "priority", 50)),
                }
            )

        config_payload["adjacency_edges"] = serialized_edges

    config_store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
    await config_store.async_save(config_payload)

    _LOGGER.info("Kernel state saved")
