# Contracts

**Last reviewed**: 2026-03-06
**Purpose**: canonical behavior contracts for Topomation runtime and panel actions.

Use this file as the quick contract surface. Keep it synchronized with:
- `docs/architecture.md`
- `docs/adr-log.md`
- implementation under `custom_components/topomation/`

## C-001 Lock immutability

- Locked locations are immutable for manual occupancy overrides.
- Manual occupied/unoccupied controls must reject changes when the target is locked.
- Rejection must be user-visible (warning toast/message), not silent.
- Lock policy services (`lock`, `unlock`, `unlock_all`) are the valid paths to change lock state.

## C-002 Manual occupied action contract

- Tree/UI "set occupied" maps to:
  - `service: topomation.trigger`
  - `source_id: manual_ui`
- Timeout behavior:
  - if location config has `modules.occupancy.default_timeout` (number >= 0), pass it as `timeout`
  - otherwise service default applies (`timeout=300` seconds)

## C-003 Manual unoccupied action contract

- Tree/UI "set unoccupied" maps to:
  - `service: topomation.vacate_area`
  - `source_id: manual_ui`
  - `include_locked: false`
- This is intentional subtree vacate semantics, not source-level clear semantics.

## C-003A Source-off clear contract

- For detection sources configured with `off_event=clear`:
  - `off_trailing <= 0` maps to immediate source release (`event_type=clear`, `timeout=0`)
  - `off_trailing > 0` maps to trailing source release (`event_type=clear`, `timeout=off_trailing`)
- Inspector "Test Off" mirrors this:
  - always `service: topomation.clear(location_id, source_id, trailing_timeout)`
- Detection source state changes must not emit location-level authoritative vacate.
- Authoritative vacate remains explicit-only (`topomation.vacate`, `topomation.vacate_area`,
  or policy actions that intentionally call vacate).
- Lock directives remain authoritative (`block_vacant` may prevent transition to vacant).

## C-004 Service surface contract

Supported services in domain `topomation`:

1. `trigger(location_id, source_id?, timeout?, entry_id?)`
2. `clear(location_id, source_id?, trailing_timeout?, entry_id?)`
3. `vacate(location_id, entry_id?)`
4. `lock(location_id, source_id?, mode?, scope?, entry_id?)`
5. `unlock(location_id, source_id?, entry_id?)`
6. `unlock_all(location_id, entry_id?)`
7. `vacate_area(location_id, source_id?, include_locked?, entry_id?)`

Lock policy contract:
- `mode`: `freeze | block_occupied | block_vacant`
- `scope`: `self | subtree`

Multi-entry routing:
- If multiple Topomation entries are loaded and `entry_id` is omitted, service calls are rejected.

## C-005 Tree control contract

- Non-root rows expose:
  - occupancy toggle icon (`mdi:home` / `mdi:home-account`)
  - lock toggle icon (`mdi:lock*`)
- Occupancy icon reflects effective occupancy state for the location row.
- Lock icon reflects lock state from occupancy entity attributes (`is_locked`, `locked_by`).

## C-006 Persistence contract

Debounced autosave must be scheduled for:

1. successful `locations/reorder`
2. successful `locations/set_module_config`
3. `occupancy.changed` events

Additional save points:
- immediate save on integration unload
- save on Home Assistant stop event

## C-007 Documentation maintenance contract

- Contract changes must update this file in the same change.
- Decision-level changes must add/update ADR entries.
- Handoff/parallel context changes must update `docs/current-work.md`.

## C-008 Managed action dark-guard contract

- Managed action rows support an optional `Only when dark` guard on **On Occupied** only.
- **On Vacant** rules do not expose dark guard UI and always persist with `require_dark: false`.
- When enabled, created automation config must include:
  - `condition: state`
  - `entity_id: sun.sun`
  - `state: below_horizon`
- When disabled, no dark guard condition is added.
- This is the v1 behavior surface; lux/ambient guards are explicitly future enhancement.

## C-009 Managed action registration + reconciliation contract

- Managed occupied/vacant action edits are panel-WebSocket backed:
  - `topomation/actions/rules/list`
  - `topomation/actions/rules/create`
  - `topomation/actions/rules/delete`
  - `topomation/actions/rules/set_enabled`
- The backend integration is the writer of HA automation config/state; browser clients do not
  directly write `config/automation/config/*` for managed-action mutations.
- Mutation path is strict WS contract:
  - create/delete/enable operations must fail explicitly when backend WS commands
    are unavailable (no browser-side mutation fallback).
- Create success criteria:
  - write + reload is not enough; HA runtime registration must converge.
  - if registration does not converge, backend must rollback the attempted write
    and return an actionable error.
- Managed automation metadata must remain machine-parseable in description:
  - `Managed by Topomation.`
  - `[topomation] {"version":...,"location_id":...,"trigger_type":...,"rule_uuid":...}`
- Managed rule identity contract:
  - backend accepts optional `automation_id` and `rule_uuid` on create/upsert.
  - saves must update existing rules in place when `automation_id` is known.
  - saves must only delete removed rules (no delete-all/recreate cycle).
- If `config/entity_registry/list` is unavailable, action rule discovery must fall back
  to `hass.states` automation entities and continue operating.
- Inspector must reconcile external automation add/delete changes while open via
  `state_changed` (`automation.*`) subscription + debounced reload.
- Reconciliation strategy in this phase is event-driven (startup hydration +
  `automation.*` subscription). No periodic polling loop is required.
- UI save behavior requirement:
  - successful create/update/delete should not visually revert checkbox/select state
    during temporary HA registry/config eventual consistency windows.
  - if post-save UI reconciliation is delayed after backend success criteria are met,
    user gets explicit "saved, still syncing" feedback.
  - create operations that never register in HA are errors, not "saved, still syncing"
    states; they must rollback per the create success criteria above.
- **Automation config source**: The integration uses the same REST API as the Home Assistant
  automation UI (`/api/config/automation/config/<id>`). That API always writes to
  `automations.yaml` (HA core constant). The automation component reload re-reads config
  from whatever `configuration.yaml` includes; if that does not include `automations.yaml`,
  neither UI-created nor API-created automations will load. Default HA config includes
  `automation: !include automations.yaml`; if you use only e.g. `!include_dir_list automations/`,
  add `!include automations.yaml` so the engine loads the file the UI/API write to.
- **Rules in automations.yaml but not in the UI**: If rules exist in `automations.yaml` but do
  not appear in Settings → Automations & scenes, the usual cause is that `configuration.yaml`
  does not include that file. Check the `automation:` key; it must load `automations.yaml`
  (e.g. `automation: !include automations.yaml`). Without that, HA never loads the file, so
  nothing in it appears in the UI or runs.
- **Created rule metadata (match UI Save dialog)**: When creating a managed-action automation,
  the integration sets: **name** (alias in config), **description** (metadata + Topomation
  marker), **area** (entity registry area_id from location’s `ha_area_id` when present),
  **category** (Topomation), and **labels** (Topomation, Topomation - On Occupied / On Vacant).
  This matches the Settings → Automations & scenes → Save dialog options so rules appear
  correctly in the UI and by area/category/labels.

## C-010 Panel authorization contract

- Topomation panel routes are admin-only (`require_admin=True`).
- Managed action create/update/delete depends on HA config APIs that require admin;
  non-admin sessions must not be routed into a write-capable panel state.

## C-011 Tree drag-and-drop contract (target state)

- **Intent is explicit, not inferred.** Drop outcome is determined solely by which drop target zone the user releases over: **before**, **inside** (child), or **after** the target row. No pointer X-offset or heuristic inference.
- **Per-row drop zones.** Each tree row exposes exactly three drop semantics relative to that row:
  - **Before**: insert as previous sibling of this row (same parent).
  - **Inside**: make this row the new parent (append as last child).
  - **After**: insert as next sibling of this row (same parent).
- **Outdent** (move to grandparent) is either a fourth explicit zone (e.g. “outdent” strip when hovering the current parent row) or a dedicated control; it is not inferred from pointer position.
- **Ordering mechanics.** SortableJS (or equivalent) is used only for list reorder and pointer capture. The final (parentId, siblingIndex) is computed from the **active drop zone** at drop time, not from flat index + heuristics.
- **Domain rules.** All moves are validated by `canMoveLocation` (hierarchy-rules): floor/building/area constraints, no cycles, no self-parent. Invalid drops are rejected and the tree is restored to pre-drag order.
- **Single source of truth.** The drag contract is specified in this contract and in the implementation’s drop-zone logic; no duplicate or divergent heuristic logic (e.g. x-offset thresholds) determines intent.

## C-012 Detection Source Enumeration Contract

- The Detection tab core area list (entities already in the selected location) is intentionally curated to:
  - `light.*` (including power/level/color signal variants as supported)
  - `fan.*`
  - `media_player.*` (playback/volume/mute signal variants)
  - `binary_sensor.*` where:
    - `device_class` is one of `motion`, `presence`, `occupancy`, `door`, `garage_door`, `opening`, `window`, `lock`, `vibration`, `sound`, or
    - `device_class` is absent (for integrations that emit semantic binary sensors such as camera person/motion variants)
  - `switch.*` only when explicitly light-classified (`device_class: light`)
- The Detection tab must exclude Topomation-managed occupancy outputs from source selection
  (`device_class: occupancy` with `location_id`), while allowing external occupancy-class sensors.
- The Detection tab must exclude non-core appliance/control domains from core auto-enumeration
  (for example `climate`, `vacuum`, `cover`).
- The explicit **Add Source** picker remains broader for edge cases and may include generic `switch.*`
  entities so users can opt into uncommon/manual workflows without cluttering core discovery.
- For HA-backed `area` locations parented by a `floor`, the cross-area picker in Detection is
  sibling-scoped:
  - candidate source areas must be immediate sibling `area` locations under the same floor
  - non-sibling areas, child/subarea nodes, and non-HA-backed areas are excluded
  - `Any area / unassigned` is not offered in this sibling-scoped mode.

## C-013 Linked Rooms + Advanced Adjacency Contract

- Detection supports primary location-sync peers via occupancy config key
  `sync_locations: string[]`.
- Primary sync UI/copy uses label `Sync Locations` (not `Sync Rooms`).
- Sync semantics are reciprocal and state-aligned:
  - checking a sync peer writes both directions (`A.sync_locations += B`,
    `B.sync_locations += A`)
  - any occupancy contributor change in one synced location is mirrored to peers
    using synthetic sync sources (`sync:<origin>::<source>`) so occupancy state
    and timeout windows remain aligned.
- Sync candidate scope is explicit and sibling-scoped:
  - selected location and candidates must share the same `parent_id`
  - `area` <-> `area` sync is allowed when parent type is one of:
    - `area`
    - `floor`
    - `building`
  - `floor` <-> `floor` sync is allowed only when parent type is `building`
  - integration-owned/system nodes outside those scopes are excluded from sync
    target/candidate roles.
- Detection supports directional linked-room contributors via occupancy config key
  `linked_locations: string[]`.
- Semantics are directional:
  - If location `A` config includes `linked_locations: ["B"]`, occupancy of `B`
    contributes to `A`.
  - Checking a contributor row updates only that forward direction by default.
- Linked-room editing must support multi-select sequencing:
  - contributor checkboxes remain interactive while persistence is in flight
  - persistence can queue sequential updates without forcing a full control lock.
- Detection provides an optional reciprocal assist:
  - each checked contributor row exposes a `2-way` toggle
  - enabling `2-way` also writes reverse config on contributor location `B` to
    include `A` in `B.linked_locations`
  - disabling `2-way` removes only the reverse direction from `B` and keeps
    the forward direction from `A` unless user unchecks the contributor row.
- Linked-room scope is strict:
  - target location must be an `area` directly under a `floor`
  - contributors must be immediate sibling `area` locations under that same floor
  - `building`, `grounds`, `floor`, and `subarea` nodes are excluded from linked-room
    target/candidate roles.
- Runtime propagation uses source-scoped occupancy contributions:
  - occupied on source -> `occupancy.trigger(target, source_id="linked:<source>", timeout=None)`
  - vacant on source -> `occupancy.clear(target, source_id="linked:<source>", trailing_timeout=0)`
- Reciprocal links must not self-latch:
  - runtime must suppress feedback when a source location is currently occupied
    by the target's linked contribution (`linked:<target>`).
- Adjacency handoff controls are non-primary UX:
  - Detection renders `Adjacent Locations` and `Handoff Trace` behind an explicit
    advanced disclosure toggle.
- Advanced adjacency neighbor picker scope is intentionally narrow:
  - candidates must be room-level (`area`/`subarea`) locations
  - candidates must share the same `parent_id` as the selected location
  - non-room topology nodes (for example `floor`, `building`, `grounds`) are
    excluded from the picker.

## C-014 Managed Shadow Area Contract

- Aggregate topology nodes requiring HA-native `area_id` interoperability must
  use explicit, integration-owned managed shadow areas.
- Managed shadow hosts:
  - non-root `floor`
  - non-root `building`
  - non-root `grounds`
- Canonical metadata keys:
  - host `_meta.shadow_area_id = <shadow_location_id>`
  - area `_meta.role = "managed_shadow"`
  - area `_meta.shadow_for_location_id = <host_location_id>`
- Managed shadow validity requirements:
  - shadow location exists
  - shadow is HA-backed `area`
  - shadow is parented directly under the host location
  - exactly one active managed shadow per host
- Lifecycle authority:
  - Home Assistant remains registry source of truth
  - Topomation is authoritative for managed shadow creation/tagging
  - on startup/reconciliation, missing or invalid managed shadows must be
    created/recreated automatically (no name-matching inference)
  - area names are deterministic and collision-safe (host name, then
    host name with ` [Topomation]` suffix variants as needed)
- `topomation/locations/assign_entity` contract:
  - when target is a managed shadow host, backend remaps assignment target to
    that host's managed shadow area before persistence and HA writeback
  - response must include resulting mapped `ha_area_id`
  - invalid/missing managed shadow mappings must fail explicitly (no silent fallback)
- API guardrails:
  - managed shadow metadata is integration-owned and must be rejected on manual
    websocket `_meta` create/update writes
  - managed shadow area topology wrappers must reject manual move/rename/delete
    websocket operations
- UI visibility:
  - managed shadow nodes are explicit/tagged (`System Area`)
  - tree-level hiding/filtering is optional presentation behavior only; it must
    not change assignment semantics.

## C-015 Ambient Read + Assignment Contract

- Ambient lux sensor assignment is explicit in Topomation v1:
  - users map/select a lux sensor per location when needed
  - no ambient auto-discovery workflow is used in v1 panel behavior.
- Ambient module configs must persist with `auto_discover: false` in integration defaults.
- Ambient source priority:
  1. assigned location lux sensor
  2. inherited ancestor lux sensor (when enabled)
  3. sun fallback (`sun.sun`) when lux input is unavailable and fallback is enabled
- Inspector header must expose ambient status at-a-glance:
  - show effective lux level on the top card
  - indicate inherited source state when applicable.
- Inspector Ambient view must expose ambient diagnostics/config:
  - current lux, `is_dark`, `is_bright`, source sensor/location, source method
  - explicit lux sensor selector
  - inherit toggle
  - dark/bright threshold controls
  - fallback-to-sun and assume-dark-on-error toggles.

## C-016 Re-entrant Occupancy Callback Safety Contract

- Event handlers subscribed to `occupancy.changed` that can emit additional
  occupancy transitions (`occupancy.trigger` / `occupancy.clear`) must be
  implemented as non-recursive queue drains.
- Required structure:
  - per-handler queue (`deque`)
  - re-entry guard (`if already draining: enqueue + return`)
  - iterative drain loop (`while queue`)
- Required safety behavior:
  - enforce a bounded max events per drain
  - on exceed: log error, drop remaining queued events in that drain
  - never allow this path to crash HA via recursion depth overflow.
- Required regression coverage:
  - include at least one deep re-entrant chain test to verify stack-safe
    behavior under large event cascades.

## C-017 Automation Editing + Lighting Persistence Contract

- Inspector IA contract:
  - top-level tabs: `Detection`, `Ambient`, `Lighting`, `Media`, `HVAC`
  - no top-level `Advanced` tab and no generic `Actions` tab
  - advanced occupancy controls are rendered inside `Detection`.
- Workspace mode controls contract:
  - `Configure` and `Assign Devices` are top-level workspace tabs (shared tab affordance pattern),
    not mixed-mode button toggles.
- Save/update behavior is explicit across editable automation surfaces:
  - `Detection` and `Ambient` use tab-level draft state + explicit
    save/discard controls.
  - `Lighting`, `Media`, and `HVAC` use per-rule card lifecycle
    controls (`Save rule` / `Update rule` / `Discard edits` / `Remove rule` /
    `Delete rule`) as applicable.
  - no silent auto-save for user-authored policy/config edits in these tabs.
- Rule-card destructive-control gating:
  - unsaved draft rule rows must not render `Delete rule`
  - unsaved drafts expose `Save rule` + `Remove rule`
  - persisted edited rows expose `Update rule` + `Discard edits` + `Delete rule`
  - persisted clean rows expose `Delete rule` only.
- Rule workflow control placement:
  - do not combine tab-level `Save changes` / `Discard changes` with per-rule
    `Delete rule` controls for the same rule-editing workflow.
  - lifecycle controls for each rule are colocated on that rule card.
- `Lighting` owns `light.*` rule editing and persists using HA-canonical
  managed automation ownership (same authority model as other managed-rule
  domains).
- Non-light managed automation tabs remain split by intent:
  - `Media` -> `media_player.*`
  - `HVAC` -> `fan.*` plus `switch.*` compatibility for switch-controlled
    exhaust/ventilation devices
  - no dedicated `Appliances` tab in v1.
  - `climate.*` thermostat/preset workflows are deferred until a narrower
    contract exists for common occupancy actions.
- Lighting rule persistence contract:
  - HA automation entities/config are canonical for Lighting rule state.
  - save path is upsert+diff with stable metadata identity (`rule_uuid`).
  - backend integration is the only writer for Lighting automation mutations.
- Ownership constraint:
  - hard-block `light.*` overlap between Lighting-policy targets and managed-action targets in `Media` / `HVAC` for the same location.
- Startup behavior contract:
  - Lighting tab does not expose a Topomation-specific startup reapply toggle.
  - startup behavior follows native HA automation semantics.
- Lighting trigger-derived condition contract:
  - `on_dark` and `on_bright` lock ambient condition to the matching value and
    render ambient condition as derived/read-only.
  - `on_occupied` locks `must_be_occupied=true` and renders it as
    derived/read-only.
  - `on_vacant` locks `must_be_occupied=false` (displayed as `Must be vacant`)
    and renders it as derived/read-only.
- Lighting multi-action contract:
  - one Lighting rule may include multiple action targets.
  - persistence writes those targets as ordered HA automation action steps.
  - response/list payloads include full action target list (`actions[]`) plus
    first-action summary fields for compatibility (`action_entity_id`,
    `action_service`, `action_data`).
- Legacy migration compatibility:
  - existing `modules.dusk_dawn` payloads may be present during migration.
  - migration logic must preserve behavior while converging persisted Lighting
    state to HA-managed automation records.
- Lighting UI contract is locked by `docs/automation-ui-guide.md` (Section 10)
  and must be updated with any lighting-tab UX change.

## C-018 Home Assistant UX Baseline Contract

- UI/UX decisions should default to Home Assistant-native interaction patterns.
- This baseline applies in particular to:
  - control placement/hierarchy
  - save/update/discard affordances
  - naming/labels
  - error and recovery messaging.
- Deviation from HA-native patterns is allowed when integration constraints or
  workflow clarity require it, but the rationale must be explicit in:
  - ADR notes (`docs/adr-log.md`) and
  - active UX contract docs (`docs/automation-ui-guide.md` and/or this file).

## C-019 Ambiguity Escalation Contract

- If implementation guidance conflicts across:
  - `docs/contracts.md`
  - `docs/automation-ui-guide.md`
  - active issue requirements
  - observed shipped UI behavior
  implementation must stop and request a user decision before coding that area.
- If more than one plausible UI/behavior pattern exists and no explicit contract
  chooses one, implementation must stop and request user choice.
- Do not mark ambiguous work complete until user sign-off is received.
- Resolved choices must be documented in contracts/guide/ADR in the same change
  set.

## C-020 Delivery Status + Validation Claim Contract

- Active behavior/status docs must distinguish delivery stage explicitly:
  - `Target`: approved/intended contract or design baseline
  - `Implemented`: landed in repo with code/docs/tests updated
  - `Released`: shipped in an installable artifact/runtime bundle
  - `Live-validated`: exercised against a running Home Assistant instance with
    the required live checklist/release gate recorded
- Execution state and delivery state are separate concerns:
  - use execution markers such as `Pending`, `In progress`, `Blocked`, `Done`
    for work tracking
  - use delivery markers above for behavior confidence/shipping claims
- `Complete` / `Completed` is not a sufficient behavior claim in active docs for
  work that changes runtime behavior, UI behavior, or contracts.
  - if used for archival/task bookkeeping, pair it with an explicit delivery
    state or keep it out of active status summaries
- If live HA validation is still pending for a behavior change, active docs may
  claim `Implemented` but must not claim `Live-validated`.
- Active docs that summarize current behavior (`docs/current-work.md`,
  `docs/work-tracking.md`, active issue checklists, and release/live validation
  docs) must stay aligned in the same change set.
