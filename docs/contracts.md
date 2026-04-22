# Contracts

**Last reviewed**: 2026-04-17
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

- For occupancy sources configured with `off_event=clear`:
  - `off_trailing <= 0` maps to `occupancy.signal` with `event_type=clear`, `timeout=0`,
    and **`authoritative_vacant: true`**, which the kernel treats as a **location-wide
    vacate** (all contributions cleared for that location). Operators who do not want
    whole-room vacant on that entity’s OFF must set `off_event` to `none` or use a
    non-zero `off_trailing` exit grace.
  - `off_trailing > 0` maps to trailing source release (`event_type=clear`, `timeout=off_trailing`).
    Those timed holds are **exit-grace** rows: any later **trigger** on that location
    cancels **all** exit-grace holds (see **C-003B** and ADR-HA-075).
- Inspector "Test Off" mirrors this:
  - always `service: topomation.clear(location_id, source_id, trailing_timeout)` (source-scoped;
    use `topomation.vacate` when testing whole-room vacant explicitly).
- Authoritative vacate from HA sources is limited to the configured **immediate off**
  path above; other vacate entry points remain `topomation.vacate`, `topomation.vacate_area`,
  or policy actions that call vacate.
- Lock directives remain authoritative (`block_vacant` may prevent transition to vacant).

## C-003B Mixed-source additive occupancy contract

- Occupancy contributions are additive per `source_id`; there is no implicit
  source-class precedence between motion, presence, occupancy, door, media,
  light, or other configured sources **except** where **C-003A** defines an
  explicit whole-room vacate or exit-grace cancellation.
- A **trailing** clear (`off_event=clear` with `off_trailing > 0`) keeps a timed
  **exit-grace** hold for that `source_id`. Any **`trigger`** on the same
  location cancels **all** exit-grace holds so new motion (or another source)
  can rescind a pending scheduled vacancy before it completes.
- A configured **immediate** off clear (`off_event=clear`, `off_trailing == 0`)
  vacates the **entire** location via **C-003A**; other sources do not keep the
  room occupied past that signal.
- For clears that are not “immediate authoritative off” and not exit-grace
  (for example service `clear(..., 0)` without the HA authoritative path), a
  source’s release still removes only that `source_id` unless otherwise specified.
- Configuring both presence and motion in one location remains a deliberate
  fusion choice; use **immediate off** only on sources that should end the room,
  and prefer **trailing off** when OFF is ambiguous (typical for motion).

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
- Manual tree lock controls are operator/test-first:
  - lock click maps to `topomation.lock(location_id, source_id="manual_ui", mode="freeze", scope="subtree")`
  - unlock click maps to force clear lock policy for the selected subtree via
    `topomation.unlock_all` across the selected location and descendants.
- Tree lock owner copy should use human-readable labels (for example `Manual panel`)
  instead of raw source id tokens when a readable label is known.

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
- Managed action occupancy conditions are tri-state:
  - `true` => must be occupied
  - `false` => must be vacant
  - omitted / `null` => ignore occupancy

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

- The Occupancy tab core area list (entities already in the selected location) is intentionally curated to:
  - `light.*` (including power/level/color signal variants as supported)
  - `fan.*`
  - `media_player.*` (playback/volume/mute signal variants)
  - `binary_sensor.*` where:
    - `device_class` is one of `motion`, `presence`, `occupancy`, `door`, `garage_door`, `opening`, `window`, `lock`, `vibration`, `sound`, or
    - `device_class` is absent (for integrations that emit semantic binary sensors such as camera person/motion variants)
  - `switch.*` only when explicitly light-classified (`device_class: light`)
- The Occupancy tab must exclude Topomation-managed occupancy outputs from source selection
  (`device_class: occupancy` with `location_id`), while allowing external occupancy-class sensors.
- The Occupancy tab must exclude non-core appliance/control domains from core auto-enumeration
  (for example `climate`, `vacuum`, `cover`).
- The explicit **Add Source** picker remains broader for edge cases and may include generic `switch.*`
  entities so users can opt into uncommon/manual workflows without cluttering core discovery.
- For HA-backed `area` locations parented by a `floor`, the cross-area picker in Occupancy is
  sibling-scoped:
  - candidate source areas must be immediate sibling `area` locations under the same floor
  - non-sibling areas, child/subarea nodes, and non-HA-backed areas are excluded
  - `Any area / unassigned` is not offered in this sibling-scoped mode.

## C-013 Occupancy Groups Contract

- Occupancy Group membership is explicit room config, using
  `occupancy_group_id: string | null`.
- The active authoring model is `Occupancy Groups`.
- Occupancy Groups v1 are HA-authored host-local UI clusters:
  - when an eligible host (`property`, `building`, `grounds`, or `floor`) is
    selected, the first inspector tab becomes
    `Occupancy Groups`
  - that tab manages shared-occupancy groups among direct child `area`
    locations of the selected host
  - an `area` may belong to zero or one occupancy group
  - an eligible host may contain zero or more occupancy groups
  - a valid occupancy group contains at least two areas
  - room-level Occupancy authoring remains room-scoped; area inspectors may
    summarize current group membership but do not own group editing
- Host occupancy-group actions apply immediately; they do not use the room
  occupancy draft bar or `Save changes` / `Discard`.
- Creating, deleting, or editing a host occupancy group updates explicit
  group membership on the affected rooms and updates the host-scoped group
  definition/registry used by occupancy runtime.
- `Create group` is enabled only when:
  - at least two ungrouped candidate areas remain on the selected host
  - the user has selected at least two of those ungrouped areas
- If an existing group is edited down to one or zero members, the group is
  removed automatically instead of persisting an invalid one-member group.
- Occupancy Group semantics are authority-based:
  - each group has one canonical runtime state
  - that state owns occupied/vacant outcome, effective timeout, and lock
    behavior for the whole group
  - occupancy-affecting events from grouped rooms resolve to the group while
    preserving the originating room/source identity for explainability
  - all grouped members must publish the same occupied/vacant result, the same
    effective timeout behavior, and the same lock behavior
  - occupancy binary sensors (entity `unique_id` `occupancy_{location_id}`) remain
    authoritative for **member room** state in Home Assistant: each grouped
    **area** location’s entity must report the group-projected occupied/vacant
    result for that room
  - **Shadow host** locations (`floor`, `building`, `grounds`, `property` per
    managed-shadow policy; see ADR-HA-049 and ADR-HA-077) do **not** register a
    host-level Topomation occupancy entity; HA-visible occupancy for that
    aggregate uses the **managed shadow** `area_*` location’s entity only (avoids
    duplicate “same name, two entities” rows)
  - Panel code that reads occupancy **state** (header, runtime summary,
    explainability, live `state_changed` refresh) must resolve the topology id via
    **`effectiveOccupancyTopologyId`** (host → managed shadow child when present),
    matching `attributes.location_id` on the entity (ADR-HA-079)
  - explainability should explicitly identify the group, using wording
    equivalent to `via occupancy group`
- Occupancy Groups v1 candidate scope is intentionally narrow:
  - only direct child `area` locations under the selected eligible host are eligible
    group members
  - eligible hosts are `property`, `building`, `grounds`, and `floor`
  - `subarea` locations are excluded
  - managed/system shadow areas are excluded
  - descendant-of-descendant and cross-host grouping are not part of the active UI
- No new Home Assistant entity is created for an occupancy group in v1; member
  rooms remain the public occupancy entities.
- Borrowed coverage belongs in `Add Source`, not in shared-space membership.
- Directional linked contributors remain supported in stored config key
  `linked_locations: string[]`, but are hidden from the active Occupancy UI
  until that workflow is revalidated.
- Hidden directional contributor runtime remains source-scoped:
  - if location `A` config includes `linked_locations: ["B"]`, occupancy of `B`
    contributes to `A`
  - occupied on source -> `occupancy.trigger(target, source_id="linked:<source>", timeout=None)`
  - vacant on source -> `occupancy.clear(target, source_id="linked:<source>", trailing_timeout=0)`
  - reciprocal links must not self-latch; runtime suppresses feedback when a
    source location is currently occupied by the target's linked contribution
    (`linked:<target>`).
- Adjacency handoff controls are non-primary UX:
  - Occupancy renders `Adjacent Locations` and `Handoff Trace` behind an explicit
    advanced disclosure toggle.
- Advanced adjacency neighbor picker scope is intentionally narrow:
  - candidates must be room-level (`area`/`subarea`) locations
  - candidates must share the same `parent_id` as the selected location
  - non-room topology nodes (for example `floor`, `building`, `grounds`) are
    excluded from the picker.
- Structural occupancy authoring is derived-only in the active UI:
  - `building` and `grounds` do not expose direct occupancy source editing
  - `building` and `grounds` do not expose `Add Source`
  - structural hosts do not expose WIAB
  - structural hosts may expose `Occupancy Groups` for immediate child `area`
    locations, but they do not expose a room-style source editor
  - structural occupancy is expected to roll up from descendant locations
- Structural nodes are informational pages in the active inspector for **occupancy
  rollup** (no direct source authoring on aggregate hosts), but they **do** expose
  **Lighting**, **Media**, and **HVAC** (not **Appliances**) alongside **Occupancy**
  (summary or groups) and **Ambient**:
  - `property`, `floor`, `building`, and `grounds` use the same managed-shadow
    HA area as the device container for aggregate automation targets (ADR-HA-049,
    ADR-HA-078)
  - `property`, `floor`, `building`, and `grounds` may manage occupancy groups
    for immediate child `area` locations only
  - `building` and `grounds` still render derived-occupancy summary and not a
    room-style source editor
  - whole-home/floor aggregate scenes may still be authored as normal Home
    Assistant automations when operators prefer HA-native automation UI

## C-014 Inspector Draft Bar Contract

- `Occupancy` and `Ambient` use one shared tab-level draft interaction model.
- Exception: host-scoped `Occupancy Groups` do not use this draft model; they
  apply immediately.
- Clean state:
  - no `Save changes` / `Discard` controls are rendered.
- Dirty state:
  - a sticky bottom action bar appears inside the inspector viewport.
  - left side copy indicates unsaved/saving state.
  - right side shows `Discard` and `Save changes`.
- Saving state:
  - the sticky bar remains visible and `Save changes` shows `Saving...`.
- Save errors:
  - the sticky bar remains visible and an inline warning is shown above it.
- Device-automation rule tabs (`Appliances`, `HVAC`, `Lighting`, `Media`) do not use this sticky draft bar; they keep per-rule lifecycle controls.

## C-014A Lighting Rule Authoring Contract

- Lighting rule authoring is trigger-family based in the panel UI.
- A Lighting rule is expressed as:
  - one occupancy trigger family row
  - one ambient trigger family row
  - one optional time window
  - one lighting action target list
- Supported trigger families are:
  - occupancy change:
    - `Room becomes occupied`
    - `Room becomes vacant`
  - ambient light change:
    - `It becomes dark`
    - `It becomes bright`
- Trigger families do not render an explicit `Off` pill.
- A trigger family is inactive when no trigger in that family is selected.
- Family conditions are cross-dimension only:
  - occupancy triggers allow `Any`, `It is dark`, `It is bright`
  - ambient triggers allow `Any`, `Room is occupied`, `Room is vacant`
- Current backend-backed Lighting rules support at most:
  - one occupancy-edge trigger
  - one ambient-edge trigger
- The panel must not present generic `Situation 1 / Situation 2` authoring for
  Lighting rules.
- `Duplicate rule` is the primary path for authoring multiple time-window
  variants of the same room behavior.
- A Lighting rule may include one optional time window only.
- Overlapping Lighting rule windows are allowed by design.
- Lighting action rows remain capability-based and may persist multiple target
  light actions in one rule.
- `only_if_off` is valid only for `light.turn_on` actions and must not be
  preserved for `turn_off` or `toggle`.

## C-014 Managed Shadow Area Contract

- Aggregate topology nodes requiring HA-native `area_id` interoperability must
  use explicit, integration-owned managed shadow areas.
- Managed shadow hosts:
  - non-root `property`
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
  - shadow `modules.occupancy` must use `occupancy_strategy: follow_parent`,
    `contributes_to_parent: false`, and `enabled: true` so runtime occupancy cannot
    diverge from the structural host rollup (tree vs inspector consistency)
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
- Lux sensor **candidates** in the inspector include entities in:
  - the location’s `entity_ids`
  - any HA area linked by `location.ha_area_id`
  - when the location is a **managed shadow host** (`property`, `floor`,
    `building`, `grounds`): the host’s managed shadow wrapper’s `ha_area_id` and
    that shadow location’s `entity_ids` (ADR-HA-078)
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
  - one lux sensor selector whose empty/default option is `Inherit from parent`
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
  - top-level tabs: `Occupancy`, `Ambient`, `Appliances`, `HVAC`, `Lighting`, `Media`
  - no top-level `Advanced` tab and no generic `Actions` tab
  - advanced occupancy relationship controls are hidden from the active
    `Occupancy` UI until the workflow is revalidated.
- Workspace mode controls contract:
  - the right panel opens directly into the inspector; the active workspace no
    longer exposes separate `Configure` / `Assign Devices` tabs.
  - the dedicated assignment workflow is currently mothballed: retaining code
    for future reuse is allowed, but the active UI must not surface it.
- Save/update behavior is explicit across editable automation surfaces:
  - `Occupancy` and `Ambient` use tab-level draft state + explicit
    save/discard controls.
  - `Appliances`, `HVAC`, `Lighting`, and `Media` use per-rule card lifecycle
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
  - `Appliances` -> standalone `fan.*` (not tied to an HVAC/climate device in the
    HA device registry) plus `switch.*` for simple on/off loads such as
    switch-mode exhaust fans.
  - `HVAC` -> `fan.*` whose entity device (or `via_device` ancestor chain) is
    shared with at least one `climate.*` entity on the same HA device graph.
  - `Media` -> `media_player.*`
  - `climate.*` thermostat/preset authoring remains deferred until a narrower
    contract exists for common occupancy actions.
  - `Appliances`, `Media`, and `HVAC` do not expose ambient-light triggers or
    ambient condition rows in v1 (occupancy edges plus optional time window only).
  - `Media` action choices focus on common occupancy controls:
    power, playback, volume, and mute.
  - `Media` exposes `volume_set` as a first-class action with a visible percent
    control only when selected.
  - `Appliances` and `HVAC` expose `fan.set_percentage` as a first-class action
    for `fan.*` targets with a visible percent control only when selected.
  - In the panel, `Media`, `HVAC`, and `Appliances` enumerate compatible
    targets and commands as choice-pill / radio groups (not `<select>`
    dropdowns) for the small per-tab entity pools.
- Lighting rule persistence contract:
  - HA automation entities/config are canonical for Lighting rule state.
  - save path is upsert+diff with stable metadata identity (`rule_uuid`).
  - backend integration is the only writer for Lighting automation mutations.
- Ownership constraint:
  - hard-block `light.*` overlap between Lighting-policy targets and managed-action targets in `Appliances` / `Media` / `HVAC` for the same location.
- Startup behavior contract:
  - `Appliances`, `HVAC`, `Lighting`, and `Media` do not expose tab-global startup reapply
    toggles.
- Lighting multi-trigger contract:
  - a Lighting rule may include up to one occupancy-edge trigger and up to one
    ambient-edge trigger.
  - valid occupancy-edge triggers: `on_occupied`, `on_vacant`.
  - valid ambient-edge triggers: `on_dark`, `on_bright`.
  - the rule fires when any configured trigger occurs.
  - conflicting triggers within the same family are invalid:
    - `on_occupied` + `on_vacant`
    - `on_dark` + `on_bright`
  - persistence writes all selected triggers into the managed HA automation.
  - compatibility payloads may still expose a primary `trigger_type`, but the
    canonical Lighting trigger surface is the full trigger set.
- Lighting condition contract:
  - Lighting renders exactly two explicit trigger-family rows:
    occupancy change and ambient light change.
  - a trigger family with no selected trigger is inactive.
  - new Lighting rule drafts start with no trigger family selected; at least one
    trigger is required before save.
  - ambient and occupancy conditions are shown inline with their trigger
    family, not as separate generic situation rows.
  - condition controls only render when their trigger family is active.
  - Lighting may default condition values from the selected trigger set, but
    users retain explicit control of those condition rows.
- Lighting multi-action contract:
  - one Lighting rule may include multiple action targets.
  - persistence writes those targets as ordered HA automation action steps.
  - individual `light.turn_on` targets may carry `only_if_off=true`, which
    persists as a per-action guard and skips only that light when it is already
    on.
  - response/list payloads include full action target list (`actions[]`) plus
    first-action summary fields for compatibility (`action_entity_id`,
    `action_service`, `action_data`).
- Dev-mode no-legacy rule:
  - the active automation editor/runtime does not import legacy
    `modules.dusk_dawn` payloads into Lighting rules.
  - compatibility fallbacks like
    `modules.automation.reapply_last_state_on_startup` are not part of the
    active automation contract.
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

## C-021 Occupancy tree strip (formerly “explainability”) contract

- Occupancy context for the selected location is rendered as a **compact docked
  strip** under the location tree in the left workspace rail (implementation:
  `ht-room-explainability`).
- The strip follows the currently selected location.
- It is **not** a raw debug log and **not** a full event timeline. It answers the
  primary operator question: **is this location occupied or vacant, and what is
  the latest useful note?**
- V1 tree UI is occupancy-scoped only and shows:
  - current occupancy state (occupied / vacant)
  - **one primary text line**: if `recent_changes` on the occupancy entity is
    non-empty, the **newest** normalized entry is summarized as a last-event
    line; otherwise the same merged **reason / “why”** string used for aggregate
    or direct occupancy (see integration formatting rules)
  - optional secondary lines for **next vacancy / timeout** and **lock** summary
    when present
- V1 **does not** require listing every active contributor or the full
  `recent_changes` deque in the tree strip. Those details may be inspected via
  the **Occupancy** inspector tab, entity attributes, or Home Assistant
  **History** / **Logbook**.
- V1 does not require raw internal engine traces or lock/unlock timeline
  history in the tree strip.
- A separate global runtime event log is not exposed in the primary workspace
  for occupancy v1.
- Occupancy entity attributes must expose a small recent-change buffer as
  `recent_changes` for inspector rendering.
- `recent_changes` entries are newest-first and normalized with:
  - `kind`: `signal | state`
  - `event`: normalized event name
  - `changed_at`: ISO timestamp
  - optional `source_id`
  - optional `signal_key`
  - optional `reason`
  - optional `occupied`
- Stayed-occupied explainability throttling (integration buffer only): when a
  kernel `occupancy.changed` would append a `kind: state` row where `occupied`
  and `previous_occupied` are both true, that row is omitted if the newest entry
  in the buffer is already an occupied state row and the new `changed_at` is
  less than 10 seconds after that entry’s `changed_at`. True edges (vacant→occupied
  or occupied→vacant), rows when `previous_occupied` is unknown, and occupied state
  rows more than 10 seconds after the prior occupied state row are always
  recorded. `occupancy.signal` rows are unchanged. Home Assistant still receives
  `EVENT_TOPOMATION_OCCUPANCY_CHANGED` for every kernel `occupancy.changed`; only
  the explainability `recent_changes` deque is throttled.
- The section title and help text must describe **occupancy at a glance**, not
  imply a complete logbook or contributor matrix in the tree strip.
- The active user-facing label for the tree strip is **`Occupancy`** (historical
  docs may say “Occupancy Explainability”; ADR-HA-080). Do not use legacy
  `Room Explainability` as the product label.
- The strip is universal, but copy must adapt to location type:
  - structural locations (`property`, `floor`, `building`, `grounds`) are described as
    derived from child locations (or occupancy groups on `floor`)
  - room-like locations (`area`, `subarea`) may describe direct sources; **`subarea`**
    is a hierarchy label only (see **C-022**), not a separate HA entity class
- Internal contributor IDs must not be shown raw when a human-readable location
  or source label can be resolved.

## C-022 Topology ↔ Home Assistant area anchoring

- **Invariant**: Every topology location row that operators treat as part of the
  home tree for room-like semantics **must** resolve to a **Home Assistant Area**
  registry entry for `area_id` / entity interoperability. There are two patterns:
  1. **Direct HA-backed area**: the row is an `area_*` topology wrapper with a
     real `ha_area_id` (user `area` rows and, when used, **`subarea`** rows—same
     registry backing as any other area; see below).
  2. **Aggregate structural host**: the row is a managed-shadow **host** (`property`,
     `floor`, `building`, `grounds`) and **must** own exactly one **managed shadow**
     HA-backed child area per **C-014** (integration-created HA area used as plumbing).
- **`subarea` is not a parallel “non-area” type**: it marks **nested placement in the
  Topomation tree only** (parent/child edges HA does not natively store). For
  contracts and product semantics, a **`subarea` node is still one normal HA area**
  at persistence level (same obligations as `area` for registry linkage); only the
  **topology hierarchy** differs.
- **Managed shadow areas** (`role: managed_shadow`) are integration-owned rows;
  they satisfy the anchoring invariant for their **host** and are not optional
  “extra” user rooms; operators may hide them in the UI, but assignment and
  reconciliation semantics remain per **C-014**.
- **HA area removed — respect user intent vs auto-heal (split policy)**:
  - **Room-like rows** (`modules._meta.type` is `area` or **`subarea`** / hierarchy-only
    room row): if the user deletes that area in **Home Assistant Settings**, treat
    HA as **source of truth for deletion**. Remove or reconcile the matching topology
    wrapper, **reparent child topology locations** to the deleted node’s parent (or
    another documented safe parent), and clean up integration-owned dependents as
    needed. **Do not** silently recreate the same logical room in HA solely because
    topology still had a row—that would override an explicit user delete.
  - **Managed shadow areas only**: if HA removes the shadow **`area_*`** backing a
    structural host (`property`, `floor`, `building`, `grounds`), treat that as
    **integration drift** (or mistaken cleanup), **not** as intent to delete the
    host. **Auto-heal**: recreate the managed shadow HA area and re-wire the host
    pointer per **C-014** / reconciliation passes.
- **HA area created**: the integration **must** listen for Home Assistant
  `area_registry_updated` **`create`** (and `update` / `remove`) and **import or
  reconcile** topology wrappers so areas the user adds in HA appear in the tree
  according to existing sync rules (see `SyncManager._setup_ha_listeners` /
  `_handle_area_created`).
- **Startup / restore drift healing for room rows**: when persisted topology contains
  a room-like row (`area` / `subarea`) that does **not** resolve to a valid HA area
  anchor, startup reconcile must repair it instead of leaving a topology-only room:
  - if exactly one plausible existing HA area match is available, relink to it
  - otherwise create the missing HA area
  - normalize the topology row onto the canonical `area_<ha_area_id>` wrapper while
    preserving children, entities, and topology-only overlay relationships
- This contract is the **policy source** for ADR-HA-083; implementation must converge
  to it without weakening the invariant (legacy stores may require one-time heal
  or migration paths).
