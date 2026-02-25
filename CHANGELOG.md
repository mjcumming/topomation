# Changelog

All notable changes to `topomation` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Automation lock policy blueprints:
  - `blueprints/automation/topomation/away_mode_vacant_guard.yaml`
  - `blueprints/automation/topomation/party_mode_hold_occupied.yaml`
- Operator workflow reference for lock modes/scopes and automation usage in
  `docs/occupancy-lock-workflows.md`.
- `topomation.unlock_all` service for operator/emergency lock reset at a
  location.
- ADR-HA-020 edge-case coverage in `tests/test_event_bridge.py` for:
  - invalid policy target fallback to owner location
  - dynamic `all_roots` resolution when root set changes at runtime
- Policy-source persistence round-trip coverage in `tests/test_persistence.py`.
- Panel registration coverage in `tests/test_panel.py` and Playwright harness
  validation (`10/10` passing) for panel load/hierarchy workflows.
- Topology persistence for location tree + module configs now includes sibling
  ordering (`order`) and entity mappings.
- New persistence tests in `tests/test_persistence.py`.
- Sync policy tests for topology-owned and sync-disabled locations in
  `tests/test_sync_manager.py`.
- WebSocket reorder contract test in `tests/test_websocket_contract.py`.
- Service wrapper regression tests in `tests/test_services.py` for occupancy
  command mapping and multi-entry routing.
- Service error-path tests for invalid `entry_id` and not-loaded integration
  handling in `tests/test_services.py`.
- Integration unload test coverage for service unregistration in
  `tests/test_init.py`.
- Cleanup scope guide in `docs/cleanup-pr-scope.md`.

### Changed

- SyncManager now uses explicit authority rules:
  - `sync_source=homeassistant` + `sync_enabled=true` allows sync
  - `sync_source=topology` or `sync_enabled=false` blocks cross-boundary writes
- Home Assistant Area/Floor lifecycle is now managed in HA Settings menus
  (create/rename/delete). The adapter imports HA registry changes and propagates
  HA area/floor renames and HA area floor reassignment into topology.
- Topology hierarchy reorder remains supported as an overlay and now syncs
  HA-backed area `floor_id` from nearest floor ancestor.
- Integration startup/storage migration removed the synthetic `house` root.
  Existing persisted `house` root data is migrated to rootless topology.
- Removed dormant topology→HA mutation handlers from `SyncManager`
  (`location.renamed`, `location.parent_changed`, `location.deleted` writeback
  paths), so policy is now enforced by code removal instead of runtime flags.
- `locations/reorder` now uses core indexed reorder support and persists
  canonical sibling ordering.
- README and integration guide now document service wrapper routing behavior and
  `entry_id` requirements for multi-entry setups.
- Event bridge now targets occupancy v3 API by publishing
  `occupancy.signal` events (`trigger`/`clear`) instead of legacy
  `sensor.state_changed` events.
- Removed legacy core-compat fallback paths in `locations/reorder` and adapter
  setup; integration now assumes core v3 APIs directly.
- Updated package requirements to align with core v3 (`home-topology>=0.2.0a0`,
  Python `>=3.12`).
- Occupancy binary sensor attributes now expose v3 fields
  (`locked_by`, `contributions`, `reason`, etc.) instead of legacy
  confidence/hold attributes.
- Occupancy lock contract is now automation-first:
  - `topomation.lock` forwards `mode` (`freeze`, `block_occupied`,
    `block_vacant`) and `scope` (`self`, `subtree`)
  - `topomation.unlock` remains source-aware
  - `topomation.unlock_all` force-clears all lock owners on a location.
- Location inspector now shows selected-location runtime lock diagnostics and
  vacancy timing:
  - lock sources, lock modes, and direct lock directives (source/mode/scope)
  - current `time until vacant` and `vacant at` details based on effective
    occupancy timeout state.
- Updated active docs/status artifacts for v3 contract and current project state
  (`integration-guide`, `coding-standards`, `cursor-guide`, roadmap/epics/work-tracking).
- Occupancy source UX now supports end-to-end edit flow from inspector:
  source rows show ON/OFF behavior + timeout semantics, and the inspector cog
  opens `ht-entity-config-dialog` for per-source editing.
- Occupancy source rows now include `Test ON` / `Test OFF` controls that call
  existing `topomation.trigger` / `topomation.clear` service wrappers.
- Add/edit source dialogs now include quick templates, effective behavior
  preview text, and warning callouts for non-functional or risky mappings.
- Added optional in-panel runtime event log window to inspect relevant
  `state_changed`, `home_topology_updated`, and source test actions during tuning.
- Runtime event log now defaults to selected-location subtree filtering, with a
  one-click toggle to view events across all locations.
- Occupancy source dialogs now include event behavior presets
  (`Pulse` / `State-Mapped` / `Clear-Only` / `Ignored`) to speed up ON/OFF
  event mapping.
- Occupancy source dialogs now show contribution preview text describing whether
  each source creates occupancy, clears occupancy, both, or neither.
- Location inspector now shows occupancy source contribution summary counts
  (trigger, clear, indefinite, ignored) plus per-source contribution text.
- Location tree drag-and-drop now uses level-stable reorder behavior by default
  and clearer drag visual states/handle affordance to reduce accidental
  reparenting.
- Occupancy inspector layout now keeps configuration controls left-aligned
  (including Default Timeout), preventing far-right drift and header overlap in
  wide panels.
- Frontend dialog event wiring fixed in panel (`dialog-closed` handlers for
  add-device and rule dialogs), preventing stuck-open dialog state.
- Occupancy source policy now enforces area-only sensor configuration:
  floors show a policy notice in inspector, source dialogs reject floor
  locations, and `locations/set_module_config` rejects non-empty
  `occupancy_sources` on floor locations.
- Sync manager now uses Home Assistant's dedicated floor registry APIs
  (`homeassistant.helpers.floor_registry`) instead of legacy
  `area_registry.floors` assumptions.
- Area imports now set canonical `Location.ha_area_id` links, and sync status
  reports canonical area linkage.
- `locations/create` now accepts and persists optional `ha_area_id`.
- Occupancy inspector now uses an area-first source workflow:
  it lists entities assigned to the selected area with per-entity
  `Use Source` / `Configure` actions, while cross-area mapping moved to
  explicit `Add External Source`.
- Occupancy inspector visual cleanup: fixed mock icon rendering, tightened
  row/action spacing, moved `Add External Source` into the `Area Sensors`
  subsection header, and aligned source timeout text with effective defaults.
- Occupancy source model now supports per-signal interaction sources for media
  and dimmable lights using explicit `signal_key` records:
  - media: `playback`, `volume`, `mute`
  - light: `power`, `level`, `color`
  with source IDs persisted as `{entity_id}::{signal_key}`.
- Occupancy source editor now keeps OFF behavior configurable for
  appliance-like sources (light/switch/fan/power signals) while treating pure
  interaction signals (`volume`, `mute`, `level`, `color`) as trigger-only.
- Wrapper location lifecycle policy is now enforced end-to-end:
  `locations/create`, `locations/update`, and `locations/delete` return
  `operation_not_supported`, while `locations/reorder` is allowed for
  hierarchy overlay; panel/tree keeps Area/Floor lifecycle read-only and
  supports drag-move hierarchy management with HA-backed area `floor_id`
  synchronization on reorder.

### Fixed

- Local HA test environment compatibility by using `pycares<5` with current
  `aiodns` and pinning `pytest-asyncio<1` for plugin fixture compatibility.

- Unload/teardown safety for event unsubscription.
- Coordinator timeout scheduling now ignores invalid non-datetime module values.
- Duplicate pytest fixture definition cleanup in `tests/conftest.py`.
- HA service wrapper now calls correct core occupancy APIs (`clear` -> `release`)
  and passes required `source_id` for lock/unlock/vacate operations.
- Service registration is now idempotent and services are unregistered when the
  last config entry unloads.
- Entity area-change cleanup now emits debug logs instead of silently swallowing
  old-location removal errors in `sync_manager.py`.
- `topomation.clear` service now maps to core `occupancy.clear(...)` and
  falls back to legacy `release(...)` only when needed.
