# Setting Up Test Topology

This guide reflects the current wrapper policy:

- Floor/area lifecycle is managed in Home Assistant menus.
- WebSocket lifecycle mutation commands are blocked by design.
- Topology drag-and-drop reorder is allowed for hierarchy overlay and floor sync.

## Recommended HA Test Structure

```
Main Building
├── Ground Floor
│   ├── Living Room
│   ├── Kitchen
│   └── Hallway
├── First Floor
│   ├── Main Bedroom
│   └── Guest Bedroom
└── Basement
    └── Garage

Grounds
├── Patio
└── Driveway
```

## 1) Create Floors and Areas in Home Assistant

1. Open **Settings -> Areas, labels & zones**.
2. Create floors (for example: `Ground Floor`, `First Floor`).
3. Create areas and optionally assign each area to a floor.
4. Assign test entities to those areas (motion sensors, lights, media players).

## 2) Import Into Topomation

Use either option:

1. Reload/restart the Topomation integration.
2. Or trigger sync import via WebSocket:

```json
{
  "id": 1,
  "type": "topomation/sync/import"
}
```

## 3) Validate Baseline in UI/Mock

1. Open the Topomation panel.
2. Confirm floors and areas appear as wrapper locations (`floor_<id>`, `area_<id>`).
3. Add integration-owned roots such as `Main Building` (`type=building`) and `Grounds` (`type=grounds`) if needed.
4. Confirm area-linked entities are attached to the expected area locations.
5. Optionally create `subarea` nodes below HA-backed areas (for example `Kitchen -> Pantry`).

## 4) Validate Overlay Reorder Behavior

Run these checks in the panel:

1. Drag an HA-backed area under a different floor (inside the same building subtree).
2. Confirm reorder succeeds and persists in topology.
3. Confirm HA `area.floor_id` changes to the new nearest floor ancestor.
4. Drag the same area under `Grounds` or to root (no floor ancestor).
5. Confirm HA `area.floor_id` is cleared (`null`) when no floor ancestor exists.
6. Confirm integration-owned roots (`building`, `grounds`) remain root-level.

## 5) Validate HA Source-of-Truth Sync

In HA menus:

1. Rename a floor or area and confirm topology name updates.
2. Move an area to a different floor and confirm topology parent updates.
3. Delete an area/floor and confirm wrapper location updates accordingly.

## 6) Quick Contract Sanity Check

These should be true in tests/manual validation:

1. `locations/create|update|delete` return `operation_not_supported`.
2. `locations/reorder` succeeds for allowed moves.
3. `sync/enable` rejects HA-backed locations.
4. No synthetic `house` root appears.
5. Integration-owned `building`/`grounds` nodes can host HA areas and `subarea` descendants.
