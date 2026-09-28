# ADR-HA-099: Scene Action Tab

**Date**: 2026-09-28
**Status**: APPROVED

## Context

Home Assistant scenes are `scene.*` entities. Activating one is `scene.turn_on`.
There is no general "turn this scene off" service: leaving a room is done by
activating a different scene, which also lets Zigbee scenes run on the devices
instead of turning each light on one by one.

Occupancy sources on a subarea can name an entity that remains assigned to the
parent area. Those signals were previously delivered only to the mapped area, so
a subarea source could stay vacant while its sensor was on.

## Decision

1. Add a **Scenes** action tab on the same locations that expose Lighting,
   Appliances, Media, HVAC, and Vacuum. Property rows stay free of direct
   action tabs.
2. A scene rule has one occupancy edge (`Room becomes occupied` or `Room becomes
   vacant`), an optional time window, and one scene target.
3. The only command is **Activate** (`scene.turn_on`), including on vacancy.
4. The picker lists every visible `scene.*` entity, including scenes with no
   Home Assistant area.
5. Occupancy signals are delivered to every location that lists the entity in
   `occupancy_sources`, not only the location returned by area mapping.

## Consequences

- A room can activate one scene when occupied and another when vacant.
- A presence sensor assigned to a parent area can hold a subarea that lists it
  as an occupancy source.
- An already-on source still waits for a fresh off-to-on edge after it is added
  or after an explicit vacate.
