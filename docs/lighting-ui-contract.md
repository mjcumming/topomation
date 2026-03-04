# Lighting UI Contract (v2)

**Last reviewed**: 2026-03-04  
**Status**: Active (design lock for current dev phase)

This document is the UI source of truth for the `Lighting` tab.  
If implementation differs from this document, treat it as a bug.

## 1. Scope

Applies to `custom_components/topomation/frontend/ht-location-inspector.ts`, tab `Lighting`, module id `dusk_dawn`.

## 2. Layout Contract

1. Lighting tab has one top section header only: `Lighting rules`.
2. No duplicate nested section title named `Rules` directly under `Lighting rules`.
3. A single `Save changes` button is rendered in the section header and is enabled only when draft changes exist.
4. The legacy `Save rules` / `Reset changes` controls are not rendered.
5. `Add rule` is rendered once, as a footer button at the bottom of the rules list.
6. Startup reapply toggle is shown above the section within Lighting tab (`Reapply lighting rules on startup`).

## 3. Rule Card Contract

Each rule card must render:

1. Rule title as a clickable button that enters inline rename mode (`input` on click).
2. `Trigger` select with values:
   - `On occupied`
   - `On vacant`
   - `On dark`
   - `On bright`
3. `Conditions` group:
   - Ambient filter (`Ignore ambient`, `Must be dark`, `Must be bright`)
   - `Must be occupied` toggle
   - `Use time window` toggle
4. Trigger-derived condition behavior:
   - `On dark` and `On bright` lock ambient filter to derived state (read-only display)
   - `On occupied` and `On vacant` lock occupancy condition to derived state (read-only display)
5. Time-window behavior:
   - `Begin` and `End` controls render only when `Use time window` is enabled
   - `Begin`/`End` use `type="time"` controls.
6. `Actions` group listing all local light entities with per-light controls:
   - include toggle
   - on/off select for non-dimmable lights
   - level slider (`0..100`) for dimmable lights
   - color picker for color-capable lights when selected and power is on
   - `Only if off` checkbox only for dimmable light rows.
7. Delete action is placed in the card footer as `Delete rule` button.

## 4. Data Contract Alignment

1. Per-light `only if off` maps to `light_targets[].already_on_behavior`:
   - checked -> `leave_unchanged`
   - unchecked -> `set_target`
2. Block-level `already_on_behavior` remains a default/fallback for new targets and compatibility.

## 5. Acceptance Checks (must be automated)

Playwright must verify at least:

1. single top `Lighting rules` header and no duplicate `Rules` section header.
2. rule title is clickable and switches to inline input edit mode.
3. `Use time window` reveals exactly two time inputs (`Begin`, `End`).
4. trigger-derived ambient/occupancy condition locking behavior.
5. per-light dimmer rows expose `Only if off`; non-dimmer rows do not.
6. delete action appears in rule footer.
7. only footer `Add rule` button is present.
