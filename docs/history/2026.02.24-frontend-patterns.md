# Frontend Implementation Patterns

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: Advanced patterns and best practices for building high-performance custom panels in Home Assistant

> **Companion Document**: This document complements `ui-design.md` by providing deep implementation patterns, performance optimizations, and architectural insights. Read `ui-design.md` first for the UI specification.

---

## 1. Performance Optimization

### 1.1 The Critical `shouldUpdate` Pattern

**Problem**: The `hass` object is replaced entirely on EVERY state change in Home Assistant. If any sensor updates anywhere in the system, your component receives a new `hass` reference. Naive implementations that re-render on every `hass` update will suffer catastrophic performance degradation.

**Solution**: Implement granular update filtering using Lit's `shouldUpdate` lifecycle method.

```typescript
@customElement("ht-location-inspector")
export class HtLocationInspector extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) location?: Location;

  /**
   * CRITICAL: Only re-render if data we actually display has changed.
   * Without this, the inspector re-renders every time ANY entity in HA changes state.
   */
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    // Always update if our direct properties changed
    if (changedProps.has("location")) {
      return true;
    }

    // For hass updates, only re-render if relevant registry data changed
    if (changedProps.has("hass")) {
      const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
      if (!oldHass) return true;

      // Check if entities we display have changed
      const relevantEntities = this.location?.entity_ids || [];
      for (const entityId of relevantEntities) {
        if (oldHass.states[entityId] !== this.hass.states[entityId]) {
          return true;
        }
      }

      // Check if area registry changed (if we display area data)
      if (oldHass.areas !== this.hass.areas) {
        return true;
      }

      // hass changed but nothing we care about changed
      return false;
    }

    return true;
  }
}
```

**Impact**: This pattern prevents the drag-and-drop interface from "stuttering" or resetting as unrelated state changes trigger re-renders during user interaction.

**Where to Use**:

- **Main Panel**: Check if `areas` or `device_registry` changed
- **Tree Component**: Check if locations or selected location changed
- **Inspector**: Check if displayed entities changed
- **Dialogs**: Usually don't need (short-lived)

---

### 1.2 List Virtualization

**Problem**: Rendering hundreds of devices in a scrollable list creates hundreds of DOM nodes, causing sluggish scrolling and high memory usage.

**Solution**: Use `lit-virtualizer` to render only visible items.

```typescript
import { LitVirtualizer } from "@lit-labs/virtualizer";

@customElement("ht-device-palette")
export class HtDevicePalette extends LitElement {
  @property({ attribute: false }) devices: Device[] = [];

  render() {
    return html`
      <div class="palette-container">
        <lit-virtualizer
          .items=${this.devices}
          .renderItem=${(device: Device) => html`
            <div class="device-item" draggable="true">
              <ha-icon .icon=${device.icon}></ha-icon>
              <span>${device.name}</span>
            </div>
          `}
        ></lit-virtualizer>
      </div>
    `;
  }
}
```

**When Needed**:

- Device palette with >50 items
- Entity picker with >100 entities
- Large location trees (>50 locations)

**Trade-offs**:

- Adds complexity
- May interfere with drag-and-drop (test thoroughly)
- Only worth it for large lists

---

### 1.3 Client-Side Filtering

**Pattern**: Filter large datasets in-memory for instant feedback, not via API calls.

```typescript
@state() private _searchTerm = '';
@state() private _allDevices: Device[] = [];

private get _filteredDevices(): Device[] {
  if (!this._searchTerm) return this._allDevices;

  const lower = this._searchTerm.toLowerCase();
  return this._allDevices.filter(device =>
    device.name.toLowerCase().includes(lower) ||
    device.entity_id.toLowerCase().includes(lower) ||
    device.area?.toLowerCase().includes(lower)
  );
}

render() {
  return html`
    <ha-textfield
      .value=${this._searchTerm}
      @input=${(e: Event) => this._searchTerm = (e.target as HTMLInputElement).value}
      placeholder="Search devices..."
    ></ha-textfield>

    ${this._filteredDevices.map(device => this._renderDevice(device))}
  `;
}
```

**Benefits**:

- Zero network latency
- Instant visual feedback
- Works offline
- Reduces server load

---

## 2. Optimistic UI with Rollback (Flux Pattern)

**Problem**: Waiting for server confirmation after drag-and-drop makes the UI feel sluggish. Users expect instant visual feedback.

**Solution**: Update UI immediately (optimistically), then rollback if server rejects.

### 2.1 The Data Flow Cycle

```
1. User Interaction
   ↓
2. Optimistic UI Update (local state)
   ↓
3. Dispatch WebSocket Command
   ↓
4. Server Validation
   ↓
5. Broadcast Confirmation or Error
   ↓
6. Confirm or Rollback
```

### 2.2 Implementation Pattern

```typescript
@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) locations: Location[] = [];
  @state() private _pendingMoves = new Map<string, PendingMove>();

  private async _handleDrop(evt: SortableEvent) {
    const locationId = evt.item.dataset.locationId!;
    const newParentId = evt.to.dataset.parentId;
    const newIndex = evt.newIndex!;

    // 1. OPTIMISTIC: Update UI immediately
    const originalLocations = [...this.locations];
    this.locations = this._moveLocation(locationId, newParentId, newIndex);

    // Track pending change
    this._pendingMoves.set(locationId, {
      originalParent: evt.from.dataset.parentId,
      originalIndex: evt.oldIndex!,
    });

    try {
      // 2. DISPATCH: Send to server
      await this.hass.callWS({
        type: "home_topology/locations/reorder",
        location_id: locationId,
        new_parent_id: newParentId,
        new_index: newIndex,
      });

      // 3. SUCCESS: Confirm (clear pending state)
      this._pendingMoves.delete(locationId);
    } catch (error) {
      // 4. FAILURE: Rollback to original state
      this.locations = originalLocations;
      this._pendingMoves.delete(locationId);

      // Show error toast
      showToast(this, {
        message: `Failed to move location: ${error.message}`,
        type: "error",
      });
    }
  }
}
```

### 2.3 Visual Feedback for Pending Changes

```typescript
render() {
  return html`
    ${this.locations.map(loc => html`
      <div class="tree-node ${this._pendingMoves.has(loc.id) ? 'pending' : ''}">
        ${this._pendingMoves.has(loc.id) ? html`
          <ha-circular-progress size="small"></ha-circular-progress>
        ` : ''}
        ${loc.name}
      </div>
    `)}
  `;
}
```

**CSS**:

```css
.tree-node.pending {
  opacity: 0.6;
  pointer-events: none; /* Prevent interaction during save */
}
```

---

## 3. Drag-and-Drop with SortableJS

### 3.1 Shadow DOM Integration

**Challenge**: SortableJS manipulates the DOM directly. Lit uses Shadow DOM. Styles and drag mirrors need careful handling.

**Solution**: Proper lifecycle hooks and configuration.

```typescript
import Sortable from "sortablejs";

@customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  private _sortable?: Sortable;

  /**
   * CRITICAL: Initialize SortableJS in firstUpdated, NOT connectedCallback.
   * The DOM nodes don't exist until after first render.
   */
  protected firstUpdated() {
    const container = this.shadowRoot!.querySelector(".tree-container");
    if (!container) return;

    this._sortable = Sortable.create(container as HTMLElement, {
      animation: 150,
      handle: ".drag-handle", // Only drag from handle
      ghostClass: "sortable-ghost", // Placeholder class
      dragClass: "sortable-drag", // Dragging element class
      fallbackOnBody: true, // Append drag mirror to body (escapes shadow DOM)
      swapThreshold: 0.65,

      // Validation
      onMove: (evt) => this._validateMove(evt),

      // Commit
      onEnd: (evt) => this._handleDrop(evt),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // IMPORTANT: Clean up SortableJS instance
    this._sortable?.destroy();
  }
}
```

### 3.2 Handling Hierarchy Constraints

**Pattern**: Validate moves before committing to prevent nonsensical hierarchies.

```typescript
private _validateMove(evt: SortableEvent): boolean {
  const draggedType = evt.dragged.dataset.locationType;
  const targetType = evt.to.dataset.locationType;

  // Example: Can't drop a Floor into a Room
  const validMoves: Record<string, string[]> = {
    floor: ['root'],           // Floors can only go to root
    room: ['floor', 'suite'],  // Rooms can go to floors or suites
    zone: ['room'],            // Zones can only go to rooms
    suite: ['floor'],          // Suites can only go to floors
  };

  const allowedTargets = validMoves[draggedType!] || [];
  if (!allowedTargets.includes(targetType!)) {
    // Show visual feedback
    evt.to.classList.add('invalid-drop-target');
    return false;
  }

  return true;
}
```

**CSS for Feedback**:

```css
.invalid-drop-target {
  background-color: var(--error-color);
  opacity: 0.3;
  cursor: not-allowed;
}

.sortable-ghost {
  opacity: 0.4;
  background-color: var(--primary-color);
}
```

### 3.3 Disabling Updates During Drag

**Problem**: If Lit re-renders during a drag, the DOM structure changes and SortableJS loses track of the drag operation.

**Solution**: Temporarily disable Lit updates during active drag.

```typescript
@state() private _isDragging = false;

protected shouldUpdate(changedProps: PropertyValues): boolean {
  // CRITICAL: Don't re-render during active drag
  if (this._isDragging) {
    return false;
  }
  return super.shouldUpdate(changedProps);
}

private _setupSortable() {
  this._sortable = Sortable.create(container, {
    onStart: () => {
      this._isDragging = true;
    },
    onEnd: (evt) => {
      this._isDragging = false;
      this._handleDrop(evt);
    },
  });
}
```

---

## 4. Advanced Form Handling

### 4.1 Leveraging `ha-form`

**Advantage**: Instead of manually building entity pickers, icon selectors, and validation, use Home Assistant's schema-driven form system.

```typescript
const schema: HaFormSchema[] = [
  {
    name: 'entity_id',
    selector: {
      entity: {
        domain: 'binary_sensor',
        device_class: 'motion',
      },
    },
  },
  {
    name: 'timeout',
    selector: {
      number: {
        min: 1,
        max: 1440,
        unit_of_measurement: 'min',
      },
    },
  },
  {
    name: 'event_type',
    selector: {
      select: {
        options: [
          { value: 'trigger', label: 'Trigger' },
          { value: 'clear', label: 'Clear' },
          { value: 'none', label: 'None' },
        ],
      },
    },
  },
];

render() {
  return html`
    <ha-form
      .hass=${this.hass}
      .data=${this._config}
      .schema=${schema}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._handleValueChanged}
    ></ha-form>
  `;
}

private _computeLabel = (schema: HaFormSchema) => {
  const labels: Record<string, string> = {
    entity_id: 'Motion Sensor',
    timeout: 'Timeout',
    event_type: 'Event Type',
  };
  return labels[schema.name] || schema.name;
};

private _handleValueChanged(ev: CustomEvent) {
  this._config = ev.detail.value;
  // Dispatch to parent
  this.dispatchEvent(new CustomEvent('config-changed', {
    detail: { config: this._config },
  }));
}
```

**Benefits**:

- Automatic validation
- Native HA styling
- Entity picker with search, filtering, icons
- Theme-aware
- Accessible

### 4.2 Dynamic Schema Based on State

**Pattern**: Change form fields based on user selections.

```typescript
private _getSchema(): HaFormSchema[] {
  const baseSchema: HaFormSchema[] = [
    {
      name: 'mode',
      selector: {
        select: {
          options: [
            { value: 'any_change', label: 'Any Change' },
            { value: 'specific_states', label: 'Specific States' },
          ],
        },
      },
    },
  ];

  // Add conditional fields based on mode
  if (this._config.mode === 'specific_states') {
    baseSchema.push(
      {
        name: 'on_event',
        selector: {
          select: {
            options: [
              { value: 'trigger', label: 'Trigger' },
              { value: 'none', label: 'None' },
            ],
          },
        },
      },
      {
        name: 'on_timeout',
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: 'min',
          },
        },
      }
    );
  }

  return baseSchema;
}

render() {
  return html`
    <ha-form
      .schema=${this._getSchema()}
      .data=${this._config}
      ...
    ></ha-form>
  `;
}
```

---

## 5. Real-Time Updates via WebSocket

### 5.1 Subscription Pattern (Alarmo Style)

**Pattern**: Subscribe to push updates from backend for real-time UI sync across multiple clients.

```typescript
@customElement("home-topology-panel")
export class HomeTopologyPanel extends LitElement {
  private _unsubscribe?: Promise<() => void>;

  async connectedCallback() {
    super.connectedCallback();

    // Subscribe to topology updates
    this._unsubscribe = this.hass.connection.subscribeEvents(
      (event) => this._handleTopologyUpdate(event),
      "home_topology_updated"
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // IMPORTANT: Clean up subscription
    if (this._unsubscribe) {
      this._unsubscribe.then((unsub) => unsub());
    }
  }

  private _handleTopologyUpdate(event: any) {
    // Refresh data from server
    this._loadLocations();

    // Or apply incremental update if event has details
    if (event.data.location_id && event.data.changes) {
      this._applyUpdate(event.data);
    }
  }
}
```

**Backend Pattern** (Python):

```python
# After successful location update
hass.bus.async_fire(
    'home_topology_updated',
    {
        'location_id': location_id,
        'changes': changes,
        'timestamp': dt_util.utcnow().isoformat(),
    }
)
```

**Benefits**:

- Multi-user sync (User A's change appears instantly on User B's screen)
- No polling required
- Efficient (only sends when data changes)

---

## 6. Mobile & Responsive Design

### 6.1 Safe Area Insets (Notch & Gesture Bar)

**Problem**: On mobile devices, content can be obscured by the notch (iPhone X+) or gesture bar (modern Android).

**Solution**: Use CSS environment variables.

```css
:host {
  display: block;
  height: 100vh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Responsive Layout**:

```typescript
render() {
  return html`
    <div class="panel-container ${this.narrow ? 'mobile' : 'desktop'}">
      <div class="tree-panel ${this.narrow ? 'drawer' : 'sidebar'}">
        ...
      </div>
      <div class="inspector-panel">
        ...
      </div>
    </div>
  `;
}
```

```css
/* Desktop: Side-by-side */
.panel-container.desktop {
  display: flex;
  flex-direction: row;
}

.tree-panel.sidebar {
  width: 40%;
  min-width: 300px;
  max-width: 500px;
}

/* Mobile: Drawer overlay */
.panel-container.mobile {
  display: flex;
  flex-direction: column;
}

.tree-panel.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 80%;
  height: 100%;
  transform: translateX(-100%);
  transition: transform 0.3s;
  z-index: 1000;
}

.tree-panel.drawer.open {
  transform: translateX(0);
}
```

### 6.2 Touch-Friendly Targets

**Pattern**: Ensure interactive elements are at least 44x44px (iOS guidelines).

```css
.drag-handle,
.icon-button,
.tree-node {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Increase padding on mobile */
@media (max-width: 768px) {
  .tree-node {
    padding: 12px 16px; /* More generous touch target */
  }
}
```

---

## 7. Theming & Visual Consistency

### 7.1 Comprehensive CSS Variable List

**Always use HA theme variables**, never hard-coded colors:

```css
:host {
  /* Backgrounds */
  --panel-background: var(--primary-background-color);
  --card-background: var(--card-background-color);
  --sidebar-background: var(--sidebar-background-color);

  /* Text */
  --text-primary: var(--primary-text-color);
  --text-secondary: var(--secondary-text-color);
  --text-disabled: var(--disabled-text-color);

  /* Borders */
  --border-color: var(--divider-color);
  --border-radius: var(--ha-card-border-radius, 12px);

  /* Interactive */
  --primary-color: var(--primary-color);
  --accent-color: var(--accent-color);
  --error-color: var(--error-color);
  --success-color: var(--success-color);
  --warning-color: var(--warning-color);

  /* States */
  --occupied-color: var(--success-color);
  --vacant-color: var(--disabled-text-color);
  --locked-color: var(--warning-color);

  /* Spacing (from ui-design.md) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --tree-indent: 24px;

  /* Shadows */
  --card-shadow: var(--ha-card-box-shadow);
}
```

### 7.2 Dark Mode Support

**Automatic**: By using HA variables, dark mode works automatically. No additional code needed.

**Testing**:

```typescript
// Force dark mode for testing (dev only)
document.body.setAttribute("data-theme", "dark");
```

---

## 8. Accessibility Patterns

### 8.1 Keyboard Navigation in Trees

```typescript
private _handleKeyDown(e: KeyboardEvent) {
  const selectedId = this._selectedLocationId;
  if (!selectedId) return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      this._selectPrevious();
      break;
    case 'ArrowDown':
      e.preventDefault();
      this._selectNext();
      break;
    case 'ArrowRight':
      e.preventDefault();
      this._expandNode(selectedId);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      this._collapseNode(selectedId);
      break;
    case 'Enter':
      e.preventDefault();
      this._editNode(selectedId);
      break;
    case 'Delete':
      e.preventDefault();
      this._deleteNode(selectedId);
      break;
  }
}

render() {
  return html`
    <div
      class="tree-container"
      role="tree"
      @keydown=${this._handleKeyDown}
      tabindex="0"
    >
      ${this._renderNodes()}
    </div>
  `;
}
```

### 8.2 ARIA Labels for Icon Buttons

```typescript
render() {
  return html`
    <ha-icon-button
      .icon=${'mdi:pencil'}
      .label=${'Edit location'}
      @click=${this._handleEdit}
    ></ha-icon-button>
  `;
}
```

**Screen Reader Announcement**:

```typescript
private _announceChange(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = message;
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  document.body.appendChild(announcement);

  setTimeout(() => announcement.remove(), 1000);
}

// Usage
this._announceChange('Kitchen moved to First Floor');
```

---

## 9. Development & Debugging

### 9.1 Hot Module Replacement (HMR)

**Challenge**: True HMR is difficult with HA custom panels.

**Workflow**:

```bash
# Terminal 1: Run Vite in watch mode
cd /workspaces/home-topology-ha/custom_components/home_topology/frontend
npm run dev -- --watch

# Terminal 2: Monitor HA logs
tail -f /workspaces/core/config/home-assistant.log | grep home_topology
```

**Refresh Strategy**:

1. Save TypeScript file
2. Vite rebuilds (1-2 seconds)
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
4. No need to restart HA

### 9.2 Debug Mode

```typescript
@customElement("home-topology-panel")
export class HomeTopologyPanel extends LitElement {
  private DEBUG = window.location.search.includes("debug=true");

  private _log(...args: any[]) {
    if (this.DEBUG) {
      console.log("[HomeTopology]", ...args);
    }
  }

  private async _loadLocations() {
    this._log("Loading locations...");
    const result = await this.hass.callWS({
      type: "home_topology/locations/list",
    });
    this._log("Locations loaded:", result);
    return result;
  }
}
```

**Usage**: Navigate to `http://localhost:8123/home-topology?debug=true`

### 9.3 Source Maps

**Vite Config**:

```typescript
// vite.config.ts
export default {
  build: {
    sourcemap: true, // Enable source maps
  },
};
```

**Result**: Set breakpoints directly in TypeScript source files in Chrome DevTools.

---

## 10. Reference Implementations

Study these Home Assistant frontend patterns before implementing complex features:

| Feature                  | HA Reference Path                           | What to Learn                           |
| ------------------------ | ------------------------------------------- | --------------------------------------- |
| **Tree/List Management** | `src/panels/config/areas/`                  | Similar CRUD pattern, card-based layout |
| **Complex Forms**        | `src/panels/config/automation/`             | Nested schemas, conditional fields      |
| **Entity Picker**        | `src/components/entity/ha-entity-picker.ts` | Filtered selection, search UX           |
| **Drag & Drop**          | `src/panels/lovelace/editor/`               | SortableJS integration                  |
| **Dialog Pattern**       | `src/dialogs/`                              | Focus management, lifecycle             |
| **Schema Rendering**     | `src/components/ha-form/`                   | Dynamic form generation                 |
| **List Virtualization**  | `src/panels/config/integrations/`           | Large list performance                  |

**How to Study**:

1. Clone HA frontend repo:

```bash
git clone https://github.com/home-assistant/frontend.git
cd frontend
```

2. Search for patterns:

```bash
grep -r "Sortable.create" src/
grep -r "shouldUpdate" src/panels/config/
grep -r "ha-form" src/components/
```

3. Read and adapt patterns to your use case

---

## 11. Performance Checklist

Before shipping, verify:

- [ ] `shouldUpdate` implemented in all components that receive `hass`
- [ ] List virtualization used for lists >50 items
- [ ] Client-side filtering for instant search
- [ ] Optimistic UI updates with rollback for drag-and-drop
- [ ] WebSocket subscriptions cleaned up in `disconnectedCallback`
- [ ] SortableJS instances destroyed on unmount
- [ ] No anonymous functions in render templates (causes re-renders)
- [ ] Large data fetched once and cached, not on every render
- [ ] debounce/throttle used for rapid events (scroll, input)

---

## 12. Common Pitfalls

### 12.1 Anonymous Functions in Templates

**❌ Bad**: Creates new function on every render, breaking memoization

```typescript
render() {
  return html`
    <button @click=${() => this._handleClick(item.id)}>
      Click
    </button>
  `;
}
```

**✅ Good**: Bind once or use event delegation

```typescript
render() {
  return html`
    <button
      data-id=${item.id}
      @click=${this._handleClick}
    >
      Click
    </button>
  `;
}

private _handleClick(e: Event) {
  const id = (e.target as HTMLElement).dataset.id;
  this._doSomething(id);
}
```

### 12.2 Forgetting to Clean Up

**❌ Bad**: Subscription leak

```typescript
connectedCallback() {
  super.connectedCallback();
  this.hass.connection.subscribeEvents(this._handler, 'event_type');
}
```

**✅ Good**: Store unsubscribe function

```typescript
private _unsubscribe?: Promise<() => void>;

connectedCallback() {
  super.connectedCallback();
  this._unsubscribe = this.hass.connection.subscribeEvents(
    this._handler,
    'event_type'
  );
}

disconnectedCallback() {
  super.disconnectedCallback();
  if (this._unsubscribe) {
    this._unsubscribe.then(unsub => unsub());
  }
}
```

### 12.3 Mutating Props

**❌ Bad**: Mutating prop breaks reactivity

```typescript
@property({ attribute: false }) location!: Location;

private _update() {
  this.location.name = 'New Name';  // WRONG: Mutating prop
}
```

**✅ Good**: Create new object

```typescript
private _update() {
  this.location = {
    ...this.location,
    name: 'New Name',
  };
  // Dispatch to parent to update source of truth
  this.dispatchEvent(new CustomEvent('location-changed', {
    detail: { location: this.location },
  }));
}
```

---

## 13. Next-Level Patterns

### 13.1 Undo/Redo Stack

```typescript
@customElement("home-topology-panel")
export class HomeTopologyPanel extends LitElement {
  @state() private _undoStack: Location[][] = [];
  @state() private _redoStack: Location[][] = [];

  private _recordState() {
    this._undoStack.push([...this.locations]);
    this._redoStack = []; // Clear redo on new action
    // Limit stack size
    if (this._undoStack.length > 50) {
      this._undoStack.shift();
    }
  }

  private _undo() {
    if (this._undoStack.length === 0) return;

    this._redoStack.push([...this.locations]);
    this.locations = this._undoStack.pop()!;
  }

  private _redo() {
    if (this._redoStack.length === 0) return;

    this._undoStack.push([...this.locations]);
    this.locations = this._redoStack.pop()!;
  }
}
```

**Keyboard Shortcuts**:

```typescript
@keydown=${(e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    this._undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    this._redo();
  }
}}
```

### 13.2 Batch Updates

**Pattern**: Collect multiple changes, debounce, save once.

```typescript
private _pendingChanges = new Map<string, Partial<Location>>();
private _saveTimer?: number;

private _queueChange(locationId: string, changes: Partial<Location>) {
  const existing = this._pendingChanges.get(locationId) || {};
  this._pendingChanges.set(locationId, { ...existing, ...changes });

  // Debounce save
  clearTimeout(this._saveTimer);
  this._saveTimer = window.setTimeout(() => this._flushChanges(), 1000);
}

private async _flushChanges() {
  const changes = Array.from(this._pendingChanges.entries());
  this._pendingChanges.clear();

  await Promise.all(
    changes.map(([id, change]) =>
      this.hass.callWS({
        type: 'home_topology/locations/update',
        location_id: id,
        changes: change,
      })
    )
  );
}
```

---

## Conclusion

These patterns, when applied correctly, result in a custom panel that:

- **Performs like native HA** (60fps, instant feedback)
- **Scales to large deployments** (hundreds of entities)
- **Works seamlessly on mobile** (safe areas, touch targets)
- **Feels professional** (theming, accessibility)
- **Is maintainable** (clean patterns, no memory leaks)

**Key Takeaways**:

1. **Always filter `hass` updates** in `shouldUpdate`
2. **Use optimistic UI** for drag-and-drop
3. **Leverage `ha-form`** instead of building custom forms
4. **Subscribe to real-time events** for multi-user sync
5. **Test on mobile** with safe areas
6. **Study HA reference implementations** before reinventing

---

**Document Status**: Active
**Last Updated**: 2025-12-09
**Maintainer**: Mike
**Related Docs**: `ui-design.md`, `architecture.md`, `coding-standards.md`
