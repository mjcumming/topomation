# Review Protocol - How Cursor Self-Reviews

> Checklist for reviewing your own work before considering it complete.

---

## When to Use This Protocol

- After completing implementation work
- Before marking an issue as complete
- When asked to review changes

---

## Self-Review Checklist

### 1. Requirements Verification

Load the issue file and verify:

- [ ] All acceptance criteria are met
- [ ] All functional requirements implemented
- [ ] Edge cases handled
- [ ] No requirements missed or misunderstood

### 2. Architecture Alignment

- [ ] Changes follow relevant ADRs
- [ ] No behavior logic in integration (belongs in kernel)
- [ ] HA patterns used correctly
- [ ] File organization matches project structure

### 3. Code Quality

#### Python
- [ ] Type hints on all functions
- [ ] Async used for I/O operations
- [ ] @callback used for sync event handlers
- [ ] Import order follows standard
- [ ] Error handling present
- [ ] Logging at appropriate levels

#### TypeScript/Lit
- [ ] `attribute: false` on hass property
- [ ] `shouldUpdate` implemented
- [ ] CSS variables used (no hex colors)
- [ ] HA components used where available
- [ ] Event cleanup in disconnectedCallback

### 4. Testing

- [ ] Existing tests still pass
- [ ] New tests added if required by issue
- [ ] Tests are meaningful (not just mock verification)

### 5. Documentation

- [ ] Code comments explain "why"
- [ ] work-tracking.md updated
- [ ] ADR added if architecture decision made
- [ ] README updated if user-facing changes

---

## Common Issues to Catch

### Logic Errors
- Off-by-one errors
- Null/undefined not handled
- Race conditions in async code
- State not cleaned up

### Pattern Violations
- Business logic in integration (should be in kernel)
- Hardcoded values that should be configurable
- Duplicate code that should be extracted
- Overly complex solutions

### Style Issues
- Inconsistent naming
- Wrong import order
- Missing type hints
- Non-standard formatting

### Missing Pieces
- Error handling absent
- Loading states not shown
- Cleanup not performed
- Edge cases ignored

---

## Review Output Format

After self-review, summarize:

```markdown
## Review Summary

### Criteria Met
- [x] Requirement 1
- [x] Requirement 2

### Issues Found
- Issue 1: Description and fix
- Issue 2: Description and fix

### Remaining Concerns
- Concern 1: Why it's acceptable or needs discussion

### Recommendation
Ready to merge / Needs changes / Needs discussion
```

---

## If Issues Are Found

1. **Minor issues**: Fix immediately
2. **Moderate issues**: Fix and re-review
3. **Major issues**: Stop, reassess approach, possibly consult

---

## Approval Criteria

Changes are ready when:

- [ ] All checklist items pass
- [ ] No blocking issues remain
- [ ] Implementation matches issue requirements
- [ ] Code is clean and follows standards

---

**Last Updated**: 2025-12-10

