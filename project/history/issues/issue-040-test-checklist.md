# ISSUE-040 Test Checklist

**Build → Test → Fix Workflow**

---

## Pre-Test: Verify Spec Compliance

### Panel Layout (ui-design.md Section 2.1)

- [ ] Tree Panel: ~40% width, min 300px
- [ ] Details Panel: ~60% width, min 400px
- [ ] Responsive breakpoints work

### Tree Node Structure (Section 3.1.2)

- [ ] Drag handle visible on hover
- [ ] Expand/collapse chevron (only if has children)
- [ ] Icon displays correctly
- [ ] Location name displays
- [ ] Delete button visible on hover

### Icon Resolution (Section 3.1.3)

- [ ] Explicit override works (`modules._meta.icon`)
- [ ] Category inference works (name contains keyword)
- [ ] Type fallback works (`modules._meta.type`)

### Indentation (Section 6.3)

- [ ] 24px per level (uses `--spacing-lg`)

---

## Test in Mock Harness

### 1. Panel Initialization

**Steps**:

1. Open `http://localhost:5173/mock-harness.html`
2. Check browser console for errors
3. Verify panel loads

**Expected**:

- No console errors
- Panel renders two-column layout
- Loading spinner shows briefly
- Locations appear in tree

**Issues Found**:

- [ ] Issue 1: ******\_\_\_\_******
- [ ] Issue 2: ******\_\_\_\_******

---

### 2. Tree Display

**Steps**:

1. Verify locations appear in tree
2. Check hierarchy is correct
3. Verify indentation

**Expected**:

- All locations visible
- Parent-child relationships correct
- Indentation: 24px per level
- Icons display correctly

**Issues Found**:

- [ ] Issue 1: ******\_\_\_\_******
- [ ] Issue 2: ******\_\_\_\_******

---

### 3. Tree Interactions

**Steps**:

1. Click location → should select (blue highlight)
2. Click chevron → should expand/collapse
3. Hover node → drag handle and delete button appear

**Expected**:

- Selection works
- Expand/collapse works
- Hover effects work

**Issues Found**:

- [ ] Issue 1: ******\_\_\_\_******
- [ ] Issue 2: ******\_\_\_\_******

---

### 4. Icon Resolution

**Steps**:

1. Check Kitchen → should show 🍴 (category)
2. Check House → should show ▣ (type: building)
3. Add location with explicit icon → should use that icon

**Expected**:

- Category icons work
- Type icons work
- Explicit override works

**Issues Found**:

- [ ] Issue 1: ******\_\_\_\_******
- [ ] Issue 2: ******\_\_\_\_******

---

## Fix Issues

For each issue found:

1. Document the problem
2. Identify root cause
3. Fix implementation
4. Re-test
5. Mark as fixed

---

## Success Criteria

- [ ] Panel initializes without errors
- [ ] Tree displays all locations
- [ ] Hierarchy is correct
- [ ] Icons display correctly
- [ ] Selection works
- [ ] Expand/collapse works
- [ ] All spec requirements met

---

**Ready to test!**
