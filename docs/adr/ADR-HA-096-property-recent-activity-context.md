# ADR-HA-096: Property Recent Activity Context

**Date**: 2026-05-22  
**Status**: 📝 PROPOSED

## Context

TopoMation's occupancy model answers whether a location is probably occupied
now. That is deliberately short-lived and location-scoped: rooms, subareas,
occupancy groups, and structural rollups become occupied or vacant from current
or recently held occupancy evidence.

Some automation decisions need a different question:

> Has this property been in use recently?

A cabin is the motivating example. Pathway or exterior lights should come on at
night when the cabin has been used within a configurable window, even if there
has not been a recent outdoor motion event. If nobody has visited for two days,
the same lights should stay off. Stretching ordinary occupancy with a very long
timeout would make the property look occupied when the real meaning is only
"recently active", and would leak that ambiguity into rollups, vacancy rules,
and diagnostics.

The current property inspector also exposes the same action tabs as other
structural hosts. For the property row, those tabs are awkward: a property is
better understood as site-level context and inherited configuration, while the
actual controllable devices live on rooms, grounds, buildings, or other concrete
locations below the property.

The same activity context could later support non-lighting cabin workflows:
turning off a water pump, hot water heater, ice maker, or other equipment when a
property has not been active for a while. Those are real use cases, but they
carry more operational risk than exterior lighting. The first implementation
should prove the context with a low-risk Lighting workflow before expanding it
to appliance or safety-critical equipment actions.

## Decision

TopoMation will introduce a **property recent activity** context for v1.

1. Recent activity is distinct from occupancy.
   - `occupied` means someone is probably present now.
   - `recently_active` means the property has qualifying human/use evidence
     within a configured time window.
2. Recent activity is configured only on `property` topology nodes in v1.
   `building`, `grounds`, `floor`, `area`, and `subarea` nodes do not own their
   own recent-activity windows in this phase.
3. The property row becomes a site-context authoring surface:
   - Recent Activity
   - Ambient inheritance/source configuration
   - property occupancy rollup and structure summary
4. The property row does not expose direct managed-action authoring tabs in v1:
   no Lighting, Appliances, Media, HVAC, or Vacuum tabs on the property row.
   Devices that physically live at the site should be modeled on a concrete
   descendant location such as grounds, exterior, pathway, garage, building, or
   room.
5. Descendant managed rules may consume the nearest ancestor property recent
   activity state as an optional condition/trigger context. The property owns
   the state; descendant locations own the device actions.
6. The canonical user-facing lighting affordance is a rule-level option such as
   **Require property activity**. This option is shown only when the selected
   rule location belongs to a property with recent activity enabled.
7. For ambient-dark Lighting rules, enabling property activity must handle both
   event orderings:
   - property is active, then it becomes dark
   - it is already dark, then the property becomes active
8. To satisfy that ordering requirement, the managed-rule compiler may add a
   property-activity trigger when compiling a dark-triggered rule with property
   activity required. Generated conditions must still require both:
   - effective ambient state is dark
   - property is recently active
9. For occupancy-triggered Lighting rules, property activity is a cross-family
   guard only. The rule wakes on the occupancy edge and runs only if the
   property is recently active.
10. Qualifying activity evidence is explicit and must avoid feedback loops.
    Descendant occupancy changes may qualify. Scheduled automation outputs,
    ambient/lux changes, weather, battery/state telemetry, and TopoMation's own
    generated action side effects must not refresh recent activity by default.
11. The runtime should expose diagnostics sufficient for the panel and HA users
    to understand the state:
    - active/inactive
    - last qualifying activity time
    - active-until time
    - latest qualifying reason/source when available
12. V1 consumption is limited to Lighting. Appliance, Media, HVAC, and Vacuum
    rule editors do not consume property recent activity in the first slice.
    Later ADRs may extend consumption to non-lighting workflows after the
    activity state and diagnostics have proven reliable.

## Rationale

1. Property-only keeps the first version aligned with the motivating use case:
   "is this site in use lately?"
2. Calling the state `recently_active` avoids corrupting the meaning of
   occupancy and preserves existing occupancy rollup semantics.
3. Property activity is useful as context for descendant automations, but the
   property itself is not usually the physical owner of a light, switch, fan,
   media player, HVAC fan, or vacuum.
4. A single rule-level activity option is easier to understand than exposing a
   full logic-builder grammar in the Lighting editor.
5. Adding a property-activity trigger for dark rules is necessary because HA
   automations wake on edges. A condition alone would miss arrivals after dark.
6. Keeping qualifying evidence explicit avoids self-refreshing loops where an
   automation runs because the property is active and then extends activity
   because the automation ran.
7. Limiting the first consumer to Lighting keeps the initial blast radius low.
   Turning on exterior/pathway lights is reversible and easy to validate; water
   pumps, hot water heaters, ice makers, and other equipment deserve a separate
   rule design with stronger safety defaults.

## Consequences

- ✅ Cabin/vacation-property lighting can be modeled without long fake
  occupancy holds.
- ✅ The property page becomes simpler and more semantically focused.
- ✅ Existing room/area occupancy behavior remains cleanly separated from
  site-level recent-use context.
- ✅ Descendant rule authors get the useful gate without needing to duplicate
  property activity logic on every location.
- ✅ The activity state remains general enough for future cabin/equipment
  workflows without making v1 carry those risks.
- ⚠️ Users who previously expected property-level action tabs must move those
  managed rules to a concrete descendant location.
- ⚠️ Non-lighting "inactive property" actions such as shutting off water pumps,
  water heaters, or ice makers are explicitly deferred.
- ⚠️ Multi-building independent activity windows are deferred. If live usage
  proves they are needed, a later ADR may extend ownership to `building`.
- ⚠️ Grounds-owned activity is deferred because outdoor events can be noisy and
  are more likely to act as evidence for property activity than to own a
  separate long-lived context.

## Validation Requirements

Implementation of this ADR must include:

1. Backend config validation that accepts recent activity config only on
   `property` nodes.
2. Persistence tests for enabled/disabled recent activity, activity window, and
   qualifying evidence options.
3. Runtime tests proving qualifying activity sets `recently_active`, updates
   `last_activity_at`, and computes `active_until`.
4. Runtime tests proving excluded telemetry/action events do not refresh
   property activity.
5. Compiler tests for Lighting rules with `require_property_activity`:
   - dark trigger plus property activity emits both dark and property-active
     wake paths, guarded by dark and active conditions
   - occupancy trigger plus property activity emits the occupancy wake path with
     property-active guard only
   - rules without property activity compile unchanged
   - non-lighting rule tabs cannot persist property-activity conditions in v1
6. Panel tests proving the property inspector hides direct action tabs and shows
   Recent Activity configuration only for property rows.
7. Live HA validation using a property, a descendant exterior/pathway lighting
   rule, and both event orderings: sunset after activity and activity after
   sunset.

## Alternatives Considered

- Long occupancy timeout on the property: rejected because it changes the
  meaning of occupancy and pollutes rollups/vacancy logic.
- Building/grounds/floor activity windows in v1: rejected as premature. The
  first supported concept is site-level recent use.
- Area activity windows: rejected because room-level occupancy already has
  source hold times and adding a second similar state would blur the model.
- Property-level Lighting/Appliances/Media/HVAC/Vacuum tabs: rejected for v1.
  The property is context; concrete descendant locations own controllable
  devices.
- Appliance/Media/HVAC/Vacuum consumption of property activity in v1: rejected
  for now. Cabin equipment workflows are plausible but higher risk and need a
  separate safety-oriented design.
- A generic rule-logic builder for activity: rejected for v1. A rule-level
  "Require property activity" option covers the motivating workflow while
  preserving the focused Lighting editor.
