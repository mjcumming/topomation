# Documentation Index

**Last Reviewed**: 2026-02-24

This file is the source of truth for active documentation and lifecycle rules.
If a file is not listed as active below, treat it as reference-only.

## Active Docs

| File | Purpose | Status |
| --- | --- | --- |
| `docs/architecture.md` | Integration architecture and adapter boundaries | Active |
| `docs/bidirectional-sync-design.md` | Sync contract + mandatory pre-change checks | Active |
| `docs/adr-log.md` | Architectural decisions and policy record | Active |
| `docs/coding-standards.md` | Coding conventions for backend/frontend | Active |
| `docs/frontend-dev-workflow.md` | Current frontend/mock workflow | Active |
| `docs/setup-test-topology.md` | Test topology setup in HA + overlay testing | Active |
| `docs/live-ha-validation-checklist.md` | Manual validation procedure for v0.1.0 release | Active |
| `docs/installation.md` | Installation guide for v0.1.0 (HACS and manual) | Active |
| `docs/integration-guide.md` | Broad integration reference (not policy source) | Active (Reference) |
| `docs/work-tracking.md` | Current sprint execution status | Active (Operational) |
| `docs/cursor-guide.md` | Agent reference and repository operating notes | Active (Reference) |

## Project Docs Scope (`/project`)

Use `/project` for execution artifacts only:

- `project/epics/`: feature-level planning and sequencing
- `project/issues/`: issue-level work items and acceptance criteria
- `project/roadmap.md`: strategic milestones and release direction
- `project/history/`: archived legacy planning/framework docs

Do not use `/project` files as architecture or contract policy sources.

## Policy Source Order

When documents disagree, use this order:

1. `docs/bidirectional-sync-design.md`
2. `docs/architecture.md`
3. `docs/adr-log.md`
4. tests + implementation under `custom_components/topomation/`

## Governance Rules

| Doc Type | Canonical Location | Owner | Update Trigger | Archive Rule |
| --- | --- | --- | --- | --- |
| Architecture / contracts | `docs/*.md` | Maintainers | Behavior, API, contract, or design changes | Never auto-archive; version via ADR/history notes |
| Sprint execution status | `docs/work-tracking.md` | Current sprint owner | At sprint start/end and meaningful status changes | Keep current + previous sprint summary; archive older sections |
| Strategic roadmap | `project/roadmap.md` | Project owner | Milestone or release-direction changes | Keep strategic only; no detailed task logs |
| Task planning and results | `project/issues/*.md` | Assignee | As issue progress changes | Close in-place; move only obsolete legacy items |
| Time-boxed plans / retros | `docs/history/*.md`, `project/history/*.md` | Author | At completion of transient effort | Archive after completion |

## Maintenance Rules

1. Any policy or contract change must update active docs in the same PR.
2. Transient plans/checklists move to `docs/history/` or `project/history/` when complete.
3. Keep one source per concern: architecture in `docs`, strategy in `project/roadmap.md`, execution in `docs/work-tracking.md`, tasks in `project/issues/`.
4. Run `scripts/check-docs-consistency.sh` before merge for sync/contract changes.
