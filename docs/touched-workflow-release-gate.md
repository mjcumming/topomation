# Touched-Workflow Release Gate

**Last reviewed**: 2026-03-18  
**Status**: Active (Operational)  
**Purpose**: block release/live claims unless the exact workflows changed in the
current branch state were rerun and recorded.

This gate exists because broad test passes and older live runs did not protect
the exact workflow that changed.

**UI workflows:** For any workflow that involves a user action in the panel
(e.g. "Save rule", "Discard changes", "Shared Space"), "done" means that
**the user can perform that action in real Home Assistant** and we have a
recorded pass. The required evidence must include the **live browser path**
(e.g. Playwright spec that clicks Save in the panel and asserts the rule
exists in HA)—backend-only or mock-only evidence does not substitute. See
`docs/working-agreement.md` §5 (Definition of Done for UI Workflows).

## 1. Rule

If a change touches behavior, UI, persistence, or error handling for a workflow,
that exact workflow must be rerun before any `Released` or `Live-validated`
claim.

Previous evidence does not carry forward across later behavior changes.

## 2. Required Recording

Before release or live-validation claims, record:

1. Commit under test.
2. Frontend bundle rebuilt from that commit: `yes` / `no`.
3. Touched workflow list.
4. Commands run.
5. Outcome for each touched workflow.

## 3. Touched Workflow Inventory

Use concrete workflow names, not broad labels.

Good examples:

- `Detection save/discard draft flow`
- `Lighting rule card create/update/delete`
- `Media rule card create/update/delete`
- `HVAC rule card create/update/delete`
- `Managed action backend create rollback on registration timeout`
- `Live HA browser save path for managed rules`

Bad examples:

- `frontend`
- `automation`
- `misc fixes`

## 4. Validation Matrix

Run the rows that match the touched workflow.

| Touched area | Required evidence |
| --- | --- |
| Docs-only change | `./scripts/check-docs-consistency.sh` |
| Backend contract/runtime change | targeted `pytest` for touched modules/contracts |
| Frontend state/renderer change | `npm run test:unit` plus relevant Web Test Runner/component tests |
| Shared inspector/rule-card change | `ht-location-inspector.test.ts` plus relevant Playwright workflow specs |
| Managed rule create/update/delete change | targeted backend tests, **and** live HA browser workflow that performs the user gesture (e.g. `playwright/live-automation-ui.spec.ts`: click Save rule in panel, assert rule appears in HA). Backend-only evidence does not satisfy this row. |
| Release-candidate behavior change | full local gate plus live HA gate for touched workflows |

## 5. Exact-Branch Rules

1. Run validation after the last behavior change on the branch state to be
   tested or released.
2. If `topomation-panel.js` changed, validate the rebuilt committed bundle.
3. If a later commit changes the touched workflow, rerun the gate.
4. If the workflow changed after the last live HA pass, delivery returns to
   `Implemented`.
5. **Cadence:** After a workflow’s live gate has passed and been recorded, do
   not add further behavior changes to that workflow without re-running the
   gate and re-recording. Otherwise previous evidence is stale (see
   `docs/working-agreement.md` §6).

## 6. Blocking Outcomes

Release/live status is blocked if any of these are true:

1. A touched workflow is not named.
2. The exact workflow lacks required local/browser/live evidence.
3. The branch state under test does not match the recorded commit.
4. The runtime bundle was not rebuilt after frontend behavior changes.
5. Status docs claim `Released` or `Live-validated` without this gate.

## 7. Release Record Template

```md
Commit under test: <sha>
Frontend bundle rebuilt from same commit: yes/no

Touched workflows:
- <workflow 1>
- <workflow 2>

Commands run:
- <command>
- <command>

Outcome:
- <workflow 1>: PASS/FAIL
- <workflow 2>: PASS/FAIL
```

## 8. Current Release Candidate Record

Commit under test: **release-candidate worktree for Topomation `0.2.74`**
with sibling `home-topology` `1.0.5` installed into the local HA venv for live
validation. This candidate adds structured occupancy explanations and includes
the location-inspector run-on-startup dirty-state bug fix.
Frontend bundle rebuilt from same candidate: **yes** (`npm run build` via
`./scripts/test-comprehensive.sh`; committed `topomation-panel.js` also passed
`node --check` after the generated Lit regex whitespace cleanup).

Touched workflows:
- **Home-topology occupancy explanation contract**: occupancy states expose a
  structured `explanation` payload with holder provenance, grouped-origin
  metadata, latest transitions, lock holders, and suspended holds.
- **Topomation occupancy state projection/entity attributes**:
  `occupancy/states/list`, state-like websocket payloads, and occupancy binary
  sensors pass the structured `explanation` through.
- **Panel/tree/inspector occupancy reason rendering**: indefinite holders,
  occupancy-group peers, follow-parent/lock holders, and latest-transition
  fallbacks render as useful user-facing reasons instead of "no active reason".
- **Grouped occupancy projection recency**: projected grouped peers merge recent
  changes from the shared/effective runtime source so the UI can explain synced
  peer state.
- **Live occupancy projection event payload size**: occupancy state changed
  events publish only the changed location and grouped peers while websocket
  snapshots remain full.
- **Panel HA connection replacement**: the panel resubscribes to Topomation
  update events when Home Assistant swaps the connection object, even when
  hass-only renders are filtered.
- **Topology mutation panel refresh events**: successful `locations/create`
  mutations publish the production panel refresh event.
- **Location inspector action-rule hydration**: persisted
  `run_on_startup` settings hydrate into the editor dirty-state baseline so
  unchanged rules do not look modified.
- **Dependency pin/release metadata**: Topomation `0.2.74` pins
  `home-topology==1.0.5`; changelogs and contracts document the new contract.

Commands run:
- `cd /workspaces/home-topology && make check` — **PASS** (`ruff`, `mypy`,
  `PYTHONPATH=src pytest tests/`: 280 passed, 1 warning; 2026-04-27)
- `cd /workspaces/home-topology && python -m build` — **PASS**
  (`home_topology-1.0.5` sdist and wheel built; 2026-04-27)
- `cd /workspaces/home-topology && python -m twine check
  dist/home_topology-1.0.5*` — **PASS** (sdist and wheel metadata; 2026-04-27)
- `pytest /workspaces/home-topology/tests/test_occupancy_module.py -q` —
  **PASS** (18 passed; 2026-04-27)
- `pytest tests/test_websocket_contract.py -q -k
  "occupancy_group_id_uses_shared_runtime_state or
  occupancy_states_list_projects_group_members" --no-cov` — **PASS**
  (2 passed; 2026-04-27)
- `pytest tests/test_binary_sensor.py -q --no-cov` — **PASS** (5 passed;
  2026-04-27)
- `cd custom_components/topomation/frontend && npm test -- --run
  occupancy-reason.test.ts` — **PASS** (11 passed; 2026-04-27)
- `cd custom_components/topomation/frontend && npm test -- --run
  topomation-panel.test.ts` — **PASS** (38 passed; 2026-04-27)
- `pytest tests/test_websocket_contract.py::test_locations_create_fires_panel_update_event
  -q --no-cov` — **PASS** (1 passed; 2026-04-27)
- `cd custom_components/topomation/frontend && npm run build` — **PASS**
  (rebuilt `topomation-panel.js`; 2026-04-27)
- `cd custom_components/topomation/frontend && npx playwright test
  playwright/production-smoke.spec.ts --project=chromium` — **PASS**
  (4 passed; 2026-04-27)
- `./scripts/test-comprehensive.sh` — **PASS** (version sync `0.2.74`,
  `ruff`, `mypy`, backend `pytest`: 301 passed / 15 skipped, Vitest, Web Test
  Runner: 199 passed, frontend build, Playwright: 34 passed; 2026-04-27)
- `pytest
  tests/test_init.py::test_setup_entry_forwards_minimal_occupancy_projection_event
  tests/test_init.py::test_setup_entry_forwards_occupancy_changed_to_ha_bus -q
  --no-cov` — **PASS** (2 passed; 2026-04-27)
- `make test-release-live` — **PARTIAL PASS / live handoff failure**: local
  comprehensive matrix passed on `0.2.74`; live handoff failed because local HA
  was not running. Starting HA then exposed the expected pre-publish dependency
  issue until `home-topology 1.0.5` was installed into the HA venv.
- `/home/vscode/.local/ha-venv/bin/python -m pip install -e
  /workspaces/home-topology` — **PASS** (local HA venv now has
  `home-topology 1.0.5`; 2026-04-27)
- `/home/vscode/.local/ha-venv/bin/hass -c /workspaces/core/config --debug` —
  **PASS** (foreground HA API reachable and Topomation setup complete;
  2026-04-27)
- `TOPOMATION_PREFER_LOCAL_HA=1 HA_TARGET=dev
  ./tests/run-live-tests.sh tests/test-live-managed-actions-contract.py` —
  **PASS** (2 live HA contract tests; 2026-04-27)
- `HA_URL="http://localhost:8123" HA_TOKEN="$(cat ha_long_lived_token)"
  npx playwright test --config playwright.live.config.ts
  playwright/live-automation-ui.spec.ts` — **PASS** (6 live browser workflow
  tests, 2026-04-27)
- `rg -n
  "2026-04-27 18:5[0-9].*Event data for topomation_occupancy_state_changed exceed"
  /workspaces/core/config/home-assistant.log || true` — **PASS** (no 32KB
  recorder warning after the post-trim live run; 2026-04-27)
- `git diff --check` and
  `node --check custom_components/topomation/frontend/topomation-panel.js` —
  **PASS** after final bundle whitespace cleanup (2026-04-27)

Outcome:
- Version sync (`0.2.74`): **PASS**
- Home-topology structured occupancy explanation contract: **PASS**
- Topomation occupancy projection/entity explanation passthrough: **PASS**
- Occupancy reason rendering for indefinite/grouped/projected holders: **PASS**
- Grouped occupancy projection recency: **PASS**
- Live occupancy projection event payload size: **PASS**
- Panel HA connection replacement subscription: **PASS**
- Topology mutation panel refresh event: **PASS**
- Location inspector run-on-startup dirty-state hydration: **PASS**
- Frontend bundle parity: **PASS**
- Local comprehensive gate: **PASS**
- Live HA managed-action contract: **PASS**
- Live HA browser workflows: **PASS**

Notes:
- Local live validation required installing the sibling `home-topology 1.0.5`
  into the HA venv before publication because Topomation `0.2.74` pins that
  version. Release order is therefore: publish/tag `home-topology 1.0.5`, then
  push Topomation `0.2.74`.
- `make test-release-live` remains useful as the one-command gate, but this run
  used the split live path after starting HA in the foreground so the current
  workspace integration stayed loaded during the browser handoff.
- Live HA initially logged a recorder-size warning for full projection events;
  the event payload was trimmed and the post-trim live run did not reproduce the
  warning.
- After push to `main`, confirm CI and **Auto Release** are green for the
  release commit before considering the release complete.
