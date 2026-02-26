# Contracts

**Last reviewed**: 2026-02-25
**Purpose**: canonical behavior contracts for Topomation runtime and panel actions.

Use this file as the quick contract surface. Keep it synchronized with:
- `docs/architecture.md`
- `docs/adr-log.md`
- implementation under `custom_components/topomation/`

## C-001 Lock immutability

- Locked locations are immutable for manual occupancy overrides.
- Manual occupied/unoccupied controls must reject changes when the target is locked.
- Rejection must be user-visible (warning toast/message), not silent.
- Lock policy services (`lock`, `unlock`, `unlock_all`) are the valid paths to change lock state.

## C-002 Manual occupied action contract

- Tree/UI "set occupied" maps to:
  - `service: topomation.trigger`
  - `source_id: manual_ui`
- Timeout behavior:
  - if location config has `modules.occupancy.default_timeout` (number >= 0), pass it as `timeout`
  - otherwise service default applies (`timeout=300` seconds)

## C-003 Manual unoccupied action contract

- Tree/UI "set unoccupied" maps to:
  - `service: topomation.vacate_area`
  - `source_id: manual_ui`
  - `include_locked: false`
- This is intentional subtree vacate semantics, not source-level clear semantics.

## C-003A Authoritative source-off contract

- For detection sources configured with `off_event=clear`:
  - `off_trailing = 0` maps to authoritative vacant intent (`event_type=vacate`)
  - `off_trailing > 0` maps to source-level release (`event_type=clear` with timeout)
- Inspector "Test Off" mirrors this:
  - `off_trailing = 0` -> `service: topomation.vacate`
  - `off_trailing > 0` -> `service: topomation.clear`
- Lock directives remain authoritative (`block_vacant` may prevent transition to vacant).

## C-004 Service surface contract

Supported services in domain `topomation`:

1. `trigger(location_id, source_id?, timeout?, entry_id?)`
2. `clear(location_id, source_id?, trailing_timeout?, entry_id?)`
3. `vacate(location_id, entry_id?)`
4. `lock(location_id, source_id?, mode?, scope?, entry_id?)`
5. `unlock(location_id, source_id?, entry_id?)`
6. `unlock_all(location_id, entry_id?)`
7. `vacate_area(location_id, source_id?, include_locked?, entry_id?)`

Lock policy contract:
- `mode`: `freeze | block_occupied | block_vacant`
- `scope`: `self | subtree`

Multi-entry routing:
- If multiple Topomation entries are loaded and `entry_id` is omitted, service calls are rejected.

## C-005 Tree control contract

- Non-root rows expose:
  - occupancy toggle icon (`mdi:home` / `mdi:home-account`)
  - lock toggle icon (`mdi:lock*`)
- Occupancy icon reflects effective occupancy state for the location row.
- Lock icon reflects lock state from occupancy entity attributes (`is_locked`, `locked_by`).

## C-006 Persistence contract

Debounced autosave must be scheduled for:

1. successful `locations/reorder`
2. successful `locations/set_module_config`
3. `occupancy.changed` events

Additional save points:
- immediate save on integration unload
- save on Home Assistant stop event

## C-007 Documentation maintenance contract

- Contract changes must update this file in the same change.
- Decision-level changes must add/update ADR entries.
- Handoff/parallel context changes must update `docs/current-work.md`.

## C-008 Managed action dark-guard contract

- Managed action rows support an optional `Only when dark` guard.
- When enabled, created automation config must include:
  - `condition: state`
  - `entity_id: sun.sun`
  - `state: below_horizon`
- When disabled, no dark guard condition is added.
- This is the v1 behavior surface; lux/ambient guards are explicitly future enhancement.

## C-009 Managed action registration + reconciliation contract

- Managed occupied/vacant action edits are HA automation-config backed (`/api/config/automation/config/{id}`).
- Managed automation metadata must remain machine-parseable in description:
  - `Managed by Topomation.`
  - `[topomation] {"version":...,"location_id":...,"trigger_type":...}`
- If `config/entity_registry/list` is unavailable, action rule discovery must fall back
  to `hass.states` automation entities and continue operating.
- Inspector must reconcile external automation add/delete changes while open via
  `state_changed` (`automation.*`) subscription + debounced reload.
- UI save behavior requirement:
  - successful create/update/delete should not visually revert checkbox/select state
    during temporary HA registry/config eventual consistency windows.
  - if convergence polling times out, user gets explicit "saved, still syncing" feedback.
