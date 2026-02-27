# Topomation Integration Architecture

**Version**: 1.0
**Date**: 2026-02-27
**Purpose**: Define the architecture of the Home Assistant integration for Topomation

> **Note**: This document focuses on **integration-specific** architecture. For core kernel architecture (LocationManager, EventBus, Modules), see the Topomation core library documentation.

---

## 1. Overview

The `topomation` integration is a **thin adapter layer** that bridges Home Assistant and the platform-agnostic Topomation kernel.

### 1.1 Responsibilities

**This Integration Provides**:

- Event translation (HA state changes → kernel events)
- State exposure (kernel state → HA entities)
- Timeout coordination (host-controlled scheduling)
- Configuration UI (Lit-based panel)
- Persistence (config and state storage)
- HA services (manual control)

**The Kernel Provides** (from the Topomation core library):

- Location hierarchy management
- Event routing
- Module behavior (Occupancy, Automation, Lighting)
- State management

**Key Principle**: The integration **never** implements behavior logic. It translates, routes, and exposes.

---

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Home Assistant (Platform)                      │
│                                                          │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   State    │  │   Services   │  │  Frontend      │ │
│  │  Changes   │  │   Registry   │  │   Panel        │ │
│  └──────┬─────┘  └──────┬───────┘  └────────┬───────┘ │
└─────────┼────────────────┼───────────────────┼─────────┘
          │                │                   │
┌─────────▼────────────────▼───────────────────▼─────────┐
│              topomation Integration               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │EventBridge   │  │ Coordinator  │  │  WebSocket   │ │
│  │(translate)   │  │ (schedule)   │  │    API       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼───────┐│
│  │    Binary Sensors / Sensors (expose state)         ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│           Topomation Kernel (Core Library)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Location     │  │   EventBus   │  │   Modules    │ │
│  │ Manager      │◄─┤              ├─►│              │ │
│  │              │  │              │  │  Occupancy   │ │
│  │ - Topology   │  │ - Publish    │  │  Automation  │ │
│  │ - Config     │  │ - Subscribe  │  │  Lighting    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Integration Components

### 3.1 Entry Point (`__init__.py`)

**Responsibilities**:

- Create kernel components (LocationManager, EventBus)
- Import HA areas as locations
- Attach modules (Occupancy, Automation, Lighting)
- Set up default configurations
- Register panel and WebSocket API
- Forward to platforms (binary_sensor, sensor)

**Lifecycle**:

1. `async_setup_entry()` - Initialize everything
2. `async_unload_entry()` - Clean shutdown, save state

### 3.2 Event Bridge (`event_bridge.py`)

**Purpose**: Translate HA state changes to kernel occupancy signals (v3 API)

**Pattern**:

```python
@callback
def state_changed_listener(event):
    entity_id = event.data["entity_id"]
    new_state = event.data["new_state"]

    # Get location for entity
    location_id = loc_mgr.get_entity_location(entity_id)

    # Translate to kernel occupancy signal
    kernel_event = Event(
        type="occupancy.signal",
        source="ha",
        entity_id=entity_id,
        location_id=location_id,
        payload={
            "event_type": "trigger",  # or "clear"/"vacate"
            "source_id": entity_id,
            "signal_key": None,  # e.g. playback/volume/mute or power/level/color
            "old_state": old_state.state,
            "new_state": new_state.state,
            "attributes": dict(new_state.attributes),
        },
        timestamp=new_state.last_changed,
    )

    # Publish to kernel
    bus.publish(kernel_event)
```

**Normalization**:

- Dimmers: `state=on, brightness=0` → OFF
- Dimmers: `state=on, brightness>0` → ON (brightness changes emit `signal_key=level`)
- Color lights: RGB/HS/XY/color-temp changes emit `signal_key=color`
- Media players: Map playing/paused/idle states

### 3.3 State Exposure (`binary_sensor.py`, `sensor.py`)

**Purpose**: Expose kernel state as HA entities

**Entities Created**:

- `binary_sensor.occupancy_{location_id}` - Occupied/vacant state
- `sensor.occupancy_confidence_{location_id}` - Confidence percentage (future)

**Pattern**:

```python
class OccupancyBinarySensor(BinarySensorEntity):
    async def async_added_to_hass(self):
        @callback
        def on_occupancy_changed(event):
            if event.location_id == self._location_id:
                self._attr_is_on = event.payload["occupied"]
                self._attr_extra_state_attributes = {
                    "confidence": event.payload["confidence"],
                    "active_holds": event.payload.get("active_holds", []),
                    "expires_at": event.payload.get("expires_at"),
                }
                self.async_write_ha_state()

        bus.subscribe(on_occupancy_changed, EventFilter(event_type="occupancy.changed"))
```

### 3.4 Timeout Coordinator (`coordinator.py`)

**Purpose**: Host-controlled timeout scheduling

**Why**: The kernel is time-agnostic. It provides `get_next_timeout()` and `check_timeouts(now)`, but doesn't run timers internally.

**Pattern**:

```python
class TopomationCoordinator:
    def schedule_next_timeout(self):
        # Find earliest timeout across all modules
        next_timeout = None
        for module in self.modules.values():
            module_timeout = module.get_next_timeout()
            if module_timeout and (not next_timeout or module_timeout < next_timeout):
                next_timeout = module_timeout

        # Schedule HA callback
        if next_timeout:
            self._timeout_cancel = async_track_point_in_time(
                self.hass,
                self._handle_timeout,
                next_timeout,
            )

    @callback
    def _handle_timeout(self, now):
        # Call kernel to process expirations
        for module in self.modules.values():
            module.check_timeouts(now)

        # Reschedule
        self.schedule_next_timeout()
```

### 3.5 WebSocket API (`websocket_api.py`)

**Purpose**: Read topology state + update module configuration

**Commands**:

- `topomation/locations/list` - Get all locations
- `topomation/locations/set_module_config` - Update module config
- `topomation/actions/rules/list` - Enumerate managed occupied/vacant rules for a location
- `topomation/actions/rules/create` - Create/replace one managed occupied/vacant rule
- `topomation/actions/rules/delete` - Delete one managed rule
- `topomation/actions/rules/set_enabled` - Enable/disable one managed rule

Location lifecycle is supported via the WebSocket API with guardrails:

- `create`: can create integration-owned locations (`building`, `grounds`,
  `subarea`) and HA-backed wrappers (`floor`, `area`) when valid parent rules
  are met.
- `update`: supports rename/icon/type-safe parent updates, with hierarchy
  constraints enforced.
- `delete`: supports deletion with child reparenting rules and explicit root
  protection.
- `reorder`: persists topology hierarchy and synchronizes HA `floor_id` for
  HA-backed areas based on nearest floor ancestor (or clears to `null`).

**Pattern**:

```python
@websocket_api.websocket_command({vol.Required("type"): "topomation/locations/list"})
@callback
def handle_locations_list(hass, connection, msg):
    kernel = hass.data[DOMAIN][entry_id]
    loc_mgr = kernel["location_manager"]

    locations = [loc.to_dict() for loc in loc_mgr.all_locations()]
    connection.send_result(msg["id"], {"locations": locations})
```

### 3.6 Services (`services.yaml`)

**Purpose**: Manual occupancy control

**Services**:

- `topomation.trigger` - Manual occupancy trigger (`occupancy.trigger`)
- `topomation.clear` - Manual occupancy clear (`occupancy.clear`)
- `topomation.vacate` - Force single location vacant (`occupancy.vacate`)
- `topomation.lock` - Apply lock policy (`freeze`, `block_occupied`, `block_vacant`) with `scope` (`self`, `subtree`)
- `topomation.unlock` - Unlock location (source-aware)
- `topomation.unlock_all` - Force-clear all lock sources at a location
- `topomation.vacate_area` - Vacate location and descendants

**Wrapper Behavior**:

- Each service supports optional `entry_id` for multi-entry routing; if multiple entries are loaded and `entry_id` is omitted, the call is rejected.
- Lock/unlock/vacate commands pass `source_id` through to the core occupancy module for deterministic multi-source behavior.
- `topomation.lock` forwards `mode` and `scope` to the core occupancy engine:
  - `freeze`: suspend local occupancy changes while locked
  - `block_occupied`: prevent occupied transitions (away/security intent)
  - `block_vacant`: prevent vacant transitions (party/manual hold intent)
  - `scope=subtree`: applies policy to location + descendants without physically copying lock state to each child
- Manual occupancy controls in the panel map to services using a stable source:
  - `set occupied` -> `topomation.trigger(location_id, source_id="manual_ui", timeout=default_timeout)`
  - `set unoccupied` -> `topomation.vacate_area(location_id, source_id="manual_ui", include_locked=false)`
- Source-off test control with authoritative semantics maps to:
  - `test off` with `off_event=clear` and `off_trailing=0` -> `topomation.vacate(location_id)`
  - `test off` with `off_event=clear` and `off_trailing>0` -> `topomation.clear(location_id, source_id, trailing_timeout)`
- Locked locations are immutable for manual occupancy actions. The UI must reject the request and show a warning toast.

### 3.7 Frontend Panel (`frontend/`)

**Purpose**: Visual manager workspace for topology, occupancy, and actions

**Technology**: Lit (LitElement) - HA's native framework

**Panel Routing**:

- `Location Manager` (`/topomation`) is the single visible sidebar entry.
- Alias routes are retained for deep linking and default-focus behavior:
  - `/topomation-occupancy` (defaults inspector to `Detection`)
  - `/topomation-actions` (defaults inspector to `On Occupied`)

All routes use the same underlying `topomation-panel` frontend module and
shared location tree selection context.

**Workspace Behavior**:

- Location tree is always present on the left; occupancy/actions use the same selected node context.
- Each non-root location row exposes two quick controls:
  - occupancy toggle icon (house): mark occupied/unoccupied
  - lock icon: lock/unlock location
- Occupancy quick-controls are source-aware (`manual_ui`) and respect lock invariants (no mutation while locked).
- Inspector tabs are split into `Detection`, `On Occupied`, and `On Vacant`.
- `On Occupied` / `On Vacant` rules are created as native Home Assistant automation entities (managed in HA's automation system).
- Topomation tags those automations with panel metadata + labels/category so each location tab can filter only its own rules.
- The panel is WS-first for rule writes:
  `topomation/actions/rules/*` commands call integration backend code, and backend
  code performs HA automation config mutations/reload.
- Managed-action mutation paths are strict backend contracts:
  create/delete/enable fail explicitly when backend WS commands are unavailable
  (no browser-side mutation fallback).
- Backend create treats registration as the success condition:
  if write+reload does not yield runtime registration, Topomation rolls back the
  write and returns an actionable error.
- The built-in action list is intentionally common-case: media players support `Stop` and `Turn off` only.
  Advanced occupancy-driven play/turn-on behavior is expected to be authored as custom HA automations using Topomation occupancy entities.
- Integration-owned nodes (`building`, `grounds`, `subarea`) are configured through explicit source assignment in inspector.
- HA-backed wrappers (`floor_*`, `area_*`) keep HA-linked entity discovery defaults.

**Components**:

- `topomation-panel.ts` - Main panel container
- `ht-location-tree.ts` - Tree navigation
- `ht-location-inspector.ts` - Details/config panel
- `ht-entity-config-dialog.ts` - Entity configuration
- `ht-location-dialog.ts` - Create/edit location

**See**: `docs/frontend-dev-workflow.md` and `docs/index.md` for current frontend workflow/document map

### 3.8 Platform Adapter for Ambient Light Module

**Purpose**: Bridge AmbientLightModule to HA state system

**Pattern**:

```python
class HAPlatformAdapter:
    """Platform adapter for AmbientLightModule to access HA state."""

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    def get_numeric_state(self, entity_id: str) -> Optional[float]:
        """Get numeric state value from HA entity."""
        state = self.hass.states.get(entity_id)
        if state and state.state not in ("unknown", "unavailable"):
            try:
                return float(state.state)
            except ValueError:
                return None
        return None

    def get_device_class(self, entity_id: str) -> Optional[str]:
        """Get device class from HA entity."""
        state = self.hass.states.get(entity_id)
        return state.attributes.get("device_class") if state else None
```

**Entities Created**:

- `sensor.{location}_ambient_light` - Current lux level (illuminance)
- `binary_sensor.{location}_is_dark` - Dark detection (< 50 lux default)
- `binary_sensor.{location}_is_bright` - Bright detection (> 500 lux default)

**WebSocket Commands**:

- `topomation/ambient/get_reading` - Get ambient light reading for location
- `topomation/ambient/set_sensor` - Configure lux sensor for location
- `topomation/ambient/auto_discover` - Auto-discover illuminance sensors

**Features**:

- Hierarchical sensor lookup (locations inherit from parents)
- Automatic sensor discovery (by device class, entity ID pattern, unit)
- Sun position fallback (when no sensors available)
- Real-time updates via HA state_changed events
- Per-location configurable thresholds

---

## 4. Data Flow Examples

### 4.1 Motion Sensor Triggers Occupancy

```
1. User walks past motion sensor
2. HA: binary_sensor.kitchen_motion: off → on
3. EventBridge: Translates to Event(type="occupancy.signal", payload={"event_type": "trigger", ...})
4. EventBus: Routes to OccupancyModule
5. OccupancyModule: Processes event, updates state, emits Event(type="occupancy.changed", payload={"occupied": True})
6. BinarySensor: Receives occupancy.changed, updates binary_sensor.occupancy_kitchen to ON
7. User sees kitchen occupied in HA
```

### 4.2 Timeout Expiration

```
1. Coordinator: Scheduled timeout triggers at 14:35:00
2. Coordinator: Calls occupancy.check_timeouts(now=14:35:00)
3. OccupancyModule: Finds kitchen timeout expired, updates state to vacant
4. OccupancyModule: Emits Event(type="occupancy.changed", payload={"occupied": False})
5. BinarySensor: Updates binary_sensor.occupancy_kitchen to OFF
6. Coordinator: Calls schedule_next_timeout() for next check
```

### 4.3 User Changes Config via UI

```
1. User opens panel, selects Kitchen
2. User changes timeout from 5min to 10min
3. Frontend: Sends WebSocket command set_module_config
4. WebSocketAPI: Calls loc_mgr.set_module_config("kitchen", "occupancy", {...})
5. WebSocketAPI: Calls occupancy.on_location_config_changed("kitchen", {...})
6. OccupancyModule: Updates internal config, adjusts active timers
7. Frontend: Receives success, updates UI
```

### 4.4 HA Registry Is Source of Truth (With Topology Reorder Overlay)

```
1. User renames an HA area/floor in HA Settings
2. HA registry emits update event
3. SyncManager updates topology location name
4. User drags an HA-backed area under a different floor in topology UI
5. WebSocket reorder updates topology parent and writes HA area.floor_id to match
6. Create/rename/delete of HA areas/floors is not allowed via integration API
```

### 4.5 Startup Merge and Reconciliation

At startup, the integration performs a two-phase merge:

1. Restore persisted topology/module config from `.storage/topomation.config`
2. Reconcile HA-backed wrappers from current HA registries (floors/areas/entities)

For HA-backed wrappers (`floor_*`, `area_*`), startup reconciliation enforces HA
as canonical for:

- floor/area names
- floor parent linkage for areas
- `ha_area_id` / `ha_floor_id` metadata
- sync ownership flags (`sync_source=homeassistant`, `sync_enabled=true`)
- area entity membership (entity mapping matches HA area assignments)

Broken/invalid persisted payloads are ignored and do not block startup.

---

## 5. State Persistence

### 5.1 Configuration Storage

**Store Key / File**: `topomation.config` -> `.storage/topomation.config`

**Contents**:

```json
{
  "locations": [
    {
      "id": "kitchen",
      "name": "Kitchen",
      "parent_id": "floor-1",
      "order": 2,
      "modules": {
        "_meta": { "type": "area", "category": "kitchen" },
        "occupancy": { "enabled": true, "default_timeout": 600 }
      }
    }
  ]
}
```

### 5.2 Runtime State Storage

**Store Key / File**: `topomation.state` -> `.storage/topomation.state`

**Contents**:

```json
{
  "occupancy": {
    "kitchen": {
      "is_occupied": true,
      "confidence": 0.85,
      "occupied_until": "2025-12-09T14:30:00Z",
      "active_holds": ["ble_mike"],
      "last_updated": "2025-12-09T14:25:00Z"
    }
  }
}
```

**Save Triggers**:

- On HA shutdown (EVENT_HOMEASSISTANT_STOP)
- On integration unload
- Debounced autosave after successful `locations/reorder`
- Debounced autosave after successful `locations/set_module_config`
- Debounced autosave after `occupancy.changed` (runtime occupancy/lock mutations)

**Restore**:

- On integration startup
- After config load
- Modules reject stale state (>1 hour old)

### 5.3 Sync authority matrix

Per-location metadata in `_meta` determines synchronization authority:

- `sync_source=homeassistant` and `sync_enabled=true`
  - HA changes -> topology updates are allowed
  - Topology changes -> lifecycle writeback is disabled, except area floor-link
    sync on explicit reorder (updates HA `floor_id` for HA-backed areas)
  - `sync/enable` toggle is not allowed for HA-backed floor/area wrappers
- `sync_source=topology` and `sync_enabled=true`
  - HA changes -> topology updates are blocked
  - Topology changes -> HA writeback is blocked
- `sync_source=topology` and `sync_enabled=false`
  - Cross-boundary writes are blocked in both directions

---

## 6. Location Type Metadata

The kernel is **type-agnostic**. The integration stores type/category metadata using the `_meta` module convention:

```python
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "area",              # Structural type (floor|area|building|grounds|subarea)
        "category": "kitchen",       # Semantic category (for icon inference)
        "icon": None,                # Optional explicit override
    }
)
```

**Icon Resolution** (integration responsibility):

1. Explicit override in `_meta.icon`
2. Category-based (kitchen → `mdi:silverware-fork-knife`)
3. Name inference (name contains "kitchen" → kitchen icon)
4. Type fallback marker (`floor`/`area`/`building`/`grounds`/`subarea`)

**Hierarchy Enforcement** (UI responsibility):

- Root-only wrappers: `building`, `grounds`
- `floor` nodes may be root-level or nested under `building`
- `area` nodes may be root-level or nested under `floor`, `area`, `building`, or `grounds`
- `subarea` nodes may be root-level or nested under `floor`, `area`, `subarea`, `building`, or `grounds`
- No synthetic `house` root is used
- Drag/reorder constraints are enforced in frontend rules
- ADR-HA-020 defines a phased extension for integration-owned structural nodes
  while preserving floor/area compatibility and rootless operation as baseline

### 6.1 Source and Scope Semantics (ADR-HA-020)

- HA-backed wrappers (`sync_source=homeassistant`) keep HA-native linkage:
  - `floor_*` and `area_*` wrappers continue to import from HA registries.
  - Occupancy source discovery can use linked HA area entities.
- Integration-owned nodes (`sync_source=topology`) require explicit source mapping:
  - Sources are selected directly by entity ID (no implicit area linkage).
  - This enables global/building/grounds scopes where HA has no native area parent.
- Policy sources are modeled in `occupancy.policy_sources`:
  - `entity_id`: policy device (for example `alarm_control_panel.home`)
  - `source_id`: stable source identity used in vacate commands
  - `targets`: location IDs or `all_roots`
  - `state_map`: mapped states (`armed_away`) -> `vacate_area` action config
- `all_roots` is resolved at execution time from current topology roots.
- Unknown/invalid explicit targets degrade to the policy-owner location instead of failing.

### 6.2 Topology Mapping Boundary

- Structural mapping is limited to HA `floor`/`area` wrappers plus integration-owned topology nodes (`building`, `grounds`, `subarea`).
- Integration-owned nodes are behavioral containers only and are not mirrored as HA registry structural objects.
- HA `zone` is out of scope for indoor topology mapping (geofence semantics).
- HA `label` is out of scope for topology structure. Labels remain optional metadata for non-structural organization, such as managed automation filtering.

### 6.3 Current Limitations

- Policy-source v1 ships only `vacate_area` actions; additional actions are not yet supported.
- Only explicitly mapped policy states execute actions; unmapped states are ignored.
- The integration assumes one HA instance/property context per install (no multi-instance orchestration).
- Explicit source assignment is required for integration-owned nodes (no automatic HA-area inference).

---

## 7. Error Handling

### 7.1 Principles

- One bad location doesn't crash the integration
- Log errors with context (entity_id, location_id, event_type)
- Emit `module.error` events for monitoring
- Degrade gracefully (skip bad config, use defaults)

### 7.2 Common Error Scenarios

| Error                      | Handling                            |
| -------------------------- | ----------------------------------- |
| Missing entity             | Log warning, skip event translation |
| Invalid location_id        | Log error, reject WebSocket command |
| Module state corruption    | Reset to defaults, log error        |
| Timeout scheduling failure | Log error, retry in 1 minute        |
| Config migration failure   | Use default config, log warning     |

---

## 8. Performance Considerations

### 8.1 Expected Scale

- **Locations**: 10-100
- **Entities**: 100-1000
- **Events**: 10-100/second peak
- **Modules**: 3-5 active

### 8.2 Optimization Strategies

- Use `@callback` for synchronous handlers (no async overhead)
- Batch entity updates (debounce rapid state changes)
- Cache location lookups in EventBridge
- Single coordinator handles all module timeouts
- Lazy-load frontend components

---

## 9. Future Enhancements

### 9.1 Phase 2 Features

- Climate module integration
- Media module integration
- Multi-home support (multiple kernel instances)
- Floor plan view (2D spatial layout)
- Bulk operations (copy configs, multi-select)

### 9.2 Advanced Coordinator

- Priority queue for timeouts (not just earliest)
- Adaptive scheduling (batch checks if many close together)
- Timezone-aware scheduling

---

## 10. References

### Core Library Docs

- [Architecture](https://github.com/mjcumming/topomation/blob/main/docs/architecture.md) - Kernel design
- [Integration Guide](https://github.com/mjcumming/topomation/blob/main/docs/integration/integration-guide.md) - How to integrate
- [Occupancy Module](https://github.com/mjcumming/topomation/blob/main/docs/modules/occupancy-integration.md) - Occupancy specifics

### HA Integration Docs

- `docs/coding-standards.md` - Python + TypeScript standards
- `docs/adr-log.md` - Integration decisions
- `docs/frontend-dev-workflow.md` - Frontend workflow
- `docs/index.md` - Active vs archived documentation map
- `docs/bidirectional-sync-design.md` - Sync contract + WTF pre-change checks

---

**Document Status**: Active
**Last Updated**: 2026-02-24
**Maintainer**: Mike
