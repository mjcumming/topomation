# Topomation Integration Implementation Review

**Date**: 2026-02-25

## Overview

The Topomation integration is a Home Assistant custom component that bridges HA to the `home_topology` kernel (occupancy, automation, ambient light). This document summarizes the implementation and notes for testing.

---

## Architecture Summary

| Layer | Role |
|-------|------|
| **Config flow** | Single-instance integration; no user input required. |
| **`__init__.py`** | Creates kernel (LocationManager, EventBus), loads/restores config and state, wires modules (occupancy, automation, ambient), SyncManager, EventBridge, coordinator, persistence, and platforms. |
| **SyncManager** | Imports HA areas/floors/entities into topology; subscribes to area/floor/entity registry changes for live sync. |
| **EventBridge** | Listens to `state_changed`; maps entity state to occupancy v3 signals (trigger/clear) and policy actions (e.g. vacate_area). |
| **Coordinator** | Schedules next timeout across modules via `get_next_timeout` / `check_timeouts(now)`. |
| **Platforms** | binary_sensor (occupancy + ambient is_dark/is_bright), sensor (ambient light level). |
| **Panel / WebSocket / Services** | Location Manager panel, WebSocket API for CRUD and ambient/sync, and services (trigger, clear, lock, unlock, vacate_area). |

---

## Strengths

1. **Clear setup sequence** — `async_setup_entry` follows a documented order: kernel → load config → modules → attach → default configs → restore state → coordinator → sync manager → bootstrap roots if needed → event bridge → debounced persist → store in `hass.data` → panel/API/services → platforms → timeout schedule → shutdown save.
2. **Separation of concerns** — SyncManager handles HA→topology; EventBridge handles state→occupancy signals and policy; coordinator handles time; persistence is debounced and explicit.
3. **Occupancy v3 alignment** — Event bridge uses trigger/clear, source_id, signal_key (e.g. playback, power, level), and respects occupancy_sources and policy_sources from location config.
4. **Bootstrap and migration** — First-run creates home/building/grounds roots; legacy "house" root is skipped on restore; root-only structural wrappers normalized; floors can be reparented to default building.
5. **Persistence** — Config (locations, hierarchy, entity_ids, module configs) and module state saved to HA Store; autosave debounced; save on shutdown and unload.
6. **HAPlatformAdapter** — AmbientLightModule gets numeric/state/device_class/unit from HA entities without coupling core to HA.

---

## Minor Notes

1. **Import style** — Some files use `from home_topology import EventBus, EventFilter, LocationManager` (or `Event`), others `from home_topology.core.bus import Event, EventBus, EventFilter`. Both work (package re-exports from `core.bus`); standardizing on the public `home_topology` API would be slightly cleaner.
2. **Logger** — For live testing, add `custom_components.topomation: debug` (and optionally `home_topology: debug`) in `configuration.yaml` under `logger.logs` to trace bridge and kernel behavior.
3. **Manifest** — `requirements`: `["home-topology==1.0.0"]`. Ensure the installed `home-topology` version satisfies this.

---

## Testing Checklist (Live HA)

- [ ] Integration installs and loads (Settings → Devices & Services → Add → Topomation).
- [ ] Location Manager panel opens; floors/areas appear after sync.
- [ ] Toggling simulated motion (e.g. `input_boolean.sim_living_room_motion`) updates occupancy binary sensors.
- [ ] Occupancy state persists across restart (and optional config/state inspection in `.storage`).
- [ ] Timeout scheduling runs (e.g. motion off → vacant after configured timeout).
- [ ] Policy reconciliation runs once at startup and vacates configured scopes when policy entity state matches.
- [ ] WebSocket APIs respond (e.g. locations list, ambient get_reading) and panel tree reflects updates.

See `docs/live-ha-validation-checklist.md` for the full validation list.

---

## File Reference

| File | Purpose |
|------|---------|
| `__init__.py` | Setup/unload, kernel lifecycle, modules, SyncManager, EventBridge, coordinator, persistence. |
| `config_flow.py` | Single-instance config flow. |
| `const.py` | Domain, storage keys, panel URLs, WebSocket message types. |
| `coordinator.py` | Timeout scheduling. |
| `event_bridge.py` | state_changed → occupancy.signal + policy vacate. |
| `sync_manager.py` | HA areas/floors/entities → topology; live registry listeners. |
| `binary_sensor.py` | Occupancy + ambient (is_dark, is_bright) entities. |
| `sensor.py` | Ambient light level entities. |
| `panel.py` / `websocket_api.py` / `services.py` | UI and API. |
