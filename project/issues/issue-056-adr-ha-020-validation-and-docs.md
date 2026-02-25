# Issue [ISSUE-056]: ADR-HA-020 Validation Matrix and Documentation Alignment

**Epic**: [EPIC-002] Testing Coverage  
**Status**: Complete  
**Created**: 2026-02-24  
**Priority**: Medium

---

## Objective

Add test coverage and documentation updates for ADR-HA-020 so new topology
structures and policy-source behavior are validated and clearly documented.

---

## Requirements

### Functional Requirements
- Extend automated test matrix for:
  - integration-owned node types
  - mixed HA-backed + custom hierarchy behavior
  - scoped policy-source execution (`armed_away` vacate flow)
- Add live validation checklist entries for scoped policy behavior.
- Update integration docs to reflect node/source semantics and scope behavior.

### Constraints
- Keep v0.1.0 validation material readable; add ADR-HA-020 sections without
  rewriting unrelated release-gate content.
- Do not document unshipped behavior as complete.

### Edge Cases
- Policy mapping configured but no valid targets.
- `all_roots` behavior when root set changes at runtime.
- Restore/restart consistency for policy bindings and custom nodes.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-019: Single Integration with Internal Module Boundaries
- ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import

**Dependencies**:
- ISSUE-053: topology model foundation
- ISSUE-054: scoped policy binding backend
- ISSUE-055: frontend exposure for custom nodes/sources

**Affected Files**:
- `tests/test_websocket_contract.py` - mixed-node contract checks
- `tests/test_event_bridge.py` - policy mapping behavior
- `docs/architecture.md` - behavior and hierarchy narrative
- `docs/integration-guide.md` - config and API examples
- `docs/live-ha-validation-checklist.md` - manual verification additions

---

## Acceptance Criteria

- [x] Automated tests cover ADR-HA-020 behavior and pass in CI/local runs.
- [x] Live validation checklist includes scoped policy/security checks.
- [x] Architecture/integration docs are aligned with shipped behavior.
- [x] Open limitations are explicitly documented.

---

## Notes

Keep this issue as the final hardening/documentation pass after implementation
issues are merged.
