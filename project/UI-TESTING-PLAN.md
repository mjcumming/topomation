# UI Integration Testing Plan

**Epic**: [EPIC-004] UI Integration Testing & Real-World Validation
**Created**: 2025-12-10
**Status**: Active

---

## Overview

This document outlines the comprehensive testing strategy for validating the UI against the real backend and design specification. The goal is to discover design mismatches, missing features, and integration issues before they compound.

---

## Testing Philosophy

**Real Data, Not Mocks**

- Test with actual WebSocket backend (now wired in ISSUE-001)
- Use real LocationManager data structures
- Discover what the backend actually provides vs what UI expects

**User Flows, Not Implementation**

- Test complete user journeys
- Focus on what users see and do
- Catch integration issues, not just unit bugs

**Document Everything**

- Every mismatch becomes an issue
- Every missing feature gets tracked
- Every design decision gets validated

---

## Testing Phases

### Phase 1: Manual Exploration (Current)

**Goal**: Discover what works and what doesn't

**Approach**:

1. Use mock-harness.html with real WebSocket calls
2. Test each component systematically
3. Document findings in real-time
4. Create issues for problems discovered

**Tools**:

- Browser DevTools (console, network tab)
- mock-harness.html
- Real HA instance (for final validation)

**Deliverable**: ISSUE-031 - Documented list of all mismatches

---

### Phase 2: Automated Component Tests

**Goal**: Prevent regressions in core functionality

**Approach**:

1. Enhance existing web-test-runner setup
2. Test components with real WebSocket responses
3. Test critical user flows
4. Run in CI

**Tools**:

- web-test-runner (already configured)
- @open-wc/testing
- Real WebSocket responses (not mocks, but deterministic)

**Deliverable**: Comprehensive component test suite

---

### Phase 3: E2E Testing

**Goal**: Validate complete user journeys

**Approach**:

1. Set up Playwright
2. Test full flows (create location, configure, etc.)
3. Visual regression testing
4. Cross-browser testing

**Tools**:

- Playwright
- Screenshot comparison
- Real HA instance or realistic simulation

**Deliverable**: E2E test suite with visual regression

---

## Test Coverage Matrix

| Component               | Manual | Unit       | E2E | Visual | Status      |
| ----------------------- | ------ | ---------- | --- | ------ | ----------- |
| home-topology-panel     | ✅     | ⚠️ Partial | ❌  | ❌     | In Progress |
| ht-location-tree        | ✅     | ❌         | ❌  | ❌     | Pending     |
| ht-location-inspector   | ✅     | ❌         | ❌  | ❌     | Pending     |
| ht-location-dialog      | ✅     | ❌         | ❌  | ❌     | Pending     |
| ht-entity-config-dialog | ✅     | ❌         | ❌  | ❌     | Pending     |
| ht-rule-dialog          | ✅     | ❌         | ❌  | ❌     | Pending     |
| Drag-and-drop           | ✅     | ❌         | ❌  | ❌     | Pending     |
| Inline editing          | ✅     | ❌         | ❌  | ❌     | Pending     |

---

## Critical User Flows to Test

### Flow 1: Initial Panel Load

```
1. Open panel
2. Panel calls locations/list
3. Tree displays hierarchy
4. Inspector shows empty state
```

**Expected Issues**:

- Data format mismatches
- Missing fields
- Type mismatches

---

### Flow 2: Create Location

```
1. Click "+ New Location"
2. Fill form (name, type, parent)
3. Submit
4. WebSocket create call
5. New location appears in tree
6. Location auto-selected
```

**Expected Issues**:

- Meta data not stored correctly
- Parent validation
- ID generation
- Response format

---

### Flow 3: Configure Occupancy

```
1. Select location
2. Open Occupancy tab
3. Toggle enabled
4. Set timeout
5. Add entity source
6. Configure entity trigger
7. Save
```

**Expected Issues**:

- Module config structure
- Entity picker filtering
- Config persistence
- Real-time updates

---

### Flow 4: Drag and Drop

```
1. Drag location
2. Drop on new parent
3. WebSocket reorder call
4. Tree updates
5. Hierarchy validates
```

**Expected Issues**:

- Parent validation
- Index handling
- Visual feedback
- Error handling

---

### Flow 5: Inline Rename

```
1. Double-click location name
2. Edit text
3. Press Enter
4. WebSocket update call
5. Name updates in tree
```

**Expected Issues**:

- Update API format
- Optimistic updates
- Error rollback

---

## Known Areas of Concern

### 1. Data Structure Mismatches

**Location Object**:

- Design spec expects: `{ id, name, parent_id, modules, ... }`
- Backend provides: `{ id, name, parent_id, modules, ha_area_id, entity_ids, ... }`
- **Action**: Verify UI handles all fields correctly

### 2. Module Config Structure

**Occupancy Config**:

- Design spec: `modules.occupancy.enabled`, `modules.occupancy.default_timeout`
- Backend: Check actual structure in LocationManager
- **Action**: Verify structure matches expectations

### 3. Icon Resolution

**Type/Category Icons**:

- Design spec: Complex resolution logic (explicit → category → type)
- Backend: Stores in `modules._meta`
- **Action**: Test icon resolution with real data

### 4. Entity Filtering

**Area Entities Only**:

- Design spec: Only show entities from location's HA area
- Backend: Location has `ha_area_id`
- **Action**: Verify entity picker filters correctly

### 5. Real-Time Updates

**Occupancy State**:

- Design spec: WebSocket subscription for state changes
- Backend: Check if events are emitted
- **Action**: Test real-time updates work

---

## Automation Strategy

### Unit/Component Tests

**What to Automate**:

- Component rendering with real data
- User interactions (clicks, inputs)
- WebSocket call verification
- Error handling

**Example Test**:

```typescript
it("loads locations from WebSocket and renders tree", async () => {
  const hass = createMockHass();
  hass.callWS = async (req) => {
    if (req.type === "home_topology/locations/list") {
      return { locations: realLocationData };
    }
  };

  const panel = await fixture(
    html`<home-topology-panel .hass=${hass}></home-topology-panel>`
  );
  await waitUntil(() => !panel._loading);

  const tree = panel.shadowRoot!.querySelector("ht-location-tree");
  expect(tree.locations).to.have.length(realLocationData.length);
});
```

**Coverage Goal**: 80%+ for critical components

---

### E2E Tests

**What to Automate**:

- Complete user flows
- Cross-component interactions
- Visual regression
- Performance

**Example Test**:

```typescript
test("create location flow", async ({ page }) => {
  await page.goto("/home-topology");
  await page.click('button:has-text("New Location")');
  await page.fill('input[name="name"]', "Test Room");
  await page.selectOption('select[name="type"]', "room");
  await page.click('button:has-text("Create")');

  await expect(page.locator("text=Test Room")).toBeVisible();
});
```

**Coverage Goal**: All critical user flows

---

### Visual Regression

**What to Test**:

- Component rendering
- Theme switching (light/dark)
- Responsive breakpoints
- Error states

**Tools**:

- Playwright screenshot comparison
- Percy (optional, for cloud hosting)

**Baseline**: Create after manual testing validates UI is correct

---

## Testing Environment Setup

### Option 1: Mock Harness (Fast Iteration)

```bash
cd custom_components/home_topology/frontend
npm run dev
# Open http://localhost:5173/mock-harness.html
```

**Pros**:

- Fast iteration
- No HA setup needed
- Easy debugging

**Cons**:

- Not 100% realistic
- Missing HA-specific features

---

### Option 2: Real HA Instance

```bash
# Symlink integration
ln -s /path/to/home-topology-ha/custom_components/home_topology \
      /path/to/ha-config/custom_components/home_topology

# Restart HA
# Open http://localhost:8123/home-topology
```

**Pros**:

- 100% realistic
- Tests full integration
- Real WebSocket behavior

**Cons**:

- Slower iteration
- Requires HA setup
- Harder to debug

---

### Option 3: Test Server with Real Backend

**Future**: Set up dedicated test server that:

- Runs HA integration
- Provides WebSocket API
- Can be controlled programmatically
- Used by E2E tests

---

## Issue Tracking

### Issue Categories

**Data Mismatches**:

- Backend returns different format than UI expects
- Missing required fields
- Type mismatches

**Missing Features**:

- UI needs data backend doesn't provide
- Functionality not implemented in backend

**Design Issues**:

- Design spec assumptions don't match reality
- User flows don't work as designed

**Performance Issues**:

- Slow rendering
- Memory leaks
- Excessive re-renders

---

## Success Criteria

### Phase 1 Complete When:

- [ ] All components tested manually
- [ ] All issues documented
- [ ] Critical issues prioritized
- [ ] Backend fix issues created

### Phase 2 Complete When:

- [ ] Component test suite >80% coverage
- [ ] Tests run in CI
- [ ] All critical flows automated

### Phase 3 Complete When:

- [ ] E2E tests for all user flows
- [ ] Visual regression baseline
- [ ] Cross-browser tested

---

## Next Steps

1. **Start Phase 1** (ISSUE-030)

   - Test panel with real backend
   - Document findings
   - Create issues for fixes

2. **Set up Automation** (ISSUE-032)

   - Enhance component tests
   - Add Playwright setup
   - Create test utilities

3. **Validate Design Spec** (ISSUE-035)
   - Check each requirement
   - Document gaps
   - Update spec if needed

---

**Last Updated**: 2025-12-10
**Owner**: Mike
