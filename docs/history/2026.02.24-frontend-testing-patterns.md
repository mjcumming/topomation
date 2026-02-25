# Frontend Testing Patterns

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: Testing strategies for Lit components in Home Topology

---

## 1. Unit Testing Lit Components

### 1.1 Setup with @open-wc/testing

**Installation**:

```bash
npm install --save-dev @open-wc/testing @web/test-runner
```

**Test File Structure**:

```typescript
import { fixture, html, expect } from "@open-wc/testing";
import { HtLocationTree } from "./ht-location-tree";

describe("HtLocationTree", () => {
  it("renders tree nodes", async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass}
        .locations=${mockLocations}
      ></ht-location-tree>
    `);

    expect(element.shadowRoot!.querySelector(".tree-node")).to.exist;
  });
});
```

---

### 1.2 Mocking hass Object

**Complete Mock**:

```typescript
const mockHass: HomeAssistant = {
  states: {
    "light.kitchen": {
      entity_id: "light.kitchen",
      state: "on",
      attributes: { friendly_name: "Kitchen Light" },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      context: { id: "123", parent_id: null, user_id: null },
    },
  },
  areas: {},
  devices: {},
  entities: {},
  config: {
    latitude: 0,
    longitude: 0,
    elevation: 0,
    unit_system: { length: "km" },
  },
  themes: {},
  selectedTheme: "default",
  panels: {},
  services: {},
  user: { id: "123", name: "Test", is_admin: true, is_owner: true },
  callService: async () => ({}),
  callWS: async () => ({}),
  connection: {
    subscribeEvents: async () => () => {},
  } as any,
  language: "en",
  localize: (key: string) => key,
};
```

---

### 1.3 Testing shouldUpdate Logic

**Critical Test**:

```typescript
describe("Performance: shouldUpdate", () => {
  it("only re-renders when locations change, not on unrelated hass updates", async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass}
        .locations=${mockLocations}
      ></ht-location-tree>
    `);

    // Track render count
    let renderCount = 0;
    const originalRender = element.render.bind(element);
    element.render = () => {
      renderCount++;
      return originalRender();
    };

    await element.updateComplete;
    const initialRenderCount = renderCount;

    // Update unrelated entity in hass
    element.hass = {
      ...mockHass,
      states: {
        ...mockHass.states,
        "light.living_room": {
          entity_id: "light.living_room",
          state: "on",
          attributes: {},
          last_changed: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          context: { id: "456", parent_id: null, user_id: null },
        },
      },
    };
    await element.updateComplete;

    // Should NOT have re-rendered (tree doesn't depend on entity states)
    expect(renderCount).to.equal(initialRenderCount);
  });

  it("does re-render when locations change", async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass}
        .locations=${mockLocations}
      ></ht-location-tree>
    `);

    let renderCount = 0;
    const originalRender = element.render.bind(element);
    element.render = () => {
      renderCount++;
      return originalRender();
    };

    await element.updateComplete;
    const initialRenderCount = renderCount;

    // Update locations
    element.locations = [
      ...mockLocations,
      {
        id: "new-room",
        name: "New Room",
        parent_id: null,
        entity_ids: [],
        modules: {},
      },
    ];
    await element.updateComplete;

    // Should have re-rendered
    expect(renderCount).to.be.greaterThan(initialRenderCount);
  });
});
```

---

### 1.4 Testing Event Dispatching

```typescript
it("dispatches location-selected event on click", async () => {
  const element = await fixture<HtLocationTree>(html`
    <ht-location-tree
      .hass=${mockHass}
      .locations=${mockLocations}
    ></ht-location-tree>
  `);

  let selectedId: string | undefined;
  element.addEventListener("location-selected", (e: CustomEvent) => {
    selectedId = e.detail.locationId;
  });

  const node = element.shadowRoot!.querySelector(".tree-node") as HTMLElement;
  node.click();
  await element.updateComplete;

  expect(selectedId).to.equal(mockLocations[0].id);
});
```

---

## 2. Integration Testing

### 2.1 Testing Component Interactions

```typescript
describe("Tree → Inspector Integration", () => {
  it("updates inspector when tree selection changes", async () => {
    const container = await fixture(html`
      <div>
        <ht-location-tree
          .hass=${mockHass}
          .locations=${mockLocations}
          @location-selected=${(e: CustomEvent) => {
            inspector.location = mockLocations.find(
              (l) => l.id === e.detail.locationId
            );
          }}
        ></ht-location-tree>
        <ht-location-inspector .hass=${mockHass}></ht-location-inspector>
      </div>
    `);

    const tree = container.querySelector("ht-location-tree");
    const inspector = container.querySelector("ht-location-inspector");

    // Click first node
    const node = tree.shadowRoot!.querySelector(".tree-node") as HTMLElement;
    node.click();
    await tree.updateComplete;
    await inspector.updateComplete;

    expect(inspector.location).to.exist;
    expect(inspector.location!.id).to.equal(mockLocations[0].id);
  });
});
```

---

### 2.2 Testing WebSocket Mock Responses

```typescript
it("handles WebSocket success response", async () => {
  const mockCallWS = async (msg: any) => {
    if (msg.type === "home_topology/locations/create") {
      return { location: { id: "new-id", ...msg } };
    }
  };

  const dialog = await fixture<HtLocationDialog>(html`
    <ht-location-dialog
      .hass=${{ ...mockHass, callWS: mockCallWS }}
      .open=${true}
    ></ht-location-dialog>
  `);

  // Fill form and submit
  // ... assertions
});
```

---

## 3. Visual Testing

### 3.1 Storybook Setup

**Installation**:

```bash
npm install --save-dev @storybook/web-components
```

**Story Example**:

```typescript
import { html } from "lit";
import "./ht-location-tree";

export default {
  title: "Components/LocationTree",
  component: "ht-location-tree",
};

export const Empty = () => html`
  <ht-location-tree .hass=${mockHass} .locations=${[]}></ht-location-tree>
`;

export const WithLocations = () => html`
  <ht-location-tree
    .hass=${mockHass}
    .locations=${mockLocations}
  ></ht-location-tree>
`;

export const LargeTree = () => html`
  <ht-location-tree
    .hass=${mockHass}
    .locations=${generateMockLocations(100)}
  ></ht-location-tree>
`;
```

---

### 3.2 Testing Responsive Breakpoints

```typescript
describe("Responsive Layout", () => {
  it("shows mobile layout when narrow", async () => {
    const panel = await fixture<HomeTopologyPanel>(html`
      <home-topology-panel
        .hass=${mockHass}
        .narrow=${true}
      ></home-topology-panel>
    `);

    const container = panel.shadowRoot!.querySelector(".panel-container");
    expect(container!.classList.contains("mobile")).to.be.true;
  });

  it("shows desktop layout when not narrow", async () => {
    const panel = await fixture<HomeTopologyPanel>(html`
      <home-topology-panel
        .hass=${mockHass}
        .narrow=${false}
      ></home-topology-panel>
    `);

    const container = panel.shadowRoot!.querySelector(".panel-container");
    expect(container!.classList.contains("mobile")).to.be.false;
  });
});
```

---

### 3.3 Testing Dark Mode

```typescript
it("applies dark mode styles", async () => {
  document.body.setAttribute("data-theme", "dark");

  const element = await fixture<HtLocationTree>(html`
    <ht-location-tree
      .hass=${mockHass}
      .locations=${mockLocations}
    ></ht-location-tree>
  `);

  const styles = getComputedStyle(element);
  expect(styles.getPropertyValue("--primary-background-color")).to.not.equal(
    "#ffffff"
  );

  document.body.removeAttribute("data-theme");
});
```

---

## 4. Test Utilities

### 4.1 Mock Data Factories

```typescript
export function createMockLocation(overrides?: Partial<Location>): Location {
  return {
    id: `loc-${Math.random().toString(36).substr(2, 9)}`,
    name: "Test Location",
    parent_id: null,
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: {
      _meta: { type: "room" },
    },
    ...overrides,
  };
}

export function createMockHass(
  overrides?: Partial<HomeAssistant>
): HomeAssistant {
  return {
    ...defaultMockHass,
    ...overrides,
  };
}
```

---

### 4.2 Common Test Helpers

```typescript
export async function waitFor(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function getRenderCount(element: LitElement): number {
  return (element as any)._renderCount || 0;
}
```

---

### 4.3 Setup/Teardown Patterns

```typescript
describe("HtLocationInspector", () => {
  let element: HtLocationInspector;
  let mockHass: HomeAssistant;
  let mockLocation: Location;

  beforeEach(async () => {
    mockHass = createMockHass();
    mockLocation = createMockLocation();

    element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${mockHass}
        .location=${mockLocation}
      ></ht-location-inspector>
    `);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it("renders location name", () => {
    const name = element.shadowRoot!.querySelector(".location-name");
    expect(name!.textContent).to.include(mockLocation.name);
  });
});
```

---

## 5. Running Tests

### 5.1 web-test-runner Configuration

**web-test-runner.config.js**:

```javascript
export default {
  files: ["src/**/*.test.ts"],
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    threshold: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

### 5.2 package.json Scripts

```json
{
  "scripts": {
    "test": "web-test-runner",
    "test:watch": "web-test-runner --watch",
    "test:coverage": "web-test-runner --coverage"
  }
}
```

---

## 6. CI/CD Integration

**GitHub Actions Example**:

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

---

**Document Status**: Active
**Last Updated**: 2025-12-09
**Maintainer**: Mike
**Related Docs**: `frontend-patterns.md`, `ui-design.md`
