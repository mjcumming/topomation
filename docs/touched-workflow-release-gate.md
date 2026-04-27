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

Commit under test: **release-candidate worktree for Topomation `0.2.73`**
(occupancy default projection, ambient lux defaults migration, release metadata).
Frontend bundle rebuilt from same commit: **yes** (`npm run build` →
committed `topomation-panel.js`; parity verified by
`./scripts/test-comprehensive.sh` and split live release gate on 2026-04-27).

Touched workflows:
- **Backend occupancy projection default state**: `occupancy/states/list`
  projects locations with no runtime occupancy record as known vacant instead of
  unknown.
- **Panel/tree/inspector occupancy rendering**: quiet rooms and structural
  rollups show vacant/off instead of unknown on initial panel load.
- **Ambient lux default authoring**: new lighting rules and fallback automation
  configs use 800 lux dark / 1200 lux bright defaults.
- **Ambient lux one-shot migration**: integration reload updates legacy
  default-looking 50/500 ambient configs while preserving custom thresholds.
- **Ideas/documentation tracking**: `docs/ideas.md` records deferred product
  ideas without changing runtime behavior.

Commands run:
- `pytest --no-cov tests/test_websocket_contract.py -k
  "missing_runtime or group_members"` — **PASS** (focused occupancy projection
  regression, 2026-04-27)
- `pytest --no-cov tests/test_ambient_config_defaults.py
  tests/test_managed_action_config_build_matrix.py -q` — **PASS** (ambient
  defaults and migration regression, 2026-04-27)
- `pytest` — **PASS** (300 passed, 15 skipped, 2026-04-27)
- `npm test` — **PASS** (196 browser component tests, 2026-04-27)
- `npm run build` — **PASS** (rebuilt `topomation-panel.js`, 2026-04-27)
- `./scripts/test-comprehensive.sh` — **PASS** (local comprehensive matrix,
  2026-04-27)
- `make test-release-live` — **PARTIAL PASS / wrapper failure**: local
  comprehensive matrix passed on `0.2.73`; the Make wrapper failed only after
  the wrapper-managed HA process exited before the live handoff.
- `./tests/run-live-tests.sh tests/test-live-managed-actions-contract.py` —
  **PASS** (real HA managed-action contract, 2026-04-27)
- `HA_URL="http://localhost:8123" HA_TOKEN="$(cat ha_long_lived_token)"
  npx playwright test --config playwright.live.config.ts
  playwright/live-automation-ui.spec.ts` — **PASS** (6 live browser workflow
  tests, 2026-04-27)

Outcome:
- Version sync (`0.2.73`): **PASS**
- Backend occupancy default projection: **PASS**
- Frontend quiet-room occupancy rendering: **PASS**
- Ambient defaults and one-shot migration: **PASS**
- Frontend bundle parity: **PASS**
- Local comprehensive gate: **PASS**
- Live HA managed-action contract: **PASS**
- Live HA browser workflows: **PASS**

Notes:
- `make test-release-live` exposed a local HA process-wrapper problem: HA was
  reachable briefly, then exited before the live test handoff. Running HA in the
  foreground and executing the same live contract/browser commands passed.
- After push to `main`, confirm CI and **Auto Release** are green for the
  release commit before considering the release complete.
