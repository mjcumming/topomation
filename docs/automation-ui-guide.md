# Automation UI Guide (Workspace + Inspector)

**Last reviewed**: 2026-04-13  
**Status**: Active (design baseline)  
**Authority**: ADR-HA-055, ADR-HA-056, ADR-HA-060, ADR-HA-066, ADR-HA-068, ADR-HA-069, ADR-HA-080, ADR-HA-087, ADR-HA-089 + `docs/contracts.md`

This guide defines the intended user interaction model for Topomation's
automation workspace and inspector tabs.

## 1. Workspace Information Architecture

1. Left panel hosts:
   - structure header/actions
   - location tree
   - docked **Occupancy** strip under the tree tied to the selected location
     (at-a-glance state + latest note; see **C-021**)
2. Right panel hosts the location inspector directly.
   - the older dedicated device-assignment workspace is mothballed in the
     active product UI; its implementation may remain in the repo but is not
     user-exposed.
3. The inspector tabs are:
   - `Occupancy`
   - `Ambient`
   - `Lighting`
   - `Appliances`
   - `Media`
   - `HVAC`

## 1.1 Structural aggregate hosts (`property`, `floor`, `building`, `grounds`)

These locations use **derived** occupancy surfaces (summary or occupancy groups),
not room-style source lists on structural hosts—see `docs/contracts.md` and
ADR-HA-073 (initial intent) as superseded by **ADR-HA-087** (current tab policy).

1. **Tabs shown**: `Occupancy Groups`, `Ambient`, `Lighting`, `Appliances`, `Media`, `HVAC`.
2. **Device and lux enumeration** (Ambient selector, Lighting/Appliances/Media/HVAC
   action targets): the host’s `entity_ids` and `ha_area_id` plus the **managed
   shadow** wrapper’s `ha_area_id` and `entity_ids` (`_meta.shadow_area_id` on the
   host). **No descendant walk** — devices in child-room HA areas are authored
   from the room that owns them (ADR-HA-049, ADR-HA-087).
3. **ADR-HA-073** originally hid automation tabs on structural nodes; **ADR-HA-087**
   restores them while scoping target-device enumeration to the host's own HA area
   plus its managed shadow area. Rollup-first occupancy UX is preserved.

## 2. Header Status Behavior

1. Occupancy state, lock state, and ambient are peer status indicators.
2. Lock status uses warning emphasis only when locked.
3. `Unlocked` should not visually dominate `Vacant/Occupied` or `Ambient`.

## 3. Occupancy Tab Layout

Top-to-bottom layout order:

1. Source configuration and editing controls
2. Add-source composer
3. Shared-space section (`Shared Space`)
4. WIAB controls
5. Occupancy no longer owns the tree **Occupancy** strip renderer; that strip is
   docked under the tree on the left and follows the selected location.
6. State-held direct-presence sources render `Occupied state` guidance and keep
   `Vacant delay` controls visible; the UI should not show disabled ON-timeout
   sliders for those sources.

## 4. Occupancy Groups Scope

1. `Occupancy Groups` edits one occupancy group, not one local directional link.
2. Saving normalizes membership across all selected members of that group.
3. Group membership is immediate-child scoped to the selected host.
4. Eligible hosts are `property`, `building`, `grounds`, and `floor`.
5. Eligible members are immediate child `area` rows only.
6. `subarea` rows and managed shadow/system rows are excluded.
7. Borrowed coverage remains in `Add Source`; users should not need a separate
   directional relationship editor for common room-coverage workflows.
8. Directional linked contributors remain hidden from the active Occupancy UI
   until that workflow is revalidated.

## 5. Managed System Area Messaging

1. Status copy must be actionable and specific.
2. Do not use vague "next reconciliation" language without an operator path.
3. When inconsistency is detected, UI should include:
   - current mapped shadow/system area id
   - detected mismatch reason (missing role, wrong host link, missing area, etc.)
   - explicit remediation action (for example a sync/reconcile trigger).

## 6. Save/Update Interaction Pattern

1. Silent auto-save is not used for user-authored policy edits.
2. Save controls must indicate dirty/clean state clearly.
3. `Occupancy` and `Ambient` use tab-level draft controls:
   - controls render only while the tab has unsaved changes (or is actively saving / showing a save error)
   - controls are presented in a sticky bottom action bar within the inspector viewport
   - `Save changes` commits draft
   - `Discard changes` restores persisted state.
4. Ambient assignment uses one selector control:
   - direct sensor options for the location (including HA areas and entities tied to
     the host’s **managed shadow** when applicable; see ADR-HA-087 / C-015)
   - `Inherit from parent` as the empty/default option
   - do not render a separate inherit checkbox alongside the selector.
5. Rule-authoring tabs (`Lighting`, `Appliances`, `Media`, `HVAC`) use
   per-rule card controls for rule lifecycle edits.
6. Do not mix tab-level `Save changes` / `Discard changes` with per-card
   `Delete rule` for the same rule workflow.

## 6.5 Non-Lighting Scope

1. `Appliances` (v1): simple loads — standalone `fan.*` (not on the same HA device
   graph as a `climate.*` entity) and `switch.*` for on/off style actions.
   - occupancy edge triggers only (`Room becomes occupied` / `Room becomes vacant`)
   - no ambient-light triggers or ambient filter rows
   - optional time window matches the Lighting-style pill control (`Any time` /
     `Limit to a time range`)
   - `Set speed` exposes a percentage control for `fan.*` when that action is selected
2. `HVAC` (v1): `fan.*` tied to HVAC hardware — a fan appears here when the entity
   registry links its device (including `via_device` parents) to a `climate.*`
   entity on the same device chain.
   - same occupancy-only + time-window editor pattern as `Appliances` and `Media`
3. `Media` is the common-case media workflow:
   `media_player.*` targets with simple occupancy-driven power/playback/volume/
   mute actions.
   - occupancy edge triggers only (choice pills; no ambient rows)
   - optional time window (same pill pattern as Lighting)
   - `Set volume` exposes a percentage control only when selected
4. `Appliances`, `Media`, and `HVAC` do not expose ambient-light triggers or
   ambient condition filters in v1.
5. Do not present `climate.*` thermostat/preset editing until a narrower common
   occupancy contract is agreed and documented.

## 7. Rule Lifecycle Controls

1. Unsaved draft rule card:
   - show `Save rule`
   - show `Remove rule`
   - all rule-authoring tabs also show `Duplicate rule`
   - do not show `Delete rule`.
2. Persisted rule card with edits:
   - show `Update rule`
   - show `Discard edits`
   - show `Delete rule`.
   - all rule-authoring tabs also show `Duplicate rule`.
3. Persisted rule card with no edits:
   - show `Delete rule` + `Duplicate rule` on every rule-authoring tab.
4. Rule lifecycle controls are colocated on the rule card.

## 8. Lighting Persistence Direction

1. Lighting rules follow HA-canonical managed automation ownership.
2. Stable metadata identity (`rule_uuid`) is required for create/update tracking.
3. The active Lighting editor ignores legacy `modules.dusk_dawn` payloads.

## 9. Home Assistant UX Alignment Rule

When workflow design is ambiguous, prefer Home Assistant-native interaction
patterns for:

1. Save/update affordances
2. Tab and section hierarchy
3. Rule lifecycle controls
4. Error and recovery messaging

Deviation policy:

1. Deviations are allowed when HA-native patterns conflict with integration
   constraints or produce lower clarity for this workflow.
2. Any deviation must include explicit rationale in ADR/contracts updates in the
   same change set.

## 10. Lighting Tab Detailed Contract

1. Lighting tab has one top section header only: `Lighting rules`.
2. Do not render a duplicate nested `Rules` section title directly under
   `Lighting rules`.
3. `Add rule` is rendered once as a footer action.
4. `Add rule` is hidden while any rule card in the current tab has unsaved edits
   or is an unsaved draft.
5. Lighting tab does not expose a Topomation-specific tab-global startup
   reapply toggle.

Rule-card requirements:

1. Rule title supports inline rename.
2. Lighting rules are trigger-family based.
3. The first section is `When`.
4. Lighting exposes exactly two trigger-family cards:
   - `Occupancy change`
   - `Ambient light change`
5. Trigger choices are presented as text-button pills, not numbered situation
   rows.
6. Supported trigger choices are:
   - occupancy: `Room becomes occupied`, `Room becomes vacant`
   - ambient: `It becomes dark`, `It becomes bright`
7. A trigger family becomes inactive when no trigger in that family is selected.
8. `Only if` values are shown only when that trigger family is active:
   - for occupancy triggers: `Any`, `It is dark`, `It is bright`
   - for ambient triggers: `Any`, `Room is occupied`, `Room is vacant`
9. Current backend-backed Lighting rules support at most:
   - one occupancy-family trigger
   - one ambient-family trigger
10. `Time window` is a separate section with pill-style choices:
    - `Any time`
    - `Limit to a time range`
    Begin / End inputs appear only when the time range option is active.
11. One rule supports one optional time window only.
12. Multi-band behavior is authored as multiple rules, typically via
    `Duplicate rule`.
13. Overlapping time windows are allowed.
14. Actions editor uses a capability-based light device list:
   - one row per compatible local `light.*` entity
   - row include toggles are multi-select and define the ordered action list for the rule
   - dimmable rows use a brightness slider (`0` -> `turn_off`, `>0` ->
     `turn_on` with `brightness_pct`)
   - non-dimmable rows use an action mode select (`Turn on` / `Turn off` /
     `Toggle`)
   - `light.turn_on` rows may expose an `Only if off` pill; when active, that
     individual light action is skipped if the light is already on
   - do not show `Only if off` for `turn_off`; do not preserve it for `toggle`
   - do not render a separate top-level `Device` + `Action` dropdown pair for
     Lighting rules.
15. Duplicate-rule helper copy is placed with the rule footer controls, not in
    the middle of the editor body.
16. Rule lifecycle controls:
   - unsaved draft rows show `Save rule` + `Remove rule`
   - all Lighting rule cards also show `Duplicate rule`
   - persisted edited rows show `Update rule` + `Discard edits` + `Delete rule`
   - persisted clean rows show `Delete rule` + `Duplicate rule`
17. Rule lifecycle controls are card-local; they are not split between tab-level
   buttons and rule-card buttons.

Acceptance checks:

1. Single top `Lighting rules` header.
2. Inline rule rename behavior works.
3. Lighting renders trigger-family cards instead of situation cards.
4. Lighting supports one occupancy trigger plus one ambient trigger in a
   single rule.
5. Time window uses `Any time` / `Limit to a time range` controls with inline
   heading placement.
6. `Time window` reveals `Begin` and `End`.
7. Unsaved draft rule hides `Delete rule`.
8. Persisted edited rule shows `Update rule`, `Discard edits`, `Delete rule`,
   and `Duplicate rule`.
9. Persisted clean rule shows `Delete rule` + `Duplicate rule`.
10. Save/discard is explicit; no silent auto-save.
11. Lighting actions render capability-based device rows (dimmer/switch style),
   not a single `Device` + `Action` dropdown editor.
12. One lighting rule can persist multiple action targets.

## 11. Human Approval Gate for Ambiguity

1. If `docs/contracts.md`, this guide, open issue requirements, or shipped UI
   behavior conflict, implementation must stop and request user decision before
   coding that area.
2. If multiple UI patterns are plausible and none is explicitly contracted,
   implementation must stop and request user choice.
3. Do not mark work "complete" until user has reviewed and approved the
   ambiguous area in live HA behavior.
4. Resolved choices must be documented in the same change set.
