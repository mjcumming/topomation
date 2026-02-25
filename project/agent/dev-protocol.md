# Development Protocol - How Cursor Writes Code

> Standards and practices for code generation in topomation.

---

## Before Writing Code

### 1. Understand the Context

- [ ] Read the issue file completely
- [ ] Read the parent epic
- [ ] Review relevant ADRs in `/docs/adr-log.md`
- [ ] Check `/docs/coding-standards.md` for conventions

### 2. Generate a Plan

Before any implementation:

```
## Plan for [Issue Title]

### Understanding
[Restate the problem in your own words]

### Approach
1. Step 1
2. Step 2
3. Step 3

### Files to Modify
- `path/file.py` - What changes
- `path/file.ts` - What changes

### Risks
- Risk 1 and mitigation
- Risk 2 and mitigation
```

### 3. Verify Prerequisites

- [ ] Dependencies are met
- [ ] Required files exist
- [ ] No conflicting work in progress

---

## While Writing Code

### Follow Existing Patterns

1. **Find similar code first** - Search the codebase for similar implementations
2. **Match the style** - Follow existing conventions exactly
3. **Don't reinvent** - Use existing utilities and helpers

### Python Standards

```python
# Import order
from __future__ import annotations      # 1. Future
import logging                          # 2. Standard library
from homeassistant.core import ...     # 3. Home Assistant
from home_topology import ...           # 4. Kernel library
from .const import DOMAIN               # 5. Local integration

# Type hints required
async def my_function(param: str) -> bool:
    ...

# Use @callback for sync event handlers
@callback
def handle_event(event: Event) -> None:
    ...
```

### TypeScript/Lit Standards

```typescript
// Use HA components
import '@ha/components/ha-form';
import '@ha/components/ha-card';

// hass must use attribute: false
@property({ attribute: false }) public hass!: HomeAssistant;

// Always implement shouldUpdate
protected shouldUpdate(changedProps: PropertyValues): boolean {
  if (changedProps.has('_localState')) return true;
  if (changedProps.has('hass')) {
    const oldHass = changedProps.get('hass');
    return oldHass?.areas !== this.hass.areas;
  }
  return true;
}

// Use CSS variables, never hardcoded colors
css`
  .card {
    background: var(--card-background-color);
    color: var(--primary-text-color);
  }
`
```

### The Golden Rule

> **Integration translates, kernel implements.**

Never put behavior logic in this integration. If you're writing business logic, stop and check if it belongs in the home-topology kernel instead.

---

## Code Quality Checks

Before finishing, verify:

### Logic Check
- [ ] Does this satisfy the acceptance criteria?
- [ ] Does it break anything upstream?
- [ ] Is there a simpler solution?
- [ ] Am I duplicating existing code?

### Architecture Check
- [ ] Does this follow the ADRs?
- [ ] Am I putting logic in the right place?
- [ ] Am I using HA patterns correctly?

### Style Check
- [ ] Type hints on all functions?
- [ ] Import order correct?
- [ ] CSS variables instead of hex colors?
- [ ] File naming conventions followed?

---

## Change Size Guidelines

### Ideal Change
- Single issue addressed
- < 500 lines of code
- Clear before/after
- Easy to review

### Too Large
- Multiple unrelated changes
- > 1000 lines of code
- Hard to explain in one sentence
- **Action**: Break into smaller changes

### Too Small
- Incomplete implementation
- Leaves broken state
- **Action**: Include more to reach working state

---

## Documentation Requirements

### Code Comments
- Explain "why", not "what"
- Document non-obvious decisions
- Reference ADRs when relevant

### Update These Files When
- Behavior changes → `/docs/work-tracking.md`
- New patterns introduced → `/docs/coding-standards.md`
- Architecture decisions → `/docs/adr-log.md`

---

**Last Updated**: 2025-12-10

