# Home Topology - Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-blue)](https://github.com/mjcumming/home-topology-ha/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A Home Assistant integration for the [home-topology](https://github.com/mjcumming/home-topology) platform-agnostic home automation kernel.

## Features

- **Spatial Topology**: Model your home as floors, rooms, zones, and suites
- **Smart Occupancy**: Track presence with motion, BLE, and door sensors
- **Location-Aware Automations**: Attach behaviors to locations, not entities
- **Visual Manager**: Sidebar panel for drag-and-drop organization
- **Behavior Modules**: Occupancy tracking, automations, and lighting presets

## Why home-topology?

Traditional home automation organizes around **entities** (lights, sensors, switches). home-topology organizes around **locations** (kitchen, bedroom, office). This makes automation more intuitive:

```yaml
# Traditional approach
- Kitchen motion → Turn on kitchen lights
- Living room motion → Turn on living room lights
- Office motion → Turn on office lights

# home-topology approach
- Any location: occupied → Turn on lights
```

The kernel handles the complexity; you just configure which sensors affect which locations.

---

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots menu → **Custom repositories**
3. Add `https://github.com/mjcumming/home-topology-ha` as an **Integration**
4. Search for "Home Topology" and install
5. Restart Home Assistant
6. Go to **Settings** → **Devices & Services** → **Add Integration** → **Home Topology**

### Manual

1. Copy `custom_components/home_topology` to your `config/custom_components/` directory
2. Restart Home Assistant
3. Go to **Settings** → **Devices & Services** → **Add Integration** → **Home Topology**

---

## Quick Start

### 1. Access the Location Manager

After installation, "Location Manager" appears in your sidebar. Open it to start organizing your home.

### 2. Import Your Areas

The integration automatically creates locations from your Home Assistant areas. You'll see them in the "Unassigned" section.

### 3. Organize Your Topology

Drag locations to create hierarchy:

```
House
├── First Floor
│   ├── Kitchen
│   ├── Living Room
│   └── Dining Room
└── Second Floor
    ├── Master Suite
    │   ├── Master Bedroom
    │   ├── Master Bath
    │   └── Master Closet
    └── Guest Room
```

### 4. Configure Occupancy

Select a location, go to the **Occupancy** tab:

- Set timeout (how long until vacant)
- Add occupancy sources (motion sensors, presence sensors)
- Configure trigger modes (motion vs. state-based)

### 5. View Occupancy State

Occupancy entities appear automatically:

- `binary_sensor.occupancy_kitchen` - Occupied/vacant
- Attributes: confidence, active holds, expires at

### 6. Use in Automations

```yaml
automation:
  - alias: "Kitchen lights on when occupied"
    trigger:
      - platform: state
        entity_id: binary_sensor.occupancy_kitchen
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.kitchen
```

---

## Documentation

### Core Concepts

- **Location**: A place in your home (room, floor, zone)
- **Module**: Behavior attached to locations (Occupancy, Automation, Lighting)
- **Occupancy Source**: Entity that generates occupancy events (motion sensor, BLE tracker)
- **Trigger Mode**: How an entity affects occupancy (any change vs. specific states)

### Configuration

See [`docs/integration-guide.md`](docs/integration-guide.md) for:

- Event translation patterns
- Timeout configuration
- Entity configuration modes
- Advanced hierarchy patterns

### UI Guide

See [`docs/ui-design.md`](docs/ui-design.md) for:

- Component specifications
- Interaction patterns
- Accessibility features
- Icon resolution

### Development

See [`docs/architecture.md`](docs/architecture.md) and [`docs/coding-standards.md`](docs/coding-standards.md) for integration architecture and development guidelines.

---

## Development

### Setup Development Environment

```bash
# Clone the repo
git clone https://github.com/mjcumming/home-topology-ha
cd home-topology-ha

# Install with dev dependencies
make dev-install

# Symlink into your HA config
make symlink
# Enter path when prompted: /path/to/ha-config

# Restart HA to load the integration
```

### Testing

```bash
# Run tests
make test

# Run with coverage
make test-cov

# Run all checks (format, lint, typecheck, test)
make check
```

### Frontend Development

The panel is built with Lit (Home Assistant's native framework):

```bash
# When frontend build system is added
make frontend-install
make frontend-watch  # Auto-rebuild on changes
```

### Project Structure

```
home-topology-ha/
├── custom_components/home_topology/
│   ├── __init__.py              # Integration setup
│   ├── event_bridge.py          # HA → kernel events
│   ├── coordinator.py           # Timeout scheduling
│   ├── binary_sensor.py         # Occupancy entities
│   ├── websocket_api.py         # UI API
│   └── frontend/                # Lit components
├── docs/                        # Architecture & guides
├── tests/                       # Unit & integration tests
└── Makefile                     # Development commands
```

---

## Roadmap

### v0.1.0 (Current - Alpha)

- [x] Documentation infrastructure
- [x] Core kernel integration
- [x] Basic UI panel
- [x] Occupancy tracking
- [x] Bidirectional HA area/entity sync
- [ ] Topology configuration persistence (location tree + module configs)

### v0.2.0 (Beta)

- [x] Automation module integration
- [x] Ambient light module integration
- [ ] Full UI with entity configuration
- [ ] State persistence
- [ ] HACS compatible

### v1.0.0 (Stable)

- [ ] Production-ready
- [ ] Comprehensive tests (>80% coverage)
- [ ] Complete documentation
- [ ] HACS default repository

### Future

- [ ] Climate module
- [ ] Media module
- [ ] Floor plan view
- [ ] Bulk operations

---

## Architecture

This integration is a **thin adapter layer** between Home Assistant and the platform-agnostic [home-topology](https://github.com/mjcumming/home-topology) kernel.

**Integration provides**:

- Event translation (HA state changes → kernel events)
- State exposure (kernel state → HA entities)
- Timeout coordination (host-controlled scheduling)
- UI panel (Lit-based)

**Kernel provides**:

- Location hierarchy management
- Event routing
- Module behavior (Occupancy, Automation, Lighting)

See [`docs/architecture.md`](docs/architecture.md) for complete architecture documentation.

---

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`feat/awesome-feature`)
3. Make changes with tests
4. Run `make check` to verify
5. Commit with [conventional commit messages](https://www.conventionalcommits.org/)
6. Push and create a Pull Request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/mjcumming/home-topology-ha/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mjcumming/home-topology-ha/discussions)
- **Core Library**: [home-topology repository](https://github.com/mjcumming/home-topology)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built on [home-topology](https://github.com/mjcumming/home-topology) kernel
- Inspired by [Magic Areas](https://github.com/jseidl/hass-magic_areas)
- Uses [Home Assistant](https://www.home-assistant.io/) integration framework

---

**Status**: Alpha (v0.1.0)
**Maintainer**: Mike Cumming
**Last Updated**: 2025-12-09
