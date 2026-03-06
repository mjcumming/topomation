# Automation UI Guide (Workspace + Inspector)

**Last reviewed**: 2026-03-06  
**Status**: Active (design baseline)  
**Authority**: ADR-HA-054, ADR-HA-055, ADR-HA-056, ADR-HA-060 + `docs/contracts.md`

This guide defines the intended user interaction model for Topomation's
automation workspace and inspector tabs.

## 1. Workspace Information Architecture

1. Right-panel mode selection uses top-level tabs:
   - `Configure`
   - `Assign Devices`
2. `Configure` hosts inspector tabs:
   - `Detection`
   - `Ambient`
   - `Lighting`
   - `Media`
   - `HVAC`
3. `Assign Devices` is a dedicated workflow tab, not a secondary button mode.

## 2. Header Status Behavior

1. Occupancy state, lock state, and ambient are peer status indicators.
2. Lock status uses warning emphasis only when locked.
3. `Unlocked` should not visually dominate `Vacant/Occupied` or `Ambient`.

## 3. Detection Tab Layout

Top-to-bottom layout order:

1. Source configuration and editing controls
2. Add-source composer
3. Sync section (`Sync Locations`)
4. WIAB and advanced occupancy controls
5. Recent occupancy events (logging/diagnostics section at bottom)

## 4. Sync Locations Scope

1. Sync is sibling-scoped (same `parent_id`).
2. Allowed sync pairings:
   - `area` with sibling `area` when parent type is `area`, `floor`, or `building`
   - `floor` with sibling `floor` when parent type is `building`
3. Primary UI label is `Sync Locations`.
4. Directional linked contributors remain a separate advanced model.

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
   - `Save changes` commits draft
   - `Discard changes` restores persisted state.
4. Rule-authoring tabs (`Lighting`, `Media`, `HVAC`) use
   per-rule card controls for rule lifecycle edits.
5. Do not mix tab-level `Save changes` / `Discard changes` with per-card
   `Delete rule` for the same rule workflow.

## 6.5 Non-Lighting Scope

1. `Media` is the common-case media workflow:
   `media_player.*` targets with simple occupancy-driven power/playback/volume/
   mute actions.
2. `HVAC` is a fans-first workflow in v1:
   - `fan.*` targets are first-class.
   - switch-controlled exhaust/ventilation devices may also appear here via
     `switch.*` compatibility.
3. `Media` and `HVAC` do not expose an ambient-light condition filter in v1.
4. `Run on startup` is not rendered inside `Conditions`; it lives in a
   separate bottom `Execution` section on the rule card.
5. Do not present a dedicated `Appliances` top-level tab in v1.
6. Do not present `climate.*` thermostat/preset editing until a narrower common
   occupancy contract is agreed and documented.

## 7. Rule Lifecycle Controls

1. Unsaved draft rule card:
   - show `Save rule`
   - show `Remove rule`
   - do not show `Delete rule`.
2. Persisted rule card with edits:
   - show `Update rule`
   - show `Discard edits`
   - show `Delete rule`.
3. Persisted rule card with no edits:
   - show `Delete rule` only.
4. Rule lifecycle controls are colocated on the rule card.

## 8. Lighting Persistence Direction

1. Lighting rules follow HA-canonical managed automation ownership.
2. Stable metadata identity (`rule_uuid`) is required for create/update tracking.
3. The active Lighting editor ignores legacy `modules.dusk_dawn` payloads.
4. Startup replay is authored per rule through rule-card `Run on startup`,
   persisted as managed-rule metadata (`run_on_startup`).
5. Startup replay only honors explicit per-rule metadata in the active UI/runtime.

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
4. Lighting tab does not expose a Topomation-specific tab-global startup
   reapply toggle.

Rule-card requirements:

1. Rule title supports inline rename.
2. Trigger options:
   - `On occupied`
   - `On vacant`
   - `On dark`
   - `On bright`
3. Conditions group includes:
   - ambient filter (`Ignore ambient`, `Must be dark`, `Must be bright`)
   - `Must be occupied` toggle
   - `Use time window` toggle
4. Execution group appears below `Actions` and includes:
   - `Run on startup` toggle
5. Trigger-derived behavior:
   - `On dark` enforces ambient condition `dark` and renders ambient as derived/read-only.
   - `On bright` enforces ambient condition `bright` and renders ambient as derived/read-only.
   - `On occupied` enforces `Must be occupied` and renders that condition as derived/read-only.
   - `On vacant` enforces `Must be vacant` and renders that condition as derived/read-only.
6. Time-window inputs (`Begin`, `End`) appear only when enabled.
7. Actions editor uses a capability-based light device list:
   - one row per compatible local `light.*` entity
   - row include toggles are multi-select and define the ordered action list for the rule
   - dimmable rows use a brightness slider (`0` -> `turn_off`, `>0` ->
     `turn_on` with `brightness_pct`)
   - non-dimmable rows use an action mode select (`Turn on` / `Turn off` /
     `Toggle`)
   - do not render a separate top-level `Device` + `Action` dropdown pair for
     Lighting rules.
8. Rule lifecycle controls:
   - unsaved draft rows show `Save rule` + `Remove rule`
   - persisted edited rows show `Update rule` + `Discard edits` + `Delete rule`
   - persisted clean rows show `Delete rule`.
9. Rule lifecycle controls are card-local; they are not split between tab-level
   buttons and rule-card buttons.

Acceptance checks:

1. Single top `Lighting rules` header.
2. Inline rule rename behavior works.
3. `Use time window` reveals `Begin` and `End`.
4. `Run on startup` is available in the card `Execution` section; no tab-global startup
   toggle is rendered.
5. `On dark` / `On bright` enforce matching ambient condition semantics.
6. `On occupied` / `On vacant` enforce matching occupancy condition semantics.
6. Unsaved draft rule hides `Delete rule`.
7. Persisted edited rule shows `Update rule`, `Discard edits`, and `Delete rule`.
8. Persisted clean rule shows `Delete rule`.
9. Save/discard is explicit; no silent auto-save.
10. Lighting actions render capability-based device rows (dimmer/switch style),
   not a single `Device` + `Action` dropdown editor.
11. One lighting rule can persist multiple action targets.

## 11. Human Approval Gate for Ambiguity

1. If `docs/contracts.md`, this guide, open issue requirements, or shipped UI
   behavior conflict, implementation must stop and request user decision before
   coding that area.
2. If multiple UI patterns are plausible and none is explicitly contracted,
   implementation must stop and request user choice.
3. Do not mark work "complete" until user has reviewed and approved the
   ambiguous area in live HA behavior.
4. Resolved choices must be documented in the same change set.
