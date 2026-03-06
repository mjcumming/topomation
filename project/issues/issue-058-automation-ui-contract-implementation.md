# Issue [ISSUE-058]: Automation UX + Lighting Contract Implementation Checklist

**Epic**: [EPIC-001] Backend Integration  
**Execution Status**: In Progress  
**Delivery Status**: Implemented  
**Created**: 2026-03-05  
**Priority**: High

---

## Objective

Implement the approved automation UX reset (ADR-HA-054/055/056/060/061/062) end-to-end so
panel behavior, backend persistence, and test coverage all match the current
contract set.

---

## Requirements

### Functional Requirements
- Workspace IA:
  - Render `Configure` and `Assign Devices` as top-level tabs.
  - Keep inspector tabs under `Configure`.
- Header status:
  - Occupancy, lock, and ambient are peer indicators.
  - `Unlocked` does not receive emphasized styling.
- Detection IA:
  - Place `Recent Occupancy Events` at the bottom.
  - Use `Sync Locations` label and sibling-scoped eligibility.
  - Support `area` sibling sync under parent types `area`/`floor`/`building`.
  - Support `floor` sibling sync only for floors under same `building`.
  - Managed system area message must be actionable (clear reason + explicit remediation path).
- Save/update model:
  - `Detection` and `Ambient` use tab-level draft state.
  - `Save changes` commits draft; `Discard changes` reverts draft for those tabs.
  - `Lighting`, `Media`, `HVAC` use card-local rule lifecycle controls.
  - No silent auto-save for user-authored edits.
- Rule lifecycle controls:
  - Unsaved draft rule: `Save rule` + `Remove rule` (no `Delete rule`).
  - Persisted edited rule: `Update rule` + `Discard edits` + `Delete rule`.
  - Persisted clean rule: `Delete rule`.
  - Do not split rule lifecycle controls between tab-level save/discard and per-card delete.
- Lighting persistence:
  - Lighting rules are HA-canonical managed automations.
  - Stable `rule_uuid` identity with upsert+diff save semantics.
  - One Lighting rule can persist multiple ordered action targets (`actions[]`).
  - Trigger-derived condition locking:
    - `on_dark`/`on_bright` ambient is derived/read-only.
    - `on_occupied`/`on_vacant` occupancy condition is derived/read-only.
  - Remove Topomation-specific Lighting startup reapply toggle.
  - Ignore legacy `modules.dusk_dawn` payloads in the active Lighting editor.
- Non-light scope:
  - Visible top-level tabs are `Lighting`, `Media`, `HVAC`.
  - `HVAC` covers `fan.*` plus switch-controlled exhaust/ventilation devices via `switch.*`.
  - `climate.*` thermostat/preset workflows stay deferred.

### Constraints
- Preserve HA-native ownership and debugging paths (automations/traces/logs).
- Keep lifecycle guardrails for linked wrappers and hierarchy validation.
- Avoid introducing parallel policy sources; update canonical docs in same PR.
- Maintain backward compatibility for existing docs links (`lighting-ui-contract.md` pointer).

### Edge Cases
- Draft changed in UI while HA rule set changes externally.
- Persisted rule deleted in HA while local draft still exists.
- Sync candidate list includes excluded/system-owned nodes.
- Managed system area mapping points to missing or mismatched HA area.
- Legacy automation payloads/aliases exist in persisted data or old links but are not imported by the active dev-mode editor.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-054: Sync Locations Uses Explicit Sibling Scope by Parent Type
- ADR-HA-055: Automation Workspace Uses Tabbed Modes + Explicit Save/Update Commit
- ADR-HA-056: Lighting Rules Move to HA-Canonical Managed Automation Ownership
- ADR-HA-057: Rule-Card Lifecycle Colocation + Mandatory User Decision Gate for Ambiguity
- ADR-HA-060: Automation Scope Narrows to Lighting / Media / HVAC; HVAC v1 Is Fans-First
- ADR-HA-061: Startup Replay Moves to Rule Cards; Harness Must Cover Reactive HA Churn
- ADR-HA-062: Active Automation Development Runs Without Legacy Compatibility Paths

**Dependencies**:
- ISSUE-057: Managed shadow areas (for detection/system-area messaging alignment)

**Affected Files (expected)**:
- `custom_components/topomation/frontend/ht-automation-panel.ts`
- `custom_components/topomation/frontend/ht-location-inspector.ts`
- `custom_components/topomation/frontend/ht-location-tree.ts` (if status or mode affordances are shared)
- `custom_components/topomation/frontend/types.ts`
- `custom_components/topomation/websocket_api.py`
- `custom_components/topomation/managed_actions.py`
- `tests/test_websocket_contract.py`
- `tests/test_sync_manager.py`
- `custom_components/topomation/frontend/test/*.test.ts`
- `custom_components/topomation/frontend/playwright/*.spec.ts`
- `docs/contracts.md`
- `docs/automation-ui-guide.md`
- `docs/architecture.md`
- `docs/live-ha-validation-checklist.md`

---

## Implementation Checklist

### Phase 1: Workspace + Detection IA
- [x] Convert right-panel `Configure`/`Assign Devices` controls to top-level tabs.
- [x] Normalize header status visual hierarchy (remove unlocked emphasis in normal state).
- [x] Move `Recent Occupancy Events` to bottom of Detection tab.
- [x] Rename Detection sync section to `Sync Locations`.
- [x] Enforce sibling-scoped sync eligibility and copy for `area` and `floor` rules.
- [x] Update managed system area panel copy to actionable error/remediation text.

### Phase 2: Explicit Save/Discard Model
- [x] Add per-tab draft state for Detection and Ambient (parity with automation tabs).
- [x] Add shared `Save changes` and `Discard changes` affordances with dirty-state indicator.
- [x] Prevent silent commit from per-control edit interactions.
- [x] Add navigation/reload protection behavior for dirty draft state (confirm/discard path).

### Phase 3: Lighting HA-Canonical Rule Workflow
- [x] Remove Lighting startup reapply toggle from UI.
- [x] Ensure rule lifecycle controls are card-local (`Save/Update/Discard/Delete/Remove`) per contract.
- [x] Remove mixed tab-level save/discard + per-card delete control pattern from rule workflows.
- [x] Enforce trigger-derived condition lock rendering for Lighting (`ambient` and `must_be_occupied`).
- [x] Support multi-target Lighting action payloads (`actions[]`) end-to-end (UI + WS + runtime + list/reconcile).
- [x] Ensure save path uses `rule_uuid` upsert+diff and in-place update.
- [x] Ensure delete path is persisted-only and reconciliation-safe.
- [x] Remove active migration/fallback behavior from the automation UI/runtime.

### Phase 4: Tests + Validation
- [x] Add/adjust frontend tests for tab IA, save/discard workflow, and rule lifecycle controls.
- [x] Add/adjust backend tests for Lighting upsert/diff + UUID tracking behavior.
- [x] Add/adjust frontend tests for card-local rule lifecycle controls (`Save rule`/`Update rule`/`Discard edits`/`Delete rule`).
- [x] Add/adjust sync tests for sibling-scoped `Sync Locations` policy.
- [x] Run `scripts/check-docs-consistency.sh`.
- [x] Run targeted backend tests (`pytest` for websocket/sync/managed rules paths).
- [x] Run frontend unit + Playwright checks.
- [ ] Execute live HA checklist deltas for the narrowed Lighting/Media/HVAC IA and document results.

### Phase 5: Documentation Closeout
- [x] Keep `docs/contracts.md`, `docs/automation-ui-guide.md`, and `docs/architecture.md` aligned.
- [x] Update `docs/live-ha-validation-checklist.md` for new save/discard + lighting behavior checks.
- [x] Update `docs/current-work.md` and issue status after each implementation phase.

---

## Acceptance Criteria

- [x] UI behavior matches ADR-HA-054/055/056 and `C-017`.
- [x] UI behavior matches ADR-HA-057 and `C-019` decision-gate requirements.
- [x] Lighting rule creation/edit/delete is HA-canonical and traceable in native HA.
- [x] Detection sync behavior matches sibling-scoped contract exactly.
- [x] No tab silently persists user-authored policy edits without explicit save.
- [x] Rule-card delete controls correctly gate by persisted state.
- [x] Managed system area messaging is explicit and operator-actionable.
- [ ] Required live validation checks pass on the no-legacy branch state.
- [x] Active docs are consistent with implemented behavior and explicitly call out remaining release/live gaps.

---

## Agent Instructions

1. Implement in phase order unless blockers force reordering.
2. Keep each phase shippable with tests and doc updates in same change set.
3. Use `docs/contracts.md` + `docs/automation-ui-guide.md` as policy source.
4. Treat `docs/adr-log.md` as rationale record, not implementation source.
5. If contracts/guides are ambiguous or conflicting, stop and ask for user decision before implementation.
6. Update this issue checklist plus execution/delivery status as work lands.

---

## Closeout Notes

- Live HA backend contract rerun passed on 2026-03-06 via `tests/test-live-managed-actions-contract.py` (`2 passed`).
- Live HA UI delta rerun passed on 2026-03-06 via `npx playwright test --config playwright.live.config.ts playwright/live-automation-ui.spec.ts` (`1 passed`).
- The live rerun exposed a managed-rule list race (`dictionary changed size during iteration`) in `managed_actions.async_list_rules`; the backend now snapshots automation entities before awaiting config reads, and regression coverage was added in `tests/test_managed_actions.py`.
- The active dev branch later removed remaining automation legacy fallbacks/aliases, so the 2026-03-06 live UI rerun is no longer sufficient evidence for the current branch state. Repeat the delta rerun before restoring `Live-validated`.
