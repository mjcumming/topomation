# Project Execution Framework

This directory defines execution workflow for planning and delivery.  
Architecture and policy authority live in `docs/`, not `project/`.

## Scope

- `epics/`: feature-level planning and sequencing
- `issues/`: issue-level implementation tasks and acceptance criteria
- `agent/`: workflow protocols for implementation and review
- `roadmap.md`: strategic release direction only
- `history/`: archived legacy planning/framework docs

## Operating Rules

1. For architecture or contract decisions, follow `docs/architecture.md`, `docs/bidirectional-sync-design.md`, and `docs/adr-log.md`.
2. Keep issue files as the source of truth for implementation-level scope and acceptance criteria.
3. Keep `docs/work-tracking.md` as the source of truth for current sprint execution status.
4. Keep `project/roadmap.md` strategic; avoid detailed task or percent-complete duplication.
5. Archive obsolete planning docs to `project/history/` instead of deleting context.

## Minimal Workflow

1. Choose or create an issue in `project/issues/`.
2. Confirm dependencies and constraints from epics/ADRs.
3. Implement and validate changes.
4. Update issue status and `docs/work-tracking.md` if sprint status changed.
5. Archive transient planning docs when no longer active.

## References

- Docs map: `docs/index.md`
- Work tracker: `docs/work-tracking.md`
- Strategic roadmap: `project/roadmap.md`
