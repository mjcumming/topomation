# Work Tracking - topomation

**Last Updated**: 2026-03-06
**Purpose**: operational execution tracker for the active sprint.

Status markers:
- Execution: `Pending`, `In Progress`, `Blocked`, `Done`
- Delivery: `Target`, `Implemented`, `Released`, `Live-validated`

### v0.2.25 (2026-03-06) — Automation UX realignment + validation gate

- Automation workspace realignment is implemented in repo:
  explicit save/discard for Detection/Ambient, HA-canonical/card-local Lighting
  rules, narrowed Lighting/Media/HVAC scope, and backend create rollback when
  HA registration does not converge.
- Delivery status is now `Live-validated` after the 2026-03-06 live HA
  automation delta rerun and backend contract rerun both passed.

Canonical separation:
- Strategy and release sequencing: `project/roadmap.md`
- Task-level scope and acceptance criteria: `project/issues/*.md`
- Architecture/contracts: `docs/contracts.md`, `docs/automation-ui-guide.md`, `docs/architecture.md`, `docs/adr-log.md`

## Current Sprint

**Name**: Automation UX contract alignment + live HA delta gate  
**Dates**: 2026-03-05 onward  
**Execution Status**: Done
**Delivery Status**: Live-validated

### Sprint Goal

Close the automation UX contract drift, keep docs/status aligned with the
implemented state, narrow the visible automation IA to Lighting/Media/HVAC, and
complete the live HA delta gate before any release/live claim.

### Active Work Items

1. [x] Remove the legacy Lighting editor save path from the active inspector workflow.  
   Source: `project/issues/issue-058-automation-ui-contract-implementation.md`
2. [x] Keep legacy `modules.dusk_dawn` only as migration compatibility input.  
   Source: `project/issues/issue-058-automation-ui-contract-implementation.md`
3. [x] Harden managed-rule creation to fail and roll back when HA registration does not converge.  
   Source: implementation hardening (2026-03-06)
4. [x] Align contracts, UI guide, architecture, and active issue docs with implemented behavior.  
   Source: ADR-HA-054/055/056/057/058/060
5. [x] Add/refresh automated backend, frontend, and Playwright coverage for automation UX deltas.  
   Source: `project/issues/issue-058-automation-ui-contract-implementation.md`
6. [x] Execute the live HA automation delta checklist for the narrowed Lighting/Media/HVAC IA and record the outcome.  
   Source: `docs/live-ha-validation-checklist.md`, `project/issues/issue-058-automation-ui-contract-implementation.md`
7. [x] Promote delivery status from `Implemented` to `Live-validated` only after the live HA rerun passes.  
   Source: ADR-HA-059 / `docs/contracts.md`

### Current Release/Validation Gate

- [x] Targeted backend/frontend/browser automation UX checks pass in local tooling.
- [x] Docs and issue status reflect `Implemented`, not `Live-validated`.
- [x] Live managed-actions backend contract rerun passed on 2026-03-06.
- [x] Live HA automation delta checklist rerun is recorded for the narrowed IA.
- [x] Release/live claim remains blocked until the live HA rerun passes.

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
