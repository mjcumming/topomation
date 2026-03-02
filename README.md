# TopoMation

<p align="center">
  <img src="custom_components/topomation/brand/logo.png" alt="TopoMation logo" width="180" />
</p>

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Installations](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fanalytics.home-assistant.io%2Fcustom_integrations.json&query=%24.topomation.total&label=installs&color=41BDF5&logo=home-assistant&cacheSeconds=3600)](https://analytics.home-assistant.io/custom_integrations.json)
[![GitHub Release](https://img.shields.io/github/release/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/mjcumming/topomation/frontend-tests.yml?branch=main&label=CI)](https://github.com/mjcumming/topomation/actions/workflows/frontend-tests.yml)
[![License](https://img.shields.io/github/license/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/blob/main/LICENSE)
[![Project Status](https://img.shields.io/badge/project%20status-alpha-orange.svg)](https://github.com/mjcumming/topomation)

TopoMation is a Home Assistant custom integration that makes occupancy automation practical at whole-home scale.

Control lights and devices by room—turn on when someone’s there, turn off after they leave—without writing per-room automations or hunting for entity IDs. You get the same power (and more) as other presence-based solutions, in an easier-to-use interface with one crucial difference: **every rule you create lives in the Home Assistant Rules Engine**. What’s happening is visible, logged, and easy to follow—no black box.

### The Two Things TopoMation Does

1. **You create a topology of your home.** One tree: building, grounds, floors, areas, subareas (closets, pantries, nooks). Drag and drop. Assign devices to locations. The tree is your map of the house and your dashboard for what’s going on.
2. **You automate using that topology.** One occupancy signal per location, one UI to define *On Occupied* and *On Vacant* actions. Pick devices from a list—no entity IDs to type. Set timeouts (e.g. “turn off 5 minutes after last motion”) in the UI. TopoMation creates native Home Assistant automations, so every rule appears in HA’s automation list, shows up in traces and logs, and stays fully editable and debuggable.

## The Tree: Your Home at a Glance

Everything in TopoMation starts from **one tree**. We designed it that way on purpose.

**What we’ve done.** Home Assistant gives you a flat list of areas and floors. That’s fine for assigning devices, but it doesn’t reflect how you actually think about your home—indoor vs outdoor, main floor vs basement, or that the closet and the pantry are *inside* the room, not next to it. We added a real hierarchy: **building**, **grounds**, **floors**, **areas**, and **subareas**. You get one shared model of the house that TopoMation (and you) use for structure, occupancy, and automation.

**Why we designed it this way.** The tree is not just a list of labels. It’s the place you go to see and control your home. You can:

- **Understand the layout** — See the whole house in one view. Which rooms are under which floor, which zones are indoors vs outdoors, where the micro-zones (closet, pantry, landing) live. No more mental map in your head; the tree is the map.
- **Organize the way you live** — Drag and drop to match reality. Put floors under a *building* root, add a *grounds* root for outside. Create *subareas* for closets, nooks, or landings so they have their own occupancy and their own “turn off in 5 minutes” without touching the parent room.
- **Assign devices to the right place** — Lights and sensors live on the tree. When you add an “On Occupied” or “On Vacant” action, you pick from what’s assigned to that location. The tree defines what’s in scope.
- **See what’s happening** — Occupancy state, lock state, and structure are all in the same view. You can tell at a glance which locations are occupied, which are locked for a scene, and how the house is wired.

**What it offers.** One place to build your topology, assign devices, configure detection (motion, doors, presence, etc.), and define occupied/vacant actions. No jumping between unrelated lists. The tree is your single source of truth for “where things are” and “what runs where.” When you add a closet as a subarea and give it a 5‑minute timeout, that behavior is scoped to the closet—the rest of the house doesn’t change. When you link rooms for open-plan spaces, the tree makes the relationship explicit. Better structure means clearer automation and easier debugging.

So: **start at the top of the tree.** Shape it, assign to it, automate from it. The rest of TopoMation is built on that foundation.

## Why This Exists

Most occupancy setups break down the same way:

- **Too many automations** — Per-room automations multiply until they’re hard to reason about.
- **Inconsistent sensors** — Motion, doors, presence, and device trackers all behave differently; occupancy feels unpredictable.
- **Debugging the wrong thing** — You end up chasing entity transitions instead of understanding home behavior.
- **No map** — There’s no single view of how occupancy and automation are wired across the house.

Other solutions can add presence-aware behavior, but often do it with internal logic that’s hard to see or debug. TopoMation gives you the same (and more) with a clear model: one tree, one occupancy language, and **every rule in Home Assistant**. If something happens, you can see why.

## What TopoMation Delivers

- **A global tree view of the entire home** — Floors, areas, subareas, indoor/outdoor roots. One place to see and manage structure.
- **One occupancy binary sensor per location** — For dashboards, automations, and debugging. No guessing which entity drives which room.
- **UI-managed detection** — Consistent trigger/clear/vacate semantics and timeouts (e.g. “5 min after last activity”) configured in the panel, not YAML.
- **Rules that live in Home Assistant** — Every *On Occupied* and *On Vacant* rule is a native Home Assistant automation (Rules Engine). Visible in **Settings → Automations & Scenes**, logged in the system, easy to trace and edit. You always know what’s running and why.
- **Point-and-click actions** — Pick the target device from a list; choose Turn On / Turn Off / Toggle. No entity IDs to look up.
- **Linked rooms for occupancy** — In open-plan spaces, one area’s occupancy can contribute to another (e.g. Family Room → Kitchen) without extra sensors. Configure directional links in Detection; contributions clear when the linked room goes vacant.
- **Runtime controls** — `trigger`, `clear`, `vacate`, `lock`, `unlock` for manual override and advanced workflows.

## From Simple to Powerful

**The simple case.** Turn on a closet light and want it to turn off in 5 minutes if nothing else happens? You don’t need to do anything else. Add the closet to the tree, add the motion (or door) sensor, set the timeout to 5 minutes, and add *On Occupied* → turn on light, *On Vacant* → turn off light. Done. No extra automations, no entity ID lookups.

**When it gets richer.** TopoMation combines events from **all sorts of sensors**—motion, door contacts, presence sensors, device trackers, even light or media activity—into **one occupancy state per location**, with a **configurable timeout** (or “indefinite until something clears it”). You choose how each source contributes (trigger, clear, vacate) and how long the location stays occupied after the last activity. So a room can be “occupied” because of motion *or* an open door *or* a device tracker, and it goes vacant only after your chosen timeout (or when a source says “I’m gone”). That single, consistent occupancy signal then drives everything.

On top of that we add **built-in occupied and vacant actions** with **time of day**. For example: “turn the lights on when this room is occupied—**but only when it’s dark**.” That’s daylight-aware: we use the sun (e.g. *sun.sun* below horizon), not a per-room brightness sensor. So you get “lights on when someone’s there and it’s nighttime” without wiring your own sun condition. Occupied and vacant actions are still plain Home Assistant automations, so you can see and edit them; we just create them for you from the tree.

So: simple things stay simple (closet, 5 min, done). Complex things—many sensors, one occupancy, timeouts, and daylight-aware actions—stay manageable because they all flow from the same tree and the same UI.

## Point-and-Click Automation (No YAML, No Entity IDs)

You build occupancy behavior entirely from the TopoMation panel:

1. **Select a location** in the tree (e.g. Closet, Kitchen).
2. **Detection**: Add motion, door, or other sources; set **timeout** in minutes (e.g. “5 min after last activity”) or “Indefinite” — all in the UI.
3. **On Occupied** / **On Vacant**: Add actions by picking the **target device from a list** and choosing Turn On, Turn Off, or Toggle. No `entity_id` typing.
4. Optionally enable **Only when dark** for occupied actions (daylight-aware: sun below horizon, not per-room brightness).

TopoMation creates **native Home Assistant automations** for each rule. They show up under **Settings → Automations & Scenes**, in traces and logs—so you can see exactly what fired and why.

## Example: Closet Light (The Classic Win)

A concrete workflow that takes a couple of minutes:

1. Create **Closet** as a `subarea` under the right room in the tree.
2. In **Detection**, add the closet motion or door sensor. Set **timeout to 5 minutes** so occupancy clears 5 minutes after the last activity.
3. **On Occupied**: add an action — choose **Turn on** and **pick the closet light from the list**.
4. **On Vacant**: add an action — **Turn off**, same light.

That’s it. You don’t need to do anything else. No entity IDs to look up, no YAML. The integration creates the automations; you get “light on when I’m there, off 5 minutes after I leave” with a point-and-click flow.

## More Example Flows

- **Kitchen lights** — On when occupied (optionally “only when dark,” i.e. daylight-aware), off when vacant.
- **Manual “I’m here for a bit”** — From the tree, mark a room occupied with a timeout; vacate when done.
- **Lock a location** — Freeze occupancy state for testing or a scene; unlock when ready.
- **Linked rooms** — Open-plan spaces: e.g. Family Room can contribute to Kitchen occupancy without extra sensors.

## Why a Real Topology (Not Just Areas)?

Home Assistant’s areas and floors are a flat list. For occupancy you often need **micro-zones** (closet, pantry, landing), **indoor vs outdoor** roots, and **nesting** that matches how you use the house. TopoMation’s location tree gives you that structure in **one place**—so one panel shows the whole home, device assignment, detection, and automation, all tied to the same topology.

## The Location Model We Built

TopoMation supports five location types:

- `building`: root-level structural wrapper for indoor hierarchies.
- `grounds`: root-level structural wrapper for outdoor hierarchies.
- `floor`: Home Assistant floor wrapper (can sit at root or under `building`).
- `area`: Home Assistant area wrapper or integration-owned area node.
- `subarea`: nested micro-zone for finer control (e.g. closet, pantry, nook).

**Important: areas and subareas in the tree are still Home Assistant areas.** We don’t create a new entity type in HA. We’ve just allowed a **parent–child relationship** in the topology—so you can put one area under another, or nest a subarea under a room, and TopoMation uses that structure for occupancy and automation. HA still has areas and floors; we add the hierarchy and the single place to manage it.

### Why We Added New Location Types

Home Assistant floors/areas are useful, but occupancy automation often needs more structure:

- separate indoor and outdoor roots,
- deeper nesting than `floor -> area`,
- micro-zones like pantry, closet, landing, or nook,
- occupancy behavior scoped to lived spaces instead of only registry objects.

`building`, `grounds`, and `subarea` close that gap while keeping everything in one management surface.

### Hierarchy Rules

The hierarchy is flexible but constrained so drag-and-drop stays predictable:

- `building` and `grounds` are root-only.
- `floor` can be root-level or a child of `building`.
- `area` can be root-level or nested under `building`, `grounds`, `floor`, or another `area`.
- `subarea` can be nested under `building`, `grounds`, `floor`, `area`, or another `subarea`.

This gives you real-world modeling freedom while preserving strict safety checks for reparent/reorder operations.

## Occupancy Model: Built For Mixed Sensors

Not all sensors represent true presence.

A motion pulse, a door open event, a dimmer level change, and a person tracker should not behave the same way. TopoMation lets each source express the right behavior while still rolling up to one occupancy state per location.

### Core Occupancy Semantics

Each source maps into one of these intents:

- `trigger`: contribute occupied intent.
- `clear`: release one source contribution (optional trailing timeout).
- `vacate`: authoritative vacant intent.

### Source Configuration Model

Each source is configured in the UI with:

- mode: `any_change` or `specific_states`
- `on_event`: typically `trigger`
- `on_timeout`: finite duration or `null` (indefinite)
- `off_event`: `none` or `clear`
- `off_trailing`: delay before source release

### Why Timeouts Matter

This is a major practical win:

- Activity-style sensors (motion, door activity, light/media interaction) are often best with finite hold time and no direct OFF clear.
- True presence-style sensors (`presence`/`occupancy`, `person`, `device_tracker`) are often best with indefinite ON plus OFF clear with trailing grace.
- OFF behavior can be either source release (`clear`) or authoritative vacant (`vacate`) based on your intent.

The result is occupancy that is stable without being sticky.

**Bounded spaces and “wasp in a box”.** For zones where you can observe both boundary (e.g. door) and interior (e.g. motion) activity, TopoMation supports a bounded-space pattern: entry/exit and interior signals combine into one occupancy state, with optional handoff to adjacent or linked areas. You get deterministic, explainable occupancy instead of motion-only guesswork. Linked rooms (below) are the topology side of this—one area’s occupancy can contribute to a neighbor so open-plan or connected spaces behave correctly without extra sensors.

### Linked Rooms (Directional Contributors)

For open-plan spaces and shared activity zones, you can now configure
`Linked Rooms` in Detection without adding dedicated crossing sensors.

- Links are directional per location.
- If `Family Room` is linked on the `Kitchen` page, Family Room contributes to
  Kitchen occupancy.
- You can select multiple contributors in one pass; selections remain editable
  while saves are queued.
- Reverse behavior stays explicit. A per-row optional `2-way` checkbox can
  also write the reverse link for convenience.
- Linked Rooms is intentionally scoped to room-level topology:
  - only `area` locations directly under a `floor` can configure linked rooms
  - only immediate sibling `area` locations under that same floor are valid contributors.

At runtime, linked-room contributions are applied as source-scoped occupancy
contributors (`linked:<location_id>`), so they compose cleanly with normal
sensors and clear correctly when the contributor location goes vacant.

## Global Operations From One Tree

From one location tree, you can:

- see occupancy state across the home,
- shape hierarchy with drag-and-drop,
- assign devices to the right location quickly,
- apply policy locks with `self` or `subtree` scope,
- manually mark locations occupied/unoccupied for testing and operations.

One tree: your topology and your dashboard. One occupancy language. Every rule in Home Assistant so you can see and debug what’s happening. Automation that scales with your home.

## Installation

Use the full guide: [Installation Guide](docs/installation.md)

Quick path via HACS:

1. Open HACS in Home Assistant.
2. Add `https://github.com/mjcumming/topomation` as a custom integration repository.
3. Install TopoMation.
4. Restart Home Assistant.
5. Add TopoMation in **Settings -> Devices & Services**.

## Quick Start Workflow

1. Open **Location Manager** from the sidebar.
2. Confirm imported floors/areas, then shape hierarchy with building/grounds/subareas.
3. Assign entities in **Assign Devices** where needed.
4. Configure source behavior in **Detection**.
5. Configure **On Occupied** and **On Vacant** actions.
6. Optionally enable `Only when dark` for occupied rules.
7. Validate with occupancy entities and manual controls.

Automation example driven by location occupancy:

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

Manual occupancy control example:

```yaml
service: topomation.trigger
data:
  location_id: kitchen
  source_id: manual_override
  timeout: 300
```

## Manual Services

- `topomation.trigger`: trigger occupied for a location.
- `topomation.clear`: clear one source (optional trailing timeout).
- `topomation.vacate`: force one location vacant.
- `topomation.vacate_area`: vacate a location and descendants.
- `topomation.lock`: apply lock policy and scope.
- `topomation.unlock`: release one lock source.
- `topomation.unlock_all`: remove all lock sources from a location.

All services support optional `entry_id` when multiple TopoMation entries are loaded.

## Current Scope (Alpha)

- Stable occupancy model, source normalization, timeout handling, and lock workflows.
- Managed occupied/vacant actions persisted as native HA automations.
- Registry sync for areas/floors/entities into topology wrappers.
- Structural hierarchy model for `building` / `grounds` / `floor` / `area` / `subarea`.
- Ambient module runtime/WebSocket support (ambient helper entities not yet exposed).

## Known Limits

- `Only when dark` is sun-position based (`sun.sun`), not per-room lux.
- Admin privileges are required for panel routes and managed action writes.
- UX polish and additional presets/templates are in progress.

## Validation and Release Discipline

- [Release Validation Runbook](docs/release-validation-runbook.md)
- [Live HA Validation Checklist](docs/live-ha-validation-checklist.md)
- [Live Release Testing Paradigm](docs/live-release-testing-paradigm.md)

## Architecture and Contracts

- [Architecture](docs/architecture.md)
- [Contracts](docs/contracts.md)
- [ADR Log](docs/adr-log.md)

## Development

```bash
git clone https://github.com/mjcumming/topomation
cd topomation
make dev-install
make test
```

Start here for contributor docs:

- [Docs Index](docs/index.md)
- [Frontend Workflow](docs/frontend-dev-workflow.md)
- [Architecture](docs/architecture.md)

## Support

- Issues: <https://github.com/mjcumming/topomation/issues>
- Discussions: <https://github.com/mjcumming/topomation/discussions>

## License

MIT License. See [LICENSE](LICENSE).

---

**Status**: Alpha  
**Maintainer**: Mike Cumming  
**Last Updated**: 2026-03-01
