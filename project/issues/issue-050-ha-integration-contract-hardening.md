# Issue [ISSUE-050]: HA Integration Contract Hardening (Core v0.2.x)

**Epic**: [EPIC-001] Backend Integration + [EPIC-002] Testing Coverage  
**Status**: In Progress  
**Created**: 2026-02-24  
**Priority**: High

---

## Objective

Align the Home Assistant adapter with current `home-topology` core APIs and HA registry APIs, with explicit contracts for floor/area mapping, sync authority, and service wrappers.

---

## Design Decisions To Confirm

1. **Canonical HA Area Link**
- Decision: `Location.ha_area_id` is canonical for area linkage.
- `_meta.ha_area_id` remains optional compatibility metadata, not source of truth.

2. **Floor Registry API Source**
- Decision: Use `homeassistant.helpers.floor_registry` APIs as primary; do not depend on `area_registry.floors`.

3. **Type Taxonomy**
- Decision: Integration structural types are `floor|area` only.
- Legacy `room` values remain readable for backward compatibility but new writes use `area`.

4. **Sync Floor Mapping Algorithm**
- Decision: Topology parent changes assign HA `floor_id` from nearest ancestor carrying `ha_floor_id`, or `null` when moved outside any floor lineage.

5. **Clear Service Compatibility**
- Decision: `topomation.clear` maps to `occupancy.clear(...)` for current core, with fallback to `release(...)` for legacy compatibility.

6. **HA Registry Writeback Policy**
- Decision: Per ADR-HA-017, lifecycle mutation remains read-only
  (create/rename/delete managed in HA), with one explicit exception:
  topology reorder updates HA-backed area `floor_id`.
- Result: topology->HA rename/delete remain disabled; reorder drives floor-link sync.

---

## Scope Checklist

### A) Sync Manager + Registries
- [x] Use floor registry object in `SyncManager` setup
- [x] Import floors via floor registry listing APIs
- [x] Handle floor create/update/remove via floor registry lookup APIs
- [x] Remove adapter dependency on `area_registry.async_update_floor`

### B) Area Link Canonicalization
- [x] Import area locations with `ha_area_id` set on `Location`
- [x] Keep `_meta` in sync for `ha_area_id` compatibility where needed
- [x] Ensure area lookup utilities prefer `Location.ha_area_id`

### C) Topology→HA Parent Sync
- [x] Disabled topology→HA create/rename/delete writeback paths per ADR-HA-017
- [x] Enabled topology reorder floor-link sync for HA-backed areas (`ha_area_id` -> HA `floor_id`)
- [x] Added regression coverage to ensure non-reorder lifecycle actions do not mutate HA registry

### D) WebSocket Contract
- [x] `locations/create/update/delete` are rejected with `operation_not_supported`
- [x] `locations/reorder` is allowed for hierarchy overlay
- [x] `locations/reorder` syncs HA-backed area `floor_id` from nearest floor ancestor (or `null` at root/no-floor lineage)
- [x] `sync/status` response returns canonical linkage (`ha_area_id`, `ha_floor_id`)
- [x] `sync/enable` is blocked for HA-backed floor/area wrappers and allowed for topology-only locations

### E) Service Wrapper Contract
- [x] `clear` calls `occupancy.clear`
- [x] Fallback to `occupancy.release` if `clear` is unavailable
- [x] Add/adjust tests for both paths

### F) Metadata Type Consistency
- [x] New sync-imported areas write `_meta.type = "area"`
- [x] Tests updated to assert `area` not `room`

---

## Acceptance Criteria

- [x] Backend tests pass:
  - `tests/test_sync_manager.py`
  - `tests/test_websocket_contract.py`
  - `tests/test_services.py`
- [x] Existing regression subset remains green:
  - `tests/test_init.py`
  - `tests/test_persistence.py`
  - `tests/test_coordinator.py`
  - `tests/test_event_bridge.py`
- [x] No API path in adapter depends on deprecated/non-existent HA floor APIs.
- [ ] UI receives stable `ha_area_id` values from backend for area-linked locations.

---

## Notes

This issue is contract hardening, not UX redesign. UI behavior changes should be tracked separately unless they are direct consequences of backend contract fixes.
