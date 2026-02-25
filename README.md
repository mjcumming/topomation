# Topomation

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-blue)](https://github.com/mjcumming/topomation/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Topomation: Occupancy-driven automation**

Topomation turns disconnected sensor signals into a reliable occupancy model you can automate against.  
Instead of wiring every automation directly to individual entities, you define occupancy at the location level and reuse that behavior across your home.

## Naming and Namespace

Topomation is the product name.  
Current Home Assistant internals use:

- Integration domain: `topomation`
- Services: `topomation.trigger`, `topomation.clear`, `topomation.lock`, `topomation.unlock`, `topomation.vacate_area`
- Repository: `topomation`

## Why Topomation

Home Assistant gives you great raw signals, but occupancy automations often become brittle when every room uses different sensor logic.  
Topomation introduces one shared pattern:

1. Collect occupancy-relevant events from your sensors.
2. Resolve those events into a location-level occupied/vacant state.
3. Drive automations from that state instead of ad hoc per-entity conditions.

Result: simpler automations, better consistency, easier debugging.

## What It Does Well

- **Unifies disparate sensors** into one occupancy decision per location.
- **Keeps automations location-first** so behavior can be reused across rooms.
- **Supports hierarchy-aware control** across floors, areas, and subareas.
- **Provides a visual manager** for structure, detection sources, and actions.
- **Uses native Home Assistant automations** for occupied/vacant action rules.

## How It Works

Topomation is a thin Home Assistant adapter around the Topomation core kernel (`home_topology` Python package).

Flow:

1. HA entities change state (motion, BLE, contact, etc.).
2. `event_bridge.py` translates state changes into kernel events.
3. Occupancy module resolves occupied/vacant with timeouts and holds.
4. Integration exposes occupancy state back to HA entities and panel views.
5. You use occupancy state and generated action automations for behavior.

See [Architecture](docs/architecture.md) for full details.

## Installation

Use the full guide: [Installation Guide](docs/installation.md)

Quick path via HACS:

1. Open HACS in Home Assistant.
2. Add `https://github.com/mjcumming/topomation` as a custom integration repository.
3. Install the integration.
4. Restart Home Assistant.
5. Add the integration from **Settings** -> **Devices & Services**.

## Quick Start

1. Open **Location Manager** from the HA sidebar.
2. Import/sync your floors and areas.
3. Build your location hierarchy.
4. Add occupancy sources under the `Detection` tab.
5. Configure actions under `On Occupied` and `On Vacant`.
6. Validate behavior using occupancy entities and service calls.

Example automation trigger:

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

Manual occupancy service example:

```yaml
service: topomation.trigger
data:
  location_id: kitchen
  source_id: manual_override
  timeout: 300
```

## Design Decisions

Topomation is built on documented ADRs in [ADR Log](docs/adr-log.md).  
Key decisions include:

- Lit-based UI aligned with Home Assistant frontend patterns.
- Host-controlled timeout scheduling for deterministic behavior.
- Integration-owned topology wrappers plus HA-backed area/floor mapping.
- Single sidebar entry with deep-link aliases for occupancy/actions workflows.

## Troubleshooting and Validation

- Live validation checklist: [Live HA Validation Checklist](docs/live-ha-validation-checklist.md)
- Integration and behavior guide: [Integration Guide](docs/integration-guide.md)
- Work log and release context: [Work Tracking](docs/work-tracking.md)

## Current Scope and Tradeoffs (v0.1.0-alpha)

- Occupancy and actions workflow is available and usable.
- Integration and service namespaces are now `topomation`.
- Some advanced UX polish and broader module surface are still in progress.

## Development

```bash
git clone https://github.com/mjcumming/topomation
cd topomation
make dev-install
make test
```

For deeper development workflows, start with:

- [Docs Index](docs/index.md)
- [Frontend Workflow](docs/frontend-dev-workflow.md)
- [Architecture](docs/architecture.md)

## Support

- Issues: <https://github.com/mjcumming/topomation/issues>
- Discussions: <https://github.com/mjcumming/topomation/discussions>
- Core library: <https://github.com/mjcumming/topomation>

## License

MIT License. See [LICENSE](LICENSE).

---

**Status**: Alpha (v0.1.0)  
**Maintainer**: Mike Cumming  
**Last Updated**: 2026-02-25
