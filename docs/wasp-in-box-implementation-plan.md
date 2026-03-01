# Wasp-in-Box Implementation Plan (TopoMation)

**Date**: 2026-03-01  
**Status**: Draft implementation guidance

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

## 4. Near-Term Implementation Sequence

1. Topology edge CRUD in integration WebSocket contract.
2. Include `adjacency_edges` in `locations/list`.
3. Inspector adjacency editor (create/remove, key metadata).
4. Occupancy engine handoff helper consumes adjacency graph.
5. Add handoff trace UI in occupancy timeline (future).

## 5. Guardrails

- Do not add confidence scoring.
- Do not add implicit edge auto-discovery in v1.
- Do not collapse topology and occupancy inference layers.
