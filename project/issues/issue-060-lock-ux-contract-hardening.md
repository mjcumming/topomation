# Issue [ISSUE-060]: Lock UX Contract Hardening (Floor/Host Accuracy + Source-Aware Unlock)

**Epic**: [EPIC-002] Testing Coverage  
**Execution Status**: Pending  
**Delivery Status**: Target  
**Created**: 2026-04-14  
**Priority**: High

---

## Objective

Fix lock/unlock UX correctness and clarity gaps in the active panel workflow so
floor/host rows show accurate lock state, unlock actions are source-aware, and
users can understand direct vs inherited lock behavior without reading internal ids.

---

## Requirements

### Functional Requirements
- Tree lock icon state must resolve using the same effective occupancy topology id
  used by inspector/occupancy strip for managed-shadow hosts.
- Lock quick-toggle success toast must correspond to visible state change on the
  same row.
- Unlock UX must be source-aware:
  - if lock owner includes `manual_ui`, quick unlock may release that source
  - if lock owner is non-`manual_ui`, UI must not silently "succeed"; show an
    actionable message and offer explicit unlock path.
- Inspector lock summary must distinguish:
  - direct lock directives on current location
  - inherited subtree lock from ancestor scope.
- Lock holder labels shown in UI must be human-readable where possible; raw
  internal source ids are fallback only.

### Constraints
- Preserve existing lock service contract (`mode`, `scope`, source-aware unlock).
- Do not introduce a new modes/policy orchestration module in this issue.
- Maintain lock semantics as inherited policy for subtree scope (no lock-copy fanout).
- Keep existing manual tree lock control as a fast operator surface.

### Edge Cases
- Non-root floor/building/grounds/property host with managed shadow occupancy id.
- Child area appears locked only due to inherited ancestor subtree lock.
- Multi-source lock state (`manual_ui` + automation source) on same location.
- Unlock request from row with only non-`manual_ui` lock owners.
- Group-projected lock state where member room receives authority from occupancy group.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-028: Manual Occupancy Tree Controls with Lock-Safe Vacate Semantics
- ADR-HA-029: Automation-first lock policies with mode/scope contract
- ADR-HA-049: Managed shadow areas are integration-owned and mandatory for aggregate hosts
- ADR-HA-071: Occupancy Groups authority and member projection
- ADR-HA-079: Inspector occupancy reads use shadow topology id
- ADR-HA-080: Occupancy at-a-glance strip (scope-aligned UI)

**Dependencies**:
- None

**Affected Files (expected)**:
- `custom_components/topomation/frontend/ht-location-tree.ts` - effective lock-state mapping + row messaging
- `custom_components/topomation/frontend/topomation-panel.ts` - source-aware unlock behavior + actionable errors
- `custom_components/topomation/frontend/ht-location-inspector.ts` - lock labeling clarity (direct vs inherited + readable source names)
- `custom_components/topomation/frontend/shadow-location-utils.ts` - shared topology-id resolution helper usage
- `custom_components/topomation/frontend/ht-location-tree.test.ts` - lock icon/state tests
- `custom_components/topomation/frontend/topomation-panel.test.ts` - unlock mismatch tests
- `custom_components/topomation/frontend/ht-location-inspector.test.ts` - lock summary readability tests
- `tests/test_lock_services_integration.py` - integration assertions for lock attributes
- `docs/contracts.md` - lock UX behavior clauses as needed
- `docs/automation-ui-guide.md` - lock status messaging/interaction guidance

---

## Acceptance Criteria

- [ ] Locking a floor/host row updates the same row icon and inspector lock status immediately.
- [ ] Tree lock status for managed-shadow hosts reflects effective occupancy topology id, not stale host id lookup.
- [ ] Unlock on non-matching lock source does not present false success; user sees clear owner/source guidance.
- [ ] Inspector clearly indicates inherited subtree lock vs direct local lock.
- [ ] Raw internal ids in lock holder copy are replaced with readable labels where resolvable.
- [ ] Frontend unit tests cover managed-shadow host lock mapping and source-aware unlock outcomes.
- [ ] Backend/integration lock tests still pass with no contract regressions.
- [ ] Docs updated for any user-visible lock interaction behavior changes.

---

## Agent Instructions

1. Implement lock-state mapping correctness first (host rows + effective topology id).
2. Add source-aware unlock UX behavior and tests before readability refactors.
3. Keep lock semantics unchanged; this issue is UX/contract hardening, not policy redesign.
4. If ambiguity remains around default quick-lock scope (`self` vs `subtree`), stop and request user decision before changing behavior.
5. Update docs/contracts and automation UI guide in the same change if behavior text changes.

---

## Notes

- This issue intentionally keeps work inside current lock primitives.
- Future "modes/policy orchestration" is captured separately in ADR-HA-081 as a
  deferred track and is out of scope for ISSUE-060.
