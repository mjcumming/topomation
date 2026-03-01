# Cursor AI Detailed Guide for topomation

> This document contains detailed patterns, code examples, and comprehensive guidelines.
> For the essential rules loaded in every conversation, see `.cursorrules`.
> Contract/policy source of truth is `docs/bidirectional-sync-design.md` and
> `docs/architecture.md`. If examples here differ, those docs win.

Last Updated: 2026-03-01

---

## Legacy Code Policy (Mandatory)

- Do not keep legacy branches, compatibility paths, or dead code after a new direction is chosen.
- Replace-and-delete in the same change unless a requirement explicitly mandates temporary coexistence.
- Never keep commented-out old implementations as rollback strategy; use git history instead.
- When deleting old behavior, clean up tests and docs tied only to that behavior.

---

## Table of Contents

1. [Learning from Existing HA Integrations](#1-learning-from-existing-ha-integrations)
2. [Home Assistant Integration Patterns](#2-home-assistant-integration-patterns)
3. [Event Translation Patterns](#3-event-translation-patterns)
4. [Timeout Coordination Pattern](#4-timeout-coordination-pattern)
5. [Location Type Metadata Pattern](#5-location-type-metadata-pattern)
6. [Frontend Development Patterns](#6-frontend-development-patterns)
7. [Testing Strategy](#7-testing-strategy)
8. [Commit Standards](#8-commit-standards)
9. [Complete File Organization](#9-complete-file-organization)

---

## 1. Learning from Existing HA Integrations

Before implementing any feature, **ALWAYS** study how official Home Assistant integrations solve similar problems.

### Why Study Existing Integrations?

- **Proven patterns**: Battle-tested solutions used by millions
- **Best practices**: Proper error handling, logging, state management
- **API usage**: Correct use of HA APIs and decorators
- **Performance**: Efficient patterns that don't block the event loop
- **User experience**: Consistent behavior users expect

### Key Integrations to Study

#### 1. **ZHA (Zigbee)** - Complex Coordinator Pattern

**Study for**: Entity management, coordinator updates, device registry

```bash
# View ZHA implementation
https://github.com/home-assistant/core/tree/dev/homeassistant/components/zha
```

**Key patterns:**

- `ZHAGateway` class - Complex state coordinator
- Entity platform forwarding
- Device and entity registry integration
- WebSocket API for device management
- Real-time updates via coordinator

**Learn from:**

- `__init__.py` - Integration setup and lifecycle
- `core/gateway.py` - Main coordinator class
- `binary_sensor.py` - Entity platform pattern
- `websocket_api.py` - API command handlers

#### 2. **ESPHome** - Event Translation & Entity Mapping

**Study for**: Platform-to-HA event translation, entity discovery

```bash
https://github.com/home-assistant/core/tree/dev/homeassistant/components/esphome
```

**Key patterns:**

- Native API event translation to HA events
- Dynamic entity creation based on device capabilities
- Connection state management
- Reconnection handling

**Learn from:**

- `entry_data.py` - Data coordinator setup
- Event subscription patterns
- Entity state synchronization

#### 3. **MQTT** - Config Flow & WebSocket API

**Study for**: Configuration UI, service handlers, topic patterns

```bash
https://github.com/home-assistant/core/tree/dev/homeassistant/components/mqtt
```

**Key patterns:**

- Complex config flow with validation
- Service definitions and handlers
- WebSocket API for management
- Subscription management

**Learn from:**

- `config_flow.py` - Multi-step configuration
- `services.yaml` - Service definitions
- Error handling and user feedback

#### 4. **Template** - Entity Platform Patterns

**Study for**: Clean entity implementation, state attributes

```bash
https://github.com/home-assistant/core/tree/dev/homeassistant/components/template
```

**Key patterns:**

- Simple, clean entity classes
- Property decorators usage
- State attribute patterns
- Entity availability logic

**Learn from:**

- `binary_sensor.py` - Minimal entity implementation
- `template_entity.py` - Base entity class

#### 5. **Lovelace** - Frontend Panel Registration

**Study for**: Custom panel integration, frontend serving

```bash
https://github.com/home-assistant/core/tree/dev/homeassistant/components/lovelace
```

**Key patterns:**

- Panel registration in `__init__.py`
- Frontend resource serving
- WebSocket API for UI state

### How to Study an Integration

#### Step 1: Understand the Integration's Purpose

Read the integration's README and documentation to understand what problem it solves.

#### Step 2: Map to Your Feature

Identify which integration feature maps to what you're building:

- Need coordinator? → Study ZHA's `ZHAGateway`
- Need event translation? → Study ESPHome's event handlers
- Need config flow? → Study MQTT's multi-step flow

#### Step 3: Read the Code Flow

Follow the execution path:

```python
# 1. Start at __init__.py
async def async_setup_entry() -> bool:
    # What objects are created?
    # How is state initialized?
    # What platforms are forwarded?

# 2. Look at platform setup (e.g., binary_sensor.py)
async def async_setup_entry():
    # How are entities discovered?
    # How is the coordinator passed?

# 3. Examine entity implementation
class MyEntity(BinarySensorEntity):
    # What properties are implemented?
    # How does it subscribe to updates?
    # How does it handle errors?
```

#### Step 4: Extract the Pattern

Identify the core pattern, not implementation details:

**❌ Don't copy blindly:**

```python
# Copying ZHA's Zigbee-specific code
self._ieee = ieee
self._endpoint_id = endpoint_id
```

**✅ Extract the pattern:**

```python
# Apply ZHA's coordinator pattern to our domain
self._location_id = location_id
self._coordinator = coordinator
```

#### Step 5: Adapt to Our Architecture

Apply the pattern while respecting our thin adapter principle:

```python
# HA Integration pattern: Entity subscribes to coordinator updates
@callback
def _handle_coordinator_update(self) -> None:
    """Handle updated data from the coordinator."""
    # DON'T: Implement occupancy logic here
    # DO: Fetch state from kernel and update HA entity
    kernel_state = self.coordinator.occupancy_module.get_state(self._location_id)
    self.async_write_ha_state()
```

### Common Patterns to Learn

#### Pattern 1: DataUpdateCoordinator

**When to use**: Periodic polling or coordinated updates

```python
# Study in: ZHA, ESPHome, many others
class MyCoordinator(DataUpdateCoordinator):
    """Coordinate updates."""

    async def _async_update_data(self):
        """Fetch data from API."""
        # Our version: check kernel timeouts
        return await self._check_timeouts()
```

#### Pattern 2: Entity Platform Setup

**When to use**: Creating multiple entities per platform

```python
# Study in: Template, Binary Sensor, Sensor platforms
async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up platform."""
    coordinator = hass.data[DOMAIN][entry.entry_id]

    entities = []
    for location_id in coordinator.locations:
        entities.append(MyEntity(coordinator, location_id))

    async_add_entities(entities)
```

#### Pattern 3: Config Flow Validation

**When to use**: User input validation in setup wizard

```python
# Study in: MQTT, ZHA
async def async_step_user(self, user_input=None):
    """Handle user step."""
    errors = {}

    if user_input is not None:
        try:
            # Validate input
            await self._test_connection(user_input)
        except CannotConnect:
            errors["base"] = "cannot_connect"
        except InvalidAuth:
            errors["base"] = "invalid_auth"
        else:
            return self.async_create_entry(title="Title", data=user_input)

    return self.async_show_form(step_id="user", data_schema=DATA_SCHEMA, errors=errors)
```

#### Pattern 4: WebSocket API Commands

**When to use**: Real-time communication with frontend

```python
# Study in: MQTT, Lovelace, ZHA
@websocket_api.websocket_command({
    vol.Required("type"): "my_integration/my_command",
    vol.Required("param"): str,
})
@callback
def websocket_my_command(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle command."""
    try:
        result = do_something(msg["param"])
        connection.send_result(msg["id"], result)
    except Exception as err:
        connection.send_error(msg["id"], "command_failed", str(err))
```

#### Pattern 5: Event Subscription

**When to use**: Reacting to HA state changes

```python
# Study in: Automation, Script, Template
@callback
def async_state_changed_listener(event: Event) -> None:
    """Handle state changes."""
    new_state = event.data.get("new_state")
    old_state = event.data.get("old_state")

    # Always check for None
    if new_state is None or new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return

    # Process change
    process_state_change(old_state, new_state)


# Subscribe with proper cleanup
remove_listener = hass.bus.async_listen(
    EVENT_STATE_CHANGED,
    async_state_changed_listener,
    event_filter=...  # Use filters for performance
)

# Store for cleanup
entry.async_on_unload(remove_listener)
```

### Best Practices Learned from HA Core

#### 1. **Always Use Type Hints**

```python
# From HA core integrations
async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up from config entry."""
```

#### 2. **Use @callback for Sync Event Handlers**

```python
# From HA core - prevents blocking event loop
@callback
def state_changed_listener(event: Event) -> None:
    """Handle state changes synchronously."""
```

#### 3. **Proper Error Handling**

```python
# From MQTT integration
try:
    await client.async_connect()
except MqttError as err:
    _LOGGER.error("Failed to connect: %s", err)
    raise ConfigEntryNotReady from err
```

#### 4. **Cleanup Pattern**

```python
# From ZHA - use entry.async_on_unload
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up platform."""

    # Subscribe to events
    remove_listener = hass.bus.async_listen(...)

    # Register cleanup
    entry.async_on_unload(remove_listener)

    return True
```

#### 5. **Entity Unique ID Pattern**

```python
# From core integrations - consistent unique_id format
@property
def unique_id(self) -> str:
    """Return unique ID."""
    return f"{self._integration_id}_{self._location_id}_{self._entity_type}"
```

#### 6. **Logging Levels**

```python
# From HA core patterns
_LOGGER.debug("Detailed info for debugging: %s", data)      # Development
_LOGGER.info("Important state changes: %s", event)          # Normal operation
_LOGGER.warning("Recoverable issues: %s", err)              # User should know
_LOGGER.error("Failed operations: %s", err)                 # Something broken
```

### Resources for Learning

#### Official Documentation

- **Developer Docs**: https://developers.home-assistant.io/
- **Architecture**: https://developers.home-assistant.io/docs/architecture_index
- **Entity Platform**: https://developers.home-assistant.io/docs/core/entity
- **Config Flow**: https://developers.home-assistant.io/docs/config_entries_config_flow_handler

#### Code References

- **Core Repo**: https://github.com/home-assistant/core
- **Frontend Repo**: https://github.com/home-assistant/frontend
- **Example Integration**: https://github.com/home-assistant/example-custom-config

#### Community

- **Discord**: #devs channel for questions
- **Forums**: https://community.home-assistant.io/c/development

---

## 2. Home Assistant Integration Patterns

### 1.1 Entry Point Pattern

**Integration Setup (`__init__.py`)**:

```python
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from config entry."""
    # 1. Create kernel components
    event_bus = EventBus()
    loc_mgr = LocationManager(event_bus)

    # 2. Build topology from HA
    await async_build_topology(hass, loc_mgr, entry)

    # 3. Attach modules
    occupancy_module = OccupancyModule(event_bus, loc_mgr)

    # 4. Register panel and WebSocket API
    await async_register_panel(hass)
    websocket_api.async_register_commands(hass)

    # 5. Forward to platforms
    await hass.config_entries.async_forward_entry_setups(
        entry, ["binary_sensor", "sensor"]
    )

    return True
```

**Platform Setup Pattern**:

```python
async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor platform."""
    coordinator: TopomationCoordinator = hass.data[DOMAIN][entry.entry_id]

    entities = []
    for location_id in coordinator.loc_mgr.get_all_locations():
        entities.append(OccupancyBinarySensor(coordinator, location_id))

    async_add_entities(entities)
```

### 1.2 WebSocket API Pattern

```python
@websocket_api.websocket_command({
    vol.Required("type"): "topomation/locations/list"
})
@callback
def handle_locations_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle locations list command."""
    coordinator: TopomationCoordinator = hass.data[DOMAIN][msg["config_entry_id"]]

    locations = []
    for loc_id in coordinator.loc_mgr.get_all_locations():
        location = coordinator.loc_mgr.get_location(loc_id)
        locations.append({
            "id": loc_id,
            "name": location.name,
            "parent_id": location.parent_id,
            "config": location.config,
        })

    connection.send_result(msg["id"], {"locations": locations})


@websocket_api.websocket_command({
    vol.Required("type"): "topomation/locations/update",
    vol.Required("location_id"): str,
    vol.Optional("name"): str,
    vol.Optional("parent_id"): str,
})
@callback
def handle_location_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle location update command."""
    coordinator: TopomationCoordinator = hass.data[DOMAIN][msg["config_entry_id"]]

    try:
        coordinator.loc_mgr.update_location(
            location_id=msg["location_id"],
            name=msg.get("name"),
            parent_id=msg.get("parent_id"),
        )
        connection.send_result(msg["id"], {"success": True})
    except Exception as err:
        connection.send_error(msg["id"], "update_failed", str(err))
```

### 1.3 Event Subscription Pattern

```python
@callback
def state_changed_listener(event: Event) -> None:
    """Handle HA state changes."""
    new_state = event.data.get("new_state")
    if new_state is None:
        return

    entity_id = new_state.entity_id

    # Get location mapping
    location_id = coordinator.entity_location_map.get(entity_id)
    if location_id is None:
        return

    # Translate to kernel Event
    if new_state.domain == "binary_sensor":
        kernel_event = Event(
            type="occupancy.signal",
            source="ha",
            location_id=location_id,
            entity_id=entity_id,
            payload={
                "event_type": "trigger" if new_state.state == "on" else "clear",
                "source_id": entity_id,
                "device_class": new_state.attributes.get("device_class"),
            }
        )
        event_bus.publish(kernel_event)


# Subscribe to HA events
remove_listener = hass.bus.async_listen(
    EVENT_STATE_CHANGED,
    state_changed_listener
)
```

### 1.4 Entity Pattern

```python
class OccupancyBinarySensor(CoordinatorEntity, BinarySensorEntity):
    """Binary sensor for occupancy state."""

    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY
    _attr_has_entity_name = True

    def __init__(self, coordinator: TopomationCoordinator, location_id: str) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._location_id = location_id
        self._attr_unique_id = f"{DOMAIN}_{location_id}_occupancy"

        location = coordinator.loc_mgr.get_location(location_id)
        self._attr_name = f"{location.name} Occupancy"

    @property
    def is_on(self) -> bool:
        """Return true if occupied."""
        state = self.coordinator.occupancy_module.get_state(self._location_id)
        return state.occupied if state else False

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return entity attributes."""
        state = self.coordinator.occupancy_module.get_state(self._location_id)
        if not state:
            return {}

        return {
            "confidence": state.confidence,
            "holds": len(state.holds),
            "expires_at": state.expires_at.isoformat() if state.expires_at else None,
        }

    async def async_added_to_hass(self) -> None:
        """Subscribe to kernel events."""
        await super().async_added_to_hass()

        @callback
        def handle_occupancy_changed(event: Event) -> None:
            if event.data.get("location_id") == self._location_id:
                self.async_write_ha_state()

        self._unsubscribe = self.coordinator.event_bus.subscribe(
            "occupancy.changed",
            handle_occupancy_changed
        )

    async def async_will_remove_from_hass(self) -> None:
        """Unsubscribe from kernel events."""
        if self._unsubscribe:
            self._unsubscribe()
        await super().async_will_remove_from_hass()
```

---

## 3. Event Translation Patterns

### 2.1 Platform → Kernel Translation

**Motion Sensor**:

```python
@callback
def translate_motion_sensor(ha_state: State) -> Event | None:
    """Translate motion sensor state to kernel event."""
    if ha_state.domain != "binary_sensor":
        return None

    if ha_state.attributes.get("device_class") != "motion":
        return None

    return Event(
        type="sensor.motion",
        data={
            "location_id": get_location_for_entity(ha_state.entity_id),
            "entity_id": ha_state.entity_id,
            "detected": ha_state.state == "on",
            "timestamp": ha_state.last_changed,
        }
    )
```

**Dimmer/Light**:

```python
@callback
def translate_light(ha_state: State) -> Event | None:
    """Translate light state to kernel event."""
    if ha_state.domain != "light":
        return None

    # Normalize brightness (0-255 → 0.0-1.0)
    brightness = ha_state.attributes.get("brightness", 0)
    normalized_brightness = brightness / 255.0 if ha_state.state == "on" else 0.0

    return Event(
        type="light.state_changed",
        data={
            "location_id": get_location_for_entity(ha_state.entity_id),
            "entity_id": ha_state.entity_id,
            "on": ha_state.state == "on",
            "brightness": normalized_brightness,
        }
    )
```

### 2.2 Kernel → Platform Translation

**Occupancy Changed → Entity Update**:

```python
@callback
def handle_occupancy_changed(event: Event) -> None:
    """Handle occupancy.changed event from kernel."""
    location_id = event.data["location_id"]

    # Find entity
    entity_id = f"binary_sensor.{DOMAIN}_{location_id}_occupancy"
    entity = hass.data[DOMAIN]["entities"].get(entity_id)

    if entity:
        # Trigger state update
        entity.async_write_ha_state()
```

---

## 4. Timeout Coordination Pattern

The kernel is time-agnostic. The integration schedules timeout checks:

```python
class TopomationCoordinator:
    """Coordinates timeout scheduling for kernel modules."""

    def __init__(
        self,
        hass: HomeAssistant,
        event_bus: EventBus,
        occupancy_module: OccupancyModule,
    ) -> None:
        """Initialize coordinator."""
        self.hass = hass
        self.event_bus = event_bus
        self.occupancy_module = occupancy_module
        self._remove_timeout_listener: Callable | None = None

    def schedule_next_timeout(self) -> None:
        """Schedule the next timeout check."""
        # Cancel existing
        if self._remove_timeout_listener:
            self._remove_timeout_listener()
            self._remove_timeout_listener = None

        # Get next timeout from module
        next_timeout = self.occupancy_module.get_next_timeout()
        if next_timeout is None:
            return

        # Schedule HA callback
        self._remove_timeout_listener = async_track_point_in_time(
            self.hass,
            self._handle_timeout,
            next_timeout,
        )

    @callback
    def _handle_timeout(self, now: datetime) -> None:
        """Handle timeout expiration."""
        # Call kernel to process expirations
        self.occupancy_module.check_timeouts(now)

        # Reschedule for next timeout
        self.schedule_next_timeout()

    def stop(self) -> None:
        """Stop timeout scheduling."""
        if self._remove_timeout_listener:
            self._remove_timeout_listener()
            self._remove_timeout_listener = None
```

---

## 5. Location Type Metadata Pattern

The kernel is type-agnostic. Store type/icon metadata via `_meta` module:

```python
# Set location type metadata
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "room",
        "category": "kitchen",
        "icon": "mdi:silverware-fork-knife",
        "floor": 1,
    }
)

# Get metadata for UI
meta_config = loc_mgr.get_module_config("kitchen", "_meta")
icon = meta_config.get("icon", "mdi:floor-plan")
```

**Standard Location Types**:

- `building` - Top-level building
- `floor` - Floor/level
- `room` - Room (kitchen, bedroom, etc.)
- `zone` - Zone within room (desk area, TV area)

**Standard Categories** (for rooms):

- `kitchen`, `bedroom`, `bathroom`, `living_room`, `office`, `hallway`, `garage`, `outdoor`

---

## 6. Frontend Development Patterns

### 5.1 Lit Component Pattern

```typescript
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant } from "custom-card-helpers";

@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedId?: string;

  @state() private _locations: Location[] = [];

  static styles = css`
    :host {
      display: block;
      background: var(--card-background-color);
      border-radius: var(--ha-card-border-radius);
    }

    .location {
      padding: 8px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--divider-color);
    }

    .location:hover {
      background: var(--secondary-background-color);
    }

    .location.selected {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._fetchLocations();
  }

  private async _fetchLocations() {
    const result = await this.hass.callWS({
      type: "topomation/locations/list",
    });
    this._locations = result.locations;
  }

  private _handleLocationClick(locationId: string) {
    this.dispatchEvent(
      new CustomEvent("location-selected", {
        detail: { locationId },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="tree">
        ${this._locations.map(
          (location) => html`
            <div
              class="location ${location.id === this.selectedId
                ? "selected"
                : ""}"
              @click=${() => this._handleLocationClick(location.id)}
            >
              <ha-icon icon=${location.icon || "mdi:floor-plan"}></ha-icon>
              <span>${location.name}</span>
            </div>
          `
        )}
      </div>
    `;
  }
}
```

### 5.2 State Management Pattern

```typescript
@customElement("topomation-panel")
export class TopomationPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _locations: Location[] = [];
  @state() private _selectedLocationId?: string;

  private _unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this._fetchData();
    this._subscribeUpdates();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  private async _fetchData() {
    const result = await this.hass.callWS({
      type: "topomation/locations/list",
    });
    this._locations = result.locations;
  }

  private async _subscribeUpdates() {
    this._unsubscribe = await this.hass.connection.subscribeEvents((event) => {
      // Handle real-time updates
      if (event.event_type === "home_topology_location_changed") {
        this._fetchData(); // Re-fetch on changes
      }
    }, "home_topology_location_changed");
  }

  private async _handleSave(location: Partial<Location>) {
    try {
      // Optimistic update
      const oldLocations = [...this._locations];
      this._updateLocalState(location);

      // Send to backend
      await this.hass.callWS({
        type: "topomation/locations/update",
        location_id: location.id,
        ...location,
      });
    } catch (err) {
      // Rollback on error
      this._locations = oldLocations;
      showErrorDialog(this, { message: "Failed to save location" });
    }
  }
}
```

### 5.3 Tree Component with Keyboard Navigation

```typescript
@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  @property() public selectedId?: string;
  @state() private _focusedIndex = 0;

  private _handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this._focusedIndex = Math.min(
          this._focusedIndex + 1,
          this._locations.length - 1
        );
        this._scrollToFocused();
        break;

      case "ArrowUp":
        e.preventDefault();
        this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
        this._scrollToFocused();
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        this._selectFocused();
        break;
    }
  }

  render() {
    return html`
      <div
        class="tree"
        role="tree"
        tabindex="0"
        @keydown=${this._handleKeyDown}
      >
        ${this._locations.map((location, index) =>
          this._renderLocation(location, index)
        )}
      </div>
    `;
  }

  private _renderLocation(location: Location, index: number) {
    const isFocused = index === this._focusedIndex;
    const isSelected = location.id === this.selectedId;

    return html`
      <div
        role="treeitem"
        aria-selected=${isSelected}
        class="location ${isFocused ? "focused" : ""} ${isSelected
          ? "selected"
          : ""}"
        data-index=${index}
      >
        ${location.name}
      </div>
    `;
  }
}
```

---

## 7. Testing Strategy

### 6.1 Unit Tests

Test integration logic in isolation:

```python
"""Test event translation."""
import pytest
from homeassistant.core import State
from custom_components.home_topology.event_bridge import translate_motion_sensor


def test_translate_motion_sensor_on():
    """Test motion sensor ON translation."""
    state = State(
        "binary_sensor.kitchen_motion",
        "on",
        {"device_class": "motion"},
    )

    event = translate_motion_sensor(state)

    assert event is not None
    assert event.type == "sensor.motion"
    assert event.data["detected"] is True


def test_translate_motion_sensor_ignores_non_motion():
    """Test that non-motion sensors are ignored."""
    state = State(
        "binary_sensor.door",
        "on",
        {"device_class": "door"},
    )

    event = translate_motion_sensor(state)

    assert event is None
```

### 6.2 Integration Tests

Test with real kernel:

```python
"""Test full flow with kernel."""
import pytest
from homeassistant.core import HomeAssistant
from home_topology import EventBus, LocationManager
from custom_components.home_topology import async_setup_entry


async def test_motion_triggers_occupancy(hass: HomeAssistant):
    """Test that HA motion event triggers kernel occupancy."""
    # Setup integration
    entry = MockConfigEntry(domain=DOMAIN, data={})
    assert await async_setup_entry(hass, entry)

    coordinator = hass.data[DOMAIN][entry.entry_id]

    # Map entity to location
    coordinator.entity_location_map["binary_sensor.kitchen_motion"] = "kitchen"

    # Trigger HA state change
    hass.states.async_set(
        "binary_sensor.kitchen_motion",
        "on",
        {"device_class": "motion"},
    )
    await hass.async_block_till_done()

    # Check kernel state
    state = coordinator.occupancy_module.get_state("kitchen")
    assert state.occupied is True

    # Check HA entity
    entity_state = hass.states.get("binary_sensor.home_topology_kitchen_occupancy")
    assert entity_state.state == "on"
```

### 6.3 Manual Testing

```bash
# 1. Symlink into HA config
cd /path/to/home-assistant/config
ln -s /workspaces/topomation-ha/custom_components/topomation \
      custom_components/topomation

# 2. Restart HA
ha core restart

# 3. Check logs
tail -f home-assistant.log | grep home_topology

# 4. Test in browser
# Navigate to http://localhost:8123/topomation
```

---

## 8. Commit Standards

### Format

```
<type>(<scope>): <subject>

<body>

Updated docs/work-tracking.md: [task status]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance
- `ui` - Frontend changes

### Scopes

- `kernel` - Kernel integration
- `event-bridge` - Event translation
- `coordinator` - Timeout coordination
- `websocket` - WebSocket API
- `ui` - Frontend
- `docs` - Documentation

### Examples

```
feat(event-bridge): translate motion sensor events to kernel

Implemented HA state_changed listener that normalizes motion
sensor states and publishes to EventBus. Supports binary_sensor
entities with device_class="motion".

Updated docs/work-tracking.md: event-bridge marked complete
```

```
ui(tree): add keyboard navigation to location tree

Added arrow key navigation and Enter/Space selection.
Implements ARIA tree role with proper treeitem children.

Updated docs/work-tracking.md: tree-keyboard task complete
```

---

## 9. Complete File Organization

```
topomation/
├── custom_components/
│   └── topomation/
│       ├── __init__.py              # Integration entry point
│       ├── config_flow.py           # Setup wizard UI
│       ├── const.py                 # Constants and defaults
│       ├── coordinator.py           # Timeout scheduling coordinator
│       ├── event_bridge.py          # HA → kernel event translation
│       ├── binary_sensor.py         # Occupancy binary sensors
│       ├── sensor.py                # Confidence/debug sensors
│       ├── services.yaml            # Service definitions
│       ├── panel.py                 # Panel registration
│       ├── websocket_api.py         # WebSocket API handlers
│       ├── manifest.json            # Integration metadata
│       ├── strings.json             # UI strings and translations
│       ├── translations/
│       │   └── en.json              # English translations
│       └── frontend/
│           ├── topomation-panel.ts       # Main panel component
│           ├── ht-location-tree.ts          # Tree view
│           ├── ht-location-inspector.ts     # Details panel
│           ├── ht-entity-config-dialog.ts   # Entity mapping dialog
│           ├── ht-location-dialog.ts        # Add/edit location
│           ├── types.ts                     # TypeScript types
│           └── styles.ts                    # Shared styles
│
├── docs/
│   ├── cursor-guide.md          # This file (detailed patterns)
│   ├── architecture.md          # Integration architecture
│   ├── coding-standards.md      # Code style guide
│   ├── adr-log.md               # Architecture decision records
│   └── work-tracking.md         # Project status and tasks
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Pytest fixtures
│   ├── test_init.py             # Integration setup tests
│   ├── test_event_bridge.py    # Event translation tests
│   ├── test_coordinator.py     # Timeout coordination tests
│   ├── test_binary_sensor.py   # Entity tests
│   └── test_websocket_api.py   # WebSocket API tests
│
├── .cursorrules                 # AI pair programming rules
├── .gitignore
├── .ruff.toml                   # Ruff linter config
├── pyproject.toml               # Python project config
├── Makefile                     # Common tasks
├── README.md                    # Project overview
├── CHANGELOG.md                 # Version history
├── LICENSE                      # MIT License
└── hacs.json                    # HACS integration metadata
```

---

## Need More Detail?

- **Home Assistant Docs**: https://developers.home-assistant.io/
- **Lit Documentation**: https://lit.dev/docs/
- **Core Library Docs**: `/workspaces/topomation/docs/`

---

**Remember: This integration is a translator and router. All behavior logic lives in the kernel.**
