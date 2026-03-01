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

TopoMation is a Home Assistant custom integration for occupancy-first homes.
It converts noisy device changes into stable location occupancy, then lets you
build occupied/vacant behavior from one control surface instead of per-room
automation sprawl.

## Why TopoMation

- **One occupancy signal per location** for dashboards, automations, and debugging.
- **Fewer brittle automations** by normalizing many entity behaviors into one model.
- **Native HA automations generated for you** from occupied/vacant rules in the panel.
- **Policy-level control** with lock modes (`freeze`, `block_occupied`,
  `block_vacant`) and scopes (`self`, `subtree`).

## What TopoMation Does

- Builds a location workspace that combines Home Assistant-backed wrappers
  (`floor`, `area`) with integration-owned structural nodes
  (`building`, `grounds`, `subarea`).
- Translates Home Assistant state changes into normalized occupancy signals
  (`trigger`, `clear`, `vacate`) using source-aware IDs and optional signal keys.
- Publishes one occupancy binary sensor per location (`binary_sensor.<location>_occupancy`).
- Supports direct manual control services for occupancy and lock workflows.
- Manages occupied/vacant action rules as native Home Assistant automations.
- Supports optional `Only when dark` guard for occupied rules
  (`sun.sun` must be `below_horizon`).

## How It Works

TopoMation is a thin Home Assistant adapter around the `home_topology` kernel:

1. Home Assistant emits `state_changed`.
2. `EventBridge` maps relevant transitions to occupancy signals.
3. Kernel modules apply occupancy state, holds, locks, and timeout logic.
4. Integration exposes state as HA entities and panel data.
5. Managed actions create/update native HA automations.

Deep design references:

- [Architecture](docs/architecture.md)
- [Contracts](docs/contracts.md)
- [ADR Log](docs/adr-log.md)

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
2. Confirm imported floors/areas and shape the hierarchy.
3. Configure source behaviors in **Detection**.
4. Configure **On Occupied** and **On Vacant** actions.
5. Optionally enable `Only when dark` on occupied actions.
6. Validate with occupancy entities and manual services.

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

- Stable occupancy model, source normalization, and lock workflows.
- Managed occupied/vacant actions persisted as native HA automations.
- Registry sync for areas/floors/entities into topology wrappers.
- Ambient module runtime/WebSocket support (ambient helper entities not yet exposed).

## Known Limits

- `Only when dark` is sun-position based (`sun.sun`), not per-room lux.
- Admin privileges are required for panel routes and managed action writes.
- UX polish and additional presets/templates are in progress.

## Validation and Release Discipline

- [Release Validation Runbook](docs/release-validation-runbook.md)
- [Live HA Validation Checklist](docs/live-ha-validation-checklist.md)
- [Live Release Testing Paradigm](docs/live-release-testing-paradigm.md)

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
