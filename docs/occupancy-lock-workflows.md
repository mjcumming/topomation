# Occupancy lock workflows

## Why lock policies exist

Topomation occupancy has two separate concerns:

1. Occupancy propagation (child -> parent rollup)
2. Occupancy policy control (whether a location is allowed to become occupied/vacant)

Lock policies are the policy-control layer. They are designed to be driven by Home Assistant automations and helpers, not by direct Python method usage.

## Lock switch entity

Every non-shadow-host location exposes a `switch.<location>_lock` entity (per ADR-HA-090). Toggling it on calls `topomation.lock` with `mode=freeze`, `scope=subtree`, `source_id=switch_entity`. Toggling it off calls `topomation.unlock_all`, which force-clears every lock source on the location, including locks held by other automations or the tree icon. State mirrors `is_locked` from the location's occupancy binary sensor.

Use the switch when you want a Lovelace toggle, a voice command, or a UI-built automation. Use the services below when you need a specific mode (`block_occupied` / `block_vacant`) or source-scoped unlock semantics.

## Service contract

Use `topomation.lock` with `source_id`, `mode`, and `scope`:

- `mode=freeze`: freeze local occupancy state and suspend timers
- `mode=block_occupied`: prevent occupied transitions
- `mode=block_vacant`: prevent vacant transitions
- `scope=self`: affect only the target location
- `scope=subtree`: affect target + descendants

Release policies with:

- `topomation.unlock(location_id, source_id)`
- `topomation.unlock_all(location_id)`

`source_id` is required for deterministic unlock behavior in multi-automation setups.

## Canonical use cases

### Away/security

Goal: keep home effectively vacant while alarm is armed away.

- Action on away: `topomation.lock(mode=block_occupied, scope=subtree)` at `house`
- Action on disarm/home: `topomation.unlock` with the same `source_id`

### Party/manual hold

Goal: keep selected area occupied so vacancy automations do not clear lights/scenes.

- Action on party on: `topomation.lock(mode=block_vacant, scope=subtree)` at `main_floor`
- Action on party off: `topomation.unlock` with the same `source_id`

## UI note

The location manager lock control remains a fast testing/operator surface. Production policy behavior should be expressed in Home Assistant automations using stable `source_id` values.

Current manual tree-control behavior:

- `Lock` applies `freeze + subtree` for the selected location (`source_id=manual_ui`).
- `Unlock` is a force-clear operator action for the selected subtree (clears all
  lock sources under that subtree).
- Lock holder labels in UI should be human-readable (for example `Manual panel`)
  when available.
