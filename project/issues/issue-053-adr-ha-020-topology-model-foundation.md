# Issue [ISSUE-053]: ADR-HA-020 Topology Model Foundation

**Epic**: [EPIC-001] Backend Integration  
**Status**: Complete  
**Created**: 2026-02-24  
**Priority**: High

---

## Objective

Establish the backend data model and persistence foundation for ADR-HA-020 by
adding integration-owned structural node types (`building`, `grounds`,
`subarea`) while preserving existing `floor|area` behavior and compatibility.

---

## Requirements

### Functional Requirements
- Extend topology metadata/type handling to support `building`, `grounds`, and `subarea`.
- Preserve rootless model (no mandatory synthetic `house` node).
- Keep HA lifecycle authority unchanged for HA-backed floor/area records.
- Keep existing floor/area-only topologies valid without migration breakage.
- Persist and restore new node types through existing storage paths.

### Constraints
- No regression to ADR-HA-017 lifecycle policy (no create/rename/delete HA registry writes).
- Existing WebSocket contracts for current type flows must remain compatible.
- Existing tests for floor/area sync and occupancy behavior must remain green.

### Edge Cases
- Unknown/legacy `_meta.type` values should degrade safely.
- Mixed trees (HA-backed + integration-owned nodes) must serialize deterministically.
- Parent changes that cross node classes must preserve current reorder guarantees.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-017: HA Registry Mutations Are Out of Scope for This Adapter
- ADR-HA-018: Explicit Signal-Key Sources for Interaction Entities
- ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import

**Dependencies**:
- None (foundation issue)

**Affected Files**:
- `custom_components/topomation/websocket_api.py` - type validation/contract payloads
- `custom_components/topomation/frontend/types.ts` - frontend type union alignment
- `custom_components/topomation/frontend/hierarchy-rules.ts` - hierarchy constraints
- `tests/test_websocket_contract.py` - contract coverage for new type values
- `tests/test_persistence.py` - round-trip persistence coverage

---

## Acceptance Criteria

- [x] New integration-owned type values are accepted and persisted.
- [x] Existing floor/area behavior remains unchanged for current users.
- [x] WebSocket contracts remain backward compatible.
- [x] Regression tests pass for sync/service/persistence baselines.
- [x] New automated tests cover type round-trip and mixed-tree behavior.

---

## Notes

This issue provides schema/model plumbing only. Source assignment UX and policy
bindings are tracked in follow-on issues.
