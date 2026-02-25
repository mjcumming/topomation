# Frontend Quick Reference

**Quick lookup for critical patterns when building Home Topology frontend components.**

> **Detailed Guide**: See `frontend-patterns.md` for complete explanations and examples.

---

## 🚨 Critical: Performance Pattern

**EVERY component that receives `hass` MUST implement `shouldUpdate`:**

```typescript
protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (changedProps.has('location')) return true;

  if (changedProps.has('hass')) {
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (!oldHass) return true;

    // Only re-render if data we display changed
    const entities = this.location?.entity_ids || [];
    for (const id of entities) {
      if (oldHass.states[id] !== this.hass.states[id]) return true;
    }

    return false; // hass changed but nothing we care about
  }

  return true;
}
```

**Why**: `hass` is replaced on EVERY state change in HA. Without this, your component re-renders 100+ times per minute.

---

## Drag-and-Drop Checklist

```typescript
import Sortable from 'sortablejs';

@state() private _isDragging = false;
@state() private _pendingMoves = new Map<string, any>();

firstUpdated() {
  Sortable.create(this.shadowRoot!.querySelector('.container'), {
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    fallbackOnBody: true,  // ✅ Escape shadow DOM
    onStart: () => this._isDragging = true,  // ✅ Disable Lit updates
    onMove: (evt) => this._validateMove(evt),  // ✅ Validate
    onEnd: (evt) => {
      this._isDragging = false;
      this._handleDragEnd(evt);  // ✅ Optimistic update
    },
  });
}

protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (this._isDragging) return false;  // ✅ Don't update during drag
  // ... normal shouldUpdate logic
}

private async _handleDragEnd(evt: SortableEvent) {
  // 1. Update UI immediately (optimistic)
  const backup = [...this.locations];
  this.locations = this._moveLocation(...);

  try {
    // 2. Save to backend
    await this.hass.callWS({ type: 'home_topology/locations/reorder', ... });
  } catch (error) {
    // 3. Rollback on error
    this.locations = backup;
    showToast(this, { message: 'Failed to move', type: 'error' });
  }
}
```

**See**: `frontend-patterns.md` Section 2 & 3

---

## CSS Theme Variables

**NEVER use hard-coded colors. Always use HA variables:**

```css
:host {
  /* Backgrounds */
  background-color: var(--primary-background-color);
  --card-bg: var(--card-background-color);

  /* Text */
  color: var(--primary-text-color);
  --text-secondary: var(--secondary-text-color);

  /* Interactive */
  --primary: var(--primary-color);
  --accent: var(--accent-color);

  /* Borders */
  border-color: var(--divider-color);
  border-radius: var(--ha-card-border-radius, 12px);

  /* States */
  --occupied: var(--success-color);
  --vacant: var(--disabled-text-color);
}
```

**Result**: Dark mode works automatically. Theme changes apply instantly.

---

## ha-form Schema (Quick)

**Instead of building custom forms, use `ha-form` with schema:**

```typescript
const schema: HaFormSchema[] = [
  {
    name: 'entity_id',
    selector: {
      entity: { domain: 'binary_sensor' }
    }
  },
  {
    name: 'timeout',
    selector: {
      number: { min: 1, max: 1440, unit_of_measurement: 'min' }
    }
  },
  {
    name: 'mode',
    selector: {
      select: {
        options: [
          { value: 'trigger', label: 'Trigger' },
          { value: 'clear', label: 'Clear' }
        ]
      }
    }
  }
];

<ha-form
  .hass=${this.hass}
  .data=${this._config}
  .schema=${schema}
  @value-changed=${this._handleChange}
></ha-form>
```

**Benefits**: Entity picker, validation, theming, accessibility - all built in.

**See**: `frontend-patterns.md` Section 4

---

## Real-Time Updates

**Subscribe to backend events for multi-user sync:**

```typescript
private _unsubscribe?: Promise<() => void>;

connectedCallback() {
  super.connectedCallback();
  this._unsubscribe = this.hass.connection.subscribeEvents(
    (event) => this._handleUpdate(event),
    'home_topology_updated'
  );
}

disconnectedCallback() {
  super.disconnectedCallback();
  if (this._unsubscribe) {
    this._unsubscribe.then(unsub => unsub());
  }
}
```

**Backend** (Python):

```python
hass.bus.async_fire('home_topology_updated', {
    'location_id': location_id,
    'changes': changes,
})
```

**See**: `frontend-patterns.md` Section 5

---

## Mobile Responsive

**Safe areas for notch/gesture bar:**

```css
:host {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Touch targets (44x44px minimum):**

```css
.drag-handle,
.icon-button {
  min-width: 44px;
  min-height: 44px;
}
```

**Responsive layout:**

```typescript
render() {
  return html`
    <div class="${this.narrow ? 'mobile' : 'desktop'}">
      ${this.narrow ? this._renderMobile() : this._renderDesktop()}
    </div>
  `;
}
```

**See**: `frontend-patterns.md` Section 6

---

## Accessibility Quick Wins

**ARIA labels on icon buttons:**

```typescript
<ha-icon-button
  .icon=${'mdi:pencil'}
  .label=${'Edit location'}  // ✅ Screen reader label
  @click=${this._handleEdit}
></ha-icon-button>
```

**Tree keyboard navigation:**

```typescript
@keydown=${(e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp': this._selectPrevious(); break;
    case 'ArrowDown': this._selectNext(); break;
    case 'ArrowRight': this._expandNode(); break;
    case 'ArrowLeft': this._collapseNode(); break;
  }
}}
```

**ARIA tree structure:**

```html
<div role="tree">
  <div role="treeitem" aria-expanded="true">Floor 1</div>
</div>
```

**See**: `frontend-patterns.md` Section 8

---

## Common Pitfalls

### ❌ Anonymous Functions in Templates

**Bad** (creates new function every render):

```typescript
render() {
  return html`
    <button @click=${() => this._handleClick(item.id)}>Click</button>
  `;
}
```

**Good** (use event delegation):

```typescript
render() {
  return html`
    <button data-id=${item.id} @click=${this._handleClick}>Click</button>
  `;
}

private _handleClick(e: Event) {
  const id = (e.target as HTMLElement).dataset.id;
}
```

### ❌ Forgetting Cleanup

**Bad**:

```typescript
connectedCallback() {
  this.hass.connection.subscribeEvents(this._handler, 'event');
}
```

**Good**:

```typescript
private _unsubscribe?: Promise<() => void>;

connectedCallback() {
  this._unsubscribe = this.hass.connection.subscribeEvents(...);
}

disconnectedCallback() {
  if (this._unsubscribe) {
    this._unsubscribe.then(unsub => unsub());
  }
}
```

### ❌ Mutating Props

**Bad**:

```typescript
@property({ attribute: false }) location!: Location;
this.location.name = 'New'; // ❌ Mutates prop
```

**Good**:

```typescript
this.location = { ...this.location, name: "New" }; // ✅ New object
this.dispatchEvent(
  new CustomEvent("location-changed", {
    detail: { location: this.location },
  })
);
```

**See**: `frontend-patterns.md` Section 12

---

## Debug Mode

**Enable debug logging:**

```typescript
private DEBUG = window.location.search.includes('debug=true');

private _log(...args: any[]) {
  if (this.DEBUG) console.log('[HomeTopology]', ...args);
}
```

**Usage**: `http://localhost:8123/home-topology?debug=true`

---

## Hot Module Replacement

```bash
# Terminal 1: Watch mode
cd custom_components/home_topology/frontend
npm run dev -- --watch

# Terminal 2: Monitor HA logs
tail -f /workspaces/core/config/home-assistant.log | grep home_topology

# Browser: Hard refresh after each build
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

---

## Pre-Ship Checklist

- [ ] `shouldUpdate` implemented in ALL components with `hass` prop
- [ ] List virtualization for lists >50 items
- [ ] Client-side filtering for search
- [ ] Optimistic UI for drag-and-drop
- [ ] WebSocket subscriptions cleaned up in `disconnectedCallback`
- [ ] SortableJS destroyed in `disconnectedCallback`
- [ ] No anonymous functions in render templates
- [ ] CSS uses HA theme variables (no hard-coded colors)
- [ ] Mobile safe areas applied
- [ ] Touch targets ≥44x44px
- [ ] Keyboard navigation tested
- [ ] Screen reader labels on icon buttons
- [ ] Source maps enabled for debugging

---

## Reference Implementations

Study these HA core patterns:

| Feature            | Path in `home-assistant/frontend`           |
| ------------------ | ------------------------------------------- |
| Tree/List + Editor | `src/panels/config/areas/`                  |
| Complex Forms      | `src/panels/config/automation/`             |
| Entity Picker      | `src/components/entity/ha-entity-picker.ts` |
| Drag & Drop        | `src/panels/lovelace/editor/`               |
| Dialog Pattern     | `src/dialogs/`                              |
| shouldUpdate       | `src/panels/config/` (all panels)           |

---

## Key ADRs

- **ADR-HA-001**: Lit for Frontend
- **ADR-HA-007**: Frontend Performance Patterns (shouldUpdate, optimistic UI)
- **ADR-HA-008**: Panel Registration (embed_iframe=False)

See `docs/adr-log.md` for full details.

---

**Last Updated**: 2025-12-09
**Complete Guide**: `docs/frontend-patterns.md`
**UI Design**: `docs/ui-design.md`
**Architecture**: `docs/architecture.md`
