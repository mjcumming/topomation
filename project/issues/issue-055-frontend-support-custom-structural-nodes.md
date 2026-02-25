# Issue [ISSUE-055]: Frontend Support for Custom Structural Nodes + Explicit Sources

**Epic**: [EPIC-001] Backend Integration  
**Status**: Complete  
**Created**: 2026-02-24  
**Priority**: Medium

---

## Objective

Expose ADR-HA-020 structural capabilities in the panel by supporting
integration-owned node types and explicit source assignment for non-HA-backed
nodes while preserving current HA area discovery UX.

---

## Requirements

### Functional Requirements
- Allow creating/editing integration-owned node types (`building`, `grounds`, `subarea`).
- Render icons/labels and hierarchy constraints for new node types.
- For HA-backed area nodes: keep existing area-entity discovery flow.
- For integration-owned nodes: enable explicit "Add Source" from HA entities.
- Show clear UI guidance when a node has no HA area linkage.

### Constraints
- Do not regress floor/area drag/reorder behavior.
- Keep current occupancy source editor behavior intact for existing node types.
- Avoid introducing hidden implicit mappings for custom nodes.

### Edge Cases
- Duplicate source assignment across parent/child custom nodes.
- Entity removed from HA while referenced by custom-node source config.
- Invalid hierarchy moves between node classes.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-008: Flat Rendering Pattern for Location Tree
- ADR-HA-010: Flexible Organizational Hierarchy
- ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import

**Dependencies**:
- ISSUE-053: topology model/type foundation
- ISSUE-054: policy-source backend slice (for shared config conventions)

**Affected Files**:
- `custom_components/topomation/frontend/types.ts` - location type unions
- `custom_components/topomation/frontend/hierarchy-rules.ts` - move rules
- `custom_components/topomation/frontend/ht-location-dialog.ts` - type picker
- `custom_components/topomation/frontend/ht-location-tree.ts` - rendering/icons
- `custom_components/topomation/frontend/ht-location-inspector.ts` - source assignment UX
- `custom_components/topomation/frontend/vitest/hierarchy-rules.test.ts` - hierarchy tests

---

## Acceptance Criteria

- [x] Panel can create and display `building`, `grounds`, `subarea` nodes.
- [x] Explicit source assignment works for integration-owned nodes.
- [x] HA-backed area source discovery remains unchanged.
- [x] Hierarchy validation prevents invalid moves with clear errors.
- [x] Frontend tests cover new hierarchy and source-assignment flows.

---

## Notes

Keep copy and controls simple. This issue should not ship advanced policy
editors; it should enable core node and source workflows first.
