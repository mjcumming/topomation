# Automation UI Guide (Workspace + Inspector)

**Last reviewed**: 2026-03-17  
**Status**: Active (design baseline)  
**Authority**: ADR-HA-055, ADR-HA-056, ADR-HA-060, ADR-HA-066 + `docs/contracts.md`

This guide defines the intended user interaction model for Topomation's
automation workspace and inspector tabs.

## 1. Workspace Information Architecture

1. Right-panel mode selection uses top-level tabs:
   - `Configure`
   - `Assign Devices`
2. Left panel hosts:
   - structure header/actions
   - location tree
   - docked `Room Explainability` panel tied to the selected location
3. `Configure` hosts inspector tabs:
   - `Detection`
   - `Ambient`
   - `Lighting`
   - `Media`
   - `HVAC`
4. `Assign Devices` is a dedicated workflow tab, not a secondary button mode.

## 2. Header Status Behavior

1. Occupancy state, lock state, and ambient are peer status indicators.
2. Lock status uses warning emphasis only when locked.
3. `Unlocked` should not visually dominate `Vacant/Occupied` or `Ambient`.

## 3. Detection Tab Layout

Top-to-bottom layout order:

1. Source configuration and editing controls
2. Add-source composer
3. Shared-space section (`Shared Space`)
4. WIAB controls
5. Detection no longer owns the Explainability renderer; that panel is docked
   under the tree on the left and follows the selected location.

## 4. Shared Space Scope

1. `Shared Space` edits one occupancy group, not one local directional link.
2. Saving normalizes membership across all selected members of that group.
3. Shared-space membership is sibling-scoped (same `parent_id`).
4. Allowed shared-space pairings:
   - `area` with sibling `area` when parent type is `area`, `floor`, or `building`
   - `floor` with sibling `floor` when parent type is `building`
5. Primary UI label is `Shared Space`.
6. Borrowed coverage remains in `Add Source`; users should not need a separate
   directional relationship editor for common room-coverage workflows.
7. Directional linked contributors remain hidden from the active Detection UI
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
3. `Detection` and `Ambient` use tab-level draft controls:
   - controls render only while the tab has unsaved changes (or is actively saving / showing a save error)
   - controls are presented in a sticky bottom action bar within the inspector viewport
   - `Save changes` commits draft
   - `Discard changes` restores persisted state.
4. Ambient assignment uses one selector control:
   - direct sensor options for the location
   - `Inherit from parent` as the empty/default option
   - do not render a separate inherit checkbox alongside the selector.
5. Rule-authoring tabs (`Lighting`, `Media`, `HVAC`) use
   per-rule card controls for rule lifecycle edits.
6. Do not mix tab-level `Save changes` / `Discard changes` with per-card
   `Delete rule` for the same rule workflow.

## 6.5 Non-Lighting Scope

1. `Media` is the common-case media workflow:
   `media_player.*` targets with simple occupancy-driven power/playback/volume/
   mute actions.
   - only `On occupied` / `On vacant` triggers
   - no separate occupancy-condition row
   - optional time window remains available
   - `Set volume` exposes a percentage control only when selected
2. `HVAC` is a fans-first workflow in v1:
   - `fan.*` targets are first-class.
   - switch-controlled exhaust/ventilation devices may also appear here via
     `switch.*` compatibility.
   - only `On occupied` / `On vacant` triggers
   - no separate occupancy-condition row
   - optional time window remains available
   - `Set speed` exposes a percentage control for `fan.*` targets only
3. `Media` and `HVAC` do not expose an ambient-light condition filter in v1.
4. Do not present a dedicated `Appliances` top-level tab in v1.
5. Do not present `climate.*` thermostat/preset editing until a narrower common
   occupancy contract is agreed and documented.

## 7. Rule Lifecycle Controls

1. Unsaved draft rule card:
   - show `Save rule`
   - show `Remove rule`
   - `Lighting` also shows `Duplicate rule`
   - do not show `Delete rule`.
2. Persisted rule card with edits:
   - show `Update rule`
   - show `Discard edits`
   - show `Delete rule`.
   - `Lighting` also shows `Duplicate rule`.
3. Persisted rule card with no edits:
   - show `Delete rule` only for `Media` / `HVAC`.
   - `Lighting` shows `Delete rule` + `Duplicate rule`.
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
2. Lighting rules are situation-based, not raw trigger-family based.
3. The first section is `When any of these happen`.
4. A situation row contains:
   - one `Event`
   - one cross-dimension `Only when` requirement
5. Supported events are:
   - `Room becomes occupied`
   - `Room becomes vacant`
   - `It becomes dark`
   - `It becomes bright`
6. Supported `Only when` values are:
   - for occupancy events: `Always`, `It is dark`, `It is bright`
   - for ambient events: `Always`, `Room is occupied`, `Room is vacant`
7. Current backend-backed Lighting rules support at most:
   - one occupancy-family situation
   - one ambient-family situation
8. `Add situation` adds the missing family when available.
9. `Remove` is per situation and is disabled when it would leave the rule with no
   situations.
10. `Time window` is a separate section with one optional toggle plus `Begin` /
    `End` inputs.
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
   - `light.turn_on` rows may expose an `Only if off` checkbox; when checked,
     that individual light action is skipped if the light is already on
   - do not show `Only if off` for `turn_off`; do not preserve it for `toggle`
   - do not render a separate top-level `Device` + `Action` dropdown pair for
     Lighting rules.
15. Rule lifecycle controls:
   - unsaved draft rows show `Save rule` + `Remove rule`
   - all Lighting rule cards also show `Duplicate rule`
   - persisted edited rows show `Update rule` + `Discard edits` + `Delete rule`
   - persisted clean rows show `Delete rule` + `Duplicate rule`
16. Rule lifecycle controls are card-local; they are not split between tab-level
   buttons and rule-card buttons.

Acceptance checks:

1. Single top `Lighting rules` header.
2. Inline rule rename behavior works.
3. Lighting renders situation cards instead of trigger-family controls.
4. Lighting supports one occupancy situation plus one ambient situation in a
   single rule.
5. `Add situation` is hidden once both situation families are present.
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
