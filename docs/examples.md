# TopoMation Examples

These examples are meant to show where TopoMation starts to pay for itself: real-house cases where occupancy is useful, but a single room, single motion sensor, or hand-built automation pattern gets awkward.

Start small. Pick one boring room, one occupancy source, and one simple rule before modeling the whole house.

## Closet light

**Problem:** A closet should turn on quickly and turn off after a short delay, without adding extra logic to the parent bedroom.

**Setup:**

- Add the closet as a `subarea` under the bedroom.
- Use the closet motion sensor as the occupancy source.
- Set a short occupied hold, such as 3-5 minutes.
- Add lighting rules for occupied -> on and vacant -> off.

**Why TopoMation helps:** The closet can behave like its own tiny room while still rolling up into the bedroom, floor, building, and property occupancy sensors.

## Bathroom with no dedicated occupancy sensor

**Problem:** The bathroom has a light switch and exhaust fan, but no separate motion or presence sensor.

**Setup:**

- Use the bathroom light switch's `on` state as an occupancy source.
- Give it a practical hold time, such as 20 minutes.
- Add a vacant rule to turn off the exhaust fan.
- Add a vacant lighting rule if the light should be managed automatically.

**Why TopoMation helps:** The switch interaction becomes a useful signal. You can automate the fan and vacancy behavior without installing more hardware first.

## Pantry or utility room

**Problem:** A pantry, laundry nook, or storage room needs fast response and a short timeout. Long room-level delays feel wrong.

**Setup:**

- Add the space as a `subarea` under the nearest room or floor.
- Use a door contact, motion sensor, or switch state as the occupancy source.
- Use a short hold, such as 30 seconds to 2 minutes.
- Add simple occupied/vacant lighting rules.

**Why TopoMation helps:** Small spaces can have their own timing without making the larger room's automation more complicated.

## Open-plan kitchen and family room

**Problem:** The kitchen and family room are separate Home Assistant areas, but people move through them like one shared living space.

**Setup:**

- Keep the kitchen and family room as separate locations.
- Put both locations in an occupancy group at their shared parent.
- Keep per-room lighting or media rules where needed.

**Why TopoMation helps:** The rooms can share occupancy while still keeping their own devices, rules, and names.

## Bedroom with motion and presence

**Problem:** Motion is good for quick entry detection, but a presence sensor or media player is better for holding occupancy while someone is still.

**Setup:**

- Add the motion sensor as one occupancy source with a normal hold time.
- Add the mmWave / presence sensor as another source, optionally holding until it reports clear.
- Optionally add a media player or bedside switch state as an additional signal.
- Let the room stay occupied while any source is still holding.

**Why TopoMation helps:** Each source has its own timing. Motion can be quick, presence can be sticky, and the room only goes vacant after all sources clear.

## Wasp-in-a-box room

**Problem:** A small room with a door and interior sensor should not go vacant just because motion goes quiet.

**Setup:**

- Assign the room's door contact and interior sensor.
- Enable wasp-in-a-box inference for the location.
- Tune the hold and vacant delays to match the room.

**Why TopoMation helps:** Door open/close events can act like boundary crossings, so the room can stay occupied while someone is inside but still.

## Floor-level or building-level device

**Problem:** Some devices belong to a floor, building, or property rather than a single room: a whole-house fan, alarm panel, hallway lighting group, or shop building load.

**Setup:**

- Add the structural level that matches the device: `property`, `building`, `floor`, or `grounds`.
- Assign the device to that location.
- Use the location's occupancy entity or managed rules to drive common behavior.

**Why TopoMation helps:** The device lives where it conceptually belongs, and the occupancy signal comes from the whole subtree beneath it.

## Outdoor and grounds automation

**Problem:** Driveway, porch, yard, and pool equipment often sit outside the room/floor mental model.

**Setup:**

- Add a `grounds` location under the property.
- Add outdoor areas such as driveway, porch, yard, or pool.
- Assign compatible sensors, lights, switches, or vacuum-style targets.
- Use occupancy and ambient-light rules where they make sense.

**Why TopoMation helps:** Outdoor spaces become part of the same model as the house, so "anyone outside" can be a real Home Assistant entity and outdoor rules do not need to be special one-off automations.

## Party or maintenance lock

**Problem:** Sometimes occupancy automation should pause: lights should stay on during a gathering, or a room should stop reacting while you test hardware.

**Setup:**

- Use the lock icon on a location row to freeze that location and its descendants.
- Or use the `switch.<location>_lock` entity from a Lovelace card, scene, voice routine, or normal HA automation.
- Unlock from the tree or switch when normal behavior should resume.

**Why TopoMation helps:** You can hold automation state at the level that matches the situation: one room, a floor, a building, or the whole property.

