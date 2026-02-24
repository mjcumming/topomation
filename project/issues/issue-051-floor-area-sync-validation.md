# Issue [ISSUE-051]: Floor/Area Sync Validation Matrix

**Epic**: [EPIC-002] Testing Coverage  
**Status**: Planned  
**Created**: 2026-02-24  
**Priority**: High

---

## Objective

Validate that HA floor/area registries and topology hierarchy remain consistent under real mutation flows (HA→Topology and Topology→HA), including authority policies and nested parent changes.

---

## Test Matrix

### 1) Initial Import
- [ ] Empty HA registries -> only explicit root topology location
- [ ] Floor import creates `floor_<id>` locations
- [ ] Area import creates `area_<id>` locations with canonical `ha_area_id`
- [ ] Area with `floor_id` maps parent to corresponding `floor_<id>` location
- [ ] Entity registry area assignments map to expected area locations

### 2) HA -> Topology Live Sync
- [ ] Area rename updates topology location name when sync allowed
- [ ] Area floor reassignment updates topology parent when sync allowed
- [ ] Area deletion removes topology location when sync allowed
- [ ] Area rename ignored when `sync_source=topology`
- [ ] Area rename ignored when `sync_enabled=false`
- [ ] Floor rename updates topology floor location name
- [ ] Floor deletion reparents child areas and removes floor location

### 3) Topology -> HA Live Sync
- [ ] Topology area rename does **not** update HA area name (ADR-HA-017)
- [ ] Topology floor rename does **not** update HA floor name (ADR-HA-017)
- [ ] Topology parent changes do **not** mutate HA area `floor_id` (ADR-HA-017)
- [ ] Topology-only locations do not create HA areas implicitly

### 4) Authority + Loop Prevention
- [ ] Lock-based loop prevention blocks circular rename storm
- [ ] `sync_source=homeassistant` + `sync_enabled=true` allows writeback
- [ ] `sync_source=topology` blocks HA-origin overwrite
- [ ] `sync_enabled=false` blocks cross-boundary writes both directions

### 5) WebSocket/API Contract
- [ ] `locations/list` always returns canonical `ha_area_id`
- [ ] `locations/create` persists provided `ha_area_id`
- [ ] `sync/status` reports canonical linkage and policy fields

---

## Acceptance Criteria

- [ ] Automated tests cover each matrix section with deterministic assertions.
- [ ] Live HA manual pass executed and documented (date, HA version, scenarios, result).
- [ ] No unresolved contract mismatches remain between adapter and current core API.

---

## Artifacts

- Test logs
- Any added/updated tests in `tests/`
- Optional screenshot/log evidence for live HA validation
