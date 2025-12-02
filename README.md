# Home Topology - Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

A Home Assistant integration for modeling your home's spatial topology and attaching behavior modules to locations.

## Features

- **Location Hierarchy**: Model floors, rooms, zones, and suites
- **Occupancy Tracking**: Attach sensors to locations for presence detection
- **Behavior Modules**: Configure location-specific behaviors
- **Visual Manager**: Sidebar panel for configuration

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots menu → Custom repositories
3. Add `https://github.com/mike/home-topology-ha` as an Integration
4. Search for "Home Topology" and install
5. Restart Home Assistant
6. Go to Settings → Devices & Services → Add Integration → Home Topology

### Manual

1. Copy `custom_components/home_topology` to your `config/custom_components/` directory
2. Restart Home Assistant
3. Go to Settings → Devices & Services → Add Integration → Home Topology

## Usage

After installation, "Location Manager" appears in the sidebar. Use it to:

1. Create locations (floors, rooms, zones)
2. Organize them hierarchically
3. Configure occupancy settings per location
4. Assign sensors to locations

## Development

This integration uses the [home-topology](https://github.com/mike/home-topology) Python library.

### Setup Development Environment

```bash
# Clone the repo
git clone https://github.com/mike/home-topology-ha
cd home-topology-ha

# Symlink into your HA config
ln -s $(pwd)/custom_components/home_topology \
      /path/to/ha-config/custom_components/home_topology

# Restart HA
```

### Frontend Development

The panel is built with Lit. Source files are in `custom_components/home_topology/frontend/`.

```bash
# Install dependencies (when we add build step)
npm install

# Build
npm run build
```

## License

MIT License - see [LICENSE](LICENSE)

