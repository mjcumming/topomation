# Wasp-in-Box Implementation Plan (TopoMation)

**Date**: 2026-03-01  
**Status**: Active implementation guidance (Phase 1 shipped)

## 1. Goal

Use Home Topology adjacency primitives to make occupancy handoff deterministic
across neighboring locations while keeping occupancy state binary
(`occupied`/`vacant`).

## 2. Architecture Mapping

- **Home Topology core**:
  - Stores adjacency edges (`AdjacencyEdge`) as durable topology.
  - Enforces structural validation and emits adjacency events.
- **TopoMation integration backend**:
  - Exposes adjacency CRUD over WebSocket.
  - Persists/restores edges in integration storage.
  - Keeps occupancy logic separate from topology data.
- **TopoMation frontend**:
  - Visual editor for adjacency in the location inspector.
  - Shows neighbor, boundary type, directionality, and handoff settings.

## 3. UI/UX Design Principles

- Keep adjacency editing in context: users edit edges while viewing a location.
- Prefer explicit relationships over inferred graph edges.
- Show simple defaults first:
  - `Door`
  - `Two-way`
  - `12s` handoff window
  - `priority=50`
- Minimize cognitive load:
  - One row per connected edge.
  - Compact metadata summary.
  - One-click remove.
- Preserve explainability:
  - Crossing sources are visible and editable.
  - Direction is shown relative to current location (`Inbound`/`Outbound`/`Two-way`).

## 4. Implementation Status

### 4.1 Shipped in TopoMation

1. Topology edge CRUD in integration WebSocket contract.
2. `adjacency_edges` included in `topomation/locations/list`.
3. Inspector adjacency editor (create/remove + edge metadata).
4. Event bridge emits adjacency-driven provisional handoff triggers.
5. Inspector handoff trace panel for runtime diagnostics.
6. Detection tab WIAB preset editor:
   - `Enclosed Room (Door Latch)`
   - `Home Containment`
   - `Hybrid`
7. WIAB runtime now uses occupancy lock/trigger/clear primitives:
   - door-close latch and door-open release for enclosed spaces
   - interior-trigger latch and exterior-door release for home containment

### 4.2 Next Iteration

1. Add richer WIAB traces in dedicated timeline cards (beyond handoff-style diagnostic payloads).
2. Add preset templates tied to location class (`bathroom`, `bedroom`, `entryway`, `whole_home`).
3. Add rule explanation strings surfaced directly in location runtime status.

## 5. Guardrails

- Do not add confidence scoring.
- Do not add implicit edge auto-discovery in v1.
- Do not collapse topology and occupancy inference layers.
