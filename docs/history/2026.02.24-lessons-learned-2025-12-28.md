# Lessons Learned: Mock Component Failures (2025-12-28)

## What Happened

Multiple core UI features were broken for an extended period:
- Icons showing as "?" instead of symbols
- New location dialog not accepting input
- Rename via double-click not working
- Parent dropdown listing invalid options

All unit tests passed (25/25), yet the harness was non-functional.

---

## Root Causes

### 1. Lit Decorator + Vite Incompatibility (CRITICAL)

**The Problem:**

Lit's `@property()` decorator generates property accessors at runtime. However, Vite's dev mode (ESM + HMR) can fail to properly transform decorators, causing properties to not be reactive.

**The Symptom:**

```typescript
// This LOOKS correct but fails silently in Vite dev
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";  // ← Property never receives value
}
```

The property is defined but never bound to the attribute. Component renders with `icon = ""` regardless of what's passed.

**The Fix:**

ALWAYS add explicit `static properties` alongside decorators:

```typescript
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";

  // ✅ REQUIRED: Explicit static properties for Vite compatibility
  static properties = {
    icon: { type: String },
  };
}
```

**Why This Wasn't Caught:**

- Unit tests use `@open-wc/testing` which doesn't have this issue (different module loading)
- Production builds work (Vite build applies full transforms)
- Only the dev harness was broken

### 2. No Harness Smoke Test in CI

**The Problem:**

We had unit tests but no automated verification that the harness actually works. The workflow was:
1. Write code
2. Run `npm test` (unit tests)
3. Assume harness works

**The Fix:**

Add a harness smoke test that runs in CI:

```javascript
// harness-smoke.test.ts
describe('Harness Smoke Tests', () => {
  it('loads panel without errors', async () => {
    // Load the actual harness HTML
    // Verify key elements render
    // Verify icons render correctly (not "?")
    // Verify form accepts input
  });
});
```

### 3. Missing Mock Component Verification Checklist

**The Problem:**

The checklist in `mock-component-strategy.md` said:
- [ ] Create minimal implementation
- [ ] Guard registration
- [ ] Test in harness

But "test in harness" wasn't defined. What does that mean? Click around? There was no formal verification.

**The Fix:**

Add explicit verification steps to the checklist:

```markdown
## Checklist for Adding/Modifying Mock Components

- [ ] Add explicit `static properties` (not just decorators)
- [ ] Register with guard: `if (!customElements.get("name"))`
- [ ] Verify in harness:
  - [ ] Open DevTools → Elements → Find component
  - [ ] Verify properties are bound (not empty/undefined)
  - [ ] Verify events fire (check console logs)
  - [ ] Verify visual output (icons render, text appears)
- [ ] Add smoke test for critical paths
```

### 4. Old Code Cleanup Not Verified

**The Problem:**

When we simplified the type system (floor/area only), we didn't grep the entire codebase for old type names. Result: `"room"` as a fallback type still existed in `mock-hass.ts`.

**The Fix:**

After any schema/type change, run:

```bash
# Find ALL usages of old types
grep -rn '"room"\|"zone"\|"building"' --include="*.ts" | grep -v node_modules
```

And add this to the refactoring checklist in `coding-standards.md`.

---

## Documentation Updates Required

### 1. Update `mock-component-strategy.md`

Add section:

```markdown
## CRITICAL: Vite Dev Mode Compatibility

Lit decorators (`@property`, `@state`) may not work correctly in Vite's dev mode due to ESM transform limitations.

**ALWAYS add explicit `static properties` to all mock components:**

\`\`\`typescript
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";

  // REQUIRED for Vite dev mode
  static properties = {
    icon: { type: String },
  };
}
\`\`\`

This is NOT required for production builds, but IS required for the dev harness to work.
```

### 2. Update Checklist in `mock-component-strategy.md`

Change Section 8 to:

```markdown
## 8. Checklist for Adding New HA Component Mocks

When you need to mock a new HA component:

- [ ] Identify the component's input properties (check HA frontend source)
- [ ] Identify the component's output events (check HA frontend source)
- [ ] Identify any slots the component uses
- [ ] Create minimal implementation in `mock-ha-components.ts`
- [ ] **ADD `static properties` declaration (CRITICAL for Vite)**
- [ ] Guard registration with `if (!customElements.get("component-name"))`
- [ ] **Verify in harness manually:**
  - [ ] Properties receive values (check DevTools)
  - [ ] Events fire (check console)
  - [ ] Visual rendering is correct
- [ ] Add smoke test for the component
- [ ] Update this document with the new mock's contract
```

### 3. Update `frontend-dev-workflow.md`

Add section:

```markdown
## Pre-Commit Verification Checklist

Before committing any frontend changes:

1. **Run tests**: `npm test` (all must pass)
2. **Build**: `npm run build` (must succeed)
3. **Verify harness manually**:
   - [ ] Open http://localhost:5173/
   - [ ] Icons render correctly (▶ ⋮⋮ 🗑️, not "?")
   - [ ] Click "+ New Location" → dialog opens, accepts input
   - [ ] Double-click location name → inline edit works
   - [ ] Drag location → drop works
   - [ ] Create nested locations (3+ levels)
4. **Check for regressions**: Did any previously working feature break?
```

### 4. Add to `coding-standards.md`

```markdown
## Type/Schema Refactoring Checklist

When changing types, schemas, or data structures:

1. Define new types in `types.ts`
2. **Grep for ALL old type references**:
   ```bash
   grep -rn '"old_type_name"' --include="*.ts" | grep -v node_modules
   ```
3. Update all references (not just obvious ones)
4. Update mock data in `mock-hass.ts`
5. Update tests with new type names
6. Verify harness still works with new types
```

---

## Process Changes

### 1. Add Harness Smoke Test to CI

The harness must be tested in CI, not just unit tests.

### 2. Mandatory Harness Verification Before PR

Before any PR is merged:
- Screenshot of harness showing feature works
- Or link to passing E2E test

### 3. "Done" Definition Update

A task is not "done" when:
- ❌ Unit tests pass
- ❌ Build succeeds

A task IS "done" when:
- ✅ Unit tests pass
- ✅ Build succeeds
- ✅ Harness verification shows feature works
- ✅ No regressions in existing features

---

## Action Items

1. [ ] Update `mock-component-strategy.md` with Vite compatibility section
2. [ ] Update checklist in `mock-component-strategy.md`
3. [ ] Update `frontend-dev-workflow.md` with pre-commit checklist
4. [ ] Update `coding-standards.md` with refactoring checklist
5. [ ] Add harness smoke test to CI pipeline
6. [ ] Review all mock components for `static properties` (DONE in this session)

---

## Summary

| Gap | Root Cause | Fix |
|-----|-----------|-----|
| Icons broken | Missing `static properties` | Always add explicit static properties |
| Form not binding | Missing `static properties` | Always add explicit static properties |
| Old code left behind | No grep verification | Grep for old types after refactoring |
| Tests passed but harness broken | Unit tests don't test harness | Add harness smoke tests |
| "Done" prematurely | No visual verification | Mandatory harness check before commit |

---

**Document Status**: Active
**Date**: 2025-12-28
**Author**: Mike + Claude




