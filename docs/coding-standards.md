# Coding Standards for topomation

> Standards specific to the Home Assistant integration. For core kernel standards, see [home-topology coding standards](https://github.com/mjcumming/topomation/blob/main/docs/coding-standards.md).

---

## 1. Language-Specific Standards

This integration uses **two languages**:

- **Python**: Backend integration (event bridge, coordinator, entities)
- **TypeScript/Lit**: Frontend panel (UI components)

---

## 2. Python Standards (Backend)

### 2.1 Home Assistant Conventions

We follow **Home Assistant's coding standards**:

- PEP 8 via `ruff` and `black`
- Async/await for all I/O
- Type hints on all functions
- Use `@callback` decorator for synchronous event handlers

### 2.2 File Naming

```
custom_components/topomation/
├── __init__.py          # Integration setup
├── event_bridge.py      # snake_case
├── coordinator.py
└── binary_sensor.py
```

### 2.3 Import Order

```python
# 1. Future imports (required for HA)
from __future__ import annotations

# 2. Standard library
import logging
from datetime import datetime, UTC
from typing import TYPE_CHECKING, Any

# 3. Home Assistant
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.components.binary_sensor import BinarySensorEntity

# 4. Third-party (home-topology kernel)
from home_topology import LocationManager, EventBus, Event
from home_topology.modules.occupancy import OccupancyModule

# 5. Local integration
from .const import DOMAIN
```

### 2.4 Type Hints

**Required for all functions**:

```python
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from config entry."""
    pass

@callback
def state_changed_listener(event: HA_Event) -> None:
    """Handle HA state changes."""
    pass

def translate_state(entity_id: str, state: State) -> Event | None:
    """Translate HA state to kernel event."""
    pass
```

### 2.5 Async/Await

**All I/O operations must be async**:

```python
# ✅ Good
async def save_config(hass: HomeAssistant, data: dict) -> None:
    """Save config to storage."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    await store.async_save(data)

# ❌ Bad
def save_config(hass: HomeAssistant, data: dict) -> None:
    """Save config to storage."""
    with open("file.json", "w") as f:  # Blocking I/O!
        json.dump(data, f)
```

### 2.6 Callback Decorator

Use `@callback` for synchronous event handlers:

```python
from homeassistant.core import callback

@callback
def on_occupancy_changed(event: Event) -> None:
    """Handle occupancy change (synchronous)."""
    # No await calls allowed in here
    self._attr_is_on = event.payload["occupied"]
    self.async_write_ha_state()
```

### 2.7 Logging

```python
import logging

_LOGGER = logging.getLogger(__name__)

# Usage
_LOGGER.debug("Processing event for %s", entity_id)
_LOGGER.info("Occupancy changed: %s → %s", location_id, state)
_LOGGER.warning("Entity %s not found in location map", entity_id)
_LOGGER.error("Failed to process event: %s", exc, exc_info=True)
```

### 2.8 Error Handling

```python
# ✅ Good: Specific exceptions, helpful messages
try:
    location = loc_mgr.get_location(location_id)
    if location is None:
        raise ValueError(f"Location {location_id} not found")
except ValueError as e:
    _LOGGER.error("Invalid location: %s", e)
    return None
except Exception as e:
    _LOGGER.exception("Unexpected error processing location %s", location_id)
    return None

# ❌ Bad: Bare except, silent swallow
try:
    location = loc_mgr.get_location(location_id)
except:
    pass  # What error? Where? Why?
```

---

## 3. TypeScript/Lit Standards (Frontend)

### 3.1 File Naming

```
frontend/
├── topomation-panel.ts      # kebab-case
├── ht-location-tree.ts
└── types.ts
```

### 3.2 Component Pattern

```typescript
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant } from "custom-card-helpers";

@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedId?: string;
  @state() private _expandedIds = new Set<string>();

  static styles = css`
    :host {
      display: block;
    }
    /* More styles */
  `;

  protected render() {
    return html`
      <div class="tree">
        ${this._locations.map((loc) => this._renderLocation(loc))}
      </div>
    `;
  }

  private _renderLocation(location: Location) {
    return html`<div>${location.name}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-location-tree": HtLocationTree;
  }
}
```

### 3.3 Naming Conventions

```typescript
// Properties (public API)
@property() selectedId?: string;  // camelCase

// State (private)
@state() private _expandedIds: Set<string>;  // underscore prefix

// Methods (private)
private _handleClick(): void  // underscore prefix

// Methods (public)
public selectLocation(id: string): void  // no underscore

// CSS classes
.location-tree {}  // kebab-case
```

### 3.4 Event Dispatching

```typescript
private _handleLocationSelected(locationId: string): void {
  // Dispatch custom event
  this.dispatchEvent(
    new CustomEvent('location-selected', {
      detail: { locationId },
      bubbles: true,
      composed: true,
    })
  );
}
```

### 3.5 WebSocket API Calls

```typescript
async function fetchLocations(hass: HomeAssistant): Promise<Location[]> {
  const result = await hass.callWS<{ locations: Location[] }>({
    type: "topomation/locations/list",
  });
  return result.locations;
}

async function reorderLocation(
  hass: HomeAssistant,
  location_id: string,
  new_parent_id: string | null,
  new_index: number
): Promise<{ success: boolean; parent_id: string | null }> {
  const result = await hass.callWS<{ success: boolean; parent_id: string | null }>({
    type: "topomation/locations/reorder",
    location_id,
    new_parent_id,
    new_index,
  });
  return result;
}
```

### 3.6 TypeScript Types

```typescript
// types.ts
export interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  is_explicit_root: boolean;
  ha_area_id?: string;
  entity_ids: string[];
  modules: Record<string, ModuleConfig>;
}

export interface ModuleConfig {
  version: number;
  enabled: boolean;
  [key: string]: any;
}

export type LocationType =
  | "floor"
  | "area";
```

### 3.7 Accessibility

```typescript
protected render() {
  return html`
    <div role="tree" aria-label="Location hierarchy">
      ${this._locations.map(loc => html`
        <div
          role="treeitem"
          aria-expanded="${this._expandedIds.has(loc.id)}"
          aria-selected="${loc.id === this.selectedId}"
          tabindex="${loc.id === this.selectedId ? 0 : -1}"
        >
          ${loc.name}
        </div>
      `)}
    </div>
  `;
}
```

---

## 4. Testing Standards

### 4.1 Python Tests

```python
# tests/test_event_bridge.py
import pytest
from unittest.mock import Mock
from homeassistant.core import HomeAssistant

from custom_components.home_topology.event_bridge import EventBridge

def test_translate_motion_sensor_on():
    """Test motion sensor ON translation."""
    # Arrange
    hass = Mock(spec=HomeAssistant)
    bridge = EventBridge(hass, mock_bus, mock_loc_mgr)

    # Act
    event = bridge.translate_state("binary_sensor.motion", "on")

    # Assert
    assert event.type == "occupancy.signal"
    assert event.payload["event_type"] == "trigger"
    assert event.payload["new_state"] == "on"
```

### 4.2 TypeScript Tests (Future)

```typescript
// tests/ht-location-tree.test.ts
import { fixture, html, expect } from "@open-wc/testing";
import "../frontend/ht-location-tree";
import type { HtLocationTree } from "../frontend/ht-location-tree";

describe("HtLocationTree", () => {
  it("renders locations", async () => {
    const el = await fixture<HtLocationTree>(html`
      <ht-location-tree .locations=${mockLocations}></ht-location-tree>
    `);

    expect(el.shadowRoot!.querySelectorAll(".location")).to.have.length(3);
  });
});
```

---

## 5. Documentation Standards

### 5.1 Docstrings (Python)

```python
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up home-topology from a config entry.

    Creates the kernel components (LocationManager, EventBus), imports HA areas
    as locations, attaches modules, and registers the UI panel.

    Args:
        hass: Home Assistant instance
        entry: Config entry for this integration

    Returns:
        True if setup succeeded, False otherwise

    Raises:
        ConfigEntryNotReady: If kernel initialization fails
    """
```

### 5.2 Comments (TypeScript)

```typescript
/**
 * Location tree component.
 *
 * Displays the location hierarchy as an expandable tree with drag-and-drop
 * reordering support (Phase 2).
 */
@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  // ...
}
```

---

## 6. Git Commit Standards

```
<type>(<scope>): <subject>

<body>

Updated docs/work-tracking.md: [task status]
```

### 6.1 Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `ui`: Frontend changes
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### 6.2 Scopes

- `kernel`: Kernel initialization
- `event-bridge`: Event translation
- `coordinator`: Timeout scheduling
- `websocket`: WebSocket API
- `ui`: Frontend components
- `docs`: Documentation

### 6.3 Examples

```
feat(event-bridge): translate motion sensor events to kernel

Implemented HA state_changed listener that normalizes motion
sensor states and publishes to EventBus.

Updated docs/work-tracking.md: event-bridge marked complete

---

ui(tree): add location tree component with keyboard navigation

Created ht-location-tree component with expand/collapse,
selection, and arrow key navigation.

Updated docs/work-tracking.md: tree component complete
```

---

## 7. Code Review Checklist

### 7.1 Python

- [ ] Type hints on all functions
- [ ] Async/await for all I/O
- [ ] `@callback` for synchronous handlers
- [ ] Proper error handling with logging
- [ ] No blocking calls
- [ ] Follows HA conventions

### 7.2 TypeScript

- [ ] Proper Lit decorators (`@property`, `@state`)
- [ ] Accessibility attributes
- [ ] Event dispatching with `bubbles` and `composed`
- [ ] No direct DOM manipulation
- [ ] Uses HA components (`ha-*`) where possible

### 7.3 General

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commit message follows format
- [ ] No linter errors
- [ ] Work tracking updated

---

## 8. Anti-Patterns to Avoid

### 8.1 Python

❌ **DON'T**:

- Implement behavior logic in integration (use kernel)
- Block the event loop
- Use `time.sleep()`
- Forget `@callback` on synchronous handlers
- Silently swallow exceptions

✅ **DO**:

- Translate events, don't process them
- Use async for I/O
- Log all errors with context
- Handle missing data gracefully

### 8.2 TypeScript

❌ **DON'T**:

- Mutate properties directly
- Use jQuery-style DOM manipulation
- Forget accessibility attributes
- Reinvent HA components

✅ **DO**:

- Use Lit reactive properties
- Use HA's `ha-*` components
- Implement keyboard navigation
- Dispatch custom events for communication

---

## 9. Tools Configuration

### 9.1 Python (`pyproject.toml`)

```toml
[tool.black]
line-length = 100
target-version = ["py311"]

[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "W", "I", "N", "UP", "ANN", "S", "B"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### 9.2 TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "lib": ["ES2021", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "experimentalDecorators": true
  },
  "include": ["frontend/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 10. Pre-commit Checks

```bash
# Python
black custom_components/
ruff check custom_components/
mypy custom_components/

# TypeScript (when build system added)
npm run lint
npm run typecheck

# Tests
pytest tests/
```

---

**Document Status**: Active
**Last Updated**: 2026-02-23
**Maintainer**: Mike
