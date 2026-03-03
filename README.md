# TopoMation

![TopoMation logo](custom_components/topomation/brand/logo.png)

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Installations](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fanalytics.home-assistant.io%2Fcustom_integrations.json&query=%24.topomation.total&label=installs&color=41BDF5&logo=home-assistant&cacheSeconds=3600)](https://analytics.home-assistant.io/custom_integrations.json)
[![GitHub Release](https://img.shields.io/github/release/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/mjcumming/topomation/frontend-tests.yml?branch=main&label=CI)](https://github.com/mjcumming/topomation/actions/workflows/frontend-tests.yml)
[![License](https://img.shields.io/github/license/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/blob/main/LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](https://github.com/mjcumming/topomation)

**Whole-home occupancy automation for Home Assistant — without the spaghetti.**

TopoMation replaces dozens of per-room automations with a single, visual approach: model your home as a tree, assign sensors and devices, and define "when occupied / when vacant" rules — all from a point-and-click UI. Every rule becomes a native Home Assistant automation, fully visible in traces and logs. No black box. No YAML. No hunting for entity IDs.

---

## The Problem

Anyone who's tried to wire up occupancy-driven lighting across an entire home knows how it goes:

- **Automation sprawl.** One automation per room, per condition, per time of day. Multiply by every room in the house. Good luck maintaining that.
- **Sensor chaos.** Motion detectors, door sensors, mmWave presence, device trackers — they all behave differently and nothing synthesizes them into a single "is someone here?" answer.
- **Invisible logic.** Other presence solutions can work, but often hide their decision-making. When something misfires at 2 AM, you're reverse-engineering someone else's state machine.
- **No spatial model.** Home Assistant gives you areas and floors, but no real hierarchy. There's no concept of "the pantry is *inside* the kitchen" or "indoor vs. outdoor."

## What TopoMation Does About It

TopoMation solves this in two moves:

**1. You model your home as a tree.** A real hierarchy: buildings, grounds, floors, areas, and subareas (closets, nooks, pantries). The tree is fully drag-and-drop — grab a room and move it under a different floor, nest a closet inside a bedroom, reorganize your entire layout without breaking a single automation. Assign sensors and devices to their locations. The tree becomes your single source of truth for what's where.

**2. You automate from that tree.** For each location, you configure detection sources and define *On Occupied* / *On Vacant* actions. Pick devices from a dropdown — no entity IDs. Set timeouts in the UI — no YAML. TopoMation generates native HA automations that show up in **Settings → Automations & Scenes**, appear in traces and logs, and remain fully editable. You always know what's running and why.

**And the tree shows you what's happening right now.** Every node in the tree displays its live occupancy state — occupied, vacant, or locked. Occupancy propagates up the hierarchy, so a single glance at a floor node tells you whether anyone is on that floor. Expand to see exactly which rooms. It's your whole-home occupancy dashboard and your automation management surface in one view.

---

## Key Capabilities

### One Occupancy Signal Per Location
Multiple sensor types — motion, door contacts, mmWave presence, device trackers, media players — are fused into a single `binary_sensor` per location. Each source has configurable semantics: does it *trigger* occupancy or *clear* its own contribution (immediate or trailing)? You decide. The result is stable, predictable occupancy that reflects how the room actually works.

### Configurable Timeouts
Set per-location timeouts ("turn off 5 minutes after last activity") right in the UI. Motion sensors can use finite hold times; true presence sensors can stay indefinite with trailing grace periods. Occupancy that's stable without being sticky.

### Daylight-Aware Actions
Enable "Only when dark" on any occupied action. Lights come on when someone enters the room *and* the sun is below the horizon. No extra automations, no lux sensors required.

### Subareas for Micro-Zones
Give the closet, pantry, or reading nook its own occupancy and its own timeout — scoped independently from the parent room. A 5-minute closet timer doesn't affect the kitchen it's inside.

### Sync Rooms for Open Plans
In open-concept spaces, you can sync rooms so they share the same occupancy state and timeout. Activity in either room keeps both occupied, and vacancy clears together. Directional contributors are still available under advanced controls for niche one-way influence patterns.

### Occupancy Propagation
Occupancy flows up the tree automatically. When the kitchen is occupied, the first floor knows. When the first floor has activity, the building knows. You get a live, hierarchical picture of where people are — not just per-room, but per-floor and per-structure. A single glance at the top of the tree tells you whether anyone is home. Drill down to see exactly where.

### Party Mode: Suspend Everything
Having people over? Lock an entire subtree and all occupancy automations in those areas stop. Lights stay on, fans stay on, nothing turns off because someone stepped out of the motion sensor's view for five minutes.

Lock the main floor with `subtree` scope and every room underneath freezes in its current state. No lights flickering off mid-conversation. No bathroom going dark on your guests. When the party's over, unlock and normal occupancy behavior resumes instantly.

You can also lock a single room with `self` scope — useful for movie night (lock the living room so the lights don't turn on when someone gets up for popcorn) or for debugging a tricky automation without the room changing state under you.

Locks are stackable and source-tagged, so multiple locks can coexist and each one unlocks independently. Lock from the UI, from a service call, or from your own automations — it's just `topomation.lock` and `topomation.unlock`.

### Full Transparency — No Black Box
Every rule TopoMation creates is a native Home Assistant automation. You'll find them in **Settings → Automations & Scenes**. They appear in traces. They show up in logs. If something unexpected happens, you trace it the same way you'd trace any other HA automation.

### Runtime Controls
Manually trigger, clear, or vacate any location. Lock or unlock from the tree UI or via service calls. Everything is accessible for manual overrides, testing, and advanced workflows.

---

## Five-Minute Example: The Closet Light

This is the automation everyone wants and nobody wants to maintain by hand.

1. **Add a subarea** called "Closet" under the parent room in the tree.
2. **Detection:** add the closet's motion or door sensor. Set timeout to **5 minutes**.
3. **On Occupied:** Turn on → pick the closet light from the dropdown.
4. **On Vacant:** Turn off → same light.

Done. Light turns on when you walk in, turns off 5 minutes after you leave. No YAML, no entity IDs, no separate automation to create and name and debug.

Now scale that to every room in the house. That's the point.

---

## You Already Have Sensors — You Just Don't Know It

Most people think occupancy automation requires dedicated motion or presence sensors in every room. TopoMation changes that equation because **any state change on any entity can be a detection source**. The light switch someone just flipped? That's a sensor. The fan they turned on? Sensor. The exhaust fan in the bathroom? Sensor. A camera with person detection? Sensor. You're already generating occupancy signals every time you interact with a room — TopoMation lets you use them.

### Got a Camera? You've Got a Presence Sensor

This is the one that clicks instantly. You buy a camera with person detection — Frigate, a Reolink, an Amcrest, whatever runs local. It already creates a binary sensor in Home Assistant when it sees a person. With TopoMation:

1. **Assign the camera's person detection entity** to the area in the tree.
2. That's it. There is no step 2.

One click. The camera's person occupancy binary sensor is now a detection source for that room. When it sees someone, the room is occupied. When it stops seeing someone, the timeout starts. All your existing On Occupied and On Vacant actions — lights, fans, whatever you've already configured — just work with the new source. No YAML to rewrite. No automations to edit. No rules to untangle and reassemble. You added a sensor to a location, and the location got smarter.

This is what topology-driven automation actually means in practice. The *location* has behavior. Sources feed into it. When you add a new source, the behavior doesn't change — it just gets more inputs. Swap out a motion sensor for a mmWave presence sensor? Same thing. Add a door contact alongside an existing motion detector? Same thing. The location doesn't care *what* told it someone is there, only *that* something did.

### The Bathroom: Zero New Hardware

This is the one that makes people stop and think. You have a bathroom with a dumb light switch (or a smart one) and maybe an exhaust fan. No motion sensor, no presence sensor, and you don't want to install one. Here's the trick:

1. **Add the bathroom** as an area in the tree.
2. **Detection:** add the bathroom light switch as a source. Any state change (on or off) triggers occupancy. Set timeout to **20 minutes**.
3. **On Vacant:** Turn off the bathroom light. Turn off the exhaust fan.

That's it. Someone flips the light on to use the bathroom — TopoMation sees the state change and marks the room occupied. The 20-minute timer starts from that last interaction. If they flip the fan on, that's another state change — the timer resets. When they leave (and nothing changes state for 20 minutes), the room goes vacant and everything turns off.

No motion sensor needed. No presence sensor. The switch activity *is* the presence signal. You never forget to turn off the bathroom light again.

### The Fan That Follows Occupancy

Ceiling fans, exhaust fans, space heaters — anything that should run while someone's in the room and stop when they leave:

1. **Detection:** use whatever sources make sense (motion, a light switch, a door sensor).
2. **On Occupied:** Turn on the fan.
3. **On Vacant:** Turn off the fan.

Pair it with a timeout and the fan shuts off automatically after the room empties. Combine it with "Only when dark" and a light in the same action list, and you get lights + fan on arrival, everything off on departure.

### Light Switches as Occupancy Sensors

This pattern works anywhere you have smart switches but no dedicated sensors:

- **Home office:** The desk lamp switch is your detection source. Flip it on to work, and the room stays occupied until 30 minutes after your last interaction. On Vacant turns off the desk lamp, the monitor backlight, whatever else you've assigned.
- **Laundry room:** The overhead light switch triggers occupancy. Set a 15-minute timeout. On Vacant turns off the light. You walked in, turned on the light, started laundry, walked out — 15 minutes later the light turns off by itself.
- **Garage:** The garage light switch triggers occupancy with a 10-minute timeout. On Vacant kills the lights. No motion sensor fighting with car exhaust or temperature swings.

The key insight: **a switch state change is proof that a human is in the room**. It's not as continuous as a motion sensor, but for rooms where you interact with a switch on entry, it's often all you need. And when you do add a dedicated sensor later — a camera, a mmWave unit, anything — you just assign it to the same location. One click. The location gets smarter; nothing else changes.

## More Patterns at a Glance

| Scenario | How It Works |
|---|---|
| **Kitchen lights, daylight-aware** | On Occupied → turn on lights, enable "Only when dark." Lights only come on after sunset. |
| **Open-plan living/kitchen** | Sync living room + kitchen so occupancy and vacancy happen together with shared timing. |
| **Guest bathroom, no sensors** | Light switch as detection source, 20-min timeout. On Vacant turns off lights and exhaust fan. Never forget the bathroom light again. |
| **Bedroom fan + lights** | Motion sensor for detection. On Occupied → fan on, lights on (only when dark). On Vacant → everything off. |
| **Outdoor path lights** | Add a `grounds` root, create areas for pathways. Use motion sensors with short timeouts. |
| **Garage with no motion sensor** | Overhead light switch as detection, 10-min timeout. On Vacant turns off lights. No sensor fighting with heat or exhaust. |
| **Camera with person detection** | Assign the camera's person binary sensor to the area. One click. All existing actions work with the new source — no YAML, no rule edits. |
| **Scene lock** | Lock a room's occupancy state while watching a movie. Unlock when done. Lights stay put. |
| **Party mode** | Lock the main floor with `subtree` scope. Every room underneath freezes — no lights turning off on guests. Unlock when the party's over. |
| **"Is anyone home?"** | Check the building node. Occupancy propagates up — if any room is occupied, the floor is occupied, and the building is occupied. One glance. |
| **Reorganize without breaking anything** | Drag the guest room from the second floor to the first floor. Detection, actions, and occupancy state move with it. Nothing breaks. |
| **Multi-source bathroom** | Light switch + exhaust fan + motion sensor all as sources. Each source maintains its own timeout, and occupancy stays on until the last active source expires. Maximum coverage, zero missed signals. |

---

## The Tree: Your Live Dashboard

The location tree isn't just configuration — it's a real-time view of your home. Every node shows its current occupancy state: occupied, vacant, or locked. Occupancy propagates upward automatically, so a floor node lights up if *any* room on that floor is occupied. Collapse the tree and you see the whole house at a glance. Expand a floor and you see exactly which rooms have people in them.

The tree is fully **drag-and-drop**. Restructuring your home — moving a room to a different floor, nesting a closet inside a bedroom, reordering areas — is a grab-and-release operation. Detection sources, assigned devices, and automation rules travel with the node. You reorganize the topology; nothing breaks.

## The Location Model

TopoMation extends Home Assistant's flat area/floor model with real hierarchy:

| Type | Role | Can Be Placed Under |
|---|---|---|
| `building` | Indoor root | Root only |
| `grounds` | Outdoor root | Root only |
| `floor` | Floor grouping | Root, or under `building` |
| `area` | Room / zone | Root, or under `building`, `grounds`, `floor`, or another `area` |
| `subarea` | Micro-zone (closet, nook) | Under `building`, `grounds`, `floor`, `area`, or another `subarea` |

Areas and subareas in the tree are still Home Assistant areas under the hood — TopoMation adds the parent-child relationship on top. You get real-world modeling freedom without leaving the HA ecosystem.

---

## Installation

### Via HACS (Recommended)

1. Open **HACS** in Home Assistant.
2. Add `https://github.com/mjcumming/topomation` as a custom integration repository.
3. Search for and install **TopoMation**.
4. Restart Home Assistant.
5. Add the integration in **Settings → Devices & Services**.

Full guide: [Installation Guide](docs/installation.md)

### Quick Start

1. Open **Location Manager** from the sidebar.
2. Review imported floors and areas, then shape your hierarchy with buildings, grounds, and subareas.
3. Assign sensors and devices to locations.
4. Configure detection sources and timeouts.
5. Define On Occupied and On Vacant actions.
6. Validate with the occupancy entities and manual controls.

---

## Services Reference

| Service | Description |
|---|---|
| `topomation.trigger` | Mark a location as occupied (with optional timeout) |
| `topomation.clear` | Release one source's occupancy contribution |
| `topomation.vacate` | Force a location vacant |
| `topomation.vacate_area` | Vacate a location and all its descendants |
| `topomation.lock` | Freeze occupancy state (self or subtree scope) |
| `topomation.unlock` | Release a specific lock source |
| `topomation.unlock_all` | Remove all locks from a location |

All services support optional `entry_id` for multi-instance setups.

**Example — external automation using the occupancy sensor:**

```yaml
automation:
  - alias: Kitchen lights on when occupied
    trigger:
      - platform: state
        entity_id: binary_sensor.kitchen_occupancy
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.kitchen
```

---

## Current Status

TopoMation is in **alpha**. The core occupancy model, source normalization, timeout handling, lock workflows, and managed automation generation are stable and tested. UX polish and additional presets are in active development.

### Known Limitations

- "Only when dark" uses sun position (`sun.sun`), not per-room lux sensors.
- Admin privileges are required for panel routes and managed automation writes.

---

## Documentation

- [Architecture](docs/architecture.md)
- [Contracts](docs/contracts.md)
- [ADR Log](docs/adr-log.md)
- [Release Validation Runbook](docs/release-validation-runbook.md)
- [Live HA Validation Checklist](docs/live-ha-validation-checklist.md)

## Development

```bash
git clone https://github.com/mjcumming/topomation
cd topomation
make dev-install
make test
```

### Dev Container HA Workflow (Standard)

For day-to-day development in this repository's dev container, use this exact loop:

```bash
cd /workspaces/topomation
make test-ha-up
make test-ha-status
make test-ha-check
```

- Open `http://localhost:8123` and validate changes in the Topomation panel.
- Restart after backend/Python edits: `make test-ha-restart`
- Tail logs while testing: `make test-ha-logs`
- Shut down when done: `make test-ha-down`

Canonical runbook: [tests/DEV-CONTAINER-HA.md](tests/DEV-CONTAINER-HA.md)

- [Docs Index](docs/index.md)
- [Frontend Workflow](docs/frontend-dev-workflow.md)

## Support

- [Issues](https://github.com/mjcumming/topomation/issues)
- [Discussions](https://github.com/mjcumming/topomation/discussions)

## License

MIT — see [LICENSE](LICENSE).

---

**Maintainer:** Mike Cumming · **Status:** Alpha · **Last Updated:** 2026-03-01
