# TopoMation

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Installations](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fanalytics.home-assistant.io%2Fcustom_integrations.json&query=%24.topomation.total&label=installs&color=41BDF5&logo=home-assistant&cacheSeconds=3600)](https://analytics.home-assistant.io/custom_integrations.json)
[![GitHub Release](https://img.shields.io/github/release/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/releases)
[![License](https://img.shields.io/github/license/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/blob/main/LICENSE)
[![Home Assistant](https://img.shields.io/badge/home%20assistant-2024.1.0+-blue.svg)](https://www.home-assistant.io/)
[![Maintenance](https://img.shields.io/maintenance/yes/2026.svg)](https://github.com/mjcumming/topomation)
[![Quality Scale](https://img.shields.io/badge/quality%20scale-silver-lightgrey.svg)](https://developers.home-assistant.io/docs/core/integration-quality-scale/)
[![Project Status](https://img.shields.io/badge/project%20status-alpha-orange.svg)](https://github.com/mjcumming/topomation)
[![CI](https://img.shields.io/github/actions/workflow/status/mjcumming/topomation/frontend-tests.yml?branch=main&label=CI)](https://github.com/mjcumming/topomation/actions/workflows/frontend-tests.yml)
[![GitHub Issues](https://img.shields.io/github/issues/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/mjcumming/topomation.svg)](https://github.com/mjcumming/topomation/pulls)

TopoMation is a Home Assistant custom integration for occupancy-first automations.
It converts noisy per-entity state changes into stable location occupancy signals,
then lets you manage occupied/vacant behaviors in one place.

Instead of rebuilding automation logic room by room, you model occupancy once per
location and reuse that behavior across your topology.

## What Topomation Does

- Builds a location workspace that combines HA-backed wrappers (`floor_*`, `area_*`)
  with integration-owned nodes (`building`, `grounds`, `subarea`).
- Translates Home Assistant state changes into normalized occupancy signals
  (`trigger`, `clear`, `vacate`) with source-aware IDs and optional signal keys.
- Publishes one occupancy binary sensor per location for dashboards, automations,
  and debugging.
- Supports lock policies for occupancy control (`freeze`, `block_occupied`,
  `block_vacant`) with `self` and `subtree` scope.
- Creates and manages occupied/vacant action rules as native Home Assistant
  automations from the Topomation panel.
- Supports optional `Only when dark` guard for managed rules
  (`sun.sun` must be `below_horizon`).

## Integration Namespace

- Domain: `topomation`
- Services:
  - `topomation.trigger`
  - `topomation.clear`
  - `topomation.vacate`
  - `topomation.lock`
  - `topomation.unlock`
  - `topomation.unlock_all`
  - `topomation.vacate_area`
- WebSocket namespace: `topomation/*`

## How It Works

Topomation is a thin Home Assistant adapter around the Topomation kernel
(`home_topology` package).

1. Home Assistant emits `state_changed` events.
2. `EventBridge` translates mapped entity transitions into occupancy signals.
3. Kernel modules resolve occupancy/holds/locks and timeout transitions.
4. Integration exposes location state as HA entities and panel data.
5. Managed actions write native HA automations for occupied/vacant responses.

Architecture and contracts:

- [Architecture](docs/architecture.md)
- [Contracts](docs/contracts.md)
- [ADR Log](docs/adr-log.md)

## Installation

Use the full guide: [Installation Guide](docs/installation.md)

Quick path via HACS:

1. Open HACS in Home Assistant.
2. Add `https://github.com/mjcumming/topomation` as a custom integration repository.
3. Install Topomation.
4. Restart Home Assistant.
5. Add Topomation in **Settings -> Devices & Services**.

## Quick Start Workflow

1. Open **Location Manager** from the sidebar.
2. Confirm imported floors/areas and shape your hierarchy.
3. Configure occupancy detection in the **Detection** tab.
4. Configure behavior in **On Occupied** and **On Vacant**.
5. Optionally enable `Only when dark` per managed action.
6. Validate using occupancy entities and manual services.

Example trigger from occupancy sensor:

```yaml
automation:
  - alias: Kitchen lights on when occupied
    trigger:
      - platform: state
        entity_id: binary_sensor.occupancy_kitchen
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

## Current Scope (Alpha)

- Stable occupancy model and lock workflows are available today.
- Managed occupied/vacant actions are backend-owned and stored as native HA automations.
- HA registry changes (areas/floors/entities) are synchronized into topology wrappers.
- Ambient module support is available via integration runtime/WebSocket workflows.
  Ambient helper entities are intentionally not exposed yet.

## Known Limits

- `Only when dark` is currently sun-position based (`sun.sun`), not per-room lux.
- Admin privileges are required for panel routes and managed-action writes.
- UX polish and richer presets/templates are still in progress.

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
**Last Updated**: 2026-02-27
