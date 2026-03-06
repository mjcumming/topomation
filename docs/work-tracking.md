# Work Tracking - topomation

**Last Updated**: 2026-03-06
**Purpose**: operational execution tracker for the active sprint.

Status markers:
- Execution: `Pending`, `In Progress`, `Blocked`, `Done`
- Delivery: `Target`, `Implemented`, `Released`, `Live-validated`

### 2026-03-06 — Workflow reset + exact-branch validation gate

- The automation UI is implemented in repo, but the process around it was not
  stable enough: ambiguity was coded through, legacy behavior lingered, and
  testing/status claims drifted away from the exact branch state.
- ADR-HA-063 resets the repo workflow around dev-mode only behavior,
  ambiguity-stop rules, and exact touched-workflow validation before release or
  live claims.

Canonical separation:
- Strategy and release sequencing: `project/roadmap.md`
- Task-level scope and acceptance criteria: `project/issues/*.md`
- Architecture/contracts: `docs/working-agreement.md`, `docs/contracts.md`, `docs/automation-ui-guide.md`, `docs/architecture.md`, `docs/adr-log.md`

## Current Sprint

**Name**: Workflow reset + exact-branch validation gate  
**Dates**: 2026-03-05 onward  
**Execution Status**: In Progress
**Delivery Status**: Implemented

### Sprint Goal

Lock the repo to one active authority chain, stop coding through ambiguous UX,
require exact touched-workflow evidence before release/live claims, and rerun
the automation UX live gate only on the exact current main branch state.

### Active Work Items

1. [x] Add the active repo working agreement (`docs/working-agreement.md`).  
   Source: ADR-HA-063
2. [x] Add the touched-workflow release gate (`docs/touched-workflow-release-gate.md`).  
   Source: ADR-HA-063
3. [x] Tighten the active authority chain in `docs/index.md`.  
   Source: ADR-HA-063
4. [x] Update release/live runbooks and status docs to block over-claiming.  
   Source: ADR-HA-063
5. [ ] Record the exact current main-branch touched workflows and rerun the required local/live evidence.  
   Source: `docs/touched-workflow-release-gate.md`
6. [ ] Execute the live HA automation delta checklist for the exact current main branch state and record the outcome.  
   Source: `docs/live-ha-validation-checklist.md`, `project/issues/issue-058-automation-ui-contract-implementation.md`
7. [ ] Promote delivery status from `Implemented` to `Live-validated` only after items 5-6 pass on the same branch state.  
   Source: ADR-HA-063 / `docs/contracts.md`

### Current Release/Validation Gate

- [x] Working agreement and touched-workflow gate are now active docs.
- [x] Docs and issue status reflect `Implemented`, not `Released`/`Live-validated`.
- [x] Older live evidence is explicitly treated as stale after later behavior changes.
- [ ] Exact touched-workflow record exists for the current main branch state.
- [ ] Live HA automation delta checklist rerun is recorded for the current main branch state.
- [x] Release/live claim remains blocked until the touched-workflow gate passes.

## Previous Sprint Summary

**Name**: Tree DnD stabilization + release gate setup  
**Window**: 2026-02-24 to 2026-02-28  
**Result**: Done / Live-validated for the then-current checklist scope

- Tree drag-and-drop moved to explicit drop zones (C-011, ADR-HA-039).
- Live HA environment and validation workflow were established for managed actions.
- That validation predates the 2026-03 automation UX delta and does not substitute
  for the new delta rerun.

## Archive Policy

Historical, phase-by-phase, and long-form status logs are archived.
See `docs/history/` for older implementation narratives.
