# Documentation Index

**Last Reviewed**: 2026-03-06

This file is the source of truth for active documentation and lifecycle rules.
If a file is not listed as active below, treat it as reference-only.

## Active Docs

| File | Purpose | Status |
| --- | --- | --- |
| `docs/architecture.md` | Integration architecture and adapter boundaries | Active |
| `docs/contracts.md` | Canonical behavior contracts and invariants | Active |
| `docs/automation-ui-guide.md` | Automation workspace and inspector UX baseline (tabs, save model, sync scope, messaging) | Active |
| `docs/bidirectional-sync-design.md` | Sync contract + mandatory pre-change checks | Active |
| `docs/adr-log.md` | Architectural decisions and policy record | Active |
| `docs/agent-quickstart.md` | Fast startup guide for contributors and AI agents | Active (Operational) |
| `docs/coding-standards.md` | Coding conventions for backend/frontend | Active |
| `docs/frontend-dev-workflow.md` | Current frontend/mock workflow | Active |
| `docs/release-validation-runbook.md` | Pre-release local/live validation workflow | Active (Operational) |
| `docs/live-release-testing-paradigm.md` | Mandatory no-mock release gate policy and live HA contract expectations | Active (Operational) |
| `docs/dependency-release-runbook.md` | Dependency pin + release validation workflow | Active (Operational) |
| `docs/setup-test-topology.md` | Test topology setup in HA + overlay testing | Active |
| `docs/live-ha-validation-checklist.md` | Manual validation procedure for live HA release candidates | Active |
| `docs/installation.md` | Installation guide for v0.1.0 (HACS and manual) | Active |
| `docs/occupancy-lock-workflows.md` | Automation-first lock policy workflows (`away`, `party`) | Active |
| `docs/wasp-in-box-whitepaper.md` | Occupancy design white paper (wasp-in-box, magic-area alignment, UX guidance) | Active (Reference) |
| `docs/integration-guide.md` | Broad integration reference (not policy source) | Active (Reference) |
| `docs/work-tracking.md` | Current sprint execution status | Active (Operational) |
| `docs/current-work.md` | Live parallel-work and handoff context | Active (Operational) |
| `docs/cursor-guide.md` | Agent reference and repository operating notes | Active (Reference) |
| `docs/tree-dnd-stabilization-plan.md` | Tree DnD explicit drop targets — implementation plan (C-011, ADR-HA-039) | Active (Operational) |
| `docs/ambient-light-v1-design.md` | Ambient light v1 design scope, UX, and phased implementation plan | Active (Operational) |
| `docs/dusk-dawn-lighting-ui-spec.md` | Historical lighting-model exploration (pre-HA-canonical migration notes) | Active (Reference) |
| `docs/lighting-ui-contract.md` | Compatibility pointer to canonical Lighting contract in `docs/automation-ui-guide.md` | Active (Reference) |

## Project Docs Scope (`/project`)

Use `/project` for execution artifacts only:

- `project/epics/`: feature-level planning and sequencing
- `project/issues/`: issue-level work items and acceptance criteria
- `project/roadmap.md`: strategic milestones and release direction
- `project/history/`: archived legacy planning/framework docs

Do not use `/project` files as architecture or contract policy sources.

## Policy Source Order

When documents disagree, use this order for the concern you are changing:

1. Sync-only behavior: `docs/bidirectional-sync-design.md`
2. General product/runtime behavior: `docs/contracts.md`
3. Automation workspace and inspector UX: `docs/automation-ui-guide.md`
4. Integration structure and component boundaries: `docs/architecture.md`
5. Decision history/rationale: `docs/adr-log.md`
6. tests + implementation under `custom_components/topomation/`

## Delivery Status Vocabulary

Use these terms consistently in active status docs:

- `Target`: agreed contract/design baseline; not yet fully implemented.
- `Implemented`: landed in repo with code/docs/tests updated.
- `Released`: shipped in an installable artifact/runtime bundle.
- `Live-validated`: rerun against a live Home Assistant instance and recorded in
  the required checklist/release gate.

Execution tracking is separate:

- `Pending`
- `In progress`
- `Blocked`
- `Done`

Do not use `Complete` / `Completed` as a standalone behavior claim in active
docs when live HA validation is still pending.

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
5. If a recurring environment/workflow prerequisite is discovered during a fix, automate it where possible and document it in active docs in the same change.
6. Active behavior-status docs must distinguish execution state from delivery state when work is not yet live-validated.
