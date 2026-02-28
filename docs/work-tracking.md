# Work Tracking - topomation

**Last Updated**: 2026-02-28
**Purpose**: operational execution tracker for the active sprint.

### v0.1.20 (2026-02-28) — Tree DnD stabilization

- Tree drag-and-drop now uses explicit drop zones (C-011, ADR-HA-039): before/inside/after/outdent by zone only; no x-offset heuristics. E2E and unit tests added; contract and plan documented.

Canonical separation:
- Strategy and release sequencing: `project/roadmap.md`
- Task-level scope and acceptance criteria: `project/issues/*.md`
- Architecture/contracts: `docs/architecture.md`, `docs/bidirectional-sync-design.md`, `docs/adr-log.md`

## Current Sprint

**Name**: Live HA Validation + v0.1.0 Release Gate  
**Dates**: 2026-02-24 onward  
**Status**: Complete

### Sprint Goal

Stand up a live HA test environment and execute the end-to-end validation checklist to clear the v0.1.0 release blocker.

### Active Work Items

1. [x] Build `tests/test-ha-config/configuration.yaml` for simulated entities  
   Source: `project/issues/issue-052-live-ha-test-environment.md`
2. [x] Start HA dev runtime and complete onboarding (`hass -c /workspaces/core/config`)  
   Source: `project/issues/issue-052-live-ha-test-environment.md`
3. [x] Complete ISSUE-052 entity assignment set (motion/presence/lights/media player)  
   Source: `project/issues/issue-052-live-ha-test-environment.md`
4. [x] Execute API-assisted live validation checks and record results in ISSUE-051  
   Source: `project/issues/issue-051-floor-area-sync-validation.md`
5. [x] Final manual UI confirmation: topology panel opens and visual hierarchy matches imported floors/areas  
   Source: `project/issues/issue-051-floor-area-sync-validation.md`
6. [x] Add debounced persistence for topology/module-config edits (`reorder`, `set_module_config`)  
   Source: implementation hardening (2026-02-24)
7. [x] Enforce startup reconciliation (HA canonical for `floor_*` / `area_*` wrappers) and record ADR-HA-022  
   Source: implementation hardening (2026-02-24)

### v0.1.0 Release Gate Checklist

- [x] All sections of `docs/live-ha-validation-checklist.md` pass
- [x] Results documented in `project/issues/issue-051-floor-area-sync-validation.md`
- [x] No blocking errors in HA logs during validation
- [x] `CHANGELOG.md` updated

## Post-v0.1 Backlog (ADR-HA-020)

1. [x] ISSUE-053: ADR-HA-020 Topology Model Foundation  
   Source: `project/issues/issue-053-adr-ha-020-topology-model-foundation.md`
2. [x] ISSUE-054: Scoped Policy Bindings for Global Devices (Security v1)  
   Source: `project/issues/issue-054-scoped-policy-bindings-security-v1.md`
3. [x] ISSUE-055: Frontend Support for Custom Structural Nodes + Explicit Sources  
   Source: `project/issues/issue-055-frontend-support-custom-structural-nodes.md`
4. [x] ISSUE-056: ADR-HA-020 Validation Matrix and Documentation Alignment  
   Source: `project/issues/issue-056-adr-ha-020-validation-and-docs.md`
5. [x] Building/grounds paradigm rollout in docs + frontend fixtures/tests  
   Source: implementation follow-up (2026-02-25)
6. [x] Inspector IA refinement: `Detection`, `On Occupied`, `On Vacant` tabs + route-default mapping  
   Source: UX follow-up (2026-02-25)
7. [x] Enable location lifecycle actions in panel: rename + delete (all non-root nodes), with root-only delete guardrail  
   Source: implementation follow-up (2026-02-25)
8. [x] Occupied/Vacant actions moved to native Home Assistant automations (with Topomation metadata labels/category + inspector integration)  
   Source: implementation follow-up (2026-02-25)

## Previous Sprint Summary

**Name**: v3 Alignment + Documentation Hardening  
**Window**: 2026-02-23 to 2026-02-24  
**Result**: Completed

- Sync contract hardened (`docs/bidirectional-sync-design.md`)
- Active docs map established (`docs/index.md`)
- Legacy docs moved under `docs/history/`
- Backend integration status: substantially complete pending live HA validation

## Archive Policy

Historical, phase-by-phase, and long-form status logs are archived.
See `docs/history/` for older implementation narratives.
