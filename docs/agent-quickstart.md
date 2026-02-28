# Agent quickstart for topomation

**Last reviewed**: 2026-02-26
**Purpose**: fast, deterministic startup context for AI and human contributors.

## 1) Working directory and repo boundary

- Integration repo: `/workspaces/topomation`
- Home Assistant core repo: `/workspaces/core` (used for dev runtime and host context)
- For Topomation feature work, start with:

```bash
cd /workspaces/topomation
```

## 2) Read first (strict order)

1. `docs/index.md` (doc map + policy source order)
2. `docs/current-work.md` (active branch/session context for parallel work)
3. `docs/contracts.md` (hard behavior and API/UI contracts)
4. `docs/architecture.md` (detailed architecture and flow)
5. `docs/adr-log.md` (decision history for tradeoffs and rationale)

## 3) High-signal repo map

- `custom_components/topomation/`: integration runtime code
- `custom_components/topomation/frontend/`: Lit UI and frontend tests
- `tests/`: backend and integration test suites
- `docs/`: active architecture/contracts/operations docs
- `project/`: roadmap, epics, and issue-level execution planning

## 4) Standard commands

```bash
# Docs and policy checks
bash scripts/check-docs-consistency.sh

# Backend checks
make test-quick
make lint
make typecheck

# Frontend checks
cd custom_components/topomation/frontend
npm run test:unit
npm run test            # Auto-resolves CHROME_PATH via Playwright Chromium
npm run build
diff -u dist/topomation-panel.js topomation-panel.js

# Full local release gate (mirrors CI breadth)
cd /workspaces/topomation
./scripts/test-comprehensive.sh

# Optional live managed-action contract gate (requires tests/ha-config.env)
set -a
source tests/ha-config.env
set +a
pytest tests/test-live-managed-actions-contract.py -v --live-ha
```

- Dependency release workflow (version pin + smoke validation):
  - `docs/dependency-release-runbook.md`
- Release-candidate workflow:
  - `docs/release-validation-runbook.md`

## 5) Home Assistant runtime (dev container)

- Canonical runbook: `tests/DEV-CONTAINER-HA.md`
- Daily backend/frontend/live-validation loop: `tests/DEV-CONTAINER-HA.md` ("Daily Change Workflow")
- Hard rule: this workflow is process-managed (`hass`) inside the existing dev container. Do not use Docker lifecycle commands for restart/control.
- Hard rule: validate managed-action behavior against the local in-container
  `hass` runtime. Do not run remote-HA probing as part of this workflow.
- Default working directory: `/workspaces/topomation`
- Default dev HA config path: `/workspaces/core/config`
- Optional isolated test HA config path: `/workspaces/topomation/tests/test-ha-config`
- Start HA:

```bash
hass -c /workspaces/core/config --debug
```

- Restart HA: stop the running `hass` process and run the same command again, or use the HA API restart endpoint with `tests/ha-config.env`.

## 6) Change-routing rules

- If behavior or invariants changed: update `docs/contracts.md` in the same change.
- If architecture flow changed: update `docs/architecture.md` in the same change.
- If the change is a meaningful long-lived decision: add/update ADR in `docs/adr-log.md`.
- If work is in progress or handed off: update `docs/current-work.md`.
- If you discover a recurring environment/workflow prerequisite while fixing something
  (example: browser path/tooling prereq), automate it where possible and document it
  in active workflow docs in the same change.

## 7) Fast done checklist

1. Code/tests updated
2. Contracts/docs updated
3. `bash scripts/check-docs-consistency.sh` passes
4. Session/handoff state reflected in `docs/current-work.md`
