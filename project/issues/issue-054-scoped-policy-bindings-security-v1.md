# Issue [ISSUE-054]: Scoped Policy Bindings for Global Devices (Security v1)

**Epic**: [EPIC-001] Backend Integration  
**Status**: Complete  
**Created**: 2026-02-24  
**Priority**: High

---

## Objective

Implement the first ADR-HA-020 policy-source slice so global devices (starting
with `alarm_control_panel`) can apply deterministic occupancy actions over a
configured topology scope (root/subtree), without requiring a synthetic root.

---

## Requirements

### Functional Requirements
- Add policy binding configuration for occupancy module with:
  - `entity_id`
  - `targets` (one-or-more location IDs or `all_roots`)
  - `state_map` (state -> policy action mapping)
- Implement `alarm_control_panel` v1 default mapping:
  - `armed_away` -> `vacate_area(include_locked=true)` over configured targets
- Route matching state changes from event bridge into scoped vacate commands.
- Apply startup reconciliation: evaluate current alarm state once on integration start.
- Emit clear runtime logs/events for policy execution success/failure.

### Constraints
- Keep existing `occupancy_sources` behavior unchanged.
- Keep service wrappers compatible; no breaking service schema change in v1.
- Respect multi-entry routing rules (`entry_id`) when policy actions are executed.

### Edge Cases
- Policy target location deleted or missing.
- Alarm state flaps rapidly between armed/disarmed states.
- Unknown alarm states (`armed_home`, `armed_night`) are ignored unless explicitly mapped.
- Locked occupancy nodes when `include_locked` policy value differs by mapping.

---

## Architecture Notes

**Relevant ADRs**:
- ADR-HA-017: HA Registry Mutations Are Out of Scope for This Adapter
- ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import

**Dependencies**:
- ISSUE-053: model foundation for broader target scopes and node types

**Affected Files**:
- `custom_components/topomation/event_bridge.py` - policy-source signal routing
- `custom_components/topomation/services.py` - optional helper hooks (if needed)
- `custom_components/topomation/__init__.py` - startup reconciliation wiring
- `tests/test_event_bridge.py` - policy routing/state-map coverage
- `tests/test_services.py` - vacate call contract assertions

---

## Acceptance Criteria

- [x] Configured alarm panel binding triggers scoped vacate on `armed_away`.
- [x] Action scope supports explicit target list and `all_roots`.
- [x] Startup reconciliation executes once and respects state map.
- [x] No regressions in existing occupancy-source behavior.
- [x] Automated tests cover positive and negative policy mapping paths.

---

## Notes

This issue is intentionally backend-first and minimal. Advanced policy UX
(editor flows, presets, diagnostics) is tracked separately.
