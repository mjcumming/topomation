# Agentic Development Framework - Quick Start

> How to use the framework in your daily workflow

---

## First Session Setup

When starting a new Cursor session, tell Cursor:

```
"Load the Agentic Development Framework from /project/README.md
and show me the current epic status."
```

This ensures Cursor has full context before starting work.

---

## Daily Workflow

### 1. Check Current Work

```
"What's currently in progress according to work-tracking.md and the epics?"
```

### 2. Select Next Task

**Option A: Let Cursor choose**
```
"Use the task manager protocol to select the next task."
```

**Option B: Specify task**
```
"Work on ISSUE-001 from EPIC-001 Backend Integration."
```

### 3. Before Coding

Cursor will automatically:
- Load the relevant epic
- Load the issue (if it exists)
- Review relevant ADRs
- Generate a plan
- Ask for approval if architecture changes needed

### 4. After Coding

Tell Cursor:
```
"Perform a self-review using the review protocol."
```

Cursor will check:
- Requirements met
- Architecture aligned
- Code quality standards
- Documentation updated

---

## Creating New Issues

When you identify new work:

```
"Create a new issue file for [task description] under EPIC-001."
```

Cursor will:
- Use the issue template
- Fill in objective and requirements
- Link to relevant epic and ADRs
- Assign a unique issue number

---

## Checking Progress

### Epic Level
```
"Show me the status of all epics."
```

### Issue Level
```
"List all issues for EPIC-001 and their status."
```

### Overall
```
"Update me on overall project completion and next milestones."
```

---

## Making Architecture Decisions

When you make a significant decision:

```
"We decided to use [approach]. Create an ADR for this in docs/adr-log.md."
```

Cursor will follow the existing ADR template.

---

## Common Commands

| What You Want | Say This |
|---------------|----------|
| Start fresh | "Load the framework and check current status" |
| Pick a task | "Select next task using task manager protocol" |
| Review work | "Self-review using review protocol" |
| Create issue | "Create issue for [task] in EPIC-[number]" |
| Check status | "Epic status and completion percentage" |
| Update tracking | "Update work-tracking.md with completed work" |

---

## Tips for Success

### DO
- ✅ Start every session by loading the framework
- ✅ Let Cursor use the protocols (they're designed for consistency)
- ✅ Create issue files for significant tasks
- ✅ Update work-tracking.md as you complete work
- ✅ Reference epics when giving instructions

### DON'T
- ❌ Skip the self-review step (it catches errors early)
- ❌ Work without loading relevant epic context
- ❌ Create ad-hoc tasks outside the epic structure
- ❌ Forget to update issue status when complete

---

## Framework Files Reference

```
/project/
├── README.md                    ← Start here (master instructions)
├── QUICK-START.md              ← This file
├── roadmap.md                  ← Multi-week timeline
├── agent/
│   ├── task-manager.md         ← How to select tasks
│   ├── dev-protocol.md         ← How to write code
│   └── review-protocol.md      ← How to review
├── epics/
│   ├── epic-template.md        ← Template for new epics
│   ├── epic-001-*.md           ← Active epic
│   ├── epic-002-*.md           ← Pending epic
│   └── epic-003-*.md           ← Pending epic
└── issues/
    ├── issue-template.md       ← Template for new issues
    └── issue-*.md              ← Created as needed
```

---

## Example Session

```
You: "Load the framework and pick the next task."

Cursor: [Loads /project/README.md, scans epics and issues]
        "Current focus is EPIC-001 Backend Integration (30% complete).
        Next priority task: Wire WebSocket handlers to LocationManager.
        Should I create an issue file for this?"

You: "Yes, create the issue."

Cursor: [Creates issue-001-websocket-handlers.md]
        "Issue created. Ready to start implementation?
        I'll need to modify websocket_api.py and __init__.py."

You: "Yes, proceed."

Cursor: [Implements changes following dev-protocol.md]
        [Completes work]
        "Implementation complete. Performing self-review..."
        [Reviews using review-protocol.md]
        "Review complete. All criteria met. Ready to commit."

You: "Update work-tracking.md and mark the issue complete."

Cursor: [Updates documentation]
        "Done. Backend Integration is now 45% complete."
```

---

## Troubleshooting

### "Cursor isn't following the protocols"

**Solution**: Start the session with explicit loading:
```
"Load /project/README.md before doing anything else."
```

### "I don't know what to work on next"

**Solution**: Let the task manager decide:
```
"Use task-manager.md to select the highest priority task."
```

### "Work feels disorganized"

**Solution**: Create issue files for active work:
```
"Create issues for all pending tasks in EPIC-001."
```

---

## Adapting for Other Projects

To use this framework on a new project:

1. Copy entire `/project` folder
2. Update `project/README.md` with new project context
3. Create new epics for that project
4. Update roadmap with that project's timeline
5. Add framework reference to that project's `.cursorrules`

---

**Questions?** See `/project/README.md` for detailed instructions.

Last Updated: 2025-12-10

