# ADR-HA-098: Idempotent Panel Registration on Reload

**Date**: 2026-08-22  
**Status**: APPROVED

## Context

`frontend.async_register_built_in_panel()` raises `ValueError: Overwriting panel
topomation` unless `update=True`. Topomation registered panels without that flag
and did not remove them on unload.

A config-entry reload (or a leftover panel after a failed unload) then aborted
`async_setup_entry` before platforms were forwarded. Occupancy binary sensors
and lock switches stayed as restored `unavailable` stubs without `location_id`.
The panel could still show kernel occupancy, but occupancy-triggered managed
rules failed with `No occupancy binary sensor found for location ...`.

## Decision

1. Re-register Topomation panel routes with
   `frontend.async_register_built_in_panel(..., update=True)`.
2. Register frontend static asset paths once per Home Assistant process.
3. Remove those panel routes when the last config entry unloads
   (`warn_if_unknown=False`).

## Rationale

1. Home Assistant already documents `update=True` as the overwrite path.
2. Setup must finish platform forwarding even when a previous panel route is
   still registered.
3. Occupancy and lock entities are the public HA surface used by managed-rule
   codegen; they cannot depend on a clean first-boot-only panel register.

## Consequences

- Reload and re-setup no longer fail solely because the sidebar panel exists.
- Last-entry unload clears Topomation sidebar/alias routes.
- Static asset paths remain registered for the process lifetime.
