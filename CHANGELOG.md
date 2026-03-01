# Changelog

All notable changes to `topomation` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

(None.)

## [0.2.4] - 2026-03-01

### Fixed

- **Removed all legacy DnD reparent guards and compatibility paths.** The backend
  no longer blocks reparenting locations that have children. The nested try/except
  compat path, `_location_has_children`, `_is_parent_reparent_block_error`, and
  the frontend `_isLegacyParentReparentError` fallback are all deleted. The kernel
  v1.0.0 `reorder_location` handles subtree moves correctly; the integration now
  calls it directly without any workarounds.

### Removed

- `_location_has_children()` helper (backend)
- `_is_parent_reparent_block_error()` helper (backend)
- Legacy parent-reparent compatibility path in `handle_locations_reorder` (backend)
- `_isLegacyParentReparentError()` method (frontend)
- `_handleLocationMoveBlocked()` handler and `@location-move-blocked` listener (frontend)
- Associated test cases for legacy compat behavior

## [0.2.3] - 2026-02-28

### Fixed

- Re-synced committed frontend runtime bundle (`topomation-panel.js`) with
  current TypeScript source to restore CI frontend parity checks.
- Browser component tests now run through a wrapper that auto-resolves
  `CHROME_PATH` from Playwright Chromium, removing repeated path lookup
  failures in local/CI workflows.

### Changed

- Auto Release workflow now hard-blocks release creation unless required CI jobs
  (`Backend checks`, `Frontend checks`, `Comprehensive gate`) are explicitly
  green for the release commit; CI timeout now fails release instead of
  continuing.
- Release/runbook rules now explicitly require verifying CI/release success
  before considering a release complete and require documenting recurring
  environment/workflow prerequisites when discovered.

## [0.2.2] - 2026-02-28

### Fixed

- Tree drag-and-drop now correctly allows reparenting a location that has
  children (subtree move), including floor-to-building/root and area-to-area
  valid moves under hierarchy rules.
- Added backend compatibility handling for legacy manager behavior that rejected
  parent-node reparent requests with the message "Parent locations cannot move
  under a different parent", while preserving cycle/type validation.

## [0.2.1] - 2026-02-28

### Changed

- **Auto Release:** Release job now runs when the release for the current version
  does not exist (in addition to when the version just changed or on manual run).
  Unblocks creating a release after fixing CI or changelog without a second
  version bump. Runbook updated with note to use "Run workflow" if a release was
  skipped.

## [0.1.20] - 2026-02-28

### Changed

- **Tree drag-and-drop: explicit drop zones (C-011, ADR-HA-039).** Drop outcome is
  determined only by which zone is hovered (before / inside / after / outdent),
  not by pointer x-offset or heuristics. Each row exposes three Y-based zones:
  top third = insert before, middle = make child, bottom third = insert after;
  when hovering the current parent row, a left-edge strip = outdent to grandparent.
  This removes heuristic drift and makes DnD behavior deterministic and
  testable.

### Added

- E2E regression tests for tree DnD zones (Playwright: before/inside/after drop)
  and unit tests for zone resolver and hit-test (`tree-dnd-zones`, vitest).
- Contract C-011 (tree DnD) and ADR-HA-039 (explicit drop targets) in
  `docs/contracts.md` and `docs/adr-log.md`; implementation plan in
  `docs/tree-dnd-stabilization-plan.md`.

### Fixed

- Removed drag-hover auto-expand and x-offset intent logic; replaced with
  zone-only resolution so the same issue does not recur.

## [0.1.19] - 2026-02-28

### Fixed

- Tree drag-and-drop now allows moving parent nodes with children to a different
  valid parent (subtree reparent), instead of blocking cross-parent moves for
  any node that had children.
- HA-backed area wrappers now preserve persisted custom topology parent overlays
  across restart/import and routine HA area updates (for example rename),
  preventing area-under-area hierarchy from being flattened back to floor links
  on startup.

## [0.1.18] - 2026-02-27

### Fixed

- Creating an `area` from Topomation now creates/links a real Home Assistant
  Area Registry entry and persists the resulting `ha_area_id`.
- Area creation now uses canonical area wrapper IDs (`area_<ha_area_id>`) and
  reuses pre-existing wrappers when HA sync races in first, preventing duplicate
  create failures.

### Added

- WebSocket contract coverage for:
  - automatic HA area creation/linking on `locations/create` for `type=area`
  - explicit error when a caller passes a non-existent `ha_area_id`

## [0.1.17] - 2026-02-27

### Changed

- Tree drag-and-drop no longer auto-expands collapsed branches during hover.
  Expansion is now explicit/manual (chevron), while drag/drop still supports
  reorder and reparent intents.
- Frontend runtime bundle (`topomation-panel.js`) is synchronized with the
  updated tree drag behavior.

## [0.1.16] - 2026-02-27

### Changed

- Tree drag-and-drop behavior now avoids constant auto-expansion and only
  expands hierarchy nodes when needed.
- Multi-entry action-rule calls now carry stronger `entry_id` resolution hints
  between panel and websocket flows.

### Fixed

- Reduced repeat `"Multiple Topomation entries loaded; include 'entry_id'"`
  failures when opening occupied/vacant action tabs in installations with more
  than one Topomation config entry.
- Added regression coverage for connection entry-hint resolution and updated
  frontend e2e tests for default-collapsed tree navigation.

## [0.1.15] - 2026-02-27

### Changed

- Rewrote `README.md` to better reflect the current integration behavior and
  scope: occupancy-first model, topology workspace, lock/service surface,
  managed occupied/vacant automations, and current alpha limitations.
- Updated quick-start and validation sections in `README.md` to point users to
  the active architecture/contracts/release docs.

## [0.1.14] - 2026-02-27

### Added

- ADR-HA-038 documenting managed-action REST API approach and configuration
  requirements (`automations.yaml` must be included in `configuration.yaml`).
- Stable automation IDs (location + trigger + action) so saves update in place
  instead of creating duplicate rules.
- Area assignment on created automations (from location `ha_area_id`) to match
  the HA UI Save dialog.
- Scripts: `verify-automation-crud.py` (create/read/delete), `query-area-entities.py`
  (list entities in an area), `cleanup-topomation-automations.py` (dedupe rules).

### Fixed

- Entity enumeration now includes entities whose area is inherited from their
  device (sync manager previously only considered entities with direct
  `entity.area_id`), fixing incomplete SOURCES lists for areas with
  device-assigned entities.

## [0.1.13] - 2026-02-27

### Changed

- Managed actions now use Home Assistant's config REST API
  (`POST`/`DELETE` `/api/config/automation/config/<id>`) instead of direct
  file I/O. HA handles validation, file write, and reload; no more
  reading/writing `automations.yaml` from the integration.
- Integration creates a system user and token for API auth; no user
  long-lived token required.

## [0.1.12] - 2026-02-27

### Changed

- Managed-action implementation rewritten to match Home Assistant's own
  `config/automation.py` pattern: read `automations.yaml`, upsert by id, write
  atomically, call `automation.reload`. Removed include-directory detection,
  polling loop, rollback logic, and ~700 lines of redundant code.
- Managed-action writes now always target `automations.yaml` (same as HA's
  built-in automation config API).

## [0.1.11] - 2026-02-27

### Fixed

- Topomation now wires `AutomationModule` with a concrete Home Assistant
  platform adapter during setup (`set_platform` + occupancy module linkage),
  preventing runtime initialization gaps reported in production logs.
- Managed-action WebSocket handlers now emit explicit warning logs for
  `list/create/delete/set_enabled` validation failures so `Saving...` reverts
  are traceable in `ha core logs`.
- Managed-action registration failure message now points to active automation
  include-path validity/writability instead of only `automations.yaml`.

## [0.1.10] - 2026-02-27

### Fixed

- Managed-action writes now honor active Home Assistant automation include
  strategy from `configuration.yaml` (`!include_dir_list`,
  `!include_dir_merge_list`, and `!include`) instead of always writing to
  `/config/automations.yaml`.
- Include-directory strategies now persist one managed rule file per
  automation ID, allowing Home Assistant to load and register Topomation rules
  in installs that do not use `automations.yaml`.
- Managed-rule delete/rollback now also cleans legacy `automations.yaml`
  entries for migration compatibility.

## [0.1.9] - 2026-02-27

### Added

- ADR-HA-037 documenting strict in-instance managed-action verification and
  no-fallback WS contract enforcement.
- Backend regression coverage for managed-action create rollback and reload
  timeout error surfacing in `tests/test_managed_actions.py`.
- Frontend WS-contract tests for explicit failure when managed-action WS
  commands are unavailable in
  `custom_components/topomation/frontend/vitest/ha-automation-rules.test.ts`.

### Changed

- Managed-action create now requires confirmed HA runtime registration after
  reload; if registration does not converge, Topomation rolls back the write
  and returns an actionable error.
- Managed-action create/delete/enable frontend APIs are now strict WS backend
  contract paths (no browser-side fallback for mutation operations).
- Dev workflow docs now explicitly require in-container `hass` validation and
  disallow remote probing during this runbook path.

### Fixed

- Prevents silent `Saving...` -> unchecked regressions caused by reporting
  success before HA actually registered the automation entity.
- Converts long/stalled automation reload waits into explicit timeout errors
  instead of opaque failure behavior.

## [0.1.8] - 2026-02-27

### Added

- Backend managed-action runtime module (`managed_actions.py`) plus new
  websocket commands:
  - `topomation/actions/rules/list`
  - `topomation/actions/rules/create`
  - `topomation/actions/rules/delete`
  - `topomation/actions/rules/set_enabled`
- Backend WebSocket contract tests for managed-action commands in
  `tests/test_websocket_contract.py`.
- Managed-actions helper unit coverage in `tests/test_managed_actions.py`.
- Frontend unit tests for WS-first managed-action path and fallback behavior in
  `custom_components/topomation/frontend/vitest/ha-automation-rules.test.ts`.
- ADR-HA-036 documenting WS-first managed-action backend ownership.

### Changed

- Frontend managed-action operations are now WebSocket-first and call backend
  integration commands instead of browser-primary automation-config writes.
- Topomation setup now stores managed-action runtime in kernel state for shared
  WebSocket handler access.
- Architecture/contracts/runbooks now document backend-owned rule mutation flow
  and updated release triage expectations.
- Live managed-action contract runner now fails fast when Topomation integration
  is not loaded in the target HA instance (prevents false-green skipped gates).

### Fixed

- Live test runner integration-detection now falls back to `/api/config`
  component checks when `/api/config/integrations` is unavailable (404) on the
  active HA runtime, preventing false "integration not loaded" failures.

## [0.1.7] - 2026-02-26

### Fixed

- Release version metadata is now synchronized across
  `manifest.json`, `const.py`, and `pyproject.toml` so CI version-sync
  validation passes reliably during auto-release.

## [0.1.6] - 2026-02-26

### Changed

- Topomation manager routes now register with `require_admin=True` so panel access
  matches Home Assistant's admin-only automation-config write APIs.
- Managed-action convergence checks now short-circuit on already-satisfied local
  state before forcing reload polls, avoiding false visual reverts when backend
  visibility lags.

### Fixed

- Managed-action fallback handling now supports mixed read-permission installs
  without regressing create flows that cannot enumerate fresh automations
  through `hass.states` immediately.

## [0.1.5] - 2026-02-26

### Added

- ADR-HA-033 documenting managed-action verification hardening for automation
  config read failures and live-contract semantics.
- `docs/live-release-testing-paradigm.md` documenting mandatory real-HA release
  validation (no mock-only releases).
- Managed-action inspector diagnostics now log start/complete/error context for
  toggle/service/dark updates with timing metadata.
- Regression test for blocked `automation/config` reads in
  `ht-location-inspector.test.ts`.

### Changed

- Live managed-action contract test now enables real sockets and validates
  registry `unique_id` -> `entity_id` correlation instead of assuming
  `automation.<config_id>`.
- Live test runner (`tests/run-live-tests.sh`) now executes with `--live-ha`
  and `--no-cov` so live checks actually run and avoid unit coverage gate noise.
- New release gate command `make test-release-live` runs comprehensive local
  checks plus live HA managed-action contract validation.

### Fixed

- Managed-action enumeration no longer silently returns an empty ruleset when
  all candidate `automation/config` reads fail in environments that still show
  Topomation automation evidence; the UI now preserves optimistic state and
  surfaces an explicit verification error path.

## [0.1.4] - 2026-02-26

### Added

- Live HA managed-action contract test:
  `tests/test-live-managed-actions-contract.py` validates create/list/config/delete
  behavior against real Home Assistant APIs.
- Frontend coverage for external automation add/delete reconciliation and
  fallback behavior when `config/entity_registry/list` is unavailable.
- Production smoke assertion coverage for managed action behavior when entity
  registry access is denied.

### Changed

- Managed action rule listing now falls back to `hass.states` when entity
  registry WebSocket access is blocked, preventing false-empty rule loads on
  restricted installs.
- Inspector now subscribes to `state_changed` for all `automation.*` entities
  and debounces rule reloads so external add/delete/edit operations reconcile in
  the UI without manual refresh.
- Inline managed action edits/toggles now keep optimistic local rule state and
  surface a success message when backend registry convergence is delayed.
- Release validation workflow now requires full local comprehensive gate plus
  documented optional live managed-action contract validation before version cut.

### Fixed

- `On Occupied` / `On Vacant` include toggles no longer silently revert on
  installs where entity registry access is restricted.
- Production smoke failure in CI caused by invalid managed-action state-id
  expectations in the registry-denied scenario.

## [0.1.3] - 2026-02-26

### Added

- Integration options dialog with about/info metadata (version, panel route, docs,
  issues) from the Devices & Services integration entry.
- Production-smoke coverage for managed action toggles under delayed automation
  registry/config visibility.
- Inline `Only when dark` action-row guard that writes a sun-based condition
  (`sun.sun` below horizon) to managed occupied/vacant automations.

### Changed

- Managed automation rule UI now performs bounded retry/reload convergence checks
  after inline include/service edits to tolerate eventual consistency in larger
  live Home Assistant installs.
- Action-rule discovery now prioritizes likely Topomation automation registry
  entries and waits longer for newly-created automations to appear.
- Topomation now only exposes occupancy binary sensors as entities.
- Mock harness persistence now keeps managed automation configs/registry entries
  across reloads in production profile.
- Local comprehensive gate (`scripts/test-comprehensive.sh`) now includes
  frontend production build + committed runtime bundle parity verification.

### Fixed

- Inline action toggles/selectors in `On Occupied`/`On Vacant` no longer
  frequently revert after showing `Saving...` when backend entity registry or
  automation config updates are delayed.
- Existing ambient entities are pruned from the entity registry on startup.
- Frontend runtime bundle (`topomation-panel.js`) is now regenerated for this
  release so CI/frontend checks match shipped UI behavior.

## [0.1.2] - 2026-02-26

### Added

- End-to-end workflow coverage for location dialogs and automation workflows in
  `custom_components/topomation/frontend/playwright/workflows.spec.ts`.
- Production-like frontend smoke profile tests in
  `custom_components/topomation/frontend/playwright/production-smoke.spec.ts`,
  including save/reload persistence, stale-read convergence, and runtime event
  replay checks.
- One-command full test orchestrator at `scripts/test-comprehensive.sh` plus
  Make targets for frontend slices and production smoke execution.

### Changed

- CI workflow (`.github/workflows/frontend-tests.yml`) now includes a required
  `Comprehensive gate` job that runs backend + frontend unit/component/e2e
  suites before release automation proceeds.
- Mock harness now supports profile-driven execution (`?profile=production`)
  with persisted mock state, eventual-consistency lag simulation for module
  config saves, and replayable runtime event sequences.
- Panel reload behavior now includes a trailing consistency reload after
  `topomation_updated` events to converge UI state when backends briefly return
  stale snapshots.

### Fixed

- Stabilized frontend tests around inspector action toggles and tab state.
- Updated Playwright panel expectations to align with current action row
  rendering and move-event wiring.

## [0.1.1] - 2026-02-26

### Fixed

- HACS repository detection no longer sees a phantom `tests` integration:
  removed tracked UI artifact files from `custom_components/tests/**` so
  `custom_components/` only contains `topomation`.
- CI backend test environment now installs `home-assistant-frontend` in dev
  dependencies, preventing `ModuleNotFoundError: hass_frontend` during
  integration setup.

## [0.1.0] - 2026-02-26

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
- Updated package requirements to align with core v3 (`home-topology==1.0.0`,
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

- Local HA test environment compatibility by aligning test stack pins for
  current HA (`pytest-asyncio>=1.0`,
  `pytest-homeassistant-custom-component>=0.13.316`).

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
