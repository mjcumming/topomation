# ISSUE-040 Implementation Plan

**Build → Test → Fix Workflow**

---

## Step 1: Review Design Spec Requirements

### Panel Layout (ui-design.md Section 2.1)

- Tree Panel: ~40% width, min 300px
- Details Panel: ~60% width, min 400px
- Responsive: Desktop side-by-side, Mobile stacked

### Tree Panel Header (Section 3.1.1)

- Title: "Home Topology"
- Subtitle: "Model your space and attach behavior modules."
- Buttons: "+ New Location" (outline), "Save Changes" (primary)

### Tree Node Structure (Section 3.1.2)

```
[Drag] [Expand] [Icon] Location Name                    [Delete] [Status]
```

- Drag handle: 6-dot grip, visible on hover
- Expand/Collapse: Chevron, only if has children
- Icon: Based on type (Section 3.1.3)
- Name: Editable on double-click
- Delete: ⊗ icon, visible on hover
- Status: Optional indicator

### Tree Interactions (Section 3.1.4)

- Select: Click node → highlights, loads inspector
- Expand/Collapse: Click chevron → shows/hides children
- Indentation: 24px per level (Section 6.3)

### Icon Resolution (Section 3.1.3)

Priority:

1. Explicit override: `modules._meta.icon`
2. Category match: Name contains keyword
3. Type fallback: `modules._meta.type` → base icon

---

## Step 2: Build According to Spec

### 2.1 Panel Component

- Fix layout to match spec (40/60 split)
- Fix initialization lifecycle
- Ensure WebSocket call happens
- Fix state management

### 2.2 Tree Component

- Build hierarchy rendering (parent/child with indentation)
- Implement expand/collapse
- Implement icon resolution logic
- Implement selection highlighting
- Add empty state

### 2.3 Icon Resolution

- Create icon resolution function
- Map types to MDI icons
- Map categories to MDI icons
- Implement priority logic

---

## Step 3: Automated Tests

### Component Tests

```typescript
// Panel initialization
it("loads locations on initialization", async () => {
  // Test WebSocket call
  // Test loading state
  // Test data received
});

// Tree rendering
it("renders hierarchy correctly", async () => {
  // Test indentation
  // Test parent-child relationships
  // Test icons
});

// Tree interactions
it("selects location on click", async () => {
  // Test click handler
  // Test highlight
  // Test inspector update
});

it("expands/collapses on chevron click", async () => {
  // Test expand
  // Test collapse
  // Test children visibility
});
```

---

## Step 4: Test and Fix

1. Run automated tests
2. Manual test in mock-harness
3. Compare against spec
4. Document mismatches
5. Fix issues
6. Re-test
7. Iterate

---

## Implementation Checklist

### Panel Component

- [ ] Layout matches spec (40/60 split)
- [ ] Initialization calls WebSocket
- [ ] Loading state works
- [ ] Error state works
- [ ] State management correct

### Tree Component

- [ ] Hierarchy renders correctly
- [ ] Indentation: 24px per level
- [ ] Expand/collapse works
- [ ] Icons display correctly
- [ ] Selection works
- [ ] Empty state works

### Icon Resolution

- [ ] Explicit override works
- [ ] Category inference works
- [ ] Type fallback works
- [ ] All icon mappings correct

### Tests

- [ ] Panel initialization test
- [ ] Tree rendering test
- [ ] Selection test
- [ ] Expand/collapse test

---

**Ready to build!**
