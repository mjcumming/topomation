# Ideas

**Last updated**: 2026-04-27
**Purpose**: parking lot for promising product/architecture ideas that are not
ready to become contracts, ADRs, or implementation issues.

This file is intentionally lightweight. Capture the thought, why it might
matter, what could go wrong, and what would prove it. When an idea becomes
real work, promote it to one of:

- `docs/adr-log.md` for a durable architecture/product decision
- `docs/contracts.md` for runtime/UI behavior that must not regress
- `project/issues/` for scoped implementation with acceptance criteria
- `docs/current-work.md` when it becomes active handoff/status context

## Status Labels

- `Parked`: worth remembering, not ready to design.
- `Candidate`: probably useful, needs a concrete proposal.
- `Needs validation`: implemented or designed in theory, but not trusted until
  tested on live Home Assistant.
- `Promoted`: moved into ADR/contract/project issue.
- `Rejected`: considered and explicitly set aside.

## Ideas

### Settings, Defaults, Diagnostics, and Repair Surface

**Status**: Candidate

Topomation has many local configuration surfaces, but no coherent admin plane
for site defaults, migrations, resets, diagnostics, or repairs.

Possible shape:

- Keep inherited behavior defaults on the visible property row first.
- Add a dedicated Settings/Repairs page only for installation-level concerns
  that are not naturally owned by a location.
- Separate release plumbing, such as one-time migrations, from ordinary user
  settings.

Candidate capabilities:

- Default ambient thresholds for new/default-looking locations.
- Default occupancy source profiles by entity class.
- Reset current location, subtree, or all default-looking configs.
- Migration status/history.
- Repairs for missing automation include, stale managed shadows, orphaned
  entities, invalid configs, missing lux sensors, or unavailable runtime state.
- Diagnostics for why a rule/source/location made a decision.

Open questions:

- Should the first version be a property-row "Defaults" section rather than a
  global settings page?
- Which settings are inherited behavior versus installation preferences?
- How do we prevent a second settings surface from hiding behavior that should
  be visible on the location itself?

### Ambient Lux Sensor Contamination by Controlled Lights

**Status**: Candidate

Indoor illuminance sensors can be contaminated by lights in the same area. If
Topomation turns a room light on, the room lux sensor may report "bright" even
though natural ambient light is still low. That can make dark/bright automations
misread the room.

Possible behavior:

- When configured lights in a location are on, mark the location's direct
  indoor lux reading as contaminated for ambient-state decisions.
- Prefer an uncontaminated inherited/property/exterior lux source when
  available.
- Otherwise hold the last known clean lux value for a bounded time, or report
  the ambient state as "estimated" with clear diagnostics.

Things to avoid:

- Blindly ignoring lux whenever any light is on, because that can freeze stale
  darkness all evening.
- Treating non-light devices or unrelated area lights as contaminating without
  an explicit relationship.
- Creating hidden feedback loops where a light turns on, lux becomes ignored,
  and the rule can never observe a true bright state.

Questions to answer:

- Which light domains/entities count as contaminating a lux sensor: all in-area
  lights, only Topomation-managed targets, or user-selected contaminators?
- Should contamination be per sensor, per location, or inherited?
- How long can a held clean reading remain trustworthy?
- Should rules see a three-state source quality: `clean`, `contaminated`,
  `unavailable`?

Validation idea:

- Create a live HA scenario with an indoor lux sensor and one controlled light.
  Confirm that turning the light on does not immediately make a dark room behave
  like daylight, while true daytime/exterior brightness still turns off
  dark-only behavior.

### Wasp In A Box Live Validation

**Status**: Needs validation

WIAB has design and implementation structure, but it has not been proven in a
real home workflow. Treat it as experimental until live validation records
success and failure modes.

Needed proof:

- Door/contact plus motion/presence scenarios on real entities.
- Expected behavior when a door opens after a long hold.
- Expected behavior when a room starts occupied, HA restarts, then source state
  resumes.
- Diagnostics that explain why WIAB is holding or releasing occupancy.

### Time Window Defaults

**Status**: Parked

Some time controls default to evening-oriented values, such as 18:00. That may
make sense for lighting examples, but it is odd as a general time-slicer
default.

Possible rule:

- Neutral time window controls should default to disabled/all-day.
- If a default time is required, use current time rounded to a clean boundary or
  a domain-specific preset that is visibly named.

