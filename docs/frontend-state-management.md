# Frontend State Management Patterns

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: State management strategies for complex Lit components

---

## 1. Local vs Remote State

### 1.1 When to Use @state vs @property

**@property** - External, passed from parent:

```typescript
@property({ attribute: false }) public hass!: HomeAssistant;
@property({ attribute: false }) public location?: Location;
@property() public selectedId?: string;
```

**@state** - Internal, component-owned:

```typescript
@state() private _loading = false;
@state() private _error?: string;
@state() private _expandedIds = new Set<string>();
```

**Rule of Thumb**: If it comes from parent → `@property`. If it's UI state → `@state`.

---

### 1.2 Optimistic Updates Pattern

**Problem**: Waiting for server response makes UI feel slow.

**Solution**: Update local state immediately, sync with server async, rollback on error.

```typescript
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) locations: Location[] = [];
  @state() private _optimisticLocations?: Location[];
  @state() private _pendingOperation?: string;

  render() {
    // Display optimistic state if available
    const displayLocations = this._optimisticLocations || this.locations;
    return html`${displayLocations.map((loc) => this._renderNode(loc))}`;
  }

  private async _handleMove(locationId: string, newParentId: string) {
    // 1. Store original for rollback
    const original = [...this.locations];

    // 2. Update optimistically
    this._optimisticLocations = this._moveInArray(locationId, newParentId);
    this._pendingOperation = locationId;

    try {
      // 3. Save to server
      await this.hass.callWS({
        type: "home_topology/locations/reorder",
        location_id: locationId,
        new_parent_id: newParentId,
      });

      // 4. Success - commit optimistic state
      this._optimisticLocations = undefined;
      this._pendingOperation = undefined;

      // Parent will reload data from server
      this.dispatchEvent(
        new CustomEvent("location-moved", {
          detail: { locationId, newParentId },
        })
      );
    } catch (error) {
      // 5. Failure - rollback
      this._optimisticLocations = undefined;
      this._pendingOperation = undefined;
      this.locations = original;

      this._showError("Failed to move location");
    }
  }
}
```

---

### 1.3 Pending Changes Tracking

**Pattern**: Track all unsaved changes in a map for batch save.

```typescript
@state() private _pendingChanges = new Map<string, {
  type: 'update' | 'delete' | 'create',
  original?: Location,
  updated: Partial<Location>
}>();

private _trackChange(locationId: string, changes: Partial<Location>) {
  const existing = this._locations.find(l => l.id === locationId);

  this._pendingChanges.set(locationId, {
    type: 'update',
    original: existing,
    updated: changes
  });

  // Update UI optimistically
  this._locations = this._locations.map(loc =>
    loc.id === locationId ? { ...loc, ...changes } : loc
  );
}

private async _saveAllChanges() {
  const changes = Array.from(this._pendingChanges.entries());
  const results = await Promise.allSettled(
    changes.map(([id, change]) => this._saveOne(id, change))
  );

  // Clear successful changes
  changes.forEach(([id], idx) => {
    if (results[idx].status === 'fulfilled') {
      this._pendingChanges.delete(id);
    }
  });
}
```

---

## 2. Complex Forms

### 2.1 Multi-Step Wizards

```typescript
@customElement("ht-add-device-wizard")
export class HtAddDeviceWizard extends LitElement {
  @state() private _step = 0;
  @state() private _wizardData: Partial<EntityConfig> = {};

  render() {
    return html`
      <ha-dialog .open=${this.open}>
        <div class="step-indicator">
          ${[0, 1, 2].map(
            (step) => html`
              <div
                class="step ${step === this._step ? "active" : ""} ${step <
                this._step
                  ? "completed"
                  : ""}"
              ></div>
            `
          )}
        </div>

        ${this._renderStep()}

        <mwc-button slot="primaryAction" @click=${this._nextStep}>
          ${this._step === 2 ? "Finish" : "Next"}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _renderStep() {
    switch (this._step) {
      case 0:
        return this._renderEntitySelect();
      case 1:
        return this._renderModeSelect();
      case 2:
        return this._renderConfiguration();
    }
  }

  private _nextStep() {
    if (this._isStepValid(this._step)) {
      if (this._step < 2) {
        this._step++;
      } else {
        this._submit();
      }
    }
  }

  private _isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return !!this._wizardData.entity_id;
      case 1:
        return !!this._wizardData.mode;
      case 2:
        return this._validateConfiguration();
    }
  }
}
```

---

### 2.2 Conditional Field Rendering

```typescript
render() {
  const schema = this._getSchema();

  return html`
    <ha-form
      .schema=${schema}
      .data=${this._config}
      @value-changed=${this._handleValueChanged}
    ></ha-form>
  `;
}

private _getSchema(): HaFormSchema[] {
  const baseSchema: HaFormSchema[] = [
    { name: 'mode', selector: { select: { options: [...] } } }
  ];

  // Add conditional fields based on mode
  if (this._config.mode === 'specific_states') {
    baseSchema.push(
      { name: 'on_event', selector: { select: { options: [...] } } },
      { name: 'off_event', selector: { select: { options: [...] } } }
    );

    // Further nesting - show timeout only if trigger is selected
    if (this._config.on_event === 'trigger') {
      baseSchema.push(
        { name: 'on_timeout', selector: { number: { min: 0, max: 1440 } } }
      );
    }
  }

  return baseSchema;
}
```

---

### 2.3 Form Validation Patterns

```typescript
@state() private _validationErrors = new Map<string, string>();

private _validateForm(): boolean {
  this._validationErrors.clear();

  if (!this._config.name) {
    this._validationErrors.set('name', 'Name is required');
  }

  if (this._config.timeout && this._config.timeout < 0) {
    this._validationErrors.set('timeout', 'Timeout must be positive');
  }

  // Custom business logic validation
  if (this._config.mode === 'specific_states' &&
      this._config.on_event === 'none' &&
      this._config.off_event === 'none') {
    this._validationErrors.set('mode', 'At least one event must be configured');
  }

  return this._validationErrors.size === 0;
}

render() {
  return html`
    <ha-textfield
      .value=${this._config.name}
      .errorMessage=${this._validationErrors.get('name')}
      .invalid=${this._validationErrors.has('name')}
      @input=${this._handleNameChange}
    ></ha-textfield>
  `;
}
```

---

### 2.4 Dirty State Tracking

```typescript
@state() private _isDirty = false;
private _originalConfig?: LocationConfig;

protected firstUpdated() {
  // Store original state
  this._originalConfig = JSON.parse(JSON.stringify(this._config));
}

private _checkDirty() {
  this._isDirty = JSON.stringify(this._config) !== JSON.stringify(this._originalConfig);
}

private _handleValueChanged(e: CustomEvent) {
  this._config = e.detail.value;
  this._checkDirty();
}

render() {
  return html`
    <div class="form-header">
      ${this._isDirty ? html`
        <span class="unsaved-indicator">● Unsaved changes</span>
      ` : ''}
    </div>
  `;
}

// Warn before closing if dirty
private _handleClose() {
  if (this._isDirty && !confirm('You have unsaved changes. Discard?')) {
    return;
  }
  this.open = false;
}
```

---

## 3. Undo/Redo

### 3.1 Command Pattern Implementation

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class MoveLocationCommand implements Command {
  constructor(
    private tree: HtLocationTree,
    private locationId: string,
    private oldParentId: string,
    private newParentId: string
  ) {}

  execute() {
    this.tree._moveLocation(this.locationId, this.newParentId);
  }

  undo() {
    this.tree._moveLocation(this.locationId, this.oldParentId);
  }
}
```

---

### 3.2 History Stack Management

```typescript
export class HomeTopologyPanel extends LitElement {
  @state() private _undoStack: Command[] = [];
  @state() private _redoStack: Command[] = [];

  private _executeCommand(command: Command) {
    command.execute();
    this._undoStack.push(command);
    this._redoStack = []; // Clear redo on new action

    // Limit stack size
    if (this._undoStack.length > 50) {
      this._undoStack.shift();
    }
  }

  private _undo() {
    const command = this._undoStack.pop();
    if (command) {
      command.undo();
      this._redoStack.push(command);
    }
  }

  private _redo() {
    const command = this._redoStack.pop();
    if (command) {
      command.execute();
      this._undoStack.push(command);
    }
  }

  render() {
    return html`
      <button @click=${this._undo} .disabled=${this._undoStack.length === 0}>
        Undo
      </button>
      <button @click=${this._redo} .disabled=${this._redoStack.length === 0}>
        Redo
      </button>
    `;
  }
}
```

---

### 3.3 Keyboard Shortcuts

```typescript
connectedCallback() {
  super.connectedCallback();
  this._boundKeyHandler = this._handleKeyboard.bind(this);
  document.addEventListener('keydown', this._boundKeyHandler);
}

disconnectedCallback() {
  super.disconnectedCallback();
  document.removeEventListener('keydown', this._boundKeyHandler);
}

private _handleKeyboard(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      this._redo(); // Ctrl+Shift+Z
    } else {
      this._undo(); // Ctrl+Z
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    this._redo(); // Ctrl+Y
  }
}
```

---

## 4. State Persistence

### 4.1 Local Storage for UI Preferences

```typescript
export class HtLocationTree extends LitElement {
  @state() private _expandedIds = new Set<string>();

  connectedCallback() {
    super.connectedCallback();
    this._loadExpandedState();
  }

  private _loadExpandedState() {
    const saved = localStorage.getItem("ht-tree-expanded");
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        this._expandedIds = new Set(ids);
      } catch (e) {
        console.warn("Failed to load expanded state", e);
      }
    }
  }

  private _saveExpandedState() {
    const ids = Array.from(this._expandedIds);
    localStorage.setItem("ht-tree-expanded", JSON.stringify(ids));
  }

  private _toggleExpand(locationId: string) {
    if (this._expandedIds.has(locationId)) {
      this._expandedIds.delete(locationId);
    } else {
      this._expandedIds.add(locationId);
    }
    this._expandedIds = new Set(this._expandedIds); // Trigger update
    this._saveExpandedState();
  }
}
```

---

### 4.2 Session Storage for Temporary State

```typescript
// Store wizard progress in session storage (survives page refresh)
export class HtAddDeviceWizard extends LitElement {
  @state() private _step = 0;
  @state() private _wizardData: Partial<EntityConfig> = {};

  private _sessionKey = "ht-add-device-wizard-state";

  connectedCallback() {
    super.connectedCallback();
    this._restoreSession();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.open) {
      this._saveSession();
    } else {
      this._clearSession();
    }
  }

  private _saveSession() {
    sessionStorage.setItem(
      this._sessionKey,
      JSON.stringify({
        step: this._step,
        data: this._wizardData,
      })
    );
  }

  private _restoreSession() {
    const saved = sessionStorage.getItem(this._sessionKey);
    if (saved) {
      try {
        const { step, data } = JSON.parse(saved);
        this._step = step;
        this._wizardData = data;
      } catch (e) {
        console.warn("Failed to restore session", e);
      }
    }
  }

  private _clearSession() {
    sessionStorage.removeItem(this._sessionKey);
  }
}
```

---

### 4.3 When to Persist vs When to Reset

**Persist (localStorage)**:

- UI preferences (collapsed/expanded state, column widths)
- User settings (theme, language, defaults)
- Recently used items

**Persist (sessionStorage)**:

- Multi-step form progress
- Search queries
- Temporary filters

**Don't Persist**:

- Sensitive data (passwords, tokens)
- Transient UI state (loading spinners, hover states)
- Data that should always be fresh from server

---

## 5. Advanced Patterns

### 5.1 Derived State with Getters

```typescript
export class HomeTopologyPanel extends LitElement {
  @property({ attribute: false }) locations: Location[] = [];
  @property() selectedId?: string;

  // Derived state - computed on demand, not stored
  private get _selectedLocation(): Location | undefined {
    return this.locations.find((l) => l.id === this.selectedId);
  }

  private get _rootLocations(): Location[] {
    return this.locations.filter((l) => !l.parent_id);
  }

  private get _hasPendingChanges(): boolean {
    return this._pendingChanges.size > 0;
  }

  render() {
    return html`
      <button .disabled=${!this._hasPendingChanges}>
        Save ${this._pendingChanges.size} Changes
      </button>
    `;
  }
}
```

---

### 5.2 State Machines for Complex Workflows

```typescript
type WizardState =
  | "idle"
  | "entity-select"
  | "mode-select"
  | "config"
  | "submitting"
  | "success"
  | "error";

export class HtAddDeviceWizard extends LitElement {
  @state() private _state: WizardState = "idle";

  private _transition(to: WizardState) {
    // Validate transitions
    const validTransitions: Record<WizardState, WizardState[]> = {
      idle: ["entity-select"],
      "entity-select": ["mode-select"],
      "mode-select": ["config"],
      config: ["submitting"],
      submitting: ["success", "error"],
      success: ["idle"],
      error: ["config", "idle"],
    };

    if (validTransitions[this._state]?.includes(to)) {
      this._state = to;
    } else {
      console.error(`Invalid transition: ${this._state} -> ${to}`);
    }
  }

  render() {
    switch (this._state) {
      case "idle":
        return this._renderIdle();
      case "entity-select":
        return this._renderEntitySelect();
      case "submitting":
        return this._renderSubmitting();
      case "success":
        return this._renderSuccess();
      case "error":
        return this._renderError();
    }
  }
}
```

---

**Document Status**: Active
**Last Updated**: 2025-12-09
**Maintainer**: Mike
**Related Docs**: `frontend-patterns.md`, `frontend-testing-patterns.md`
