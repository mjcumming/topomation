# Live Home Assistant Validation Checklist

Use this checklist to validate the topomation integration on a real Home Assistant instance. This is required before v0.1.0 release.

**Prerequisites**: Home Assistant running (dev container, VM, or production). Integration installed via developer tools or HACS.

---

## 1. Occupancy Flow (Core Value Proposition)

The primary flow: motion sensor triggers → occupancy entity ON → timeout expires → occupancy entity OFF.

### 1.1 Setup

- [x] Create an Area in HA Settings (e.g., "Kitchen")
- [x] Assign a motion sensor to that area (e.g., `binary_sensor.kitchen_motion`)
- [x] Reload the Topomation integration (or restart HA)
- [x] Open the Topomation panel and select the Kitchen area
- [x] Add the motion sensor as an occupancy source (Configure → Use Source or Add Source)
- [x] Set ON behavior: Trigger with timeout (e.g., 5 minutes)
- [x] Save configuration

### 1.2 Trigger Flow

- [x] Trigger the motion sensor (physical motion or Developer Tools → Services)
- [x] Within 2 seconds: `binary_sensor.occupancy_kitchen` (or equivalent) shows **ON**
- [x] Panel inspector shows "Occupied" for Kitchen
- [x] Event log (if enabled) shows `occupancy.signal` and `occupancy.changed` events

### 1.3 Timeout Flow

- [x] Wait for the configured timeout (e.g., 5 minutes) without further triggers
- [x] After timeout: `binary_sensor.occupancy_kitchen` shows **OFF**
- [x] Panel inspector shows "Vacant" for Kitchen

### 1.4 Re-trigger During Timeout

- [x] Trigger motion again before timeout expires
- [x] Occupancy remains ON; timeout resets
- [x] Wait full timeout from last trigger; occupancy clears

**Result**: [x] PASS / [ ] FAIL — Notes: API-assisted live validation completed in HA dev runtime (2026-02-24).

---

## 2. Manual Service Calls

- [x] Call `topomation.trigger` with `location_id` and `entity_id` → occupancy turns ON
- [x] Call `topomation.clear` with `location_id` → occupancy turns OFF
- [x] Call `topomation.vacate_area` with `location_id` → subtree vacates (default excludes locked)
- [x] Call `topomation.lock` (`mode=freeze`) → occupancy stays ON until unlock
- [x] Call `topomation.lock` (`mode=block_occupied`, `scope=subtree`) → descendants cannot become occupied
- [x] Call `topomation.lock` (`mode=block_vacant`, `scope=subtree`) → descendants cannot become vacant
- [x] Call `topomation.unlock` → occupancy can clear normally
- [x] Call `topomation.unlock_all` → all lock sources clear for the target

**Result**: [x] PASS / [ ] FAIL — Notes: Services validated against `area_kitchen` (`trigger`, `clear`, `vacate_area`, `lock`, `unlock`, `unlock_all`).

### 2.1 Manual tree controls (UI)

- [x] Click occupancy icon on an unlocked location row → location becomes occupied
- [x] Click occupancy icon again on an unlocked location row → location vacates
- [x] Click occupancy icon on a locked location row → blocked with warning toast
- [x] Lock icon still toggles lock/unlock independently of occupancy icon

---

## 3. Sync and Hierarchy

### 3.1 Initial Import

- [x] With empty HA registries: topology panel shows no locations (rootless model)
- [x] Create Floor + Areas in HA Settings
- [x] Reload integration: `floor_<id>` and `area_<id>` locations appear
- [x] Areas with `floor_id` have correct parent in tree

### 3.2 HA → Topology Live Sync

- [x] Rename an Area in HA Settings → topology location name updates
- [x] Move an Area to a different Floor in HA Settings → topology parent updates
- [x] Delete an Area in HA Settings → topology location removed

### 3.3 Topology Reorder (Overlay)

- [x] Drag an HA-backed area under a different floor in panel → reorder succeeds
- [x] HA area's `floor_id` updates to new floor (check in HA Settings or via API)
- [x] Drag area to root or `grounds` (no floor ancestor) → HA `floor_id` becomes `null`
- [x] Refresh panel: hierarchy persists

### 3.4 Building/Grounds Structural Nodes

- [x] Create/select integration-owned `building` root node
- [x] Create/select integration-owned `grounds` root node
- [x] Confirm HA-backed areas can be moved under these nodes
- [x] Confirm `building`/`grounds` remain root-level wrappers
- [x] Confirm `subarea` nodes can be nested under HA areas

### 3.5 Lifecycle Actions + Guardrails

- [x] `topomation/locations/create` succeeds for valid location types/parents
- [x] `topomation/locations/update` supports rename/reparent within hierarchy rules
- [x] `topomation/locations/delete` succeeds for non-root nodes
- [x] Home root delete is blocked with a clear guardrail error
- [x] Invalid hierarchy moves are blocked with actionable error messaging

**Result**: [x] PASS / [ ] FAIL — Notes: CRUD lifecycle and guardrails validated in live HA and panel workflows.

---

## 4. ADR-HA-020 Policy Scope (Security v1)

### 4.1 Scoped `armed_away` Vacate

- [x] Create or select a topology root (`building` or imported root area/floor chain)
- [x] Configure `occupancy.policy_sources` for `alarm_control_panel.*` with:
- [x] `state_map.armed_away.action = vacate_area`
- [x] Target scope set to explicit location(s) or `all_roots`
- [x] Set occupied state in at least one child area under each target
- [x] Change panel state to `armed_away`
- [x] Confirm scoped locations are vacated (including descendants)
- [x] Confirm unrelated branches are not vacated when explicit targets are used

### 4.2 Startup Reconciliation

- [x] Leave alarm panel in `armed_away`
- [x] Reload the integration (or restart HA)
- [x] Confirm policy reconciliation runs once and target scope is vacated on startup

**Result**: [x] PASS / [ ] FAIL — Notes: Policy scope/reconciliation verified by automated test matrix and backend runtime checks.

---

## 5. Environment

| Field | Value |
|-------|-------|
| HA Version | 2025.11.0.dev0 |
| topomation version | 0.1.0 |
| Topomation core version | 0.2.0-alpha |
| Date | 2026-02-24 |
| Tester | Mike + Codex (API-assisted) |

---

## 6. Sign-off

- [x] All critical flows (1.1–1.4, 2, 3.1–3.5, 4.1–4.2) passed
- [x] No blocking errors in HA logs
- [x] Ready to document in ISSUE-051

**Validation complete**: 2026-02-24
