# Wasp in a Box for Home Occupancy

**Status**: Draft (Design White Paper)  
**Date**: 2026-03-01  
**Scope**: Occupancy determination and management patterns for TopoMation

## 1. Executive Summary

"Wasp in a box" is a bounded-space occupancy pattern: if you can reliably observe boundary crossings (entry/exit) and interior activity, you can infer occupancy with much higher stability than motion-only automations.

For TopoMation, this paper proposes:

- A zone-level occupancy state machine (`occupied`, `vacant`) with deterministic transitions.
- Boundary-first reasoning for transitions and interior signals for persistence/decay.
- Cross-zone handoff logic so adjacent locations/areas can transfer occupancy deterministically.
- Strict separation between topology data, occupancy inference, and automation policy.
- UI/UX that exposes reasons and evidence so users trust the system.
- A "magic areas" inspired layer for context-aware area behavior and whole-home orchestration.

## 2. Problem Statement

Most home occupancy automations fail in one or more ways:

- False vacant: lights/HVAC turn off while someone is still present.
- Sticky occupied: rooms remain occupied long after departure.
- Signal conflict: different sensor types produce inconsistent behavior.
- Opaque behavior: users cannot tell why occupancy changed.

A robust model must be deterministic, conservative about vacancy, and explainable end-to-end.

## 3. Goals and Non-Goals

### Goals

- Provide stable occupancy per location with low oscillation.
- Minimize false vacant outcomes (human comfort first).
- Normalize heterogeneous sources under one event contract.
- Support adjacency-aware occupancy transfer across neighboring locations/areas.
- Preserve manual control and lock semantics for policy workflows.
- Make decisions observable (reason strings and event timeline).

### Non-Goals

- Perfect human presence detection in all environments.
- Identity tracking (which person is present).
- Replacing HA automations; occupancy should be a reusable signal layer.

## 4. Core Concepts

### 4.1 Wasp-in-Box Model

A "box" is a bounded location with known edges and crossing points:

- `interior`: sensors that indicate activity in the zone.
- `boundary`: sensors/events that indicate potential entry/exit.
- `adjacency`: neighboring zones connected by boundaries.

If a location is bounded well enough, occupancy can be inferred through transitions, not just motion pulses.

### 4.2 Topology vs Inference vs Policy

- **Topology layer**: structural facts (zone graph, boundaries, sensor placement, adjacency).
- **Occupancy engine**: state machine, timeout policy, conflict handling.
- **Policy/automation layer**: what to do when occupancy changes (lights, media, HVAC, security).

This split keeps structure stable and behavior tunable.

### 4.3 State Contract

Each location exposes:

- `state`: `occupied | vacant`
- `reason`: short explanation string
- `updated_at`: timestamp
- `evidence`: optional recent evidence list for debugging

### 4.4 Adjacency Contract

Each boundary edge between two locations/areas should declare:

- `from_location_id`, `to_location_id`
- `boundary_type` (door, archway, corridor, stair, virtual transition)
- `directionality` (`bidirectional` or directed)
- `crossing_sources` (sensors/events that can confirm transfer)
- `handoff_window_sec` (max time between exit-evidence in A and entry-evidence in B)

This allows deterministic handoff reasoning between adjacent locations, not only isolated room inference.

## 5. Design Principles

1. Occupied fast, vacant slow: enter quickly, clear conservatively.
2. Boundary signals are high-value evidence in enclosed spaces.
3. Vacant requires stronger proof than occupied.
4. Contradictory evidence should preserve current state until clear evidence arrives, not toggle rapidly.
5. Manual overrides are first-class and time-bound by default.
6. Keep inference deterministic with asymmetric timers and explicit guard rules.
7. Always keep an explanation path for every state transition.
8. Treat adjacent-zone handoff as a first-class transition, not a side effect.

## 6. Reference Inference Pattern

### 6.1 Inputs

- Boundary events: door contact, beam break, hallway crossing, geofenced transitions.
- Interior events: motion, mmWave, pressure, power/activity proxies.
- Global context: home mode (`home`, `away`, `sleep`, `guest`, `vacation`), lock state.

### 6.2 State Machine (Per Location)

- `vacant`
- `occupied`

Transitions are event-driven with hysteresis and timers:

- `vacant -> occupied`: strong boundary+interior evidence or direct interior trigger.
- `occupied -> vacant`: explicit exit evidence or prolonged no-activity timeout.
- `occupied(A) + crossing(A->B) -> occupied(B)`: adjacency handoff path with optional temporary overlap.

### 6.3 Timer and Evidence Heuristics

Occupancy remains binary; stability comes from timer policy and evidence quality:

- Enter quickly on strong evidence (entry + interior activity).
- Clear conservatively with asymmetric vacant delays.
- Penalize stale/offline critical sensors by extending vacant timers or requiring corroboration.
- Use per-zone profile defaults (hallway short, bedroom longer, etc.).

### 6.4 Wasp-in-Box Rules (Illustrative)

- Door closes, then interior activity within N seconds: strong occupied assertion.
- Door opens+closes with no exit evidence: keep occupied, start conservative decay.
- Confirmed exit boundary + no interior activity for M seconds: transition to vacant.
- Simultaneous conflicting events: keep current state and wait for next decisive event.

### 6.5 Adjacent Location and Area Handoff

When a crossing between adjacent nodes is detected:

1. Emit provisional exit-evidence for source node A and provisional entry-evidence for destination node B.
2. Start `handoff_window_sec` for B confirmation.
3. If B interior/boundary confirmation arrives in window:
   quickly vacate A (or start short trailing timeout) and assert occupied on B.
4. If B confirmation does not arrive:
   keep A occupied and cancel B provisional occupancy.

Recommended behavior:

- Allow brief dual-occupancy overlap during transfer to avoid false vacant flicker.
- Prefer corridor/hallway transit profiles for short-duration occupancy.
- For area-level aggregation, treat handoff as movement of occupancy mass through the adjacency graph, not independent random toggles.

## 7. Magic Areas Mapping

"Magic Areas" is useful as a conceptual layer for context-aware zones and aggregate behavior. For TopoMation, the recommended adaptation is:

1. Area semantics: rooms behave differently by function (bedroom vs hallway vs garage).
2. Area aggregation: parent occupancy derives from child states and weighting rules.
3. Context profiles: occupancy thresholds/timers vary by mode (`sleep`, `away`, etc.).
4. Presence classes: support direct-presence sensors differently from activity proxies.
5. Neighborhood behavior: adjacent areas participate in context-aware handoff and pre/post occupancy weighting.

Practical alignment:

- Keep zone logic explicit in TopoMation, but allow mode/profile overlays inspired by "magic" behavior.
- Keep all derived decisions explainable; avoid hidden heuristics users cannot inspect.

## 8. Recommended Design Patterns

1. Finite State Machine per location (explicit transitions, guards, entry/exit actions).
2. Evidence pipeline (normalize events before transition evaluation).
3. Source profiles (motion, presence, contact, media, power each with tuned defaults).
4. Event-sourced transition log (why state changed, with evidence snapshot).
5. Policy locks (freeze, block occupied, block vacant) as separate control-plane concerns.
6. Deterministic IDs and idempotent updates for replay-safe processing.
7. Graceful degradation when sensor health drops (bias to current occupied state + conservative vacate).
8. Cross-zone handoff queue keyed by boundary edge + time window.

## 9. UI/UX Guidance

### 9.1 Occupancy Surfaces

For each location card/inspector:

- Primary state chip: `Occupied` or `Vacant`.
- Reason text: `Occupied: motion 42s ago, door closed`.
- Last transition timestamp and timeout countdown (if active).

### 9.2 Debuggability

- Timeline view of recent evidence and transitions.
- Sensor health badges (`ok`, `stale`, `offline`, battery warning).
- Explicit conflict indicator when evidence disagrees.
- "Why" action that reveals the exact transition rule and inputs.
- Cross-zone trace view: `A -> boundary -> B` with timestamps and rule outcomes.

### 9.3 Manual Control

- One-tap override: `Force Occupied`, `Force Vacant`.
- Require override TTL (with optional "until canceled").
- Clear visual marker when overrides/locks are active.
- Scope controls (`self`, `subtree`) for operational workflows.

### 9.4 Human-Factors Defaults

- Bias toward comfort (avoid premature vacant actions).
- Avoid rapid visual state flapping.
- Use consistent language: "occupied/vacant" across UI, events, and services.

## 10. Topology Design (What Goes in Topology)

Topology should hold durable, structural truth that the occupancy engine can consume. It should not contain mutable inference behavior.

### 10.1 Required Topology Objects

- `Location`: stable node identity (`id`, `type`, `name`, `parent_id`) and optional HA links.
- `AdjacencyEdge`: explicit connection between two locations/areas.
- `Boundary`: physical or logical crossing point attached to an adjacency edge.
- `SensorBinding`: mapping from sensor/entity to location and signal capabilities.
- `ZoneProfileRef`: optional reference to intended zone class (`hallway`, `bedroom`, `bathroom`, `garage`) for defaults selection.

### 10.2 Boundary and Adjacency Model

Each adjacency edge should be first-class data, not implied by tree parentage.

Recommended fields:

- `edge_id`
- `from_location_id`
- `to_location_id`
- `directionality` (`bidirectional`, `a_to_b`, `b_to_a`)
- `boundary_type` (`door`, `archway`, `corridor`, `stairs`, `virtual`)
- `crossing_sources` (sensor/entity IDs that can confirm crossing)
- `handoff_window_sec`
- `priority` (tie-breaker when multiple candidate paths exist)

Illustrative JSON shape:

```json
{
  "edge_id": "edge_living_hall_door",
  "from_location_id": "area_living_room",
  "to_location_id": "area_hallway",
  "directionality": "bidirectional",
  "boundary_type": "door",
  "crossing_sources": ["binary_sensor.living_hall_door", "binary_sensor.hall_beam"],
  "handoff_window_sec": 12,
  "priority": 50
}
```

### 10.3 Sensor Binding Model

Topology should express where sensors are and what they can assert, without embedding transition logic.

Recommended fields:

- `entity_id`
- `location_id`
- `role` (`interior`, `boundary`, `global_policy`)
- `capabilities` (`trigger`, `clear`, `crossing`, `presence`, `activity`)
- `reliability_class` (`high`, `medium`, `low`) for downstream policy tuning

### 10.4 Topology Invariants

- Adjacency edges may connect siblings, cousins, or parent/child nodes when physically valid.
- Parent hierarchy is organizational; movement handoff uses adjacency graph first.
- Boundary-edge definitions must be deterministic and replay-safe (stable IDs).
- No implicit auto-generated edges unless explicitly marked and user-visible.
- Multi-path adjacency requires deterministic tie-break rules (`priority`, recency, strongest boundary evidence).

### 10.5 Explicitly Out of Topology

- Occupancy transition rules.
- Conflict-resolution heuristics.
- Automation effects (lights/HVAC/security actions).
- User policy locks and mode-specific action outcomes.

Rationale: topology is durable structure; occupancy logic is tunable domain behavior.

## 11. Validation and Metrics

Evaluate with scenario tests and live telemetry:

- False vacant rate (critical).
- Time-to-occupied after true entry.
- Sticky occupied duration after true exit.
- Handoff success rate for adjacent transfers.
- Override frequency (proxy for trust/usability).

Minimum validation set:

1. Single-entry room with one motion sensor.
2. Adjacent room handoff through one shared door.
3. Multi-entry area with conflicting signals.
4. Sleep mode (low-motion occupants).
5. Away mode lock workflows.
6. Partial sensor outage.

## 12. Implementation Goals for TopoMation

Phase-oriented goals:

1. Keep occupancy binary (`occupied`/`vacant`) and align with core occupancy ADRs.
2. Add boundary metadata in topology config/API.
3. Implement adjacency-aware handoff helpers in occupancy domain layer.
4. Implement wasp-in-box transition helpers per location profile.
5. Add explainability payloads (`reason`, evidence IDs) to occupancy events.
6. Build inspector timeline and handoff trace UI.
7. Add mode/profile overlays inspired by magic-area behavior.

### 12.1 Current TopoMation Design Contract

The current implementation uses WIAB presets in occupancy module config:

- `off`
- `enclosed_room`
- `home_containment`
- `hybrid`

Preset behavior is implemented in the integration inference layer (event bridge),
not in topology storage:

- `enclosed_room`: interior trigger + door-close latch (`block_vacant`) until door-open release.
- `home_containment`: interior trigger latches home occupancy until exterior-door release.
- `hybrid`: applies both models for mixed spaces.

Topology remains responsible for structural truth:

- location hierarchy
- adjacency edges and boundary metadata
- crossing-source wiring

Occupancy/WIAB remains responsible for inference behavior:

- trigger/clear lock semantics
- hold/release timing
- deterministic transition reasoning

## 13. Risks and Mitigations

- Overfitting to one home layout: use source profiles + per-zone tuning.
- Hidden complexity: keep transition logs and rule names visible.
- Sensor drift/failures: health-aware guard rules and conservative vacant timers.
- User confusion: consistent terminology and transparent reason strings.

## 14. Open Decisions

1. Standard boundary schema in API contracts.
2. Parent rollup semantics during rapid adjacent handoffs.
3. Ambiguous path resolution when one source node has multiple adjacent candidates.
4. Default timers by zone type (`hallway`, `bedroom`, `bathroom`, `garage`).
5. Which mode overlays are first-class in v1 (`sleep`, `away`, `guest`).

## 15. Conclusion

Wasp-in-box is a practical path to reliable occupancy for real homes. Combined with explicit topology, explainable inference, and policy separation, it can deliver occupancy that is both stable for automation and understandable for users. "Magic areas" concepts should inform context and aggregation behavior, while TopoMation retains deterministic contracts and transparent reasoning.
