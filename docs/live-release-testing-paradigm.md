# Live Release Testing Paradigm

**Last reviewed**: 2026-02-27  
**Scope**: release confidence for managed automations and HA registration behavior.

## Policy

1. Do not ship from mock-only evidence.
2. Every release must pass local comprehensive checks and a live HA contract test.
3. If live contract fails, stop release work and fix before version bump/tag.
4. Managed-action validation must run with an admin user/session (HA config APIs are admin-gated).
5. In this dev-container workflow, run the live gate against the local
   in-container `hass` runtime/API path (no remote probing).

## Token Handling (Local Only)

1. Store HA token only in `tests/ha-config.env`.
2. `tests/ha-config.env` is gitignored and must stay local.
3. Keep permissions strict:

```bash
chmod 600 tests/ha-config.env
```

4. Never commit raw tokens into tracked docs/code.

## Required Release Gate

Run this from repo root:

```bash
make test-release-live
```

This runs:

1. `scripts/test-comprehensive.sh` (backend, frontend unit, browser suites, build parity)
2. `tests/run-live-tests.sh tests/test-live-managed-actions-contract.py` (real HA API contract)

The live contract gate is strict: it fails if the Topomation integration is not
loaded in the target HA instance.

## What the Live Contract Must Prove

For managed action rules, against a running HA instance:

1. Topomation rule create/list/delete flows work end-to-end against real HA APIs.
2. Created rule appears in entity registry with `unique_id == config.id`.
3. `automation/config` returns metadata including the Topomation marker payload.
4. Delete flow removes the automation state cleanly.
5. Panel-managed path is WebSocket-first (`topomation/actions/rules/*`); backend
   code is responsible for HA automation mutations.

## Why This Exists

This project previously had a blind spot: mocked/browser tests passed while
production installs still showed `Saving...` then unchecked managed actions.
The live gate closes that gap by validating the real HA APIs and registry
behavior on every release.
