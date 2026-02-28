# Frontend Development Workflow

> Optimized development methodology for Topomation custom panel using Cursor AI, Vite, and Lit.

## Goals

- **Millisecond-level iteration** without restarting Home Assistant
- **Preserve HA state** while coding (no hard refresh required)
- **Support both modes**: Live HA data and deterministic mock data
- **AI-assisted development** with context-aware Cursor rules

---

## Quick Start

### Option 1: Mock Harness (Recommended for UI Development)

No Home Assistant required. Full state simulation with theme switching.

```bash
cd custom_components/topomation/frontend
npm install
npm run dev
```

Open: **http://localhost:5173/mock-harness.html**

Features:

- 🎨 Light/Dark theme toggle (Ctrl+Shift+T)
- 🔄 Reactive state updates
- 📊 Entity state simulation
- 🔔 Event simulation (motion, occupancy)
- 📝 Console logging of service calls

### Option 2: Live HA with Vite Proxy

For testing with real Home Assistant data:

```bash
cd custom_components/topomation/frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

Then update panel config in HA to use dev server:

```yaml
# In HA configuration (temporary for dev)
module_url: http://localhost:5173/topomation-panel.ts
```

HMR keeps your UI state while you edit code.

---

## Architecture

### The hass Object

The `hass` object is the nervous system of any HA frontend component. Key properties:

| Property             | Description                            |
| -------------------- | -------------------------------------- |
| `hass.states`        | All entity states, keyed by entity_id  |
| `hass.areas`         | Area registry                          |
| `hass.callWS()`      | WebSocket API calls to backend         |
| `hass.callService()` | Service calls (e.g., turn_on)          |
| `hass.connection`    | WebSocket connection for subscriptions |
| `hass.localize()`    | Translation helper                     |

### Critical Reactivity Pattern

LitElement checks **reference equality** for updates. When `hass` changes, HA creates a **new object reference**. Your component must handle this:

```typescript
// ❌ WRONG: Mutation doesn't trigger update
this.hass.states["light.kitchen"] = newState;

// ✅ CORRECT: Spread creates new reference
this.hass = { ...this.hass };
```

The mock harness uses this pattern:

```typescript
// In mock-hass.ts
getReactiveHass: () => {
  hass = { ...buildHass() };
  return hass;
};
```

---

## Mock Development Harness

### File Structure

```
frontend/
├── mock-harness.html    # Development harness page
├── mock-hass.ts         # Mock hass factory with reactive patterns
├── topomation-panel.ts
└── ...components
```

### Using the Mock

```typescript
import { createMockHass } from "./mock-hass.ts";

const mock = createMockHass();
panel.hass = mock.hass;

// Update state (triggers Lit reactivity)
mock.updateState("light.kitchen", "off");
panel.hass = mock.getReactiveHass();

// Simulate events
mock.connection.fireEvent("state_changed", { ... });
```

### Customizing Mock Data

Edit `mock-hass.ts` to add:

- Custom locations in `MOCK_LOCATIONS`
- Entity states in `MOCK_STATES`
- Areas in `MOCK_AREAS`

### What Are We Testing?

The mock harness should mirror adapter policy:

- HA owns floor/area lifecycle (create/rename/delete in HA menus only).
- Panel behavior focuses on hierarchy overlay reorder and module configuration.
- HA-backed area moves must sync `floor_id` from nearest floor ancestor (or `null` at root).

The mock WebSocket API (`callWS` in `mock-hass.ts`) is used to:

- Validate drag-and-drop reorder behavior
- Validate inspector/config interactions
- Validate state/notification/error handling

To adjust scenarios, edit `MOCK_LOCATIONS`, `MOCK_AREAS`, and `MOCK_STATES` in `mock-hass.ts`.

---

## Cursor AI Integration

### Rule Files

AI context is provided via `.cursor/rules/*.mdc` files:

| File                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `ha-components.mdc`     | HA component reference (ha-form, ha-card, etc.) |
| `frontend-patterns.mdc` | Lit patterns, shouldUpdate, lifecycle           |
| `styling.mdc`           | CSS variables, theming, responsive design       |

### Key AI Directives

When prompting Cursor for frontend work:

1. **Forms**: "Use ha-form with schema" → AI generates schema-driven forms
2. **Entity pickers**: "Add entity selector" → AI uses ha-form entity selector
3. **Styling**: AI automatically uses CSS variables, not hex codes

### Example Prompt Results

**Prompt**: "Create a configuration dialog for occupancy timeout"

**AI generates**:

```typescript
const schema = [
  { name: "timeout", selector: { number: { min: 0, max: 3600, step: 60 } } },
  { name: "entity", selector: { entity: { domain: "binary_sensor" } } },
];

html`<ha-form .schema=${schema} ...></ha-form>`;
```

---

## Performance Optimization

### shouldUpdate Filter

**Critical**: Without this, your component re-renders 100+ times/minute.

```typescript
protected shouldUpdate(changedProps: PropertyValues): boolean {
  // Always update for local state
  if (changedProps.has('_loading') || changedProps.has('_data')) {
    return true;
  }

  // Filter hass updates
  if (changedProps.has('hass')) {
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (!oldHass) return true;

    // Only re-render if areas changed
    if (oldHass.areas !== this.hass.areas) return true;

    return false; // Ignore other hass changes
  }

  return true;
}
```

### Lazy Loading

For complex panels, consider lazy-loading sub-components:

```typescript
// Dynamic import when needed
const { HtEntityConfigDialog } = await import("./ht-entity-config-dialog");
```

---

## Testing

### Unit Tests (Vitest) - Recommended for UI Logic

These tests run fast and should focus on **pure logic** (hierarchy rules, icon resolution, tree transforms).

```bash
cd custom_components/topomation/frontend
npm run test:unit
npm run test:unit:watch
```

### E2E/UI Interaction Tests (Playwright) - Recommended for DnD + Dialog Flows

These tests run a real browser against the mock harness, which is the only reliable way to test
**drag-and-drop** and complex **dialog** flows.

```bash
cd custom_components/topomation/frontend
npm run test:e2e
npm run test:e2e:ui
```

### Legacy Component/Browser Tests (Web Test Runner)

```bash
npm run test           # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

`npm run test*` now resolves `CHROME_PATH` automatically from Playwright's Chromium
binary (`playwright.chromium.executablePath()`), so manual path lookups are not part
of the workflow anymore.

In this dev container, the resolved path is typically:

```bash
/home/vscode/.cache/ms-playwright/<revision>/chrome-linux64/chrome
```

Path can change when Playwright updates. Verify with:

```bash
cd custom_components/topomation/frontend
node -e "const { chromium } = require('playwright'); console.log(chromium.executablePath())"
```

Tests use `@open-wc/testing` with real Chromium:

```typescript
import { fixture, html, expect } from "@open-wc/testing";

it("renders locations", async () => {
  const el = await fixture(html`
    <topomation-panel .hass=${mockHass}></topomation-panel>
  `);

  await el.updateComplete;

  const tree = el.shadowRoot!.querySelector("ht-location-tree");
  expect(tree).to.exist;
});
```

### Visual Testing in Harness

1. Open `http://localhost:5173/mock-harness.html`
2. Use theme toggle to verify dark mode
3. Use simulation buttons to test state changes
4. Check console for service call logs

---

## Production Build

```bash
npm run build
```

Build output is written to:

```
dist/topomation-panel.js
```

The runtime artifact loaded by Home Assistant is:

```
/local/custom_components/topomation/frontend/topomation-panel.js
```

After `npm run build`, sync the runtime artifact and verify parity:

```bash
cp dist/topomation-panel.js topomation-panel.js
diff -u dist/topomation-panel.js topomation-panel.js
```

### Cache Busting

Update version in `const.py` or append timestamp:

```yaml
module_url: /local/.../topomation-panel.js?v=20251210
```

---

## Debugging Tips

### Browser DevTools

```javascript
// Select element in DevTools, then:
$0.hass; // Inspect hass object
$0.shadowRoot; // Access Shadow DOM
$0._locations; // Check internal state

// Check if element is registered
customElements.get("topomation-panel");
```

### Vite Source Maps

Source maps are enabled by default. Breakpoints work in original TypeScript.

### Common Issues

| Issue             | Solution                                             |
| ----------------- | ---------------------------------------------------- |
| Element not found | Check `customElements.get('component-name')`         |
| No reactivity     | Ensure `{ attribute: false }` for hass property      |
| Style bleeding    | All styles must be in Shadow DOM via `static styles` |
| HMR fails         | Custom elements can't be re-registered; full reload  |

---

## Keyboard Shortcuts (Mock Harness)

| Shortcut     | Action                     |
| ------------ | -------------------------- |
| Ctrl+Shift+T | Toggle light/dark theme    |
| Ctrl+Shift+R | Reload locations from mock |

---

## Reference

### CSS Variables

See `.cursor/rules/styling.mdc` for full list. Key variables:

```css
var(--primary-color)
var(--card-background-color)
var(--primary-text-color)
var(--secondary-text-color)
var(--divider-color)
var(--success-color)
var(--error-color)
```

### HA Components

See `.cursor/rules/ha-components.mdc` for full reference:

- `ha-form` - Schema-driven forms
- `ha-card` - Card container
- `ha-dialog` - Modal dialogs
- `ha-entity-picker` - Entity selector
- `mwc-button` - Material buttons

---

## Pre-Commit Verification Checklist

**IMPORTANT**: Unit tests passing is NOT enough. The harness must be verified manually.

Before committing any frontend changes:

1. **Run tests**: `npm test` (all must pass)
2. **Build**: `npm run build` (must succeed)
3. **Verify runtime bundle parity**:
   - [ ] `diff -u dist/topomation-panel.js topomation-panel.js` returns no differences
4. **Verify harness manually** (http://localhost:5173/):
   - [ ] Icons render correctly (▶ ⋮⋮ 🗑️, not "?")
   - [ ] Drag location → drop works
   - [ ] Move area under another floor updates `ha_floor_id` in mock response
   - [ ] Move area to root clears `ha_floor_id` in mock response
   - [ ] Blocked lifecycle ops (`create/update/delete`) show expected policy error
   - [ ] Theme toggle works (Ctrl+Shift+T)
5. **Run full local gate before release**:
   - [ ] `cd /workspaces/topomation && ./scripts/test-comprehensive.sh`
6. **Check for regressions**: Did any previously working feature break?

### Why Manual Verification?

Unit tests use `@open-wc/testing` which loads modules differently than Vite dev mode.
A test can pass while the harness is completely broken (see `docs/history/2026.02.24-lessons-learned-2025-12-28.md`).

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│  1. Start Dev Server                                        │
│     npm run dev                                              │
│     Open mock-harness.html                                   │
├─────────────────────────────────────────────────────────────┤
│  2. Develop with AI Assistance                              │
│     Cursor uses .cursor/rules/*.mdc for context             │
│     Ask for ha-form schemas, HA components                  │
├─────────────────────────────────────────────────────────────┤
│  3. Test in Harness (VISUAL VERIFICATION)                   │
│     Verify icons render correctly                            │
│     Verify forms accept input                                │
│     Verify drag-drop works                                   │
│     Toggle themes, simulate states                          │
├─────────────────────────────────────────────────────────────┤
│  4. Run Unit Tests                                          │
│     npm run test                                             │
├─────────────────────────────────────────────────────────────┤
│  5. Build & Deploy                                          │
│     npm run build                                            │
│     cp dist/topomation-panel.js topomation-panel.js          │
│     diff -u dist/topomation-panel.js topomation-panel.js     │
│     Commit topomation-panel.js                               │
└─────────────────────────────────────────────────────────────┘
```

---

_Last Updated: 2026-02-26_
