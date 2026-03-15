# Lighting Automation UI Spec (Draft v4 - Rules Model)

**Last reviewed**: 2026-03-03  
**Status**: Reference (pre-HA-canonical lighting migration)  
**Purpose**: define a practical lighting UX that combines time, ambient, and occupancy using explicit triggers + conditions + actions.

Implementation note:

1. `docs/lighting-ui-contract.md` is authoritative for current Lighting UX.
2. ADR-HA-056 supersedes this document's persistence assumptions where they
   conflict (Lighting ownership now targets HA-canonical managed automations).

## 1. Why v4

Current v3 schedule blocks are directionally correct but not expressive enough:

1. Users are thinking in terms of events and conditions, not just time blocks.
2. We need to express scenarios like:
   - on dark, only if occupied,
   - on occupied, only when dark,
   - overnight behavior with lower levels.
3. Current auto-save UX can feel "locked" while each change persists.

v4 changes the mental model from "block timeline" to "lighting rules."

## 2. Goals and non-goals

### 2.1 Goals

1. Keep setup easy for the 80% case.
2. Make behavior explainable ("this rule ran because trigger X and conditions Y").
3. Keep single-writer ownership for lights.
4. Avoid fighting `On Occupied` / `On Vacant` actions for non-light devices.

### 2.2 Non-goals

1. Full arbitrary rules engine in v4.
2. Adaptive circadian math and scene interpolation.
3. Manual override suppression loops (future phase).

## 3. Locked design decisions

1. Top-level tabs remain:
   - `Detection`
   - `Ambient`
   - `Lighting`
   - `Appliances`
   - `Media`
   - `HVAC`
2. `Lighting` owns `light.*` automation logic for this location.
3. Non-light rules are split by domain tab:
   - `Appliances` -> `switch.*`
   - `Media` -> `media_player.*`
   - `HVAC` -> `fan.*`
4. Ownership conflicts are hard-blocked (not soft-prioritized).
5. Internal module id remains `dusk_dawn` in this phase.

## 4. Information architecture and ownership

### 4.1 Detection tab

1. Sensor/source setup.
2. Occupancy diagnostics.
3. No direct light action authoring.

### 4.2 Ambient tab

1. Ambient state/config (`is_dark`, `is_bright`, lux source).
2. Lux sensor assignment + thresholds + sun fallback controls.
3. No direct light action authoring.

### 4.3 Lighting tab

1. Rule list and rule editor for `light.*`.
2. Rules are event-driven with optional conditions.
3. Per-rule light actions (on/off, level, color).

### 4.4 Device automation tabs (`Appliances`, `Media`, `HVAC`)

1. Rules are authored per-tab for domain-specific non-light entities.
2. Triggers are constrained to occupancy transitions (`on_occupied` / `on_vacant`).
3. If a target is `light.*` and lighting-owned, block with explicit message.

## 5. Rule model

Each lighting rule has:

1. `id`
2. `name`
3. `enabled`
4. `trigger`
5. `conditions[]`
6. `actions[]`

### 5.1 Trigger types (v4)

1. `on_occupied`
2. `on_vacant`
3. `ambient_became_dark`
4. `ambient_became_bright`
5. `at_time`

### 5.2 Condition types (v4)

1. `ambient_is_dark` / `ambient_is_bright`
2. `location_is_occupied` / `location_is_vacant`
3. `time_between` (supports overnight wrap)
4. `target_light_is_off` / `target_light_is_on` (optional advanced toggle)

### 5.3 Action types (v4)

1. `light_action` with:
   - `entity_id` (`light.*`)
   - `power` (`on|off`)
   - `brightness_pct?` (`1..100`)
   - `color_hex?` (`#RRGGBB`)
   - `already_on_behavior` (`leave_unchanged|set_target`)

## 6. UX specification

### 6.1 Layout

Lighting tab shows:

1. `Policy status` card:
   - ambient snapshot
   - active/inactive summary
   - rule count
2. `Rules` list:
   - sortable cards
   - add rule button
   - duplicate/delete rule actions

### 6.2 Rule card editor

Each rule card includes:

1. Rule name + enabled toggle.
2. Trigger picker.
3. Conditions editor:
   - add condition
   - remove condition
4. Light actions table:
   - add light action
   - per action entity + on/off + brightness + color + already-on behavior

### 6.3 Save behavior (fix current pain)

To prevent "UI frozen while editing":

1. Edit in local draft state.
2. Save per-rule or save-all (explicit commit), not on every keystroke/change.
3. Do not disable entire tab during save.
4. Only disable the specific save button while request is in flight.
5. Show inline save/error state per rule.

### 6.4 Starter templates

Offer quick-start templates:

1. `Evening arrival`: trigger `ambient_became_dark`, condition `location_is_occupied`.
2. `Overnight pathway`: trigger `on_occupied`, conditions `ambient_is_dark` + overnight `time_between`.
3. `Exterior dusk-to-dawn`: trigger `ambient_became_dark` + separate `ambient_became_bright` off rule.

## 7. Runtime semantics

### 7.1 Evaluation events

Re-evaluate on:

1. occupancy state change,
2. ambient dark/bright transition,
3. scheduled time trigger,
4. config save/reload,
5. HA startup.

### 7.2 Rule execution

1. Trigger must match first.
2. All conditions must pass.
3. Run actions in order.
4. If multiple rules fire in same evaluation cycle, execute by explicit rule order (top to bottom).

### 7.3 Conflict behavior

1. Same light in multiple lighting rules is allowed.
2. Simultaneous writes resolve by rule order (later rule wins in same cycle).
3. Same light in `Lighting` and `Actions` is disallowed (hard-block).

## 8. Data model target (v4 draft)

Keep module id `modules.dusk_dawn`, but move shape to rules.

```json
{
  "version": 4,
  "rules": [
    {
      "id": "rule_evening_arrival",
      "name": "Evening arrival",
      "enabled": true,
      "trigger": { "type": "ambient_became_dark" },
      "conditions": [
        { "type": "location_is_occupied" },
        { "type": "time_between", "start": "16:00", "end": "23:00" }
      ],
      "actions": [
        {
          "type": "light_action",
          "entity_id": "light.kitchen_ceiling",
          "power": "on",
          "brightness_pct": 100,
          "already_on_behavior": "set_target"
        }
      ]
    }
  ]
}
```

## 9. Dev-phase migration policy

1. No backward compatibility shim required in this phase.
2. Existing v3 block configs may be reset to v4 defaults:
   - `version: 4`
   - `rules: []`
3. Legacy behavior can be rebuilt through templates/manual rule creation.

## 10. Transition plan

1. Phase A: fix current editing UX in existing lighting screen (local drafts + scoped save disable).
2. Phase B: ship v4 data model + rule card UI behind dev flag.
3. Phase C: remove old block editor and keep only rule model.

## 11. Open questions for next review

1. Should `on_vacant` be available in Lighting rules or kept only in Actions?
2. Should `target_light_is_off` condition be global rule-level or action-level?
3. Do we need rule grouping/folders in v4, or just flat ordered list?
