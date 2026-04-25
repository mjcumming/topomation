# Installation Guide

This guide covers installing and first-run setup for the TopoMation Home Assistant integration.

## Prerequisites

- Home Assistant 2024.1.0 or newer
- HACS for the recommended install path
- Existing Home Assistant areas and, optionally, floors

The integration installs its `home-topology` dependency automatically through the manifest.

## Install with HACS

1. Ensure [HACS](https://hacs.xyz/) is installed.
2. Open **HACS** -> **Integrations**.
3. Open the menu -> **Custom repositories**.
4. Add `https://github.com/mjcumming/topomation`.
5. Choose **Integration** as the category.
6. Search for **TopoMation** and install it.
7. Restart Home Assistant.
8. Go to **Settings** -> **Devices & Services** -> **Add Integration** -> **TopoMation**.

## Manual install

1. Download the [latest release](https://github.com/mjcumming/topomation/releases) or clone the repository.
2. Copy `custom_components/topomation` into `config/custom_components/`.
3. Restart Home Assistant.
4. Add **TopoMation** in **Settings** -> **Devices & Services**.

## First-run setup

### 1. Prepare floors and areas in Home Assistant

TopoMation imports Home Assistant floors and areas. Create or review those first in:

`Settings -> Areas, labels & zones`

Recommended setup:

1. Create floors such as `Main Floor` or `Basement`.
2. Create areas such as `Kitchen`, `Living Room`, or `Garage`.
3. Assign relevant entities to those areas.

TopoMation can also create topology-only structure around those imported nodes:

- `property` for the top-level container (one household, even if it spans multiple buildings or includes outdoor grounds)
- `building` for an indoor root
- `grounds` for outdoor structure
- `subarea` for nested zones such as closets, pantries, or reading nooks

### 2. Open the TopoMation panel

After the integration loads, open **TopoMation** from the Home Assistant sidebar.

The main workspace is split into:

- the location tree on the left, with a compact **Occupancy** strip for the
  selected location (occupied/vacant, one latest note, optional timeout/lock
  hints—not a replacement for HA History or Logbook)
- a right-side inspector with:

- `Occupancy`
- `Ambient`
- `Lighting`
- `Appliances`
- `Media`
- `HVAC`

Admin access is required for panel use and managed automation writes.

### 3. Build your topology

1. Review the imported floors and areas.
2. Add `building`, `grounds`, or `subarea` nodes where helpful.
3. Reorganize locations in the tree as needed.

TopoMation does not replace Home Assistant floors and areas. It adds hierarchy on top of them.

### 4. Configure occupancy

Select a location and use the `Occupancy` tab to:

- add occupancy sources
- define timeout behavior
- configure sync relationships where needed
- decide intentionally whether your sources are additive coverage or one
  authoritative signal

Useful source examples:

- motion sensors
- door contacts
- mmWave presence sensors
- camera person-detection binary sensors
- smart switches or other entity state changes

Important mixed-source rule:

- if you configure both presence and motion for one location, both sources can
  keep that location occupied independently
- when presence turns off, it clears only the presence contribution; an active
  motion hold remains until its own timeout expires
- if you want presence to be authoritative, do not also configure motion or
  other occupancy contributors that can hold the room occupied

### Occupancy strip vs automations

The **Occupancy** strip (under the location tree) answers “is this location
occupied or vacant?” and surfaces the **latest** occupancy-related note when the
integration’s `recent_changes` buffer has entries; otherwise it shows the same
merged summary string as the panel logic. It is intentionally brief—not a full
contributor list or event feed.

That summary is **not** what drives your automations. Managed rules (for example
**Lighting** `On occupied` / `On vacant`) are stored as normal Home Assistant
automations and use the location **occupancy binary sensor** state (and any
ambient or schedule conditions you set). Use **History**, **Logbook**, and
automation **Traces** when you need a full event-by-event record.

### 5. Configure ambient behavior

Use the `Ambient` tab to:

- assign a lux sensor directly
- inherit ambient behavior from a parent location
- define dark and bright thresholds
- fall back to sunrise and sunset when needed

### 6. Create managed automations

Use the rule tabs to create native Home Assistant automations:

- `Lighting` for `light.*` targets (occupancy and ambient triggers, optional time window, per-light brightness)
- `Appliances` for standalone `fan.*` and `switch.*` targets (exhaust fans, plug-in heaters, anything not on a climate device chain)
- `HVAC` for `fan.*` entities linked to a `climate.*` device on the same device chain
- `Media` for `media_player.*` targets (power, playback, volume, mute)

Rules created here are stored as Home Assistant automations and appear in:

`Settings -> Automations & Scenes`

### 7. Validate the first room

For a quick first success:

1. Pick one room.
2. Add one detection source.
3. Set a timeout.
4. Add a simple `On occupied` and `On vacant` lighting rule.
5. Trigger the room and verify:
   - the location occupancy sensor changes
   - the managed automation appears in HA
   - HA traces show the rule firing

## Manual controls and services

The tree exposes quick operator controls for manual occupancy and lock testing.

These map to integration services:

- `topomation.trigger`
- `topomation.clear`
- `topomation.vacate`
- `topomation.vacate_area`
- `topomation.lock`
- `topomation.unlock`
- `topomation.unlock_all`

Lock-policy guidance: [docs/occupancy-lock-workflows.md](occupancy-lock-workflows.md)

## Locking and lock workflows

The simplest way to lock or unlock a location is the lock icon on its row in the tree. That holds the location's state (and its subtree) until you click the icon again.

For UI-driven automations and dashboards, every location also has a `switch.<location>_lock` entity. Turning it on locks the location with `freeze + subtree`; turning it off force-clears every lock source. The state mirrors any active lock, including locks held by the tree icon or by other automations.

For automation-driven workflows that need a specific mode, the `topomation.lock` and `topomation.unlock` services accept a `mode` (`freeze`, `block_occupied`, or `block_vacant`) and a `scope` (`self` or `subtree`). Common patterns:

- `mode=block_occupied` for away or security workflows (alarm armed away)
- `mode=block_vacant` for party mode or manual hold workflows
- `mode=freeze` for temporary testing or state-freeze scenarios

See [docs/occupancy-lock-workflows.md](occupancy-lock-workflows.md) for canonical patterns and `source_id` discipline.

## Troubleshooting

### Integration fails to load

- Check Home Assistant logs.
- Confirm the install completed and Home Assistant restarted cleanly.

### No locations appear

- Create at least one Home Assistant area.
- Reload the integration or restart Home Assistant.

### Occupancy is not changing

- Confirm the entity is assigned to the expected location.
- Confirm it was added as a source in `Occupancy`.
- For topology-only nodes such as `building`, `grounds`, and `subarea`, use explicit source assignment from the UI.

### Rule creation fails

- Confirm you are using an admin account.
- Confirm Home Assistant can create automations normally.
- Check browser dev tools for websocket failures.
- Check HA logs for `custom_components.topomation.managed_actions` errors.

## Uninstall

1. Go to **Settings** -> **Devices & Services**.
2. Remove **TopoMation**.
3. Delete `custom_components/topomation` if you installed manually.
4. Restart Home Assistant.
