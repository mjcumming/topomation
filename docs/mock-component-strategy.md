# Mock Component Strategy for Home Topology UI Development

**Version**: 1.0
**Date**: 2025-12-11
**Purpose**: Comprehensive mocking strategy for `ha-dialog`, `ha-form`, and other Home Assistant components in the mock harness and tests.

---

## 1. Why Mocking Is Required (Not Optional)

When developing a Home Assistant custom panel, we face a fundamental challenge: the components we use (`ha-form`, `ha-dialog`, `ha-entity-picker`, etc.) are tightly coupled to the Home Assistant runtime.

### 1.1 The Dependency Problem

```
ha-form
  └── requires hass.localize() for translations
  └── requires hass.states for entity pickers
  └── requires hass.services for action selectors
  └── uses nested Shadow DOM (ha-selector → ha-textfield → mwc-textfield)
  └── uses complex Polymer-era event patterns (value-changed)

ha-dialog
  └── wraps mwc-dialog from Material Web Components
  └── uses portal rendering (moves itself to <body>)
  └── complex focus trapping and scroll locking
  └── theme-aware styling from HA theme system
```

**In the mock harness (no HA runtime):**

- These components either don't exist, or fail immediately with missing dependencies
- Even if they load, they can't function without `hass` being fully populated
- Shadow DOM nesting makes testing fragile

### 1.2 The Solution: Functional Mocks

We create **functional mocks** that:

1. **Accept the same props** as the real components (`schema`, `data`, `open`, etc.)
2. **Fire the same events** with the same signatures (`value-changed`, `closed`, etc.)
3. **Render inline** (no portals) for predictable DOM structure
4. **Expose slots** so parent components can project content

This allows our panel code to run unchanged while we iterate on UI without needing HA.

---

## 2. Architectural Layers (Critical Context)

Home Topology has three distinct layers:

| Layer                                | Responsibility                                                                | Mock Strategy                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Kernel** (`home-topology`)         | Type-agnostic Location tree. No concept of floor/room/building.               | Not mocked (pure library)                                    |
| **Integration** (`home-topology-ha`) | Defines types via `modules._meta`, enforces hierarchy rules, maps to HA Areas | Our mock components                                          |
| **Home Assistant**                   | Areas (flat), Floors (optional), Zones (GPS geofences)                        | `mock-hass.ts` provides simulated `hass` object and `callWS` |

The mock harness simulates layers 2 and 3 so we can develop layer 2's UI.

---

## 3. Mock Component Reference

### 3.1 `MockHaDialog` (ha-dialog)

**Location**: `custom_components/home_topology/frontend/mock-ha-components.ts`

**What It Mocks**: The Home Assistant dialog wrapper around `mwc-dialog`.

**Key Contract**:
| Property | Type | Description |
|----------|------|-------------|
| `open` | Boolean | When true, dialog is visible |
| `heading` | String | Title displayed in header |

| Event    | When Fired                                                        | Payload |
| -------- | ----------------------------------------------------------------- | ------- |
| `opened` | When `open` changes from false → true                             | None    |
| `closed` | When `open` changes from true → false, or backdrop/escape clicked | None    |

| Slot              | Purpose                     |
| ----------------- | --------------------------- |
| (default)         | Main content                |
| `heading`         | Alternative to heading prop |
| `primaryAction`   | Save/Submit button          |
| `secondaryAction` | Cancel button               |

**Critical Implementation Details**:

```typescript
// MUST fire opened/closed synchronously on prop change
updated(changedProps: Map<string, any>) {
  if (changedProps.has("open")) {
    const wasOpen = changedProps.get("open");
    if (this.open && !wasOpen) {
      this.dispatchEvent(new CustomEvent("opened"));
    } else if (!this.open && wasOpen) {
      this.dispatchEvent(new CustomEvent("closed"));
    }
  }
}
```

**Why Inline Rendering**: The real `mwc-dialog` uses portal rendering (appends to `<body>`). This breaks test queries because the element leaves the fixture. Our mock renders inline within its parent.

---

### 3.2 `MockHaForm` (ha-form)

**What It Mocks**: Home Assistant's schema-driven form component.

**Key Contract**:
| Property | Type | Description |
|----------|------|-------------|
| `hass` | Object | The hass object (often ignored in mock) |
| `data` | Object | Current form values `{ field_name: value }` |
| `schema` | Array | Field definitions (see below) |
| `error` | Object | Field-level errors `{ field_name: "Error message" }` |
| `computeLabel` | Function | Optional `(schemaItem, data) => string` for labels |

| Event           | When Fired          | Payload                          |
| --------------- | ------------------- | -------------------------------- |
| `value-changed` | On any field change | `{ detail: { value: newData } }` |

**Schema Format** (subset we support):

```typescript
type SchemaItem = {
  name: string; // Field key in data
  required?: boolean; // Show asterisk
  type?: "string" | "integer" | "boolean"; // Simple types
  selector?: {
    // Complex selectors
    text?: { multiline?: boolean };
    select?: { options: { value: string; label: string }[] };
    boolean?: {};
    number?: { min?: number; max?: number; step?: number };
    entity?: { domain?: string }; // Rendered as text input in mock
    area?: {}; // Rendered as text input in mock
    icon?: {}; // Rendered as text input in mock
  };
};
```

**Critical Implementation: Immutability**

The mock must **never mutate** `this.data`. Always create a new object:

```typescript
private _handleChange(key: string, value: any) {
  // ✅ Immutable - creates new object
  const newData = { ...this.data, [key]: value };

  this.dispatchEvent(new CustomEvent("value-changed", {
    detail: { value: newData },
    bubbles: true,
    composed: true,  // MUST be composed to cross Shadow DOM
  }));
}
```

**Why `composed: true`**: Events must bubble through Shadow DOM boundaries. Without this, parent components won't receive the event.

**Error Display**:

```typescript
private _renderField(field: any) {
  const error = this.error?.[field.name];
  return html`
    <div class="form-field">
      ${this._renderInput(field)}
      ${error ? html`<div class="error">${error}</div>` : ""}
    </div>
  `;
}
```

---

### 3.3 Other Mock Components

**We may need mocks for**:

| Component          | When Needed           | Mock Strategy                                  |
| ------------------ | --------------------- | ---------------------------------------------- |
| `ha-icon`          | Always (used in tree) | Render empty span with icon name for debugging |
| `ha-icon-button`   | Toolbar buttons       | Render native button with label                |
| `ha-switch`        | Settings toggles      | Render native checkbox                         |
| `mwc-button`       | Dialog buttons        | Render native button                           |
| `ha-entity-picker` | Future: source config | Text input accepting entity_id                 |
| `ha-area-picker`   | Future: area mapping  | Text input accepting area_id                   |

**General Principle**: Render the simplest native HTML that honors the component's input/output contract.

---

## 4. Registration Strategy

### 4.1 Guard Against Double Registration

Custom elements can only be defined once. Always guard:

```typescript
if (!customElements.get("ha-dialog")) {
  customElements.define("ha-dialog", MockHaDialog);
}
```

### 4.2 Registration Order

**Critical**: Mocks must be registered **before** any component that uses them is defined.

In `mock-harness.html`:

```html
<!-- 1. First: Register mock HA components -->
<script type="module" src="./mock-ha-components.ts"></script>

<!-- 2. Second: Mock hass factory -->
<script type="module" src="./mock-hass.ts"></script>

<!-- 3. Third: Our panel (which uses ha-dialog, ha-form) -->
<script type="module" src="./home-topology-panel.ts"></script>
```

If order is wrong, the panel may reference the undefined real components and fail.

---

## 5. Testing Patterns With Mocks

### 5.1 Verifying Form Data Flow

```typescript
it("updates data when form value changes", async () => {
  const panel = await fixture<HomeTopologyPanel>(html`
    <home-topology-panel .hass=${mockHass}></home-topology-panel>
  `);

  // Open create dialog
  const createBtn = panel.shadowRoot!.querySelector(".new-location-btn");
  createBtn!.click();
  await panel.updateComplete;

  // Find the mock form
  const dialog = panel.shadowRoot!.querySelector("ht-location-dialog");
  const form = dialog!.shadowRoot!.querySelector("ha-form") as MockHaForm;

  // Simulate user typing in name field
  const nameInput = form.shadowRoot!.querySelector('input[aria-label="name"]');
  nameInput!.value = "Kitchen";
  nameInput!.dispatchEvent(new Event("input", { bubbles: true }));

  // Verify the form's data updated
  await form.updateComplete;
  expect(form.data.name).to.equal("Kitchen");

  // Verify value-changed event bubbled to dialog
  // (dialog should have captured it and updated its state)
});
```

### 5.2 Verifying Dialog Lifecycle

```typescript
it("closes dialog and resets form on cancel", async () => {
  const panel = await fixture<HomeTopologyPanel>(...);

  // Open dialog
  panel._locationDialogOpen = true;
  await panel.updateComplete;

  const dialog = panel.shadowRoot!.querySelector("ha-dialog") as MockHaDialog;
  expect(dialog.open).to.be.true;

  // Click cancel (secondary action)
  const cancelBtn = dialog.querySelector('[slot="secondaryAction"]');
  cancelBtn!.click();

  // Dialog should fire "closed" event
  // Panel should receive it and set _locationDialogOpen = false
  await panel.updateComplete;
  expect(panel._locationDialogOpen).to.be.false;
});
```

### 5.3 Smoke Test Pattern (Quick Verification)

Add this to the harness for rapid manual verification:

```javascript
// In mock-harness.html <script>
window.smokeTest = async () => {
  const panel = document.querySelector("home-topology-panel");
  const before = panel._locations.length;

  // Add location via mock API
  await mock.callWS({ type: "home_topology/locations/create", name: "Test" });
  await panel._loadLocations();

  const after = panel._locations.length;
  console.log(`[SmokeTest] Locations: ${before} → ${after}`);
  console.assert(after === before + 1, "Location was not added!");

  // Verify tree rendered new node
  const nodes = panel.shadowRoot.querySelectorAll(
    "ht-location-tree .tree-node"
  );
  console.log(`[SmokeTest] Tree nodes: ${nodes.length}`);
};

// Hotkey: Ctrl+Shift+S
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "S") {
    e.preventDefault();
    smokeTest();
  }
});
```

---

## 6. Common Pitfalls and Fixes

### 6.1 Event Not Reaching Parent

**Symptom**: Form changes don't update parent state.

**Cause**: Event missing `bubbles: true` or `composed: true`.

**Fix**:

```typescript
this.dispatchEvent(
  new CustomEvent("value-changed", {
    detail: { value: newData },
    bubbles: true, // Bubbles through DOM tree
    composed: true, // Crosses Shadow DOM boundaries
  })
);
```

### 6.2 Dialog Content Not Rendering

**Symptom**: Buttons in dialog slots don't appear.

**Cause**: Mock dialog missing slot elements.

**Fix**: Ensure mock has all required slots:

```typescript
render() {
  return html`
    <slot name="heading"></slot>
    <slot></slot>  <!-- Default slot for content -->
    <slot name="secondaryAction"></slot>
    <slot name="primaryAction"></slot>
  `;
}
```

### 6.3 Form Changes Not Persisting

**Symptom**: Typing in form field, value disappears.

**Cause**: Data flow is "Event Up, Data Down". If parent doesn't update `data` prop after receiving `value-changed`, the form shows stale data.

**Fix**: In the dialog/parent component:

```typescript
private _handleFormChange(e: CustomEvent) {
  // Update local state (which passes back to form)
  this._formData = e.detail.value;
}

render() {
  return html`
    <ha-form
      .data=${this._formData}
      @value-changed=${this._handleFormChange}
    ></ha-form>
  `;
}
```

### 6.4 Double-Click Rename Conflicts With Drag

**Symptom**: Double-click to rename doesn't work, or starts a drag.

**Cause**: SortableJS intercepts mouse events before double-click fires.

**Fix**: Use SortableJS `handle` and `filter` options:

```typescript
Sortable.create(container, {
  handle: ".drag-handle", // Only start drag from handle element
  filter: ".location-name-input", // Never start drag from input
  preventOnFilter: false, // Allow click events on filtered elements
});
```

And ensure the name element is not inside the drag handle:

```html
<div class="tree-node">
  <span class="drag-handle">⠿</span>
  <!-- Drag only from here -->
  <span class="location-name" @dblclick="${this._startRename}">
    ${location.name}
  </span>
</div>
```

### 6.5 Tree Not Updating After Add/Delete

**Symptom**: Add/delete location, tree doesn't reflect change.

**Cause**: Lit checks reference equality. Mutating the array doesn't trigger update.

**Fix**: Always create new array reference:

```typescript
// After add
this._locations = [...this._locations, newLocation];

// After delete
this._locations = this._locations.filter((l) => l.id !== deletedId);

// Force re-render with version counter if needed
this._locationsVersion += 1;
```

---

## 7. File Structure Reference

```
custom_components/home_topology/frontend/
├── mock-harness.html          # Development entry point
├── mock-hass.ts               # Simulates hass object and WebSocket API
├── mock-ha-components.ts      # Mock implementations of HA components ← THIS DOC
├── home-topology-panel.ts     # Main panel component
├── ht-location-tree.ts        # Tree view component
├── ht-location-dialog.ts      # Create/edit dialog
├── ht-location-inspector.ts   # Details sidebar
└── types.ts                   # TypeScript interfaces
```

---

## 8. CRITICAL: Vite Dev Mode Compatibility

Lit decorators (`@property`, `@state`) may not work correctly in Vite's dev mode due to ESM transform limitations. This causes properties to silently fail to bind.

**ALWAYS add explicit `static properties` to ALL mock components:**

```typescript
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";

  // ✅ REQUIRED for Vite dev mode - without this, properties don't bind!
  static properties = {
    icon: { type: String },
  };
}
```

**Why:**

- Vite dev mode uses native ESM which can skip decorator transforms
- Production builds work fine (full Rollup transforms)
- Unit tests work fine (different module loading)
- ONLY the dev harness breaks - silently

**Symptoms of missing `static properties`:**

- Icons show "?" instead of symbols
- Form fields don't accept input
- Properties show as empty/undefined in DevTools

---

## 9. Checklist for Adding New HA Component Mocks

When you need to mock a new HA component:

- [ ] Identify the component's input properties (check HA frontend source)
- [ ] Identify the component's output events (check HA frontend source)
- [ ] Identify any slots the component uses
- [ ] Create minimal implementation in `mock-ha-components.ts`
- [ ] **ADD `static properties` declaration (CRITICAL for Vite - see Section 8)**
- [ ] Guard registration with `if (!customElements.get("component-name"))`
- [ ] **Verify in harness manually:**
  - [ ] Properties receive values (check DevTools → Elements → Properties)
  - [ ] Events fire (check console logs)
  - [ ] Visual rendering is correct (icons show, text appears)
- [ ] Add smoke test if component is critical path
- [ ] Update this document with the new mock's contract

---

## 10. Related Documents

| Document                       | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `frontend-dev-workflow.md`     | How to use the mock harness            |
| `frontend-testing-patterns.md` | Unit testing with @open-wc/testing     |
| `frontend-patterns.md`         | Lit patterns, performance, drag-drop   |
| `ui-design.md`                 | UI specification and interaction flows |

---

**Document Status**: Active
**Last Updated**: 2025-12-28
**Maintainer**: Mike
**Related Issues**: Mock harness double-click rename, tree reactivity, Vite static properties issue
