# Occupancy lock workflows

## Why lock policies exist

Topomation occupancy has two separate concerns:

1. Occupancy propagation (child -> parent rollup)
2. Occupancy policy control (whether a location is allowed to become occupied/vacant)

Lock policies are the policy-control layer. They are designed to be driven by Home Assistant automations and helpers, not by direct Python method usage.

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

## Blueprints

This repository includes starter blueprints under:

- `blueprints/automation/topomation/away_mode_vacant_guard.yaml`
- `blueprints/automation/topomation/party_mode_hold_occupied.yaml`

They provide default automation wiring for the two canonical workflows.

## UI note

The location manager lock control remains a fast testing/operator surface. Production policy behavior should be expressed in Home Assistant automations using stable `source_id` values.
