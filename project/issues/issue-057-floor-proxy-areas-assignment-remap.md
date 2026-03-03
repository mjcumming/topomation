# Issue [ISSUE-057]: Managed Shadow Areas + Assignment Remap Contract

**Epic**: [EPIC-001] Backend Integration  
**Status**: In progress  
**Created**: 2026-03-03  
**Priority**: High

---

## Objective

Support aggregate-node assignment in HA-native area terms by introducing
integration-owned managed shadow areas for `floor`, `building`, and `grounds`,
with deterministic backend remap behavior.

---

## Requirements

### Functional Requirements
- Add explicit managed-shadow metadata contract:
  - host `_meta.shadow_area_id`
  - area `_meta.role = "managed_shadow"`
  - area `_meta.shadow_for_location_id = <host_location_id>`
- Managed-shadow hosts are non-root `floor`, `building`, and `grounds`.
- Enforce exactly one active managed shadow area per host.
- Auto-create/recreate managed shadow areas on startup/reconciliation.
- Remap `locations/assign_entity` target from host -> configured managed shadow area.
- Block manual websocket mutation for managed-shadow metadata and wrappers.
- Tag managed shadow areas in UI with clear `System Area` affordance.
- Keep optional tree filtering presentation-only (no hidden implicit behavior).

### Constraints
- Preserve HA registry authority while allowing integration-owned shadow creation.
- Do not use name-equality inference or heuristic shadow adoption.
- Preserve single-assignment invariant for entity-to-location mapping.
- Do not regress existing floor/area sync and reorder contracts.

### Edge Cases
- Managed shadow area removed in HA after linkage.
- Host removed/renamed while shadow metadata exists.
- Shadow area moved outside host subtree.
- Duplicate shadow tags on sibling areas under one host.
- Assignment attempted on host with missing/invalid shadow.
- Startup reconciliation with stale shadow metadata references.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-017: HA Registry Mutations Are Out of Scope for This Adapter
- ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import
- ADR-HA-048: Floor Proxy Areas Use Explicit Tags + Backend Assignment Remap (superseded)
- ADR-HA-049: Managed Shadow Areas Are Integration-Owned and Mandatory for Aggregate Hosts

**Dependencies**:
- None

**Affected Files**:
- `custom_components/topomation/websocket_api.py` - assignment remap + managed-shadow guardrails
- `custom_components/topomation/sync_manager.py` - managed-shadow create/recreate reconciliation
- `custom_components/topomation/frontend/ht-location-inspector.ts` - managed system area status UX
- `custom_components/topomation/frontend/ht-location-tree.ts` - system-area badge behavior
- `custom_components/topomation/frontend/types.ts` - metadata typing updates
- `tests/test_websocket_contract.py` - managed-shadow contract + assignment remap assertions
- `tests/test_sync_manager.py` - deletion/reconciliation cleanup behavior
- `docs/contracts.md` - contract additions
- `docs/adr-log.md` - ADR linkage

---

## Acceptance Criteria

- [ ] Every non-root `floor`/`building`/`grounds` node has exactly one managed shadow area.
- [ ] Assigning an entity to host location remaps to shadow area and returns mapped `ha_area_id`.
- [ ] Invalid/missing shadow mappings are rejected with explicit, actionable errors.
- [ ] Deleted shadow areas are recreated automatically during reconciliation.
- [ ] UI exposes clear managed system area status and ownership.
- [ ] Optional tree filter hides only explicitly tagged system area nodes.
- [ ] Regression tests pass for sync + assignment + startup reconciliation.
- [ ] Documentation is updated for behavior contracts and operator guidance.

---

## Agent Instructions

1. Implement managed-shadow reconciliation and assignment remap first.
2. Add create/recreate policy for aggregate hosts.
3. Implement UI status/badge behavior (no manual selector flow).
4. Add/update contract tests before optional tree filter UX.
5. Update docs/contracts + current-work in same change set.
6. Validate with targeted backend and frontend test runs.

---

## Notes

- Managed shadow matching is ID-based and explicit. Name equality is not used.
- Shadow areas are integration-owned lifecycle artifacts.
- Keep tree filtering optional and reversible for debugging.
