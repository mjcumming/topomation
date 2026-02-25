# Issue [ISSUE-051]: Floor/Area Sync Validation Matrix

**Epic**: [EPIC-002] Testing Coverage  
**Status**: Complete  
**Created**: 2026-02-24  
**Priority**: High

---

## Objective

Validate that HA floor/area registries and topology hierarchy remain consistent under real mutation flows (HA→Topology and Topology→HA), including authority policies and nested parent changes.

---

## Test Matrix

### 1) Initial Import
- [x] Empty HA registries -> no topology locations (rootless model)
- [x] Floor import creates `floor_<id>` locations
- [x] Area import creates `area_<id>` locations with canonical `ha_area_id`
- [x] Area with `floor_id` maps parent to corresponding `floor_<id>` location
- [x] Entity registry area assignments map to expected area locations

### 2) HA -> Topology Live Sync
- [x] Area rename updates topology location name when sync allowed
- [x] Area floor reassignment updates topology parent when sync allowed
- [x] Area deletion removes topology location when sync allowed
- [x] Area rename ignored when `sync_source=topology`
- [x] Area rename ignored when `sync_enabled=false`
- [x] Floor rename updates topology floor location name
- [x] Floor deletion reparents child areas and removes floor location

### 3) Topology Hierarchy Overlay (No HA Registry Writeback)
- [x] Topology reorder/reparent persists hierarchy overlay locally
- [x] Topology reorder/reparent updates HA-backed area `floor_id` using nearest floor ancestor (or `null` at root/no-floor lineage)
- [x] Topology reorder/reparent does not mutate HA area/floor names or create/delete HA registries
- [x] Topology create/rename/delete remain blocked by adapter policy

### 4) Authority + Policy Enforcement
- [x] HA-origin updates apply only when `sync_source=homeassistant` + `sync_enabled=true`
- [x] `sync_source=topology` blocks HA-origin overwrite
- [x] `sync_enabled=false` blocks HA->topology updates
- [x] WebSocket `create/update/delete` always return `operation_not_supported`
- [x] WebSocket `reorder` allows HA-backed area moves without a floor ancestor and clears `floor_id`

### 5) WebSocket/API Contract
- [x] `locations/list` always returns canonical `ha_area_id`
- [x] `locations/create` is blocked by adapter policy (`operation_not_supported`)
- [x] `locations/reorder` updates HA-backed area `floor_id` (`null` when root/no-floor) and returns `ha_floor_id`
- [x] `sync/status` reports canonical linkage and policy fields

---

## Acceptance Criteria

- [x] Automated tests cover each matrix section with deterministic assertions.
- [x] Live HA manual/API-assisted pass executed and documented (date, HA version, scenarios, result).
- [x] No unresolved contract mismatches remain between adapter and current core API.

---

## Live HA Validation Results

Use [docs/live-ha-validation-checklist.md](../../docs/live-ha-validation-checklist.md) for the step-by-step procedure.

| Run | Date | HA Version | Result | Notes |
|-----|------|------------|--------|-------|
| 1 | 2026-02-24 | 2025.11.0.dev0 | PASS | API-assisted validation in `/workspaces/core` runtime. Verified: lifecycle mutation blocking, reorder/floor writeback (`ha_floor_id` + area registry), occupancy source config, trigger/timeout/retrigger behavior, manual services (`trigger/clear/lock/unlock`). |
| 2 | 2026-02-24 | 2025.11.0.dev0 | PASS | UI/hierarchy confirmation and ADR-HA-020 validation alignment. Playwright harness suite passed (`10/10`), panel registration confirmed in HA logs, backend ADR-HA-020 policy/persistence/contract tests passed (`58/58`). |

## Run 1 Details (2026-02-24)

- Environment:
  - HA Core: `2025.11.0.dev0`
  - `topomation`: `0.1.0`
  - `home-topology` core: `0.2.0-alpha`
- Sync/hierarchy checks:
  - `topomation/locations/create|update|delete` return `operation_not_supported`
  - `topomation/locations/reorder` updates HA area `floor_id` and returns expected `ha_floor_id`
  - Reorder to root clears HA `floor_id` (`null`) as expected
- Occupancy checks:
  - Configured occupancy source on `area_kitchen` via `locations/set_module_config`
  - `binary_sensor.kitchen_occupancy` turned ON on trigger within SLA window
  - Re-trigger reset timeout behavior verified
  - Timeout-based OFF verified after fix to timeout rescheduling path
- Services checks:
  - `topomation.trigger`, `topomation.clear`, `topomation.lock`, `topomation.unlock` all validated against `area_kitchen`

**Sign-off**: Live validation must pass before v0.1.0 release.

## Run 2 Details (2026-02-24)

- UI/panel confirmation:
  - Playwright e2e suite passed:
    - `npm --prefix custom_components/topomation/frontend run test:e2e`
    - Result: `10 passed`
  - Coverage includes panel load, tree rendering, read-only lifecycle behavior,
    hierarchy move/reorder, and occupancy inspector render.
  - HA runtime logs confirm panel registration for:
    - `/topomation`
    - `/topomation-occupancy`
    - `/topomation-actions`
- ADR-HA-020 automated matrix:
  - `PYTHONPATH=. pytest --no-cov -q tests/test_panel.py tests/test_event_bridge.py tests/test_persistence.py tests/test_websocket_contract.py`
  - Result: `58 passed`
- Log review:
  - No `home_topology` ERROR/CRITICAL entries during validation window.
  - Existing non-blocking WARNING entries are present (custom integration notice;
    duplicate import warnings during restore/import merge).
  - Unrelated Wiim integration UPnP timeout errors observed; not attributable to
    topomation validation scope.

---

## Artifacts

- Test logs
- Any added/updated tests in `tests/`
- [docs/live-ha-validation-checklist.md](../../docs/live-ha-validation-checklist.md) — manual validation procedure
- Optional screenshot/log evidence for live HA validation
