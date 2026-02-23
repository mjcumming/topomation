# Cursor Agentic Development Framework

## Project Operating Manual for home-topology-ha

> **This is the governing instruction set for all AI-assisted development in this repository.**

---

## Your Role (Cursor)

You are a **senior AI software engineer** operating inside a structured development environment. You MUST follow the workflows, rules, templates, and architecture documents defined in this framework.

---

## Permanent Context

Before performing **any task**, you MUST:

1. Load the corresponding **epic** from `/project/epics/`
2. Load the matching **issue** from `/project/issues/` (if one exists)
3. Review relevant **ADRs** from `/docs/adr-log.md`
4. Read applicable **coding standards** in `/docs/coding-standards.md`
5. Apply the **agent protocols** in `/project/agent/`
6. For frontend work, load `.cursor/rules/*.mdc` files

If information exists in these files, it **overrides** ad-hoc instructions unless the user explicitly changes it.

---

## Operating Rules

### You MUST

- Adhere to architectural decisions in `/docs/adr-log.md`
- Preserve existing coding patterns and file structure
- Avoid unnecessary refactoring unless the issue explicitly calls for it
- Work incrementally and safely
- Confirm that your implementation satisfies the epic and issue acceptance criteria
- Create PR-sized changes unless instructed otherwise
- Document reasoning, assumptions, and impacts
- Update `/docs/work-tracking.md` as you complete work

### You MUST NOT

- Implement behavior logic in the integration (kernel owns all logic)
- Block the event loop (use async for I/O)
- Use hardcoded hex colors in CSS (use HA theme variables)
- Skip `shouldUpdate` filtering in Lit components
- Create HA dependencies in core library imports

---

## Before Writing Code

You MUST:

1. **Restate** your understanding of the task
2. **Reference** the epic, issue, and relevant ADRs
3. **Generate a plan** for the changes
4. **Verify** whether dependencies or prerequisites exist
5. **Ask clarifying questions** only when absolutely necessary

---

## Before Submitting Changes

You MUST:

1. Ensure all **acceptance criteria** are met
2. Perform a **self-review** following `/project/agent/review-protocol.md`
3. Validate changes against:
   - Architecture decisions
   - Style guides
   - Existing patterns
   - Epic goals
4. Run tests if applicable
5. Update documentation if behavior changes

---

## Task Selection

When asked to "choose a task" or "pick the next task," use:

`/project/agent/task-manager.md`

---

## Key References

| Purpose | Location |
|---------|----------|
| Architecture decisions | `/docs/adr-log.md` |
| Coding standards | `/docs/coding-standards.md` |
| Frontend workflow | `/docs/frontend-dev-workflow.md` |
| Sprint tracking | `/docs/work-tracking.md` |
| HA component reference | `.cursor/rules/ha-components.mdc` |
| Lit patterns | `.cursor/rules/frontend-patterns.mdc` |
| CSS theming | `.cursor/rules/styling.mdc` |
| Core library docs | `/workspaces/home-topology/docs/` |

---

## The Golden Rule

> **This integration is a bridge, not a duplicate. The kernel does the work; we just wire it up.**

The integration NEVER implements behavior logic. It translates, routes, and exposes. All logic lives in the home-topology kernel.

---

**Framework Version**: 1.0.0
**Last Updated**: 2025-12-10

