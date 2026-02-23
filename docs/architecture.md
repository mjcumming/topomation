# home-topology-ha Integration Architecture

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: Define the architecture of the Home Assistant integration for home-topology

> **Note**: This document focuses on **integration-specific** architecture. For core kernel architecture (LocationManager, EventBus, Modules), see the [home-topology core library documentation](https://github.com/mjcumming/home-topology/blob/main/docs/architecture.md).

---

## 1. Overview

The `home-topology-ha` integration is a **thin adapter layer** that bridges Home Assistant and the platform-agnostic `home-topology` kernel.

### 1.1 Responsibilities

**This Integration Provides**:

- Event translation (HA state changes → kernel events)
- State exposure (kernel state → HA entities)
- Timeout coordination (host-controlled scheduling)
- Configuration UI (Lit-based panel)
- Persistence (config and state storage)
- HA services (manual control)

**The Kernel Provides** (from `home-topology` library):

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
│              home-topology-ha Integration               │
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
│          home-topology Kernel (Core Library)            │
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

**Purpose**: Translate HA state changes to kernel events

**Pattern**:

```python
@callback
def state_changed_listener(event):
    entity_id = event.data["entity_id"]
    new_state = event.data["new_state"]

    # Get location for entity
    location_id = loc_mgr.get_entity_location(entity_id)

    # Translate to kernel event
    kernel_event = Event(
        type="sensor.state_changed",
        source="ha",
        entity_id=entity_id,
        location_id=location_id,
        payload={
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
- Dimmers: `state=on, brightness>0` → ON (brightness changes re-trigger)
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
class HomeTopologyCoordinator:
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

**Purpose**: CRUD operations for locations and module configs

**Commands**:

- `home_topology/locations/list` - Get all locations
- `home_topology/locations/create` - Create location
- `home_topology/locations/update` - Update location (name, parent)
- `home_topology/locations/delete` - Delete location
- `home_topology/locations/reorder` - Move location in hierarchy
- `home_topology/locations/set_module_config` - Update module config

`locations/reorder` is backed by core `LocationManager.reorder_location()`,
which enforces canonical sibling ordering (`Location.order`) so tree order is
stable across reloads and restarts.

**Pattern**:

```python
@websocket_api.websocket_command({vol.Required("type"): "home_topology/locations/list"})
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

- `home_topology.trigger` - Manual occupancy trigger (`occupancy.trigger`)
- `home_topology.clear` - Manual occupancy clear (`occupancy.release`, compatibility alias)
- `home_topology.lock` - Lock location (prevent vacancy, source-aware)
- `home_topology.unlock` - Unlock location (source-aware)
- `home_topology.vacate_area` - Vacate location and descendants

**Wrapper Behavior**:

- Each service supports optional `entry_id` for multi-entry routing; if multiple entries are loaded and `entry_id` is omitted, the call is rejected.
- Lock/unlock/vacate commands pass `source_id` through to the core occupancy module for deterministic multi-source behavior.

### 3.7 Frontend Panel (`frontend/`)

**Purpose**: Visual location manager UI

**Technology**: Lit (LitElement) - HA's native framework

**Components**:

- `home-topology-panel.ts` - Main panel container
- `ht-location-tree.ts` - Tree navigation
- `ht-location-inspector.ts` - Details/config panel
- `ht-entity-config-dialog.ts` - Entity configuration
- `ht-location-dialog.ts` - Create/edit location

**See**: `docs/ui-design.md` for complete UI specification

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

- `home_topology/ambient/get_reading` - Get ambient light reading for location
- `home_topology/ambient/set_sensor` - Configure lux sensor for location
- `home_topology/ambient/auto_discover` - Auto-discover illuminance sensors

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
3. EventBridge: Translates to Event(type="sensor.state_changed", entity_id="...", payload={"new_state": "on"})
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

### 4.4 Topology Rename Syncs Back to HA

```
1. User renames location in topology UI ("Kitchen" -> "Culinary Space")
2. Frontend sends update/reorder command
3. LocationManager emits Event(type="location.renamed", source="topology")
4. SyncManager receives location.renamed and evaluates sync policy
5. If sync_source=homeassistant and sync_enabled=true:
   - HA area/floor registry is updated
6. HA reflects renamed area/floor
```

---

## 5. State Persistence

### 5.1 Configuration Storage

**File**: `.storage/home_topology_config.json`

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
        "_meta": { "type": "room", "category": "kitchen" },
        "occupancy": { "enabled": true, "default_timeout": 600 }
      }
    }
  ]
}
```

### 5.3 Sync authority matrix

Per-location metadata in `_meta` determines synchronization authority:

- `sync_source=homeassistant` and `sync_enabled=true`
  - HA changes -> topology updates are allowed
  - Topology changes -> HA writeback is allowed
- `sync_source=topology` and `sync_enabled=true`
  - HA changes -> topology updates are blocked
  - Topology changes -> HA writeback is blocked
- `sync_enabled=false` (any source)
  - Cross-boundary writes are blocked in both directions

### 5.2 Runtime State Storage

**File**: `.storage/home_topology_state.json`

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
- Periodic (every 5 minutes)
- On config change

**Restore**:

- On integration startup
- After config load
- Modules reject stale state (>1 hour old)

---

## 6. Location Type Metadata

The kernel is **type-agnostic**. The integration stores type/category metadata using the `_meta` module convention:

```python
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "room",              # Structural type (floor, room, zone, suite, outdoor, building)
        "category": "kitchen",       # Semantic category (for icon inference)
        "icon": None,                # Optional explicit override
    }
)
```

**Icon Resolution** (integration responsibility):

1. Explicit override in `_meta.icon`
2. Category-based (kitchen → `mdi:silverware-fork-knife`)
3. Name inference (name contains "kitchen" → kitchen icon)
4. Type fallback (room → `mdi:map-marker`)

**Hierarchy Enforcement** (UI responsibility):

- Floors contain rooms/suites
- Rooms contain zones
- Zones are terminal (no children)
- Suite contains rooms

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

- [Architecture](https://github.com/mjcumming/home-topology/blob/main/docs/architecture.md) - Kernel design
- [Integration Guide](https://github.com/mjcumming/home-topology/blob/main/docs/integration/integration-guide.md) - How to integrate
- [Occupancy Module](https://github.com/mjcumming/home-topology/blob/main/docs/modules/occupancy-integration.md) - Occupancy specifics

### HA Integration Docs

- `docs/coding-standards.md` - Python + TypeScript standards
- `docs/adr-log.md` - Integration decisions
- `docs/ui-design.md` - Frontend specification

---

**Document Status**: Active
**Last Updated**: 2025-12-09
**Maintainer**: Mike
