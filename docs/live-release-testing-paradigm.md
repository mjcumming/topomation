# Live Release Testing Paradigm

**Last reviewed**: 2026-02-27  
**Scope**: release confidence for managed automations, runtime behavior, and HA
registration behavior.

## Policy

1. Do not ship from mock-only evidence.
2. Every release must pass local comprehensive checks and the isolated
   dev-container HA e2e gate.
3. If the HA dev e2e gate fails, stop release work and fix before version
   bump/tag.
4. Managed-action validation must run with an admin user/session (HA config APIs are admin-gated).
5. In this dev-container workflow, run the required gate against the isolated
   in-container `hass -c tests/ha-dev-runtime` runtime/API path (no remote
   probing).
6. Use delivery status precisely:
   - passing local/mock/browser checks -> `Implemented`
   - successful live HA gate -> `Live-validated`
7. `make test-production-shaped` is the required release gate. Production/home
   validation is optional `prod-smoke` evidence.

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
make test-production-shaped
```

This runs:

1. `scripts/test-comprehensive.sh` (backend, frontend unit, browser suites, build parity)
2. `scripts/run-ha-dev-e2e.sh` (isolated HA dev runtime, backend e2e, and real-panel Playwright)

The HA dev e2e gate is strict: it fails if the Topomation integration is not
loaded, HA websocket commands are missing, automations do not register, service
payloads are invalid, or real-panel workflows fail.

## What the Live Contract Must Prove

For managed action rules and core runtime behavior, against the isolated HA dev
runtime:

1. Topomation rule create/list/delete flows work end-to-end against real HA APIs.
2. Created rule appears in entity registry with `unique_id == config.id`.
3. `automation/config` returns metadata including the Topomation marker payload.
4. Delete flow removes the automation state cleanly.
5. Panel-managed path is WebSocket-first (`topomation/actions/rules/*`); backend
   code is responsible for HA automation mutations.
6. Real browser interaction matches the contracted UI lifecycle on a running HA
   instance served from the current workspace bundle; do not rely on mock-only
   Playwright evidence.

## Why This Exists

This project previously had a blind spot: mocked/browser tests passed while
production installs still showed `Saving...` then unchecked managed actions.
The live gate closes that gap by validating the real HA APIs and registry
behavior, plus the real browser workflow, on every release.
