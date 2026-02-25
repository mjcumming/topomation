# Issue [ISSUE-040]: Panel Initialization and Basic Tree Functionality

**Epic**: [EPIC-005] Basic Location Manager - Get It Working
**Status**: In Progress
**Created**: 2025-12-10
**Priority**: High

---

## Objective

Build the panel initialization and basic tree functionality according to the design spec (ui-design.md). Panel must load mock location data, display hierarchy correctly, and support basic tree interactions (expand/collapse, selection). Build it right the first time per spec, then test and fix.

---

## Requirements

### Functional Requirements

**Panel Initialization** (from ui-design.md Section 2):

- Panel loads with two-column layout (Tree ~40%, Details ~60%)
- Panel calls `home_topology/locations/list` on initialization
- Mock WebSocket returns mock location data
- Loading state displays while fetching
- Error state displays if fetch fails

**Tree Functionality** (from ui-design.md Section 3.1):

- Tree displays location hierarchy with correct indentation
- Each node shows: [Expand] [Icon] Location Name
- Expand/collapse chevron (only if has children)
- Type icons based on `modules._meta.type` (per Section 3.1.3)
- Click node to select (highlights, loads inspector)
- Empty state when no locations
- Responsive behavior (per Section 2.2)

### Constraints

- Must work in mock-harness.html (no real HA needed)
- Must use mock-hass.ts for WebSocket simulation
- Must follow Lit lifecycle patterns
- Must use `shouldUpdate` to prevent unnecessary re-renders

### Edge Cases

- Empty location list (no locations yet)
- Network error during WebSocket call
- Invalid data format from backend
- Component unmounts before data loads

---

## Architecture Notes

**Relevant ADRs**:

- ADR-HA-001: Lit for Frontend

**Dependencies**:

- mock-hass.ts must have working WebSocket simulation
- mock-harness.html must be set up correctly

**Affected Files**:

- `custom_components/home_topology/frontend/home-topology-panel.ts`
- `custom_components/home_topology/frontend/mock-hass.ts`
- `custom_components/home_topology/frontend/mock-harness.html`

---

## Acceptance Criteria

### Panel Initialization

- [ ] Panel loads in mock-harness without console errors
- [ ] Two-column layout renders correctly (Tree ~40%, Details ~60%)
- [ ] WebSocket call to `locations/list` is made on initialization
- [ ] Mock data is returned correctly
- [ ] Loading spinner shows while fetching
- [ ] Error message shows if WebSocket fails

### Tree Display (per ui-design.md Section 3.1)

- [ ] Tree displays all locations in correct hierarchy
- [ ] Parent-child relationships shown via indentation (24px per level)
- [ ] Expand/collapse chevron appears only for nodes with children
- [ ] Icons display based on location type (from `modules._meta.type`)
- [ ] Location names display correctly
- [ ] Empty state shows when no locations

### Tree Interactions (per ui-design.md Section 3.1.4)

- [ ] Click node selects it (blue highlight)
- [ ] Selected node triggers inspector update
- [ ] Expand/collapse works via chevron click
- [ ] Tree scrolls correctly for long lists

### Automated Tests

- [ ] Component test: Panel initializes and loads data
- [ ] Component test: Tree renders hierarchy correctly
- [ ] Component test: Selection works
- [ ] Component test: Expand/collapse works

---

## Agent Instructions

**Workflow: Build → Test → Fix**

1. **Review Design Spec First**

   - Read `docs/ui-design.md` Sections 2 (Layout) and 3.1 (Tree Panel)
   - Understand exact requirements before coding
   - Note all visual specifications (dimensions, spacing, icons)

2. **Build According to Spec**

   - Implement panel layout per Section 2.1 (Tree ~40%, Details ~60%)
   - Implement tree structure per Section 3.1.2 (node structure)
   - Implement icons per Section 3.1.3 (type-based icons)
   - Implement interactions per Section 3.1.4 (click, expand/collapse)
   - Follow patterns from `.cursor/rules/frontend-patterns.mdc`

3. **Set Up Automated Tests**

   - Create component tests for panel initialization
   - Create component tests for tree rendering
   - Create component tests for interactions
   - Use web-test-runner (already configured)

4. **Test What We Built**

   - Run automated tests
   - Manual test in mock-harness.html
   - Compare against design spec requirements

5. **Fix Issues Found**
   - Document mismatches
   - Fix implementation
   - Re-test
   - Iterate until spec is met

**Key Files to Review**:

- `docs/ui-design.md` - Design specification
- `custom_components/home_topology/frontend/home-topology-panel.ts` - Panel component
- `custom_components/home_topology/frontend/ht-location-tree.ts` - Tree component
- `.cursor/rules/frontend-patterns.mdc` - Lit patterns
- `.cursor/rules/ha-components.mdc` - HA component reference

---

## Implementation Checklist

### Component Lifecycle

- [ ] `connectedCallback` schedules initial load
- [ ] `willUpdate` checks if hass is available
- [ ] `_loadLocations` method calls WebSocket
- [ ] Loading state managed correctly
- [ ] Error state handled

### WebSocket Integration

- [ ] `hass.callWS` called with correct type
- [ ] Response handled correctly
- [ ] Error handling for failed calls
- [ ] Timeout handling (if needed)

### State Management

- [ ] `_locations` state array
- [ ] `_loading` state boolean
- [ ] `_error` state string | undefined
- [ ] State updates trigger re-render

### Mock Data

- [ ] mock-hass.ts returns mock locations
- [ ] Mock data structure matches expected format
- [ ] Mock data includes hierarchy (parent_id relationships)

### Testing

- [ ] Panel loads in mock-harness
- [ ] Console shows WebSocket call
- [ ] Locations appear in tree
- [ ] Loading state works
- [ ] Error state works

---

## Notes

**Current Problems** (to fix):

- Component may not be initializing correctly
- WebSocket call may not be happening
- State may not be updating
- Tree may not be receiving data

**Key Patterns to Follow**:

```typescript
// From frontend-patterns.mdc
protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (changedProps.has('_locations') || changedProps.has('_loading')) {
    return true;
  }
  // Filter hass updates
  if (changedProps.has('hass')) {
    const oldHass = changedProps.get('hass');
    // Only update if areas changed (if we use areas)
    return oldHass?.areas !== this.hass.areas;
  }
  return true;
}
```

**Mock Data Format**:

```typescript
const MOCK_LOCATIONS = [
  {
    id: "house",
    name: "House",
    parent_id: null,
    is_explicit_root: true,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: "building" } },
  },
  // ... more locations
];
```

---

**Let's get this working!**
