# Issue [ISSUE-052]: Live HA Test Environment Setup

**Epic**: [EPIC-002] Testing Coverage
**Status**: Complete
**Created**: 2026-02-24
**Priority**: Critical — blocks v0.1.0 release

---

## Objective

Stand up a working Home Assistant dev instance in Docker with simulated dummy
entities so the team can execute the live-HA validation checklist without
requiring real physical hardware.

---

## Context

The integration has never been validated on a live HA instance. The Docker
infrastructure already exists (`tests/docker-compose.test-ha.yml`, `make test-ha-up`),
but there is no `tests/test-ha-config/` directory with a `configuration.yaml` to
provide simulated entities. This issue covers creating that config and completing
first-time HA setup.

---

## Acceptance Criteria

- [x] `tests/test-ha-config/configuration.yaml` exists with all dummy entities defined
- [x] HA Core starts successfully from `/workspaces/core/config` (`hass -c /workspaces/core/config`)
- [x] HA onboarding is complete and the instance is accessible at `http://localhost:8123`
- [x] Floors and Areas from the test topology are created in HA Settings
- [x] Dummy entities are assigned to their correct areas
- [x] Topomation integration is installed and loads without errors in HA logs
- [x] Topology panel opens and shows the imported floor/area structure

## Current Notes (2026-02-24)

- Runtime model for current validation is HA Core dev environment (`/workspaces/core`) instead of `tests/docker-compose.test-ha.yml`.
- `topomation/locations/list` returns synced floor/area locations, including `Ground Floor`, `First Floor`, and `Garage`.
- `home_topology` config entry is loaded after correcting manifest requirement syntax to `home-topology==0.2.0a0`.
- Motion/presence sensors, template lights, and `media_player.living_room_tv` are assigned to expected areas.
- `media_player.living_room_tv` now uses `unique_id: living_room_tv` so it appears in entity registry and supports explicit area assignment.
- Panel/hierarchy confirmation completed on 2026-02-24 via Playwright harness e2e (`10/10` passing) plus HA runtime panel registration logs for `/topomation`, `/topomation-occupancy`, and `/topomation-actions`.

---

## Test Topology Structure

From `docs/setup-test-topology.md`:

```
Ground Floor
├── Living Room
├── Kitchen
└── Hallway

First Floor
├── Main Bedroom
└── Guest Bedroom

(Unassigned / root)
└── Garage
```

---

## Dummy Entity Specification

### Motion Sensors (via input_boolean + template)

Use `input_boolean` helpers as the control mechanism (toggleable from the HA UI
and Developer Tools without hardware). Wrap each in a `template` binary_sensor
with `device_class: motion` so they look like real sensors to the integration.

| Entity ID | Area | Notes |
|-----------|------|-------|
| `binary_sensor.living_room_motion` | Living Room | template → `input_boolean.sim_living_room_motion` |
| `binary_sensor.kitchen_motion` | Kitchen | template → `input_boolean.sim_kitchen_motion` |
| `binary_sensor.hallway_motion` | Hallway | template → `input_boolean.sim_hallway_motion` |
| `binary_sensor.main_bedroom_motion` | Main Bedroom | template → `input_boolean.sim_main_bedroom_motion` |
| `binary_sensor.main_bedroom_presence` | Main Bedroom | template → `input_boolean.sim_main_bedroom_presence`, device_class: presence |
| `binary_sensor.guest_bedroom_motion` | Guest Bedroom | template → `input_boolean.sim_guest_bedroom_motion` |
| `binary_sensor.garage_motion` | Garage | template → `input_boolean.sim_garage_motion` |

### Lights (via demo platform)

| Entity ID | Area |
|-----------|------|
| `light.living_room_main` | Living Room |
| `light.kitchen_ceiling` | Kitchen |
| `light.main_bedroom_lamp` | Main Bedroom |

### Media Players (via demo platform)

| Entity ID | Area | Purpose |
|-----------|------|---------|
| `media_player.living_room_tv` | Living Room | Signal-key source testing (playback/volume/mute) |

---

## Implementation Steps

### Step 1: Create configuration.yaml

Create `tests/test-ha-config/configuration.yaml` with:

```yaml
# Input booleans — simulated motion/presence sources
input_boolean:
  sim_living_room_motion:
    name: "SIM Living Room Motion"
  sim_kitchen_motion:
    name: "SIM Kitchen Motion"
  sim_hallway_motion:
    name: "SIM Hallway Motion"
  sim_main_bedroom_motion:
    name: "SIM Main Bedroom Motion"
  sim_main_bedroom_presence:
    name: "SIM Main Bedroom Presence"
  sim_guest_bedroom_motion:
    name: "SIM Guest Bedroom Motion"
  sim_garage_motion:
    name: "SIM Garage Motion"

# Template binary sensors — wrap booleans to look like real sensors
template:
  - binary_sensor:
      - name: "Living Room Motion"
        unique_id: living_room_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_living_room_motion', 'on') }}"
      - name: "Kitchen Motion"
        unique_id: kitchen_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_kitchen_motion', 'on') }}"
      - name: "Hallway Motion"
        unique_id: hallway_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_hallway_motion', 'on') }}"
      - name: "Main Bedroom Motion"
        unique_id: main_bedroom_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_main_bedroom_motion', 'on') }}"
      - name: "Main Bedroom Presence"
        unique_id: main_bedroom_presence
        device_class: presence
        state: "{{ is_state('input_boolean.sim_main_bedroom_presence', 'on') }}"
      - name: "Guest Bedroom Motion"
        unique_id: guest_bedroom_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_guest_bedroom_motion', 'on') }}"
      - name: "Garage Motion"
        unique_id: garage_motion
        device_class: motion
        state: "{{ is_state('input_boolean.sim_garage_motion', 'on') }}"

# Demo platform — lights and media players without hardware
demo:
```

### Step 2: Start the Container

```bash
make test-ha-up
# Watch logs until HA is ready:
make test-ha-logs
# Open: http://localhost:8124
```

### Step 3: Complete HA Onboarding

- Create a user account (e.g., `admin` / choose a password)
- Skip device discovery
- Set location and timezone

### Step 4: Create Floors and Areas

In **Settings → Areas, labels & zones**:

1. Create floor: `Ground Floor`
2. Create floor: `First Floor`
3. Create areas: `Living Room`, `Kitchen`, `Hallway` → assign to Ground Floor
4. Create areas: `Main Bedroom`, `Guest Bedroom` → assign to First Floor
5. Create area: `Garage` → no floor assigned

### Step 5: Assign Entities to Areas

In each area's settings, add the corresponding entities:
- Living Room: `binary_sensor.living_room_motion`, `light.living_room_main`, `media_player.living_room_tv`
- Kitchen: `binary_sensor.kitchen_motion`, `light.kitchen_ceiling`
- Hallway: `binary_sensor.hallway_motion`
- Main Bedroom: `binary_sensor.main_bedroom_motion`, `binary_sensor.main_bedroom_presence`, `light.main_bedroom_lamp`
- Guest Bedroom: `binary_sensor.guest_bedroom_motion`
- Garage: `binary_sensor.garage_motion`

### Step 6: Install Topomation

In **Settings → Integrations → Add Integration**:

- Search for "Topomation"
- Complete setup wizard
- Verify no errors in **Settings → System → Logs**

### Step 7: Verify Panel

- Open the Topomation panel from the sidebar
- Confirm `Ground Floor` and `First Floor` appear as root nodes
- Confirm all areas appear under correct floors
- Confirm `Garage` appears at root (no floor)

---

## Verification

Once setup is complete, run the validation checklist from `docs/live-ha-validation-checklist.md`
and record results in ISSUE-051.

---

## Artifacts

- `tests/test-ha-config/configuration.yaml` — dummy entity config (created by this issue)
- `docs/live-ha-validation-checklist.md` — what to run after setup
- ISSUE-051 — where results are recorded
