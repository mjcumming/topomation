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

It gives you one place to model your home as a hierarchy, one occupancy signal per location, and one UI to build occupied/vacant behavior without writing brittle per-room automations.

## Why This Exists

Most occupancy setups break down the same way:

- Per-room automations multiply until they are hard to reason about.
- Different sensor types behave differently, so occupancy feels inconsistent.
- You end up debugging entity transitions instead of home behavior.
- There is no global map of how occupancy logic is connected across the house.

TopoMation solves this with a single location tree and a consistent occupancy contract across many sensor domains.

## What TopoMation Delivers

- A global tree view of the entire home, including custom structural nodes.
- One occupancy binary sensor per location for dashboards, automations, and debugging.
- UI-managed occupancy source behavior with consistent trigger/clear/vacate semantics.
- Native Home Assistant automations generated from `On Occupied` and `On Vacant` rules.
- Runtime policy controls (`trigger`, `clear`, `vacate`, `lock`, `unlock`) for advanced workflows.

## The Location Model We Built

TopoMation supports five location types:

- `building`: root-level structural wrapper for indoor hierarchies.
- `grounds`: root-level structural wrapper for outdoor hierarchies.
- `floor`: Home Assistant floor wrapper (can sit at root or under `building`).
- `area`: Home Assistant area wrapper or integration-owned area node.
- `subarea`: nested micro-zone for finer control.

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

## UI-First Automation

You can build occupancy behavior directly from the TopoMation panel:

1. Select a location in the tree.
2. Configure detection sources in `Detection`.
3. Create actions in `On Occupied` and `On Vacant`.
4. Optionally enable `Only when dark` for occupied actions.

TopoMation writes these as native Home Assistant automations, so rules appear in the standard HA automation UI and remain fully interoperable.

This means you can build powerful automations without manually stitching entity IDs into YAML.

## Example: Closet Light Automation

A concrete workflow:

1. Create `Closet` as a `subarea` under the right parent.
2. Assign closet motion or door-contact source in `Detection`.
3. Use a short timeout for activity-based signals.
4. Add `On Occupied`: turn closet light on.
5. Add `On Vacant`: turn closet light off.

That is exactly the kind of low-friction, high-value automation this integration is designed to make easy.

## Global Operations From One Tree

From one location tree, you can:

- see occupancy state across the home,
- shape hierarchy with drag-and-drop,
- assign devices to the right location quickly,
- apply policy locks with `self` or `subtree` scope,
- manually mark locations occupied/unoccupied for testing and operations.

This integration is built to remove user pain: one model, one UI, one occupancy language, and automation behavior that scales with your home.

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
