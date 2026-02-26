# Installation Guide — Topomation v0.1.0

This guide covers installing the Topomation integration on Home Assistant for v0.1.0 (alpha).

## Prerequisites

- Home Assistant 2024.1.0 or newer
- Python 3.12+ (HA 2024.x uses Python 3.12)
- The `home-topology` core library (installed automatically via manifest)

## Installation Methods

### HACS (Recommended)

1. Ensure [HACS](https://hacs.xyz/) is installed.
2. Open **HACS** → **Integrations**.
3. Click the three-dots menu → **Custom repositories**.
4. Add: `https://github.com/mjcumming/topomation`
5. Choose **Integration** as the category and add.
6. Search for **Topomation** and click **Download**.
7. Restart Home Assistant.
8. Go to **Settings** → **Devices & Services** → **Add Integration** → **Topomation**.

### Manual

1. Download the [latest release](https://github.com/mjcumming/topomation/releases) or clone the repository.
2. Copy the `custom_components/topomation` directory into your Home Assistant `config/custom_components/` directory.
3. Restart Home Assistant.
4. Go to **Settings** → **Devices & Services** → **Add Integration** → **Topomation**.

## Post-Installation

### 1. Configure the Integration

The integration uses a config flow. After adding it, you will be guided through setup. No additional configuration is required for basic use.

### 2. Create Areas and Floors

Areas and Floors are managed in Home Assistant Settings:

1. Go to **Settings** → **Areas, labels & zones**.
2. Create Floors (e.g., Ground Floor, First Floor).
3. Create Areas and assign them to floors.
4. Assign entities (motion sensors, lights) to areas.

Optional topology wrappers managed by Topomation UI:

1. Create `building` and/or `grounds` root nodes for structural grouping.
2. Nest HA-backed floors/areas under those wrappers as needed.
3. Use `subarea` nodes for child zones under an area (for example Pantry under Kitchen).

### 3. Import into Topology

The integration automatically imports your HA areas and floors on startup. To force a re-import:

- Reload the Topomation integration from **Settings** → **Devices & Services**, or
- Restart Home Assistant.

### 4. Open the Manager

The integration exposes one primary sidebar panel:

- **Location Manager**: Topology/hierarchy management with occupancy and actions
  tabs in the right panel (`Detection`, `On Occupied`, `On Vacant`).
  Access requires an admin user session.
  Action rules created in `On Occupied` / `On Vacant` are native Home Assistant
  automations (not integration-local rule storage).
  The built-in action composer is intentionally opinionated for common cases:
  media players only expose `Stop` and `Turn off` actions.
  If you want play/turn-on behavior on occupancy, use Topomation occupancy entities
  as triggers in your own HA automations.

Deep-link aliases are also available (same panel, different default focus):

- `/topomation-occupancy`
- `/topomation-actions`

### 5. Manual occupancy controls in the tree

Each non-root location row in the left tree includes:

- Occupancy icon (`mdi:home` / `mdi:home-account`) to manually mark occupied or unoccupied
- Lock icon (`mdi:lock*`) to lock/unlock occupancy state

Behavior contract:

- Mark occupied calls `topomation.trigger` with `source_id=manual_ui`
- Mark unoccupied calls `topomation.vacate_area` with `source_id=manual_ui`
- If the location is locked, manual occupancy changes are blocked and a warning is shown

### 6. Automation-first lock policies (recommended)

Topomation lock behavior is intended to be driven from HA automations:

- `topomation.lock` supports:
  - `mode=freeze`
  - `mode=block_occupied` (away/security)
  - `mode=block_vacant` (party/manual hold)
  - `scope=self|subtree`
- Release with `topomation.unlock` (same `source_id`) or `topomation.unlock_all`.

Two starter blueprints are provided in this repository:

- `blueprints/automation/topomation/away_mode_vacant_guard.yaml`
- `blueprints/automation/topomation/party_mode_hold_occupied.yaml`

Import those files into HA blueprint editor, then create automations from the imported blueprints.

## Troubleshooting

### Integration fails to load

- Check the [Home Assistant logs](https://www.home-assistant.io/docs/configuration/logging/) for errors.
- Ensure `home-topology==1.0.0` is installed (it should install automatically; if not, install via pip in your HA environment).

### No locations appear

- Create at least one Area in **Settings** → **Areas, labels & zones**.
- Reload the integration or restart Home Assistant.

### Occupancy entities not updating

- Ensure motion sensors (or other sources) are assigned to the correct areas.
- Add the entity as an occupancy source in the Location Manager panel
  (select location → `Detection` tab → Add Source).
- For integration-owned nodes (`building`, `grounds`, `subarea`), use explicit **Add Source** assignment from HA entities.

### Action rule create/delete fails

- Confirm your user has admin rights (HA automation config APIs require admin).
- Open **Settings** → **Automations & Scenes** and verify automations can be created manually.
- If occupancy actions still fail, check HA logs for `config/automation/config` errors.

## Uninstallation

1. Go to **Settings** → **Devices & Services**.
2. Find **Topomation** and click the three dots → **Delete**.
3. Remove `custom_components/topomation` if you installed manually.
4. Restart Home Assistant.
