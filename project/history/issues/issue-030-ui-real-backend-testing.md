# Issue [ISSUE-030]: Test UI with Real WebSocket Backend

**Epic**: [EPIC-004] UI Integration Testing & Real-World Validation
**Status**: In Progress
**Created**: 2025-12-10
**Priority**: High

---

## Objective

Test all UI components with the real WebSocket backend (now wired in ISSUE-001) to discover data mismatches, missing features, and integration issues. This is the first step in validating the UI design spec against actual backend behavior.

---

## Requirements

### Functional Requirements

- Test home-topology-panel with real WebSocket calls
- Test ht-location-tree with real location hierarchy
- Test ht-location-inspector with real location data
- Test all dialogs (create, edit, entity config, rule editor)
- Verify data flows match design spec expectations
- Document every mismatch or issue found

### Constraints

- Must use real backend (not mocks) per testing philosophy
- Can use mock-harness.html for initial testing
- Must test in actual HA environment for final validation
- Document issues as they're discovered

### Edge Cases

- Empty location list (no locations created yet)
- Large hierarchies (100+ locations)
- Concurrent modifications
- Network errors during WebSocket calls
- Invalid data from backend

---

## Architecture Notes

**Relevant ADRs**:

- ADR-HA-001: Lit for Frontend
- ADR-HA-005: Location Type Storage via `_meta` Module

**Dependencies**:

- ISSUE-001: WebSocket handlers must be wired (✅ Complete)

**Affected Files**:

- `custom_components/home_topology/frontend/home-topology-panel.ts`
- `custom_components/home_topology/frontend/ht-location-tree.ts`
- `custom_components/home_topology/frontend/ht-location-inspector.ts`
- `custom_components/home_topology/frontend/ht-location-dialog.ts`
- `custom_components/home_topology/frontend/ht-entity-config-dialog.ts`
- `custom_components/home_topology/frontend/ht-rule-dialog.ts`
- `custom_components/home_topology/frontend/mock-harness.html`

---

## Acceptance Criteria

- [ ] Panel loads locations from real WebSocket API
- [ ] Tree displays hierarchy correctly
- [ ] Inspector shows location details correctly
- [ ] Create location dialog works with real backend
- [ ] Update location works with real backend
- [ ] Delete location works with real backend
- [ ] Entity configuration works with real backend
- [ ] All discovered issues documented in ISSUE-031
- [ ] Test results recorded (what works, what doesn't)

---

## Agent Instructions

1. Load this issue, EPIC-004, and relevant ADRs
2. Review ui-design.md to understand expected behavior
3. Set up testing environment:
   - Use mock-harness.html with real WebSocket calls
   - Or test in actual HA instance
4. Test each component systematically:
   - Panel initialization
   - Location list loading
   - Tree rendering
   - Inspector display
   - Dialog operations
   - Error handling
5. Document findings in ISSUE-031
6. Create issues for backend fixes as needed
7. Update this issue status

---

## Testing Checklist

### Panel Initialization

- [ ] Panel loads without errors
- [ ] WebSocket call to `locations/list` succeeds
- [ ] Loading state displays correctly
- [ ] Error state handles failures gracefully

### Tree Panel

- [ ] Locations render in correct hierarchy
- [ ] Expand/collapse works
- [ ] Selection highlights correctly
- [ ] Icons display based on type/category
- [ ] Empty state shows when no locations
- [ ] Drag handles appear on hover

### Inspector Panel

- [ ] Shows selected location details
- [ ] Occupancy tab displays config correctly
- [ ] Actions tab displays (if implemented)
- [ ] Module configs load from `modules` object
- [ ] Empty state when no location selected

### Location Dialogs

- [ ] Create dialog opens
- [ ] Form validation works
- [ ] Create succeeds via WebSocket
- [ ] New location appears in tree
- [ ] Edit dialog opens with current values
- [ ] Update succeeds via WebSocket
- [ ] Changes reflect in UI

### Entity Configuration

- [ ] Entity picker shows area entities
- [ ] Config dialog opens
- [ ] Trigger mode selection works
- [ ] Timeout inputs work
- [ ] Save persists to backend
- [ ] Config appears in inspector

### Error Handling

- [ ] Network errors show user-friendly messages
- [ ] Validation errors display inline
- [ ] Invalid data handled gracefully
- [ ] Retry mechanisms work (if implemented)

### Real-Time Updates

- [ ] Occupancy state changes update UI
- [ ] Location changes sync across components
- [ ] WebSocket subscriptions work

---

## Notes

**Testing Approach**:

1. Start with mock-harness.html (faster iteration)
2. Test each component in isolation
3. Test full user flows
4. Move to real HA instance for final validation

**What to Look For**:

- Data format mismatches (backend returns X, UI expects Y)
- Missing fields (UI needs data backend doesn't provide)
- Extra fields (backend provides data UI doesn't use)
- Type mismatches (string vs number, null vs undefined)
- Array vs object structure differences
- Icon/type resolution issues
- Module config structure mismatches

**Documentation Format**:
For each issue found, document:

- Component affected
- Expected behavior (from design spec)
- Actual behavior
- Backend data structure
- UI data expectations
- Suggested fix

---

**Ready for testing!**
