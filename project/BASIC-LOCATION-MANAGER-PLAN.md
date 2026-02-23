# Basic Location Manager - Implementation Plan

**Epic**: [EPIC-005] Basic Location Manager - Get It Working
**Created**: 2025-12-10
**Status**: Active

---

## Goal

Get the basic location manager UI working with mock data. Focus on core CRUD operations and tree manipulation. Skip occupancy/config for now.

---

## Current State Assessment

### What Exists ✅

- Panel component (`home-topology-panel.ts`)
- Tree component (`ht-location-tree.ts`)
- Inspector component (`ht-location-inspector.ts`)
- Location dialog (`ht-location-dialog.ts`)
- Mock harness (`mock-harness.html`)
- Mock hass factory (`mock-hass.ts`) with WebSocket simulation
- Mock location data (`MOCK_LOCATIONS`)

### What's Broken ❌

- Panel initialization (may not be calling WebSocket correctly)
- State management (locations may not be updating)
- Component lifecycle (may not be following Lit patterns)
- Tree rendering (may not be receiving/displaying data)
- CRUD operations (dialogs may not be working)

---

## Implementation Order

### Phase 1: Panel Initialization (ISSUE-040) - START HERE

**Goal**: Panel loads and displays mock locations

**Tasks**:

1. Fix component lifecycle (connectedCallback, willUpdate)
2. Ensure WebSocket call happens on initialization
3. Verify mock-hass returns data correctly
4. Fix state management (locations array updates)
5. Test in mock-harness

**Success Criteria**:

- Panel loads without errors
- WebSocket call visible in console
- Locations appear in tree
- Loading/error states work

---

### Phase 2: Tree Display (ISSUE-041)

**Goal**: Tree renders hierarchy correctly

**Tasks**:

1. Fix tree component to receive locations prop
2. Implement hierarchy rendering (parent/child relationships)
3. Add expand/collapse functionality
4. Add selection highlighting
5. Display icons based on type

**Success Criteria**:

- Tree shows all locations
- Hierarchy is correct (indentation)
- Expand/collapse works
- Selection works

---

### Phase 3: Create Location (ISSUE-042)

**Goal**: Create new locations via dialog

**Tasks**:

1. Fix location dialog component
2. Wire "New Location" button to open dialog
3. Implement form validation
4. Call WebSocket create endpoint
5. Update tree with new location

**Success Criteria**:

- Dialog opens when clicking "New Location"
- Form validates correctly
- Create succeeds via WebSocket
- New location appears in tree

---

### Phase 4: Update Location (ISSUE-043)

**Goal**: Rename locations inline

**Tasks**:

1. Implement double-click to edit
2. Inline text editing
3. Call WebSocket update endpoint
4. Update tree display

**Success Criteria**:

- Double-click enables edit mode
- Text input works
- Update succeeds via WebSocket
- Tree updates with new name

---

### Phase 5: Delete Location (ISSUE-044)

**Goal**: Delete locations with confirmation

**Tasks**:

1. Add delete button to tree nodes
2. Show confirmation dialog
3. Call WebSocket delete endpoint
4. Remove from tree

**Success Criteria**:

- Delete button appears on hover
- Confirmation dialog shows
- Delete succeeds via WebSocket
- Location removed from tree

---

### Phase 6: Drag and Drop (ISSUE-045)

**Goal**: Reorder and move locations in tree

**Tasks**:

1. Fix SortableJS integration
2. Handle drag events
3. Validate hierarchy constraints
4. Call WebSocket reorder endpoint
5. Update tree structure

**Success Criteria**:

- Drag handles appear
- Drag-and-drop works smoothly
- Hierarchy constraints enforced
- Reorder succeeds via WebSocket
- Tree updates correctly

---

### Phase 7: Inspector Panel (ISSUE-046)

**Goal**: Show location details when selected

**Tasks**:

1. Fix inspector to receive location prop
2. Display location information
3. Show basic details (name, ID, type)
4. Skip occupancy/config for now

**Success Criteria**:

- Inspector shows when location selected
- Location details display correctly
- Empty state shows when nothing selected

---

## Best Practices to Follow

### From Documentation

1. **shouldUpdate filtering** - Prevent unnecessary re-renders
2. **Lit lifecycle** - Use connectedCallback, willUpdate correctly
3. **HA components** - Use ha-form, ha-dialog where possible
4. **Event handling** - CustomEvent with bubbles/composed
5. **Error handling** - User-friendly error messages

### Code Patterns

```typescript
// shouldUpdate pattern
protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (changedProps.has('_locations') || changedProps.has('_loading')) {
    return true;
  }
  if (changedProps.has('hass')) {
    const oldHass = changedProps.get('hass');
    return oldHass?.areas !== this.hass.areas;
  }
  return true;
}

// WebSocket call pattern
private async _loadLocations(): Promise<void> {
  this._loading = true;
  try {
    const result = await this.hass.callWS<{ locations: Location[] }>({
      type: "home_topology/locations/list",
    });
    this._locations = result.locations;
  } catch (err) {
    this._error = err.message;
  } finally {
    this._loading = false;
  }
}
```

---

## Testing Strategy

### Manual Testing in Mock Harness

1. Open `http://localhost:5173/mock-harness.html`
2. Check console for errors
3. Verify WebSocket calls
4. Test each operation
5. Document issues found

### What to Test

- Panel loads
- Locations display
- Create works
- Update works
- Delete works
- Drag-and-drop works
- Inspector shows details

---

## Success Metrics

**Epic Complete When**:

- [ ] Panel initializes correctly
- [ ] Tree displays locations
- [ ] Can create locations
- [ ] Can update locations
- [ ] Can delete locations
- [ ] Can reorder locations
- [ ] Inspector shows details
- [ ] All operations work with mock data

---

**Next Step**: Start with ISSUE-040 - Panel Initialization
