# home-topology Integration Guide

**Version**: 2.4  
**Date**: 2026.02.23  
**Audience**: Platform developers integrating home-topology into Home Assistant.

> **v2.4 Changes**:
> - Occupancy v3 signal contract (`occupancy.signal`) examples
> - Explicit `event_type` + `source_id` payload fields in bridge examples
>
> **v2.3 Changes**:
> - Events vs Commands API separation
> - Timer suspension during lock
> - Holds and timers coexist
> - Removed identity tracking (active_occupants) - deferred to PresenceModule

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Location Types (Your Responsibility)](#location-types-your-responsibility)
4. [Initialization Sequence](#initialization-sequence)
5. [Event Translation](#event-translation)
6. [State Exposure](#state-exposure)
7. [Configuration Management](#configuration-management)
8. [State Persistence](#state-persistence)
9. [Timeout Management](#timeout-management)
10. [Best Practices](#best-practices)
11. [Complete Home Assistant Example](#complete-home-assistant-example)

---

## Quick Start

### Minimal Working Example

```python
from datetime import datetime, UTC
from home_topology import LocationManager, EventBus, Event
from home_topology.modules.occupancy import OccupancyModule

# 1. Create kernel components
loc_mgr = LocationManager()
bus = EventBus()
bus.set_location_manager(loc_mgr)

# 2. Build topology
kitchen = loc_mgr.create_location(
    id="kitchen",
    name="Kitchen",
    parent_id="main_floor"
)
loc_mgr.add_entity_to_location("binary_sensor.kitchen_motion", "kitchen")

# 3. Configure and attach module
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="occupancy",
    config={
        "version": 1,
        "enabled": True,
        "timeouts": {"motion": 300},  # 5 minutes
    }
)

occupancy = OccupancyModule()
occupancy.attach(bus, loc_mgr)

# 4. Publish platform event
bus.publish(
    Event(
        type="occupancy.signal",
        source="ha",
        entity_id="binary_sensor.kitchen_motion",
        payload={
            "event_type": "trigger",
            "source_id": "binary_sensor.kitchen_motion",
            "old_state": "off",
            "new_state": "on",
        },
        timestamp=datetime.now(UTC),
    )
)

# 5. Read module state
state = occupancy.get_location_state("kitchen")
print(f"Kitchen occupied: {state['occupied']}")
```

---

## Core Concepts

### The Integration Contract

As a platform integrator, you are responsible for:

1. **Topology Management**: Create Locations from platform areas/rooms
2. **Event Translation**: Platform state changes → kernel `Event`s
3. **State Exposure**: Module state → platform entities/sensors
4. **Timeout Scheduling**: Call `check_timeouts()` when modules need it
5. **State Persistence**: Save/restore module state across restarts
6. **Configuration UI**: Allow users to configure modules per location

The kernel is responsible for:

1. **Event Routing**: Deliver events to interested modules
2. **Module Lifecycle**: Initialize, attach, detach modules
3. **Topology Queries**: Provide hierarchy navigation
4. **Configuration Storage**: Store per-location module config

---

### Key Components

#### LocationManager

The "database" of your spatial model:

```python
loc_mgr = LocationManager()

# Create topology
house = loc_mgr.create_location(id="house", name="House")
kitchen = loc_mgr.create_location(
    id="kitchen", 
    name="Kitchen", 
    parent_id="house",
    ha_area_id="area.kitchen"  # Optional platform link
)

# Map entities to locations
loc_mgr.add_entity_to_location("binary_sensor.kitchen_motion", "kitchen")

# Store module config
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="occupancy",
    config={"version": 1, "enabled": True}
)

# Query topology
ancestors = loc_mgr.ancestors_of("kitchen")  # [main_floor, house]
children = loc_mgr.children_of("house")      # [main_floor, ...]
```

#### EventBus

The "nervous system" for event routing:

```python
bus = EventBus()
bus.set_location_manager(loc_mgr)  # Enables ancestor/descendant filtering

# Subscribe to events
from home_topology.core.bus import EventFilter

def on_occupancy_changed(event: Event):
    print(f"Location {event.location_id} occupied: {event.payload['occupied']}")

bus.subscribe(
    handler=on_occupancy_changed,
    event_filter=EventFilter(event_type="occupancy.changed")
)

# Publish events
bus.publish(
    Event(
        type="occupancy.signal",
        source="ha",
        entity_id="binary_sensor.motion",
        location_id="kitchen",
        payload={
            "event_type": "trigger",
            "source_id": "binary_sensor.motion",
            "old_state": "off",
            "new_state": "on",
        },
    )
)
```

#### LocationModule

The "applications" that add behavior:

```python
from home_topology.modules.occupancy import OccupancyModule

occupancy = OccupancyModule()

# Attach to kernel (registers event subscriptions)
occupancy.attach(bus, loc_mgr)

# Get module ID and version
module_id = occupancy.id  # "occupancy"
version = occupancy.CURRENT_CONFIG_VERSION  # 1

# Get default config for a location
default = occupancy.default_config()

# Get config schema for UI generation
schema = occupancy.location_config_schema()

# Read module state
state = occupancy.get_location_state("kitchen")
# {"occupied": True, "active_holds": ["presence_sensor"], "is_locked": False, ...}

# Persist state
state_dump = occupancy.dump_state()
occupancy.restore_state(state_dump)
```

---

## Location Types (Your Responsibility)

The kernel is **type-agnostic** - it provides a tree structure but has no concept of "Floor", "Room", or "Zone". Your integration is responsible for:

1. **Defining types** - What location types make sense for your platform
2. **Storing type metadata** - Where to persist type information
3. **Enforcing hierarchy rules** - What can parent what
4. **UI representation** - Icons, labels, drag-and-drop constraints

### Recommended Type Taxonomy

For home automation, we recommend these standard types:

| Type | Description | Can Contain |
|------|-------------|-------------|
| **Building** | Separate structure (main house, garage) | Floor, Room |
| **Floor** | A level of the building | Room, Suite |
| **Suite** | Room group (e.g., Master Suite) | Room only |
| **Room** | Standard room | Zone only |
| **Zone** | Sub-room area (reading nook, kitchen island) | Nothing (terminal) |
| **Outdoor** | Exterior location | Zone only |

### Hierarchy Rules

Your UI should enforce these constraints:

| Illegal Move | Why |
|--------------|-----|
| Floor → Room | Floors contain rooms, not vice versa |
| Room → Room | Rooms are flat within floors (use Suite for grouping) |
| Zone → anything | Zones are terminal nodes |
| Anything → itself | Cannot be own parent |
| Parent → descendant | Cannot create cycles |

### Storing Type Metadata

**Option A: Integration's own storage** (recommended)

```python
class LocationTypeRegistry:
    """Integration maintains type info separately from kernel."""
    
    def __init__(self):
        self._types: dict[str, str] = {}  # location_id → type
    
    def get_type(self, location_id: str) -> str | None:
        return self._types.get(location_id)
    
    def set_type(self, location_id: str, loc_type: str) -> None:
        self._types[location_id] = loc_type
    
    def can_parent(self, parent_id: str, child_id: str) -> bool:
        """Check if reparenting would violate hierarchy rules."""
        parent_type = self.get_type(parent_id)
        child_type = self.get_type(child_id)
        
        valid_children = {
            "building": ["floor", "room"],
            "floor": ["room", "suite"],
            "suite": ["room"],
            "room": ["zone"],
            "zone": [],  # Terminal
            "outdoor": ["zone"],
        }
        return child_type in valid_children.get(parent_type, [])
```

**Option B: Store in modules dict** (recommended for simpler integrations)

```python
# Use reserved "_meta" module for integration metadata
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "room",
        "category": "kitchen",      # Room category for icon selection
        "icon": "mdi:stove",         # Explicit override (optional)
    }
)

# Read back
meta = loc_mgr.get_module_config("kitchen", "_meta")
loc_type = meta.get("type", "room")  # Default to room
category = meta.get("category")       # For icon inference
```

### Icon Resolution Pattern

The integration is responsible for mapping locations to icons. Recommended approach:

```python
# Constants for icon mapping
TYPE_ICONS = {
    "floor": "mdi:layers",
    "room": "mdi:map-marker",
    "zone": "mdi:vector-square",
    "suite": "mdi:home-group",
    "outdoor": "mdi:home-outline",
    "building": "mdi:warehouse",
}

CATEGORY_ICONS = {
    "kitchen": "mdi:silverware-fork-knife",
    "bedroom": "mdi:bed",
    "bathroom": "mdi:shower",
    "living": "mdi:sofa",
    "dining": "mdi:table-furniture",
    "office": "mdi:desk",
    "garage": "mdi:garage",
    "patio": "mdi:flower",
    "utility": "mdi:washing-machine",
}

def get_location_icon(loc_mgr, location_id: str) -> str:
    """Resolve icon for a location (integration responsibility)."""
    meta = loc_mgr.get_module_config(location_id, "_meta") or {}
    
    # Priority 1: Explicit icon override
    if meta.get("icon"):
        return meta["icon"]
    
    # Priority 2: Category-based icon
    category = meta.get("category")
    if category and category in CATEGORY_ICONS:
        return CATEGORY_ICONS[category]
    
    # Priority 3: Infer category from name
    location = loc_mgr.get_location(location_id)
    if location:
        name_lower = location.name.lower()
        for cat, icon in CATEGORY_ICONS.items():
            if cat in name_lower:
                return icon
    
    # Priority 4: Type-based fallback
    loc_type = meta.get("type", "room")
    return TYPE_ICONS.get(loc_type, "mdi:map-marker")
```

> **See also**: [UI Design Spec](./ui-design.md) section 3.1.3 for comprehensive icon tables.

### Why the Kernel Stays Agnostic

1. **Flexibility**: Your platform might have different type needs
2. **Simplicity**: Kernel focuses on structure, not semantics
3. **Power users**: API can bypass UI constraints if needed
4. **Future-proof**: Add new types without kernel changes

> **See also**: [UI Design Spec](./ui-design.md) section 5.3.1 for detailed UI enforcement rules.

---

## Initialization Sequence

### Complete Startup Flow

```python
async def initialize_home_topology(hass):
    """Complete initialization sequence for HA integration."""
    
    # 1. Create kernel components
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    
    # 2. Build topology from platform data
    await build_topology_from_ha(hass, loc_mgr)
    
    # 3. Load saved configuration
    config_data = await async_load_from_store(hass, "home_topology_config.json")
    restore_topology_config(loc_mgr, config_data)
    
    # 4. Initialize modules
    modules = {
        "occupancy": OccupancyModule(),
        "actions": ActionsModule(),
    }
    
    # 5. Attach modules to kernel
    for module in modules.values():
        module.attach(bus, loc_mgr)
    
    # 6. Restore module runtime state
    state_data = await async_load_from_store(hass, "home_topology_state.json")
    restore_module_states(modules, state_data)
    
    # 7. Set up platform → kernel event bridge
    setup_event_bridge(hass, bus, loc_mgr)
    
    # 8. Set up kernel → platform state exposure
    setup_state_exposure(hass, modules)
    
    # 9. Set up timeout scheduling
    setup_timeout_scheduler(hass, modules)
    
    # 10. Subscribe to semantic events for actions
    setup_semantic_event_handlers(hass, bus)
    
    return {
        "loc_mgr": loc_mgr,
        "bus": bus,
        "modules": modules,
    }
```

### Building Topology from Platform

```python
async def build_topology_from_ha(hass, loc_mgr):
    """Build topology from Home Assistant areas and devices."""
    
    # Create root location
    loc_mgr.create_location(id="house", name="House")
    
    # Import HA areas as locations
    area_registry = ar.async_get(hass)
    for area in area_registry.areas.values():
        loc_mgr.create_location(
            id=f"area_{area.id}",
            name=area.name,
            parent_id="house",  # or parse from area.name for hierarchy
            ha_area_id=area.id,
        )
    
    # Map entities to locations based on HA area assignments
    entity_registry = er.async_get(hass)
    for entity in entity_registry.entities.values():
        if entity.area_id:
            loc_mgr.add_entity_to_location(
                entity.entity_id,
                f"area_{entity.area_id}"
            )
    
    # Note: Entities without areas go to "inbox" (unassigned)
    # User can assign them later via UI
```

---

## Event Translation

### Platform → Kernel

Your integration must translate platform events into kernel `Event` objects:

```python
from home_topology.core.bus import Event
from datetime import datetime, UTC

@callback
def state_changed_listener(hass, event):
    """Listen to HA state changes and publish to kernel."""
    
    entity_id = event.data.get("entity_id")
    old_state = event.data.get("old_state")
    new_state = event.data.get("new_state")
    
    if new_state is None:
        return
    
    # Get location for entity
    kernel = hass.data[DOMAIN]
    loc_mgr = kernel["loc_mgr"]
    location_id = loc_mgr.get_entity_location(entity_id)
    
    # Translate to kernel event
    kernel_event = Event(
        type="occupancy.signal",
        source="ha",
        entity_id=entity_id,
        location_id=location_id,
        payload={
            "event_type": "trigger" if new_state.state == "on" else "clear",
            "source_id": entity_id,
            "old_state": old_state.state if old_state else None,
            "new_state": new_state.state,
            "attributes": dict(new_state.attributes),
        },
        timestamp=new_state.last_changed or datetime.now(UTC),
    )
    
    # Publish to kernel
    bus = kernel["bus"]
    bus.publish(kernel_event)
```

### Event Type Mapping

| Platform Event | Kernel Event Type | Notes |
|----------------|-------------------|-------|
| `state_changed` | `occupancy.signal` | Emit `event_type=trigger/clear` + `source_id` |
| Time trigger | `time.tick` | Periodic or scheduled |
| Service call | `service.called` | User-initiated actions |
| Platform start | `platform.started` | Initial load complete |
| Platform stop | `platform.stopping` | Save state before shutdown |

### Event Payload Guidelines

Keep payloads **platform-neutral**:

```python
# ✅ Good: Generic, portable
payload = {
    "old_state": "off",
    "new_state": "on",
    "attributes": {"device_class": "motion"},  # Optional attributes
}

# ❌ Bad: Platform-specific
payload = {
    "old_state_object": ha_state,  # HA-specific object
    "new_state_object": ha_state,
}
```

---

## State Exposure

### Kernel → Platform Entities

Modules emit semantic events (e.g., `occupancy.changed`). Your integration should:

1. **Subscribe to semantic events**
2. **Translate to platform entities**
3. **Update platform state**

```python
from home_topology.core.bus import EventFilter

async def setup_state_exposure(hass, modules):
    """Expose module state as HA entities."""
    
    kernel = hass.data[DOMAIN]
    bus = kernel["bus"]
    
    # Subscribe to occupancy events
    def on_occupancy_changed(event: Event):
        location_id = event.location_id
        payload = event.payload
        
        # Update HA binary sensor
        entity_id = f"binary_sensor.occupancy_{location_id}"
        hass.states.async_set(
            entity_id,
            "on" if payload["occupied"] else "off",
            attributes={
                "confidence": payload["confidence"],
                "active_holds": payload.get("active_holds", []),
                "expires_at": payload.get("expires_at"),
                "friendly_name": f"{location_id} Occupancy",
            },
        )
    
    bus.subscribe(
        on_occupancy_changed,
        EventFilter(event_type="occupancy.changed")
    )
```

### Recommended Entity Patterns

| Module | Entity Pattern | Type | Attributes |
|--------|---------------|------|------------|
| Occupancy | `binary_sensor.occupancy_{location_id}` | `binary_sensor` | `active_holds`, `is_locked`, `expires_at` |
| Occupancy | `sensor.occupancy_confidence_{location_id}` | `sensor` | `unit_of_measurement: "%"` |
| Actions | `sensor.actions_{location_id}` | `sensor` | `last_action`, `action_count` |

---

## Configuration Management

### Initial Configuration

```python
async def setup_default_config(loc_mgr, modules):
    """Set up default configuration for all locations."""
    
    for location in loc_mgr.all_locations():
        for module_id, module in modules.items():
            # Get default config from module
            default_config = module.default_config()
            
            # Set version
            default_config["version"] = module.CURRENT_CONFIG_VERSION
            
            # Store in LocationManager
            loc_mgr.set_module_config(
                location_id=location.id,
                module_id=module_id,
                config=default_config,
            )
            
            # Notify module of config
            module.on_location_config_changed(location.id, default_config)
```

### Configuration Updates

When user changes config via UI:

```python
async def update_module_config(loc_mgr, module, location_id, new_config):
    """Update module configuration for a location."""
    
    # 1. Validate config version
    if new_config.get("version") != module.CURRENT_CONFIG_VERSION:
        # Migrate if needed
        new_config = module.migrate_config(new_config)
    
    # 2. Store in LocationManager
    loc_mgr.set_module_config(location_id, module.id, new_config)
    
    # 3. Notify module
    module.on_location_config_changed(location_id, new_config)
    
    # 4. Save to persistent storage
    await save_config_to_store(loc_mgr)
```

### Configuration Migration

Modules handle their own version migrations:

```python
class MyModule(LocationModule):
    CURRENT_CONFIG_VERSION = 2
    
    def migrate_config(self, config: Dict) -> Dict:
        """Migrate config from older versions."""
        version = config.get("version", 1)
        
        if version == 1:
            # v1 → v2: Rename timeout_seconds to timeout
            config["timeout"] = config.pop("timeout_seconds", 300)
            config["version"] = 2
        
        return config
```

### Configuration Schema

Modules provide schemas for UI generation:

```python
def location_config_schema(self) -> Dict:
    """Return JSON-schema-like definition for UI."""
    return {
        "type": "object",
        "properties": {
            "version": {"type": "integer", "default": 1},
            "enabled": {"type": "boolean", "default": True},
            "timeouts": {
                "type": "object",
                "properties": {
                    "motion": {
                        "type": "integer",
                        "default": 300,
                        "minimum": 0,
                        "title": "Motion Timeout (seconds)",
                        "description": "How long after motion stops to consider location vacant",
                    },
                    "presence": {
                        "type": "integer",
                        "default": 600,
                        "minimum": 0,
                        "title": "Presence Timeout (seconds)",
                    },
                },
            },
        },
    }
```

---

## State Persistence

### Saving State

Save state before platform shutdown or periodically:

```python
async def save_kernel_state(hass):
    """Save all module state to persistent storage."""
    
    kernel = hass.data[DOMAIN]
    modules = kernel["modules"]
    
    state_data = {}
    for module_id, module in modules.items():
        state_data[module_id] = module.dump_state()
    
    await async_save_to_store(
        hass,
        "home_topology_state.json",
        state_data
    )

# Register shutdown handler
hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, save_kernel_state)

# Or periodic save
async_track_time_interval(hass, save_kernel_state, timedelta(minutes=5))
```

### Restoring State

Restore state during initialization:

```python
async def restore_module_states(modules, state_data):
    """Restore runtime state for all modules."""
    
    for module_id, module in modules.items():
        if module_id in state_data:
            try:
                module.restore_state(state_data[module_id])
                _LOGGER.info(f"Restored state for {module_id}")
            except Exception as e:
                _LOGGER.error(f"Failed to restore {module_id}: {e}")
```

### State Format Example

```json
{
  "occupancy": {
    "kitchen": {
      "is_occupied": true,
      "confidence": 0.85,
      "occupied_until": "2025-11-24T14:30:00Z",
      "active_holds": ["ble_mike"],
      "last_updated": "2025-11-24T14:25:00Z"
    },
    "living_room": {
      "is_occupied": false,
      "confidence": 0.0,
      "occupied_until": null,
      "active_holds": [],
      "last_updated": "2025-11-24T14:00:00Z"
    }
  },
  "actions": {
    "last_action_by_location": {
      "kitchen": "lights_on",
      "living_room": "climate_adjust"
    }
  }
}
```

### Stale State Handling

Modules should reject stale state on restore:

```python
def restore_state(self, state: Dict) -> None:
    """Restore state, rejecting stale data."""
    
    for location_id, loc_state in state.items():
        last_updated = datetime.fromisoformat(loc_state["last_updated"])
        age = datetime.now(UTC) - last_updated
        
        # Reject state older than 1 hour
        if age > timedelta(hours=1):
            _LOGGER.warning(f"Ignoring stale state for {location_id}")
            continue
        
        # Restore state...
```

---

## Timeout Management

### Time-Agnostic Design

Modules **do not run internal timers**. The host platform is responsible for:

1. **Querying when next timeout is needed**: `module.get_next_timeout()`
2. **Scheduling a callback**: Use platform scheduler
3. **Calling timeout check**: `module.check_timeouts(now)`

This design enables:

- ✅ **Testability**: Tests control time exactly (no `time.sleep()` or mocking)
- ✅ **Platform flexibility**: HA uses `async_track_point_in_time`, tests use manual time
- ✅ **Efficiency**: Single scheduler, no per-location timers

### Implementation Pattern

```python
from datetime import datetime, UTC

# Module interface
class OccupancyModule(LocationModule):
    def get_next_timeout(self) -> Optional[datetime]:
        """Get when the next timeout check is needed."""
        # Returns earliest expiration time across all locations
        pass
    
    def check_timeouts(self, now: datetime) -> None:
        """Check and process any expired timeouts."""
        # Processes expirations, emits occupancy.changed events
        pass
```

### Home Assistant Integration

```python
from homeassistant.helpers.event import async_track_point_in_time
from datetime import datetime, UTC

class HomeTopologyCoordinator:
    def __init__(self, hass, modules):
        self.hass = hass
        self.modules = modules
        self._timeout_cancel = None
    
    def schedule_next_timeout(self):
        """Schedule the next timeout check."""
        
        # Cancel existing timer
        if self._timeout_cancel:
            self._timeout_cancel()
            self._timeout_cancel = None
        
        # Find earliest timeout across all modules
        next_timeout = None
        for module in self.modules.values():
            if hasattr(module, "get_next_timeout"):
                module_timeout = module.get_next_timeout()
                if module_timeout:
                    if next_timeout is None or module_timeout < next_timeout:
                        next_timeout = module_timeout
        
        # Schedule callback
        if next_timeout:
            self._timeout_cancel = async_track_point_in_time(
                self.hass,
                self._handle_timeout,
                next_timeout,
            )
    
    @callback
    def _handle_timeout(self, now):
        """Handle timeout check."""
        
        # Call check_timeouts on all modules
        for module in self.modules.values():
            if hasattr(module, "check_timeouts"):
                module.check_timeouts(now)
        
        # Schedule next check
        self.schedule_next_timeout()
```

### Testing Pattern

```python
def test_occupancy_timeout():
    """Test occupancy timeout expiration."""
    
    # Setup
    loc_mgr = LocationManager()
    bus = EventBus()
    occupancy = OccupancyModule()
    occupancy.attach(bus, loc_mgr)
    
    # Trigger motion at t=0
    t0 = datetime(2025, 11, 24, 14, 0, 0, tzinfo=UTC)
    bus.publish(Event(
        type="occupancy.signal",
        entity_id="binary_sensor.motion",
        payload={
            "event_type": "trigger",
            "source_id": "binary_sensor.motion",
            "new_state": "on",
        },
        timestamp=t0,
    ))
    
    # Verify occupied
    assert occupancy.get_location_state("kitchen")["occupied"] is True
    
    # Check timeout is scheduled for t0 + 5 minutes
    next_timeout = occupancy.get_next_timeout()
    assert next_timeout == t0 + timedelta(minutes=5)
    
    # Simulate host calling check_timeouts at t0 + 5 minutes
    t1 = t0 + timedelta(minutes=5)
    occupancy.check_timeouts(t1)
    
    # Verify vacant
    assert occupancy.get_location_state("kitchen")["occupied"] is False
```

---

## Best Practices

### Event Design

**✅ DO:**

- Use descriptive event types: `occupancy.changed`, `action.executed`
- Include timestamps on all events
- Keep payloads JSON-serializable
- Document event schemas

**❌ DON'T:**

- Pass platform-specific objects in payloads
- Use overly generic types: `state.changed` (too broad)
- Forget to include `location_id` for location-aware events

---

### Error Handling

**✅ DO:**

- Wrap event handlers in `try/except` (EventBus does this automatically)
- Log errors with context: entity, location, payload
- Degrade gracefully: one bad module shouldn't crash the kernel
- Emit error events: `module.error` for monitoring

**❌ DON'T:**

- Silently swallow errors
- Re-raise exceptions from handlers (crashes EventBus)
- Let bad data corrupt module state

```python
def on_sensor_changed(self, event: Event):
    """Handle sensor state change."""
    try:
        # Your logic here
        pass
    except ValueError as e:
        _LOGGER.error(f"Invalid data from {event.entity_id}: {e}")
        # Emit error event for monitoring
        self.bus.publish(Event(
            type="module.error",
            source=self.id,
            location_id=event.location_id,
            payload={"error": str(e), "event_type": event.type},
        ))
    except Exception as e:
        _LOGGER.exception(f"Unexpected error in {self.id}: {e}")
```

---

### Configuration Best Practices

**✅ DO:**

- Provide sensible defaults
- Version all config structures
- Validate config before applying
- Document config schema

**❌ DON'T:**

- Store runtime state in config (use `dump_state()`)
- Break compatibility without migration
- Require manual config for basic functionality

---

### State Management

**✅ DO:**

- Keep module state immutable where possible
- Use `dump_state()` / `restore_state()` for persistence
- Reject stale state on restore
- Version state format

**❌ DON'T:**

- Store references to mutable platform objects
- Mix config and runtime state
- Forget to handle missing state gracefully

---

### Performance

**✅ DO:**

- Keep event handlers fast (< 10ms)
- Use `EventFilter` to reduce unnecessary handler calls
- Batch state updates
- Profile hot paths

**❌ DON'T:**

- Perform I/O in event handlers (use `run_in_background()`)
- Query large datasets synchronously
- Update platform state for every event (debounce)

---

### Testing

**✅ DO:**

- Test module logic in pure Python (no platform)
- Use time-agnostic design (pass `now` parameter)
- Test error paths
- Test config migration

**❌ DON'T:**

- Require full platform for unit tests
- Use `time.sleep()` in tests
- Skip edge cases

---

## Complete Home Assistant Example

### File Structure

```
custom_components/home_topology/
├── __init__.py           # Integration setup
├── manifest.json         # HA integration metadata
├── config_flow.py        # Configuration UI
├── coordinator.py        # Coordinator for timeout scheduling
├── binary_sensor.py      # Occupancy sensors
├── sensor.py             # Confidence sensors
└── services.yaml         # Custom services
```

---

### `__init__.py` - Integration Setup

```python
"""Home Topology integration for Home Assistant."""
import logging
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers import (
    device_registry as dr,
    entity_registry as er,
    area_registry as ar,
)
from homeassistant.const import EVENT_HOMEASSISTANT_STOP

from home_topology import LocationManager, EventBus, Event
from home_topology.modules.occupancy import OccupancyModule
from home_topology.modules.actions import ActionsModule

from .coordinator import HomeTopologyCoordinator
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["binary_sensor", "sensor"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up home-topology from a config entry."""
    
    _LOGGER.info("Setting up home-topology integration")
    
    # 1. Create kernel components
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)
    
    # 2. Build topology from HA areas
    await build_topology_from_ha(hass, loc_mgr)
    
    # 3. Initialize modules
    modules = {
        "occupancy": OccupancyModule(),
        "actions": ActionsModule(),
    }
    
    # 4. Attach modules
    for module in modules.values():
        module.attach(bus, loc_mgr)
    
    # 5. Set up default config for all locations
    setup_default_config(loc_mgr, modules)
    
    # 6. Restore saved state
    # TODO: Load from storage
    
    # 7. Create coordinator for timeout scheduling
    coordinator = HomeTopologyCoordinator(hass, modules)
    
    # 8. Store kernel in hass.data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "loc_mgr": loc_mgr,
        "bus": bus,
        "modules": modules,
        "coordinator": coordinator,
    }
    
    # 9. Set up event bridge (HA → kernel)
    setup_event_bridge(hass, entry, bus, loc_mgr)
    
    # 10. Set up state exposure (kernel → HA)
    setup_state_exposure(hass, entry, bus, modules)
    
    # 11. Set up platforms (entities)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    # 12. Schedule initial timeout check
    coordinator.schedule_next_timeout()
    
    # 13. Register shutdown handler
    async def save_state_on_shutdown(event):
        """Save state before shutdown."""
        await save_kernel_state(hass, entry)
    
    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, save_state_on_shutdown)
    )
    
    _LOGGER.info("Home-topology setup complete")
    return True


async def build_topology_from_ha(hass: HomeAssistant, loc_mgr: LocationManager):
    """Build topology from HA areas and entities."""
    
    # Create root
    loc_mgr.create_location(id="house", name="House")
    
    # Import areas
    area_registry = ar.async_get(hass)
    for area in area_registry.areas.values():
        loc_mgr.create_location(
            id=f"area_{area.id}",
            name=area.name,
            parent_id="house",
            ha_area_id=area.id,
        )
    
    # Map entities to locations
    entity_registry = er.async_get(hass)
    for entity in entity_registry.entities.values():
        if entity.area_id:
            try:
                loc_mgr.add_entity_to_location(
                    entity.entity_id,
                    f"area_{entity.area_id}"
                )
            except ValueError:
                _LOGGER.warning(f"Could not map {entity.entity_id} to area")


def setup_default_config(loc_mgr: LocationManager, modules):
    """Set up default configuration for all locations."""
    
    for location in loc_mgr.all_locations():
        for module_id, module in modules.items():
            default_config = module.default_config()
            default_config["version"] = module.CURRENT_CONFIG_VERSION
            
            loc_mgr.set_module_config(
                location_id=location.id,
                module_id=module_id,
                config=default_config,
            )


@callback
def setup_event_bridge(
    hass: HomeAssistant,
    entry: ConfigEntry,
    bus: EventBus,
    loc_mgr: LocationManager,
):
    """Set up HA → kernel event bridge."""
    
    @callback
    def state_changed_listener(event):
        """Translate HA state changes to kernel events."""
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        old_state = event.data.get("old_state")
        
        if new_state is None:
            return
        
        # Get location for entity
        location_id = loc_mgr.get_entity_location(entity_id)
        
        # Publish to kernel
        kernel_event = Event(
            type="occupancy.signal",
            source="ha",
            entity_id=entity_id,
            location_id=location_id,
            payload={
                "event_type": "trigger" if new_state.state == "on" else "clear",
                "source_id": entity_id,
                "old_state": old_state.state if old_state else None,
                "new_state": new_state.state,
                "attributes": dict(new_state.attributes),
            },
            timestamp=new_state.last_changed,
        )
        
        bus.publish(kernel_event)
    
    # Subscribe to all HA state changes
    entry.async_on_unload(
        async_track_state_change_event(hass, None, state_changed_listener)
    )


@callback
def setup_state_exposure(
    hass: HomeAssistant,
    entry: ConfigEntry,
    bus: EventBus,
    modules,
):
    """Set up kernel → HA state exposure."""
    
    from home_topology.core.bus import EventFilter
    
    # Expose occupancy state
    @callback
    def on_occupancy_changed(event: Event):
        """Update HA binary sensor when occupancy changes."""
        location_id = event.location_id
        payload = event.payload
        
        entity_id = f"binary_sensor.occupancy_{location_id}"
        hass.states.async_set(
            entity_id,
            "on" if payload["occupied"] else "off",
            attributes={
                "confidence": payload["confidence"],
                "active_holds": payload.get("active_holds", []),
                "expires_at": payload.get("expires_at"),
                "device_class": "occupancy",
                "friendly_name": f"{location_id} Occupancy",
            },
        )
    
    bus.subscribe(
        on_occupancy_changed,
        EventFilter(event_type="occupancy.changed")
    )


async def save_kernel_state(hass: HomeAssistant, entry: ConfigEntry):
    """Save kernel state to persistent storage."""
    
    kernel = hass.data[DOMAIN][entry.entry_id]
    modules = kernel["modules"]
    
    state_data = {}
    for module_id, module in modules.items():
        state_data[module_id] = module.dump_state()
    
    # TODO: Use Store API
    _LOGGER.info("Saved kernel state")


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    
    # Save state before unloading
    await save_kernel_state(hass, entry)
    
    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    
    return unload_ok
```

---

### `coordinator.py` - Timeout Scheduling

```python
"""Coordinator for timeout scheduling."""
import logging
from datetime import datetime, UTC
from typing import Dict, Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time

_LOGGER = logging.getLogger(__name__)


class HomeTopologyCoordinator:
    """Coordinator for scheduling module timeout checks."""
    
    def __init__(self, hass: HomeAssistant, modules: Dict[str, Any]):
        """Initialize the coordinator."""
        self.hass = hass
        self.modules = modules
        self._timeout_cancel = None
    
    def schedule_next_timeout(self):
        """Schedule the next timeout check."""
        
        # Cancel existing timer
        if self._timeout_cancel:
            self._timeout_cancel()
            self._timeout_cancel = None
        
        # Find earliest timeout across all modules
        next_timeout = None
        for module_id, module in self.modules.items():
            if hasattr(module, "get_next_timeout"):
                try:
                    module_timeout = module.get_next_timeout()
                    if module_timeout:
                        if next_timeout is None or module_timeout < next_timeout:
                            next_timeout = module_timeout
                            _LOGGER.debug(
                                f"Next timeout from {module_id}: {module_timeout}"
                            )
                except Exception as e:
                    _LOGGER.error(f"Error getting timeout from {module_id}: {e}")
        
        # Schedule callback
        if next_timeout:
            _LOGGER.info(f"Scheduling timeout check at {next_timeout}")
            self._timeout_cancel = async_track_point_in_time(
                self.hass,
                self._handle_timeout,
                next_timeout,
            )
        else:
            _LOGGER.debug("No timeouts to schedule")
    
    @callback
    def _handle_timeout(self, now):
        """Handle timeout check."""
        
        _LOGGER.debug(f"Running timeout check at {now}")
        
        # Call check_timeouts on all modules
        for module_id, module in self.modules.items():
            if hasattr(module, "check_timeouts"):
                try:
                    module.check_timeouts(now)
                except Exception as e:
                    _LOGGER.error(f"Error checking timeouts in {module_id}: {e}")
        
        # Schedule next check
        self.schedule_next_timeout()
```

---

### `binary_sensor.py` - Occupancy Sensors

```python
"""Binary sensor platform for home-topology."""
import logging

from homeassistant.components.binary_sensor import (
    BinarySensorEntity,
    BinarySensorDeviceClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from home_topology.core.bus import EventFilter

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up occupancy binary sensors."""
    
    kernel = hass.data[DOMAIN][entry.entry_id]
    loc_mgr = kernel["loc_mgr"]
    bus = kernel["bus"]
    
    # Create occupancy sensor for each location
    entities = []
    for location in loc_mgr.all_locations():
        entities.append(OccupancyBinarySensor(location.id, location.name, bus))
    
    async_add_entities(entities)


class OccupancyBinarySensor(BinarySensorEntity):
    """Binary sensor representing occupancy state."""
    
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    
    def __init__(self, location_id: str, location_name: str, bus):
        """Initialize the sensor."""
        self._location_id = location_id
        self._location_name = location_name
        self._bus = bus
        
        self._attr_unique_id = f"occupancy_{location_id}"
        self._attr_name = f"{location_name} Occupancy"
        
        self._attr_is_on = False
        self._attr_extra_state_attributes = {}
    
    async def async_added_to_hass(self):
        """Subscribe to occupancy events when added."""
        
        @callback
        def on_occupancy_changed(event):
            """Update state when occupancy changes."""
            if event.location_id == self._location_id:
                payload = event.payload
                self._attr_is_on = payload["occupied"]
                self._attr_extra_state_attributes = {
                    "confidence": payload["confidence"],
                    "active_holds": payload.get("active_holds", []),
                    "expires_at": payload.get("expires_at"),
                }
                self.async_write_ha_state()
        
        self._bus.subscribe(
            on_occupancy_changed,
            EventFilter(event_type="occupancy.changed")
        )
```

---

### `const.py` - Constants

```python
"""Constants for home-topology integration."""

DOMAIN = "home_topology"

CONF_TOPOLOGY_CONFIG = "topology_config"
CONF_MODULE_STATE = "module_state"
```

---

### `manifest.json` - Integration Metadata

```json
{
  "domain": "home_topology",
  "name": "Home Topology",
  "documentation": "https://github.com/mjcumming/home-topology",
  "codeowners": ["@mjcumming"],
  "config_flow": true,
  "dependencies": [],
  "requirements": ["home-topology==0.1.0"],
  "version": "0.1.0",
  "iot_class": "calculated"
}
```

---

## Summary

This guide covered:

✅ **Complete initialization sequence** - Step-by-step setup  
✅ **Event translation patterns** - Platform ↔ kernel  
✅ **State exposure patterns** - Module state → platform entities  
✅ **Configuration management** - Setup, updates, migration  
✅ **State persistence** - Dump/restore workflows  
✅ **Timeout scheduling** - Time-agnostic design  
✅ **Best practices** - Patterns and anti-patterns  
✅ **Full HA integration example** - Production-ready code  

### Manual Service Routing Notes

The HA wrapper services map directly to occupancy module APIs:

- `home_topology.trigger` -> `occupancy.trigger(location_id, source_id, timeout)`
- `home_topology.clear` -> `occupancy.release(location_id, source_id, trailing_timeout)`
- `home_topology.lock` -> `occupancy.lock(location_id, source_id)`
- `home_topology.unlock` -> `occupancy.unlock(location_id, source_id)`
- `home_topology.vacate_area` -> `occupancy.vacate_area(location_id, source_id, include_locked)`

For multi-entry HA setups, service calls should include `entry_id`. If multiple
entries are loaded and `entry_id` is omitted, the wrapper rejects the call to
avoid ambiguous dispatch.

### Key Takeaways

1. **Kernel is platform-agnostic** - No HA dependencies in core
2. **Modules are time-agnostic** - Host controls scheduling
3. **Event translation is your responsibility** - Platform → kernel
4. **State exposure is your responsibility** - Kernel → platform
5. **Configuration is stored in LocationManager** - Modules read it
6. **Runtime state is stored in modules** - Use dump/restore

### Next Steps

- Read the [module specifications](../library/modules/)
- Join the [discussions](https://github.com/mjcumming/home-topology/discussions)
- Build your integration!

---

**Document Version**: 2.3  
**Last Updated**: 2026.02.23  
**Status**: Living Document
