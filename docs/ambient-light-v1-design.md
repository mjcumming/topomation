# Ambient Light v1 Design Guide

**Last reviewed**: 2026-03-03  
**Purpose**: define a practical, low-complexity ambient-light plan before coding dusk/dawn or advanced lighting behaviors.

## 1. Why this doc exists

Ambient support already exists in backend module wiring and WebSocket APIs, but it is not currently surfaced as a first-class user workflow in the panel. This guide defines a constrained v1 that is useful in real homes without forcing per-room sensor sprawl.

## 2. Product goals

1. Deliver useful ambient-aware behavior with one primary sensor (typically outdoor/roofline).
2. Keep configuration simple and transparent so users can explain "why it thinks dark."
3. Avoid oscillation and brittle automations caused by cloud noise or sensor dropouts.
4. Preserve an upgrade path to richer dusk/dawn and brightness actions later.

## 3. Non-goals (v1)

1. No multi-sensor fusion algorithm (weighted averages, voting, etc.).
2. No per-room ML/adaptive circadian modeling.
3. No large new rule engine for time blocks.
4. No requirement to create many ambient entities in HA.

## 4. Baseline in current code

1. Ambient module is loaded with occupancy/automation modules in integration setup.
2. Ambient APIs already exist:
   - `topomation/ambient/get_reading`
   - `topomation/ambient/set_sensor`
   - `topomation/ambient/auto_discover`
3. Sensor platform currently publishes no entities; binary sensor platform is occupancy-only.
4. Managed action contract currently treats lux/ambient guards as future enhancement.

## 5. v1 behavior model

### 5.1 Sensor model

1. Default recommendation: configure one primary ambient sensor at `building` (or `grounds`).
2. Child locations inherit by default.
3. Optional per-location override is supported but not required.

### 5.2 Dark/bright classification

1. Use two thresholds (hysteresis):
   - `dark_threshold`
   - `bright_threshold` (`bright_threshold > dark_threshold`)
2. Classification:
   - dark when lux `< dark_threshold`
   - bright when lux `> bright_threshold`
   - in-between region keeps prior state (prevents chatter)
3. Add dwell/debounce window before state flip (default 180s) to smooth cloud flicker.
4. Architecture supports per-location dwell/debounce with inheritance from parent/global defaults.
5. v1 UI does not need to expose per-location dwell/debounce controls yet.

### 5.3 Fallback policy

1. If effective lux sensor is unavailable, fall back to `sun.sun` when enabled.
2. If sun fallback is disabled, use explicit safety default (`assume_dark_on_error`).
3. Always expose fallback method in diagnostics/UI.

### 5.4 Transparency requirements

Ambient UI should show:

1. Effective lux value
2. Effective `is_dark` and `is_bright` results
3. Source sensor entity ID
4. Source location (local vs inherited)
5. Fallback method (none/sun/assume-dark/assume-bright)
6. Thresholds in effect

## 6. UX scope for v1

Add an `Ambient` section in the location inspector (no dusk/dawn action tab yet):

1. Read-only status card:
   - current lux/state/source/fallback
2. Config card:
   - selected sensor (or Auto)
   - inherit from parent toggle
   - dark threshold / bright threshold
   - fallback to sun toggle
   - assume dark on error toggle
3. Utility actions:
   - run auto-discover
   - refresh reading

Auto-discover intent (v1):

1. This is a helper to find likely lux sensors from mapped entities so users do not have to type entity IDs.
2. It should be explicit/manual (button-driven), not a hidden background mutation loop.
3. Prefer one-time assignment of a primary sensor (usually at `building`/`grounds`) over per-room auto-binding.

Design intent:

1. Make debugability first-class before automation coupling.
2. Let users validate ambient quality before relying on it for action triggering.

## 7. Technical implementation plan

### Phase A: expose ambient read path in panel

1. Add frontend ambient types for reading payload.
2. Add WS client calls for ambient commands.
3. Render inspector ambient status card with manual refresh.

### Phase B: config controls

1. Persist ambient config through existing `locations/set_module_config`.
2. Add sensor selector + override/inheritance toggles.
3. Add threshold/fallback controls with validation:
   - `dark_threshold >= 0`
   - `bright_threshold > dark_threshold`

### Phase C: stability guardrails

1. Add dwell/debounce config key (default 180s) in ambient module config.
2. Keep key per-location with inheritance semantics in backend model.
3. Do not expose dwell/debounce in v1 inspector controls unless needed after field testing.
4. Ensure classification logic applies hysteresis + dwell.
5. Add tests for noisy lux around threshold boundaries.

### Phase D (separate feature): action coupling

1. Introduce ambient-aware triggers/conditions for managed actions only after A-C are stable.
2. Keep dusk/dawn and brightness policies out of this v1 ambient foundation doc.

## 8. Proposed v1 acceptance criteria

1. User can configure one building-level lux sensor and see inherited readings in child rooms.
2. UI always explains whether reading is local, inherited, or fallback-derived.
3. No dark/bright flapping under rapid lux noise near threshold in tests.
4. If sensor fails, behavior follows explicit fallback policy and remains visible.

## 9. Risks and mitigations

1. Risk: indoor sensor contaminated by controlled lights.
   - Mitigation: recommend outdoor primary sensor in UI copy; show source clearly.
2. Risk: cloudy-day flapping.
   - Mitigation: hysteresis + dwell.
3. Risk: stale docs from legacy ambient-entity design.
   - Mitigation: keep this document aligned with `docs/contracts.md` and `docs/architecture.md` in same PRs.

## 10. Decisions confirmed (2026-03-03)

1. Debounce/dwell model: per-location in architecture, inheritable defaults; not required in v1 UI.
2. State visibility: show both `is_dark` and `is_bright`.
3. Auto-discover: keep as explicit/manual helper action, not default background behavior across all locations.

## 11. Remaining open decisions

1. Should manual auto-discover be available on all locations or only on `building`/`grounds` in v1 UI?
2. If auto-discover finds multiple candidates, should v1 pick first deterministically or require explicit user selection?

## 12. Working agreement for implementation

1. Keep v1 small: ambient observability/config first, no dusk/dawn coupling.
2. Update contracts and ADR only when behavior changes are committed.
3. Validate in both mock frontend tests and live HA manual checks before release.
