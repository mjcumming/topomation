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
- Decision: Topology parent changes assign HA `floor_id` from nearest ancestor carrying `ha_floor_id`.

5. **Clear Service Compatibility**
- Decision: `home_topology.clear` maps to `occupancy.clear(...)` for current core, with fallback to `release(...)` for legacy compatibility.

6. **HA Registry Writeback Policy**
- Decision: Per ADR-HA-017, this adapter does not mutate HA area/floor registries.
- Result: topology->HA rename/floor writeback paths are disabled.

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
- [x] Disabled topology→HA area/floor writeback paths per ADR-HA-017
- [x] Added regression coverage to ensure topology parent/rename actions do not mutate HA registry

### D) WebSocket Contract
- [x] `locations/create` accepts optional `ha_area_id`
- [x] `locations/create` persists `ha_area_id` on `Location`
- [x] `locations/update` supports `changes.ha_area_id`
- [x] Sync status response returns canonical `ha_area_id`

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
