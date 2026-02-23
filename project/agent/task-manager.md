# Task Manager - Autonomous Agent Rules

> How Cursor selects and prioritizes tasks when working autonomously.

---

## When to Use This Protocol

Use this protocol when:
- Asked to "choose a task" or "pick the next task"
- Starting a new session without explicit instructions
- Completing a task and looking for the next one

---

## Task Selection Process

### Step 1: Load Context

1. Read `/docs/work-tracking.md` for current sprint status
2. Scan `/project/epics/` for active epics
3. Check `/project/issues/` for ready tasks

### Step 2: Prioritize

Select tasks in this order:

1. **Blocked unblocking** - Tasks that unblock other work
2. **In-progress completion** - Finish started work before new work
3. **High priority issues** - Marked as High in issue files
4. **Same epic continuity** - Stay within current epic for context efficiency
5. **Low-hanging fruit** - Quick wins that build momentum

### Step 3: Validate Selection

Before starting, verify:

- [ ] No unresolved dependencies
- [ ] No human input required (skip if so)
- [ ] Relevant files are accessible
- [ ] Acceptance criteria are clear

### Step 4: Begin Work

1. Load the selected issue
2. Load the parent epic
3. Load relevant ADRs from `/docs/adr-log.md`
4. Generate a plan
5. Ask for approval **only if**:
   - Architecture changes are needed
   - The scope seems larger than expected
   - Requirements are ambiguous

---

## Task Categories

### Ready for Agent (autonomous)
- Clear acceptance criteria
- No external dependencies
- No human decisions needed
- Well-defined scope

### Needs Human Input (skip or ask)
- Unclear requirements
- Design decisions pending
- External API or service dependencies
- User preference questions

### Blocked (skip)
- Depends on incomplete work
- Waiting on external factors
- Requires resources not available

---

## Session Continuity

When resuming work:

1. Check `/docs/work-tracking.md` for "In Progress" items
2. Review any partial implementations
3. Complete in-progress work before starting new tasks
4. Update work-tracking.md as tasks complete

---

## Escalation

If no suitable tasks are found:

1. Report current status
2. Suggest potential next steps
3. Ask for guidance

If a task is more complex than expected:

1. Stop and reassess
2. Break into smaller issues
3. Ask if the scope change is acceptable

---

**Last Updated**: 2025-12-10

