# ADR-HA-100: HACS Review Boundaries

**Date**: 2026-11-05  
**Status**: APPROVED

## Context

The HACS default listing review found that the Topomation panel is admin-only
while its websocket commands are not, that rule create/delete/enable can target
any automation id, that startup and area events write guessed icons onto Home
Assistant areas the user already owns, that system health reads package metadata
on the event loop, and that the automation config API system user survives
uninstall.

## Decision

1. Decorate every Topomation websocket command with `@websocket_api.require_admin`.
2. Before creating over an existing id, deleting, or toggling, require a
   parseable `[topomation]` metadata line. A missing id may be created. Deleting
   a missing id is a no-op.
3. Write guessed Home Assistant area icons only for managed shadow areas and
   areas created from the panel (`sync_source: topology`).
4. Read `importlib.metadata.version("home-topology")` with
   `hass.async_add_executor_job`.
5. On `async_remove_entry`, when no other Topomation config entry remains,
   remove the generated `Topomation` system user with `hass.auth.async_remove_user`.
   Document that user in the README.

## Rationale

1. The sidebar already requires an administrator. The same gate belongs on the
   commands a non-admin can send directly.
2. Rule listing already ignores automations without Topomation metadata.
   Mutations need the same check before they call the config API or
   `automation.turn_on` / `turn_off`.
3. Home Assistant areas created outside Topomation belong to the user. Icon
   guesses stay on areas this integration created, or on an explicit panel edit.
4. Package metadata lookup reads the disk. System health info runs on the event
   loop.
5. The system user is an administrator with a long-lived refresh token. Removing
   the integration has to remove that credential too. People need to know the
   user exists.

## Consequences

- Non-admin websocket calls fail before any handler runs.
- Saving a rule with the id of a personal automation is rejected.
- Imported areas keep blank or custom icons across startup and registry updates.
- Uninstall of the last entry deletes the Topomation system user. A second
  config entry keeps the shared user.

## Alternatives Considered

- Admin-gate only the write commands. Rejected because the read commands also
  expose the full location model and the panel is already admin-only.
- Match automation ids by the `topomation_` prefix. Rejected because a caller can
  pass any id, and listing already trusts the metadata line.
