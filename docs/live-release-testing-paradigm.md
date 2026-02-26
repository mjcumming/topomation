# Live Release Testing Paradigm

**Last reviewed**: 2026-02-26  
**Scope**: release confidence for managed automations and HA registration behavior.

## Policy

1. Do not ship from mock-only evidence.
2. Every release must pass local comprehensive checks and a live HA contract test.
3. If live contract fails, stop release work and fix before version bump/tag.
4. Managed-action validation must run with an admin user/session (HA config APIs are admin-gated).

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

## What the Live Contract Must Prove

For managed action rules, against a running HA instance:

1. POST `config/automation/config/{id}` succeeds.
2. Rule appears in entity registry with `unique_id == config.id`.
3. `automation/config` returns metadata including Topomation marker.
4. DELETE `config/automation/config/{id}` removes the automation state.

## Why This Exists

This project previously had a blind spot: mocked/browser tests passed while
production installs still showed `Saving...` then unchecked managed actions.
The live gate closes that gap by validating the real HA APIs and registry
behavior on every release.
