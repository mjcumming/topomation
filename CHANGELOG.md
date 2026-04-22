# Changelog

All notable changes to `topomation` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.2.57] - 2026-04-22

### Changed

- **Occupancy Groups authoring**: the Home Assistant inspector now treats
  `property`, `building`, `grounds`, and `floor` as eligible group hosts,
  while still limiting membership to **immediate child `area`** rows only.
- **Structural occupancy UX**: structural hosts keep derived occupancy/source
  behavior, but now surface `Occupancy Groups` plus the structural summary in
  the active inspector workflow instead of reserving group authoring to floors.

### Fixed

- **Frontend bundle publish**: the production panel build now publishes
  ``topomation-panel.js`` via an **atomic temp-file rename** instead of copying
  over the served file in place, reducing intermittent blank custom-panel loads
  when Home Assistant requests the module during a rebuild.

### Documentation

- **ADR / contracts alignment**: clarified that occupancy-group runtime remains
  in `home-topology`, while host eligibility, managed-shadow exclusion, and
  immediate-child candidate discovery are Home Assistant integration policy.

### Tests

- **Frontend**: inspector unit coverage for building-host occupancy groups,
  managed-shadow exclusion, and updated structural-host occupancy-group copy.
- **Backend**: websocket contract coverage now verifies `occupancy_group_id`
  acceptance and shared runtime behavior for direct child `area` rows under a
  `building`, matching the kernel’s type-agnostic grouping model.

## [0.2.56] - 2026-04-17

### Fixed

- **HA → topology sync** (C-022): when Home Assistant **removes an area**, the
  matching ``area_*`` topology wrapper is now removed after **reparenting direct
  children** to the deleted node’s parent (same semantics as ``locations/delete``,
  without calling ``area_registry.async_delete`` again). This applies to
  **``sync_source: topology``** room rows as well, so HA remains authoritative for
  user-deleted areas.
- **Managed shadow** HA areas that disappear from the registry still **reconcile**
  back via existing managed-shadow passes after the stale wrapper is pruned.

### Changed

- **Startup import**: after entity mapping, **``reconcile_missing_ha_area_wrappers``**
  runs so persisted topology cannot keep ``area_*`` rows whose ``ha_area_id`` no
  longer exists in HA, before the managed-shadow reconcile pass.

### Tests

- **Backend**: ``test_ha_area_delete_reparents_overlay_children`` and
  ``test_reconcile_missing_ha_removes_stale_area_wrapper`` in ``test_sync_manager.py``.

### Fixed (CI)

- **Version sync**: align ``const.py`` and ``pyproject.toml`` with ``0.2.56`` (was
  only bumped in ``manifest.json`` in the first commit, which failed
  ``scripts/verify-version-sync.py`` on CI).

## [0.2.55] - 2026-04-17

### Added

- **Lighting managed rules**: **Test rule** runs the configured light actions
  immediately via Home Assistant ``callService`` (works for drafts, dirty edits,
  and saved rules).

### Changed

- **Lighting managed rules**: for a **saved** rule with no pending edits, lights
  that are part of the rule are listed **first** (then other area lights); drafts
  and dirty rows keep name-sorted order so the list does not jump while editing.

### Tests

- **Frontend**: Vitest coverage for configured-first row order and for **Test rule**
  ``callService`` sequencing.

## [0.2.54] - 2026-04-16

### Added

- **ADR-HA-082**: Records intended user journeys for future **climate** (thermostat)
  managed actions (setpoints, presets, fan) versus today’s **fans-first** HVAC tab,
  and sets a bar for keeping that surface simple when implemented.

### Changed

- **Inspector tabs (narrow / mobile)**: location inspector tabs (Occupancy, Ambient,
  Lighting, Media, HVAC, etc.) scroll horizontally when they do not fit on one line.
- **Lighting managed rules**: new drafts start with **no** occupancy or ambient
  trigger selected; validation still requires at least one trigger before save.
  Default light action brightness for dimmable ``turn_on`` is **100%** (was 30%).
- **Occupancy sources list**: configured sources sort to the **top** of the area
  candidate list for quicker scanning after save.
- **Media / HVAC / Appliances managed rules**: device targets and commands use
  **choice-pill / radio** controls instead of dropdowns (small per-area entity
  pools). HVAC includes a short hint tying **time windows** to setback-style fan
  schedules; thermostat setpoints/presets remain **out of scope** until a
  dedicated climate contract lands (see ADR-HA-082).

### Fixed

- **Tree occupancy toggle (managed-shadow hosts)**: manual row toggle now treats
  a floor/building/grounds/property as occupied when either the effective HA
  occupancy entity is on **or** the same descendant rollup that drives the tree
  dot is occupied. Fixes repeated ``trigger`` / “marked occupied” when children
  were occupied but the shadow sensor read ``off`` (panel location lists omit the
  shadow row, so click-time HA resolution alone could miss that case).

### Tests

- **Frontend**: Vitest coverage for ``rollupOccupancyStatusByLocation`` /
  ``isManagedShadowOccupancyHost``; panel integration test for vacate on shadow
  host when rollup occupied and shadow entity is off. Playwright and inspector
  tests updated for pill-based media/HVAC/appliances actions.

### Documentation

- **Contracts**: panel enumeration for Media/HVAC/Appliances; Lighting draft
  trigger default; ADR-HA-082 added to ``docs/adr-log.md``.

## [0.2.53] - 2026-04-14

### Fixed

- **Managed shadow occupancy**: structural host managed shadows (`area_*` rows for
  floor / building / grounds / property) now always reconcile to
  `occupancy_strategy: follow_parent` and `contributes_to_parent: false`, with
  sensible occupancy defaults when missing. Prevents host vs shadow runtime
  divergence (for example tree/summary occupied while inspector showed vacant,
  or confusing manual toggle behavior).
- **Startup ordering**: after `reconcile_managed_shadow_areas()` during setup,
  the occupancy module is notified via `on_location_config_changed` so the
  engine rebuilds with the stamped shadow config.

### Tests

- **SyncManager**: `assert_all_managed_shadows_mirror_host_occupancy` and a
  combined import test assert the mirror contract for every managed shadow.
- **Kernel regression**: `tests/test_managed_shadow_occupancy_invariant.py`
  covers correct mirror behavior when a descendant room triggers, and documents
  the failure mode when shadow occupancy is misconfigured as independent.

### Documentation

- **C-014**: managed shadow validity now explicitly requires mirror occupancy
  config for tree vs inspector consistency.
- **Release workflow**: `docs/release-validation-runbook.md` and
  `docs/agent-quickstart.md` note publishing concise GitHub Release notes with
  `CHANGELOG.md` as canonical detail.

## [0.2.52] - 2026-04-14

### Fixed

- **Tree lock controls (operator mode)**: manual lock/unlock now use subtree
  semantics by default for fast testing workflows.
  - Lock: `topomation.lock(..., mode=freeze, scope=subtree, source_id=manual_ui)`
  - Unlock: force-clear subtree lock directives via `unlock_all`.
- **Tree lock status accuracy**: managed-shadow host rows now resolve lock state
  from the effective occupancy topology id, so floor/host lock icons and state
  messages match actual runtime lock state.
- **Lock source readability**: lock holder/source labels are human-readable in
  tree/inspector surfaces (for example `Manual panel` instead of `manual_ui`).
- **Tree occupancy toggle**: manual row toggle intent now resolves from the
  current effective HA occupancy entity state at click time (with event payload
  only as fallback), preventing stale UI payloads from re-sending `trigger`
  when a location is already occupied.
- **Tree occupancy button UX**: host rows with managed-shadow occupancy now use
  effective occupancy state for button title/action intent (`Set occupied` /
  `Set vacant`) so tooltips and dispatched toggle behavior match what will
  actually execute.

## [0.2.51] - 2026-04-14

### Tests

- **Frontend**: `ambient-lux-enumeration.ts` + Vitest `vitest/ambient-lux-enumeration.test.ts`
  cover HA area name matching for Ambient lux; inspector adds an integration
  case for `sensor.illuminance` when no topology row maps the native HA area.

## [0.2.50] - 2026-04-14

### Fixed

- **Inspector / Ambient**: lux picker no longer unions **every** descendant-room HA
  area (which listed unrelated illuminance sensors). It now uses **core** areas
  (host + shadow) plus HA registry areas whose **name matches** the structural
  host’s **display name** (case-insensitive), e.g. HA area “Queen” ↔ topology
  property “Queen” for `sensor.illuminance`. **Lighting / Media / HVAC /
  Appliances** still use the full descendant-area union for action rules.

## [0.2.49] - 2026-04-14

### Fixed

- **Inspector / managed-shadow hosts**: the same **descendant `ha_area_id` union**
  used for ambient lux now applies to **all** device enumeration on structural
  hosts (**Lighting**, **Media**, **HVAC**, **Appliances** action rules), not only
  the Ambient tab.

## [0.2.48] - 2026-04-14

### Fixed

- **Inspector / Ambient**: lux sensor dropdown for **property / building / grounds /
  floor** hosts now unions **descendant** topology locations’ native `ha_area_id`
  values (not only the host row and managed shadow). Site illuminance in a child
  HA-backed area (e.g. native “Queen” under the property) appears for assignment
  when the structural host row has no direct `ha_area_id`.

## [0.2.47] - 2026-04-14

### Changed

- **Dependencies**: pin **`home-topology==1.0.4`** (PyPI). Use stock
  **`AmbientLightModule`** `extra_lux_entity_ids` / `invalidate_ambient_sensor_cache`
  from the published kernel; remove in-tree **`TopomationAmbientLightModule`** backport.

## [0.2.46] - 2026-04-13

### Fixed

- **CI / installs**: `home-topology` **1.0.4** is not yet on PyPI; integration again
  pins **1.0.3** and supplies `TopomationAmbientLightModule` in-tree with the same
  managed-shadow `extra_lux_entity_ids` resolution and `invalidate_ambient_sensor_cache`
  behavior so HACS and `pip install` keep working until the kernel release ships.

## [0.2.45] - 2026-04-13

### Fixed

- **Ambient / lux on structure hosts** (`property`, `building`, `grounds`, `floor`):
  illuminance sensors attached to the **managed shadow** topology row (where HA
  registry mappings land) are now included in kernel lux resolution via
  `home-topology` `AmbientLightModule` `extra_lux_entity_ids`, so readings and
  provenance work even when `auto_discover` is off and the host row has no
  `entity_ids`. Ambient sensor cache is cleared on topology entity assignment.
- **Inspector**: managed-shadow HA area enumeration for the Ambient lux picker no
  longer skips hosts solely because `is_explicit_root` is set on the location row.

### Dependencies

- `home-topology` **1.0.4** (`AmbientLightModule` hook + `invalidate_ambient_sensor_cache`).

## [0.2.44] - 2026-04-13

### Changed

- **Occupancy tree strip**: docked panel under the tree is labeled **Occupancy**
  and shows occupied/vacant, **one** primary line (newest `recent_changes` entry
  as “Last event”, otherwise the merged “why” string), plus optional timeout /
  lock meta. Removed separate contributor and full recent-changes lists from the
  tree (use the **Occupancy** tab or HA History/Logbook for depth).
- **Inspector**: derived and structural occupancy summaries use the same
  at-a-glance layout; removed an unwired legacy explainability drawer.
- **Presentation**: `__group_member__:*` sources show readable names; duplicate
  contributions dedupe by `source_id`; aggregate parent contributors merge across
  children.

### Documentation

- **ADR-HA-080**; **C-021** and user docs (README, installation, automation UI
  guide, architecture).

## [0.2.43] - 2026-04-13

### Fixed

- **Structural inspector vs tree / explainability**: for `property`, `building`,
  `grounds`, and `floor`, the inspector header, derived occupancy tab, and
  runtime summary now use the **same descendant rollup** as the topology tree
  and Occupancy Explainability dock (`occupancyStates` across the subtree).
  v0.2.42 already read the correct **shadow** occupancy entity
  (`effectiveOccupancyTopologyId`); this closes the remaining case where that
  entity could read **vacant** while children were **occupied** (e.g. “9
  occupied descendants” but “Vacant” in the inspector).

## [0.2.42] - 2026-04-13

### Fixed

- **Structural host occupancy in the panel** (`property`, `floor`, `building`,
  `grounds`): the inspector and room explainability now read Home Assistant
  occupancy state using the **managed shadow area** topology id
  (`effectiveOccupancyTopologyId`), aligned with `attributes.location_id` on
  the registered entity (ADR-HA-077). Resolves mismatches where the tree showed
  **occupied** but the header or derived summary showed **vacant**.

### Tests

- Vitest coverage for `effectiveOccupancyTopologyId` in
  `vitest/shadow-location-utils.test.ts`.

### Documentation

- **ADR-HA-079**; `docs/contracts.md` and `docs/architecture.md` panel contract
  for shadow-aware occupancy reads; README automation tab ordering for doc
  consistency checks.

## [0.2.41] - 2026-04-13

### Added

- **Ambient** tab on structural locations (`property`, `building`, `grounds`,
  `floor`) next to **Occupancy** / **Occupancy Groups**, so site and structural
  nodes can edit lux sensor and ambient calibration without action tabs.

### Changed

- Panel **forced tab** (deep links such as `/topomation-appliances`) is
  reapplied when the selected location changes, so picking a room after landing
  on a structural node opens the correct inspector tab.
- **Managed shadow** reconciliation runs before the event bridge starts so
  shadow areas exist before occupancy entities register.
- **Occupancy binary sensors** are not created for shadow host locations
  (`floor`, `building`, `grounds`, `property`); only the managed shadow area
  exposes the entity, with legacy host entities removed on setup.
- **Managed actions** rule listing filters Topomation metadata before calling
  the automation config API and fetches latest configs concurrently.

### Fixed

- WebSocket contract tests updated for property bootstrap location counts and
  sibling ordering under `building_main`.

### Documentation

- `docs/contracts.md`: structural inspector exposes Occupancy + Ambient only.

## [0.2.40] - 2026-04-12

### Added

- **`property`** location type as a visible site / parcel root with managed
  shadow HA area support (same reconciliation model as `building` / `grounds` /
  `floor`).
- **`modules._meta.topology_anchor`** on the default bootstrap row (`home`) so
  the primary property cannot be deleted from the UI or WebSocket API.

### Changed

- Bootstrap now creates **`home`** as a **visible** property anchor
  (`is_explicit_root=false`), with default **`building_main`** and **`grounds`**
  parented under it so ambient defaults and occupancy rollup follow the tree.
- Legacy installs: explicit-root **`home`** (or `home` still typed as
  **`building`**) migrate to **property** + anchor; orphan root-level
  **`building` / `grounds`** reparent under the anchor when exactly one anchor
  exists (idempotent on restart).
- **Hierarchy**: `building` and `grounds` may live at root or under a
  **`property`**; **`floor`** may parent under **`property`** or **`building`**.
- **WebSocket** `locations/delete` rejects removal of the topology anchor.

### Documentation

- **ADR-HA-076** and `docs/integration-guide.md` type / parent matrix updates.

## [0.2.39] - 2026-04-11

### Changed

- Depend on **home-topology 1.0.3** for occupancy engine updates below.

### Fixed

- Configured `off_event=clear` with **zero** `off_trailing` now carries
  **`authoritative_vacant`** on `occupancy.signal`, so the kernel **vacates the
  whole location** (not only that `source_id`). Use `off_event=none` or a
  non-zero trailing delay when OFF must not end the room.
- **Exit-grace** holds from trailing clears are cancelled when **any** source
  **triggers** on the same location (rescues scheduled vacancy during grace).

### Documentation

- **ADR-HA-075** (authoritative immediate off + exit-grace cancellation) and
  contract updates **C-003A** / **C-003B**.

## [0.2.38] - 2026-04-10

### Added

- **Appliances** managed-rules tab in the room inspector for standalone `fan.*`
  entities and `switch.*` targets, with the same occupancy-only trigger and time
  window controls as Media and HVAC.
- Deep links `/topomation-appliances` and `/topomation-appliance` so the panel
  opens with the Appliances inspector tab for the selected location.

### Changed

- **HVAC** tab now lists only `fan.*` entities whose device registry chain ties
  them to a `climate.*` on the same Home Assistant device; other fans appear
  under Appliances.

### Tests / docs

- Extended Web Test Runner and Playwright coverage for the new tab, fan split,
  and appliances route; updated root `README.md` and `tests/README.md`.

## [0.2.37] - 2026-04-10

### Changed

- Reworked the room Lighting rule editor around explicit occupancy and ambient
  trigger families, with pill-style selections, inline `Time window` choices,
  and a simpler light-target action layout.
- Structural nodes (`building`, `grounds`, and `floor`) now stay focused on
  summary/explainability instead of exposing room-style automation editing.
- Floor occupancy grouping now uses the `occupancy_group_id` model end to end,
  with legacy sync behavior removed from the active UI/runtime path.

### Fixed

- Managed action rule save/list calls now prefer local loopback in the dev
  runtime, avoiding delays caused by stale Home Assistant internal URLs.
- Lighting rule draft rows no longer get stuck disabled while background rule
  loading is still completing.
- Building and grounds inspectors no longer show stale occupancy controls that
  do not apply to structural nodes.
- Occupancy explainability now uses location-oriented wording and structural
  child labels instead of raw room/internal contributor language.

## [0.2.36] - 2026-03-18

### Fixed

- Reworked the Occupancy inspector shell so the room hero banner and tab strip
  sit outside the scrollable content body instead of relying on a sticky stack.
  This prevents source rows and section text from painting behind the banner or
  tabs while the inspector body scrolls.
- Added browser coverage for the inspector shell contract in both the mock
  harness and live Home Assistant release gates so future layout regressions are
  caught before release.

## [0.2.35] - 2026-03-18

### Changed

- Simplified the automation workspace by removing the visible `Configure` /
  `Assign Devices` mode tabs; the right pane now opens directly into the
  location inspector, and the former `Detection` tab is labeled `Occupancy`.
- Mothballed the dedicated device-assignment workspace in the active UI: the
  implementation is retained in the codebase for future reactivation, but it is
  intentionally not exposed in the current panel.
- Moved the Occupancy tab's external `Add Source` flow into an on-demand dialog
  so the source list stays focused and the cross-area picker only appears when
  requested.
- Documented mixed-source occupancy semantics explicitly: presence and motion
  are additive contributors, presence `off` clears only the presence source,
  and operators who want presence to be authoritative should not also add
  motion as a source for that location.

### Fixed

- Grouped the sticky room/area banner and tab strip into one inspector top
  stack so scrolling content no longer bleeds behind the location banner.
- Tightened the inspector header stack against the Automation title and removed
  margin-based sticky gaps that let scrolled source cards show through.
- Made the sticky occupancy hero/tabs surfaces fully opaque and restored a
  small content offset under the tab row so scrolled source cards no longer
  ghost through the sticky stack.
- State-held presence sources no longer show disabled occupied-hold controls;
  the inspector now renders them as `Occupied state` sources and keeps vacant
  delay configuration visible.

## [0.2.34] - 2026-03-18

### Changed

- Shared Space is now documented and enforced as a backend-owned occupancy
  contract: shared-space members behave like one connected occupancy group, and
  room occupancy binary sensors are the authoritative API surface for both Home
  Assistant automations and the UI.
- Added ADR-HA-067 plus contract/architecture updates defining shared-space
  contribution-union timeout semantics, including that mirrored sync
  contributors preserve source timeouts and shorter later events do not shorten
  longer active holds.

### Fixed

- Shared-space runtime propagation now resolves the full connected sync group
  instead of only one-hop peers, so historical or partially normalized
  `sync_locations` graphs still behave like one occupied space.
- Removed the frontend-only shared-space occupancy workaround so the panel
  renders backend occupancy truth instead of inventing a conflicting room state.
- Stabilized panel event subscriptions across same-connection reactive `hass`
  churn so live occupancy/explainability state cannot get stuck on stale
  `Vacant` overrides after the backend binary sensor has already turned on.

## [0.2.33] - 2026-03-17

### Fixed

- Room Explainability now treats floors/buildings as occupied when an occupied
  descendant keeps the selected subtree active, matching the occupancy rollup
  already shown in the topology tree.
- Parent-location explainability now surfaces active descendant contributors
  instead of incorrectly showing `Vacant` with no active contributors while a
  child room is clearly occupied.

## [0.2.32] - 2026-03-17

### Changed

- Detection now presents reciprocal occupancy grouping as `Shared Space`, with
  the UI normalizing effective membership across sibling locations instead of
  exposing implementation-oriented sync wording.
- The inspector keeps the selected room header sticky while you scroll, and the
  docked `Room Explainability` panel supports vertical resize with clearer
  contributor cards and current-state copy.

### Fixed

- The panel now reloads its live data when the browser tab/window regains
  focus, preventing the empty workspace state that previously required a manual
  refresh after leaving and returning.
- Mobile stacked layout now uses a Home Assistant-style hamburger affordance for
  reopening the sidebar instead of a text `Sidebar` button.

## [0.2.31] - 2026-03-16

### Added

- Added a docked `Room Explainability` panel under the location tree so the
  selected room's current occupancy state, active contributors, and recent
  changes stay visible without floating over the editor workspace.

### Changed

- Reworked Lighting rules around plain-English situation cards (`Event` + `Only
  when`) with a single optional time window, per-light outputs, `Only turn on
  if off`, and a `Duplicate rule` workflow for adjacent time-based variants.
- Updated the active UI contracts, architecture notes, and design mockups to
  treat Lighting authoring as room-behavior configuration instead of raw
  trigger/condition mechanics.

### Fixed

- Aligned managed-rule normalization, browser suites, and live Home Assistant
  coverage with the new Lighting rule editor and docked explainability layout.
- Fixed the new explainability component runtime path so browser-based harnesses
  and Playwright suites load the panel reliably from the committed frontend
  bundle.

## [0.2.30] - 2026-03-15

### Added

- Occupancy entities now expose a normalized `recent_changes` explainability
  buffer that combines room-level occupied/vacant transitions with recent
  source-level occupancy signals for the Detection inspector.
- Added backend/frontend regression coverage for explainability updates,
  service-kernel resolution, and managed-action registry grouping behavior.

### Changed

- Detection now treats `Room Explainability` as the primary diagnostic surface,
  and advanced occupancy relationship controls are hidden from the active UI
  until that workflow is revalidated.
- Removed the header-level runtime event log from the primary workspace and
  documented that hard-disable in the active contracts and ADR log.
- Reworked the public README and installation guide around a clearer evaluation
  and first-run path for Home Assistant users.

### Fixed

- Service resolution now ignores non-kernel `hass.data[DOMAIN]` entries when
  multiple TopoMation config entries are loaded.
- Managed-action entity-registry grouping now skips redundant update calls when
  labels, categories, and area metadata are already correct.

## [0.2.29] - 2026-03-15

### Added

- Lighting rules now support a per-light `Only turn on if off` option, so one
  automation can skip changing lights that are already on while still applying
  the rule to other selected targets.

### Changed

- Updated the active Lighting rule contract and release-gate policy docs to
  formalize per-target guarded light actions and require live HA browser
  validation for touched UI workflows.

### Fixed

- Managed lighting rule persistence now round-trips per-target `only_if_off`
  metadata through the frontend payload, WebSocket layer, HA automation config,
  and rule reload path.

## [0.2.26] - 2026-03-06

### Added

- Added a dedicated live Home Assistant browser release gate
  (`playwright.live.config.ts` + `live-automation-ui.spec.ts`) so release
  validation covers the real inspector workflow, not just mock Playwright
  suites and backend live contract checks.

### Changed

- Narrowed the visible automation IA to `Lighting`, `Media`, and `HVAC`.
  `HVAC` v1 now covers `fan.*` plus switch-controlled exhaust/ventilation
  devices, while the old `/topomation-appliances` route remains as a
  compatibility alias into `HVAC`.
- Updated contracts, architecture, ADRs, and work-tracking docs to formalize
  the narrowed automation scope and separate `Implemented`, `Released`, and
  `Live-validated` delivery states.
- Hardened release automation so the default Playwright matrix always excludes
  `playwright/live-*`, while `make test-release-live` runs the explicit live
  browser workflow and auto-targets the local dev Home Assistant instance in
  dev-container release work.

### Fixed

- Managed action creation now rolls back and fails when Home Assistant does not
  register the automation in time, instead of returning a false success.
- Managed rule enumeration now snapshots automation entities before awaiting
  config reads, preventing the post-create `dictionary changed size during
  iteration` race.

## [0.2.25] - 2026-03-05

### Added

- Introduced stable managed-rule identity (`rule_uuid`) for action-rule metadata
  and WebSocket create/update flows, enabling deterministic rule tracking across
  UI saves and runtime reloads.

### Changed

- Switched managed action-rule saves from delete/recreate to HA-canonical
  upsert+diff behavior, preserving existing automation IDs when rules are edited.
- Updated runtime/frontend contracts and architecture docs to formalize
  Home Assistant as the single source of truth for rule state.
- Expanded inspector/action-rule test coverage for identity-aware create/update
  behavior and reconciliation semantics.

### Fixed

- Restored managed shadow-area filtering in the topology tree so
  integration-owned shadow locations remain hidden from user-facing lists.

## [0.2.24] - 2026-03-04

### Changed

- Refined inspector automation IA to domain-first tabs:
  `Detection`, `Ambient`, `Lighting`, `Appliances`, `Media`, and `HVAC`.
- Moved startup reapply control into each automation tab while persisting the
  same shared automation-module key (`reapply_last_state_on_startup`).
- Updated hidden panel route aliases to match domain tabs
  (`/topomation-appliances`, `/topomation-media`, `/topomation-hvac`).

### Fixed

- Fixed Add Rule behavior for non-light automation tabs so a visible draft rule
  row is created even when there is no preselected compatible entity.
- Updated Playwright workflow coverage for the new startup-toggle location in
  the Lighting tab.
- Removed a stale mypy `type: ignore` in actions runtime metadata parsing and
  replaced it with explicit typed casting.

### Documentation

- Added ADR-HA-052 for domain-tab automation IA and tab-local startup controls.
- Updated architecture/contracts to reflect ambient split, lighting ownership,
  domain-specific automation tabs, and shared startup reapply persistence.
- Added active lighting UX documents:
  `docs/dusk-dawn-lighting-ui-spec.md` and `docs/lighting-ui-contract.md`.

## [0.2.23] - 2026-03-03

### Fixed

- Prevented recursive occupancy propagation re-entry from overflowing the
  Python call stack by draining linked/synced propagation events iteratively
  with queue guards in runtime listeners.
- Added regression coverage for deep re-entrant occupancy event chains to
  ensure propagation remains stack-safe.

### Changed

- Documented re-entrant event safety constraints and anti-patterns across
  architecture, contracts, coding standards, and ADR history to reduce future
  startup-failure risk from recursive callback patterns.

## [0.2.22] - 2026-03-03

### Added

- Added a dedicated `Ambient` inspector tab so ambient controls and telemetry
  are no longer mixed into the `Detection` workflow.

### Changed

- Simplified the Ambient tab header by removing the extra `Live/Updating...`
  status label.

### Fixed

- Recent occupancy events `Show all`/`Show less` expansion now updates
  reliably in the inspector UI.
- Reduced noisy/contradictory occupancy reason text in the header status row
  while preserving detailed reason context in state metadata.

## [0.2.21] - 2026-03-03

### Fixed

- Managed shadow fallback naming now uses Topomation-branded suffixes
  (`[Topomation]`) instead of `(System)`, and reconciliation now repairs
  legacy `(System)` shadow names to the new deterministic naming scheme.
- Managed shadow UI filtering now also honors host
  `_meta.shadow_area_id` mappings, so integration-owned shadow areas stay
  hidden in tree/selector surfaces even when area-side shadow tags are stale
  or incomplete.
- Detection source OFF behavior is now strictly source-scoped:
  `off_trailing=0` emits immediate `clear` (`timeout=0`) instead of
  location-wide `vacate`, so one source cannot clear unrelated active
  contributors.
- Inspector `Test Off` now always calls `topomation.clear` with the source ID
  and trailing timeout, matching runtime source-scoped semantics.
- Added coverage for mixed-source timeout semantics: each source maintains its
  own timer and occupancy remains active until the longest active contribution
  expires.
- Removed legacy managed-shadow compatibility paths
  (`floor_proxy`, `proxy_area_id`, `proxy_for_floor_id`) so runtime/UI/WebSocket
  logic now follows only the explicit managed-shadow contract
  (`shadow_area_id`, `managed_shadow`, `shadow_for_location_id`).

## [0.2.20] - 2026-03-03

### Fixed

- Improved location inspector source controls with clearer section separation and updated copy.
- Expanded tree drag-and-drop child drop target to reduce accidental sibling drops.

## [0.2.19] - 2026-03-03

### Added

- Detection now includes a primary `Sync Rooms` workflow (recommended) for
  room-level occupancy sync, with reciprocal config writes (`sync_locations`)
  so paired rooms stay aligned without manual reverse setup.
- Backend/runtime support for occupancy `sync_locations` with room-scope
  validation and contributor mirroring across sync peers.

### Changed

- Detection UX now prioritizes `Sync Rooms`; directional contributors moved
  under advanced occupancy relationship controls.

### Fixed

- Linked-room trigger propagation now uses indefinite linked contributions
  (`timeout=None`) until explicit clear, instead of immediate-expiry `0`.
- `Sync Rooms` and directional/adjacency neighbor pickers now exclude
  integration-managed shadow areas (`_meta.role=managed_shadow`), so hidden
  floor/building/grounds proxy areas no longer appear as link/sync candidates.
- Managed shadow areas are now consistently excluded from additional selection
  surfaces (location parent selector, generic external area source selector,
  and default panel selection), preventing hidden system nodes from appearing
  in user-facing menus.
- Backend sync/link validation now rejects managed shadow area targets and
  runtime sync propagation ignores them if stale config is present.
- Location tree row icons now follow the same icon resolution as the inspector
  header (HA area icon -> explicit `_meta.icon` -> name/category inference ->
  type fallback), so left-tree and right-panel location icons stay consistent.

## [0.2.18] - 2026-03-02

### Added

- Linked Rooms now includes an optional per-contributor `2-way` toggle so users
  can enable/disable reciprocal links from one page when needed.
- Added ADR-HA-047 documenting linked-room batch editing, optional reciprocal
  toggle behavior, and explicit `Vacant at` timeout fallback copy.

### Changed

- Linked Rooms contributor selection now supports queued batch edits without
  locking all checkboxes between saves, so users can select/update multiple
  rooms in one pass.
- Dev-container operational runbooks now explicitly bind restart/live-gate
  commands to local `HA_URL_LOCAL`/`HA_TOKEN_LOCAL` aliases (ADR-HA-046).

### Fixed

- Occupancy header/runtime timeout copy now renders `Vacant at No timeout
  scheduled` when timeout metadata is absent, avoiding ambiguous `Unknown`
  status text.

## [0.2.17] - 2026-03-02

### Added

- Added directional Detection-tab `linked_locations` configuration ("Linked
  Rooms") so users can mark neighboring rooms as occupancy contributors without
  boundary crossing sensors.
- Runtime now listens to `occupancy.changed` and applies linked-room
  propagation using synthetic contributor sources (`linked:<location_id>`),
  including reciprocal-link feedback guards to prevent self-latching loops.

### Changed

- Moved adjacency + handoff controls behind an explicit Detection-tab advanced
  section ("Advanced Movement Handoff"), reducing default UI complexity for
  common room-level automations.
- Adjacency neighbor selection in Detection now limits candidates to same-parent
  room-level siblings (`area`/`subarea`) instead of listing unrelated topology
  nodes (for example floors/buildings).
- Linked Rooms now follows strict room-level scope:
  - only configurable on `area` locations directly under a `floor`
  - candidates are immediate sibling `area` locations only
  - backend validation rejects invalid linked-room targets/candidates.
- Frontend build now auto-syncs `dist/topomation-panel.js` to
  `frontend/topomation-panel.js` so Home Assistant serves the latest inspector
  bundle after rebuilds.

## [0.2.16] - 2026-03-01

### Added

- Added occupancy design white paper at `docs/wasp-in-box-whitepaper.md`,
  covering wasp-in-box principles, topology/inference boundaries, magic-area
  alignment, and UI/UX guidance for occupancy management.
- White paper now aligns with binary occupancy policy (`occupied`/`vacant`)
  and removes confidence/unknown-state modeling from the design baseline.
- Persistence now supports optional topology `adjacency_edges` payloads when
  the loaded `home-topology` runtime exposes adjacency APIs, enabling forward
  compatibility for cross-area handoff graph storage.
- Added adjacency edge WebSocket APIs (`list/create/update/delete`) and now
  include `adjacency_edges` in `topomation/locations/list` responses.
- Added an adjacency editor section in the location inspector so users can
  model neighboring locations, boundary type, direction, handoff window,
  crossing sources, and remove edges directly in the UI.
- Event bridge now uses configured adjacency edges to emit provisional
  cross-location handoff triggers (`signal_key: handoff`) when crossing
  sources fire, plus `occupancy.handoff` trace events for diagnostics.
- Added Home Assistant bus event forwarding (`topomation_handoff_trace`) and a
  new inspector "Handoff Trace" panel section to visualize recent inferred
  adjacency handoffs per location.
- Added system health diagnostics reporting for Topomation and
  `home-topology` versions, so the integration info window shows the currently
  active topology runtime version.
- Added Detection-tab WIAB preset configuration (`Enclosed Room`, `Home Containment`,
  `Hybrid`) with per-location interior/boundary entity selectors and latch/release
  timeout controls.
- Added WIAB runtime handling in the event bridge for room/home latch semantics
  using occupancy trigger/lock/unlock/clear primitives and diagnostic trace events.

### Changed

- Detection source pickers now allow external occupancy-class binary sensors
  while still excluding Topomation-managed occupancy outputs
  (`device_class: occupancy` with `location_id`).
- Managed action service options for `media_player` entities now include
  playback `Pause` alongside `Stop` and power `Turn off`.
- Integration runtime dependency now targets `home-topology==1.0.1` to ensure
  adjacency topology APIs are available.

## [0.2.15] - 2026-03-01

### Fixed

- Synced committed frontend runtime bundle
  (`custom_components/topomation/frontend/topomation-panel.js`) with the
  current TypeScript sources/build output so CI bundle drift checks pass and
  shipped UI behavior matches the source implementation.

## [0.2.14] - 2026-03-01

### Fixed

- Frontend now listens for Home Assistant `entity_registry_updated`,
  `device_registry_updated`, and `area_registry_updated` events and refreshes
  location/entity assignment data automatically, so Detection/Assign Devices
  views update without manual browser refresh.
- Inspector now updates occupancy header timeout metadata (`Vacant at ...`) from
  live occupancy `state_changed` events, preventing stale `Vacant at Unknown`
  after test-triggering occupancy.
- Detection source grouping now normalizes legacy light power rows (missing
  explicit `signal_key`) so `Power` + `Level change` stay merged in a single
  shared source card.

## [0.2.13] - 2026-03-01

### Fixed

- Managed occupied/vacant rule creation now waits for the newly created
  automation entity to appear before applying grouping metadata, so new rules
  are reliably tagged and categorized.
- Managed-action grouping now uses `TopoMation` naming for created automation
  labels/category (`TopoMation`, `TopoMation - On Occupied`, `TopoMation - On
  Vacant`).

## [0.2.12] - 2026-03-01

### Changed

- Detection source edits now auto-save immediately on change; the explicit
  `Save/Discard` action row was removed for consistency with the other inspector
  tabs.

### Fixed

- Occupancy binary sensors now hydrate from the occupancy module's current
  state on entity startup, so lock/occupied attributes are correct after reload
  before the next live event arrives.
- Configuration restore now creates pending locations in stable order so manual
  sibling reordering survives persistence round trips.

## [0.2.11] - 2026-03-01

### Fixed

- Detection source rows now reliably render editable controls when a light
  source is already configured with a keyed `source_id` (for example
  `light.office_lights::power`) but lacks an explicit `signal_key`.
- Source-row toggle handling now forces UI resync after no-op add attempts, so
  checked rows no longer appear without their editor content.

## [0.2.10] - 2026-03-01

### Changed

- Detection source cards now group light `Power` and `Level change` into one
  shared box while keeping independent toggles and per-signal behavior controls.
- Panel now passes event-driven location occupancy state into the inspector so
  header occupancy status can update immediately from runtime events.
- README refreshed for clearer positioning, capability summary, and workflow
  guidance.

## [0.2.9] - 2026-03-01

### Changed

- Detection source pickers now exclude all `binary_sensor` entities with
  `device_class: occupancy` (including non-Topomation occupancy sensors).
- Detection core list now always exposes all supported signal rows for rich
  entities (for example light `power` + `level`, media `playback` + `volume` +
  `mute`) instead of showing only a default signal.

### Fixed

- Integration runtime now mirrors kernel `occupancy.changed` transitions to the
  HA bus event `topomation_occupancy_changed`, restoring live occupancy state
  refreshes in the main panel.

## [0.2.8] - 2026-03-01

### Changed

- Device assignment UX now uses a clearer list workflow: `All/Unassigned/Assigned`
  filters, per-group collapse/expand, and quick `Expand all/Collapse all`
  controls.
- Assignment rows now use simplified metadata for faster visual scanning (entity
  id shown first; HA area only shown where useful in unassigned grouping).
- Assignment rendering is now on-demand in the `Assign Devices` mode and no
  longer performs redundant double-reload cycles, reducing UI lag on large
  entity sets.
- Frontend panel/inspector runtime logging was reduced to warnings/errors only,
  cutting noisy debug/trace output during normal operation.
- Detection binary sensor inclusion now also supports `vibration` and `sound`
  device classes (without including `tamper`/`problem`), in both core area
  discovery and Add Source candidates.

## [0.2.7] - 2026-03-01

### Added

- ADR-HA-041 documenting curated detection-source enumeration defaults and
  occupied-only dark-condition behavior.

### Changed

- Detection tab core in-area source enumeration is now curated to common
  occupancy inputs: lights, light-classified switches, fans, media players, and
  relevant binary sensors.
- Topomation-created occupancy entities are excluded from source candidates.
- Non-core domains (`climate`, `vacuum`, `cover`) are excluded from core
  auto-enumeration; edge cases remain available through Add Source.
- `On Vacant` managed actions no longer expose or persist `Only when dark`
  (`require_dark` is always `false` for vacant rules).

## [0.2.6] - 2026-03-01

### Added

- Device assignment WebSocket command: `topomation/locations/assign_entity`.
  It enforces single-location assignment per entity, updates HA `area_id` when
  assigning to HA-backed area wrappers, and persists assignment changes.

### Changed

- Topology panel right side now includes a grouped device assignment workspace
  (`Unassigned` + Topomation location groups) with search and per-row assign
  controls.
- Left tree rows now accept device drops from the right-side list and emit a
  dedicated `entity-dropped` event for assignment handling.
- Sync reconciliation now preserves explicit non-HA location assignments
  (for example floor/building/grounds) by excluding those entities from HA-area
  wrapper remapping.

## [0.2.6] - 2026-03-01

### Changed

- **DnD "child" drop zone enlarged from 33% to 50% of row height.** The before/after
  zones are now the top and bottom 25%; the inside (child) zone is the middle 50%,
  making it much easier to drop an item as a child of another location.

## [0.2.5] - 2026-03-01

### Fixed

- **DnD zone detection now updates continuously during drag.** SortableJS onMove
  only fires once per row entry, so the zone (before/inside/after) was locked to
  whichever third the pointer entered from — making the "inside" (child) zone
  nearly impossible to hit. Added a continuous dragover listener that recalculates
  the zone on every pointer move, so all three zones respond in real time.

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
