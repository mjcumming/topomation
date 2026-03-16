# Lighting Behavior + Explainability Mockups

**Last updated**: 2026-03-16  
**Status**: Draft proposal, not authoritative  
**Purpose**: capture the current Lighting UX direction and Explainability layout
proposal before changing the active contract docs.

This doc is exploratory. If approved, follow-up work must update:

- `docs/automation-ui-guide.md`
- `docs/contracts.md`
- `docs/adr-log.md` if the interaction model changes materially

## Decisions Reached

1. Do not expose raw trigger mechanics as the primary Lighting UX.
2. Do not mix "turn on" and "turn off" behavior into one rule.
3. Do not introduce reusable named lighting profiles in this phase.
4. Do not build multi-time-band editing into one rule in this phase.
5. One Lighting rule should represent one lighting outcome.
6. A rule may include one optional time window.
7. If a room needs cooking, evening, and overnight variants, those should be
   separate rules.
8. Overlapping time windows are allowed by design.
9. `Duplicate rule` should be a first-class workflow.
10. Room Explainability should move out of the floating right-side drawer.

## Design Principles

1. Users should think in room behavior, not boolean logic.
2. Rules should read like plain language.
3. Time stays local to the rule.
4. The rule should describe a room lighting state, not a generic "on" or "off"
   automation.
5. Explainability should be anchored to location selection, not overlaid on top
   of editing controls.

## Rule Model

Recommended rule shape:

1. `Rule name`
2. `When any of these happen`
3. `Optional time window`
4. `Set room lights to`

The key idea is:

- a rule is not "turn lights on"
- a rule is "when these situations happen, apply this room lighting state"

This handles the important real-world case where a "vacant" rule does not
necessarily mean "all off." For example, a room may go mostly dark but leave a
nightlight on.

## Situation Model

Each rule contains one or more situation rows.

Each row has:

1. an `Event`
2. zero or more `Requirements`

### Event vocabulary

Keep this short and concrete:

1. `Room becomes occupied`
2. `Room becomes vacant`
3. `It becomes dark`
4. `It becomes bright`

### Requirement vocabulary

Also keep this short:

1. `Room is occupied`
2. `Room is vacant`
3. `It is dark`
4. `It is bright`
5. later, possibly `Home is occupied` / `Only when home`

### Situation examples

Common examples become:

1. `Room becomes occupied` + `It is dark`
2. `It becomes dark` + `Room is occupied`
3. `Room becomes vacant`
4. `It becomes bright`

Those are the main household lighting cases without exposing trigger-family
internals like `trigger_type`, `ambient_condition`, or `must_be_occupied`.

## Common Situation Examples

The UI should still help users move fast, but this should not require a second
top-level add button.

Instead of a separate `Add common situation` control, show example phrases
inside the `Add situation` flow or as nearby helper copy:

1. `Occupied while dark`
2. `Dark while occupied`
3. `Vacant`
4. `Bright`
5. `Occupied`
6. `Dark`

These are just example phrases that fill `Event` + `Requirements`.

If users understand `Add situation`, that should be enough. The examples can
live as:

1. helper text below the button
2. starter options inside the add flow
3. suggestions in the event/requirement picker

## Mockup A: Situation-Based Lighting Rule

Recommended direction for implementation.

```text
+----------------------------------------------------------------------------------+
| HOME                                                                             |
| Occupied | Unlocked | Ambient: 0.0 lx | Location ID building_main               |
+----------------------------------------------------------------------------------+
| Detection | Ambient | Lighting | Media | HVAC                                    |
+----------------------------------------------------------------------------------+
| LIGHTING RULES                                                                   |
|                                                                                  |
|  [ Rule: Family Room Evening ]                                                   |
|                                                                                  |
|  When any of these happen                                                        |
|                                                                                  |
|  [ Situation 1 ]                                                                 |
|  Event ................. Room becomes occupied                                   |
|  Requirements .......... [ It is dark ]                                          |
|                                                                                  |
|  [ Situation 2 ]                                                                 |
|  Event ................. It becomes dark                                         |
|  Requirements .......... [ Room is occupied ]                                    |
|                                                                                  |
|  [ + Add situation ]                                                             |
|  Examples: Occupied while dark, Dark while occupied, Vacant, Bright              |
|                                                                                  |
|  Time window                                                                      |
|  [x] Limit this rule to a time range                                             |
|  Begin ................. 6:00 PM                                                 |
|  End ................... 11:00 PM                                                |
|                                                                                  |
|  Set room lights to                                                               |
|  - Lamp ......................... On 60% warm | Only if off [x]                 |
|  - Ceiling cans ................. On 100%      | Only if off [ ]                 |
|  - TV bias light ................ Off                                            |
|                                                                                  |
|                           [ Save rule ] [ Remove rule ] [ Duplicate rule ]       |
|                                                                                  |
|                                                            [ Add rule ]          |
+----------------------------------------------------------------------------------+
```

### Why this is the recommended starting point

1. It matches the actual rule model discussed.
2. It avoids separate `Triggers` and `Conditions` sections while still
   preserving both concepts.
3. It does not require a reusable lighting-profile system.
4. It avoids multi-band complexity inside one rule.
5. It makes `Duplicate rule` the main path for cooking/evening/overnight
   variants.
6. It keeps `Only if off` available as a per-light action guard for `On`
   outcomes.

## Mockup B: Template-First Variant

Alternative if the explicit event/requirement rows feel too mechanical.

```text
+----------------------------------------------------------------------------------+
| LIGHTING RULES                                                                   |
|                                                                                  |
|  [ Rule: Kitchen Overnight ]                                                     |
|                                                                                  |
|  Situations                                                                      |
|  [ Occupied while dark ]                                                         |
|  [ Dark while occupied ]                                                         |
|                                                                                  |
|  [ Add situation ]                                                               |
|                                                                                  |
|  Time window                                                                      |
|  [x] Limit this rule to a time range                                             |
|  Begin ................. 12:00 AM                                                |
|  End ................... 6:00 AM                                                 |
|                                                                                  |
|  Set room lights to                                                               |
|  - Sink light .................... On 15%                                        |
|  - Ceiling cans .................. Off                                            |
|  - Pantry accent ................. On 10%                                        |
|                                                                                  |
|                           [ Save rule ] [ Remove rule ] [ Duplicate rule ]       |
+----------------------------------------------------------------------------------+
```

### Why this is weaker than Mockup A

1. It hides the event/requirement shape a bit too much.
2. It works well only if the template vocabulary stays small and well-curated.
3. It becomes harder to extend when requirements like `Only when home` arrive.

## Time Window Policy

Current recommendation:

1. One optional time window per rule.
2. No multi-band editor inside one rule.
3. If the room needs multiple time-based outcomes, create multiple rules.
4. Overlapping windows are allowed.
5. Do not hard-block overlap.
6. Do not over-govern the user in this phase.

This keeps the UI much smaller and supports the real workflow:

1. Create one evening rule.
2. Duplicate it.
3. Adjust the time window and light state for overnight.
4. Duplicate again for cooking.

## Duplicate Rule Workflow

`Duplicate rule` should clone:

1. the situation set
2. the time-window toggle and values
3. the target-light state rows

The duplicated rule should open immediately in editable state so the user can
change only:

1. rule name
2. time window
3. selected lights / brightness values

This is the primary acceleration path for rooms with several time-based
variants.

## Per-Light Action Guard

For light actions that result in `On`, the row should support `Only if off`.

Why:

1. It matches the existing managed-lighting capability.
2. It prevents a rule from needlessly reapplying an already-on light.
3. It matters more once a room can have several overlapping rules that target
   different subsets of lights.

Recommended behavior:

1. Show `Only if off` only for rows whose action is `On`.
2. Hide it for `Off`.
3. Do not preserve it for future `Toggle` if that action mode is ever allowed.

## Explainability Relocation

Current problem:

1. Explainability is rendered as a floating drawer inside the right-side
   inspector.
2. It competes with editing controls and feels bolted on.
3. It is visually heavy for something that should be glanceable.

### Recommended layout

Move Explainability to the bottom of the left panel, directly under the
location tree.

```text
+----------------------------------+-----------------------------------------------+
| LOCATIONS                        | AUTOMATION                                     |
|                                  |                                               |
|  Home                            |  Header / tabs / active editor                |
|   - First floor                  |                                               |
|   - Second floor                 |  Lighting / Media / HVAC / Detection          |
|   - Basement                     |                                               |
|                                  |  Main editing surface                         |
|                                  |                                               |
|----------------------------------|-----------------------------------------------|
| ROOM EXPLAINABILITY              |                                               |
| Occupied                         |                                               |
| Why: Vacated by child            |                                               |
| Recent: Kitchen changed 2m ago   |                                               |
| [ Open details ]                 |                                               |
+----------------------------------+-----------------------------------------------+
```

### Explainability panel behavior

1. Docked, not floating.
2. Collapsible.
3. Fixed-height by default, roughly `220-280px`.
4. Summary-first:
   - current state
   - why
   - latest contributing change
5. Optional `Open details` expands the full recent event timeline in place.

### Why the left side is better

1. Explainability follows the selected room, which is already anchored by the
   tree.
2. The right side stays focused on editing.
3. The panel becomes a stable reference instead of an overlay that must be
   mentally dismissed.

## Proposed Next Step

If this direction is approved:

1. update `docs/automation-ui-guide.md`
2. update `docs/contracts.md`
3. refactor the Lighting rule card around:
   - situation rows
   - one optional time window
   - room-light-state editor
   - duplicate-rule action
4. move Room Explainability from the inspector drawer into the left panel

Current recommendation: `Mockup A` + docked-left Explainability.
