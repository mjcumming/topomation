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

Commit under test: **release-candidate worktree for Topomation `0.2.66`**
(managed-shadow frontend graph preservation + release metadata).
Frontend bundle rebuilt from same commit: **yes** (`npm run build` →
committed `topomation-panel.js`; parity verified by
`diff -u dist/topomation-panel.js topomation-panel.js`,
`./scripts/test-comprehensive.sh`, and `make test-release-live`).

Touched workflows:
- **Structural-host action-rule target enumeration** (frontend):
  `property`, `building`, `grounds`, and `floor` rows keep managed shadow
  rows hidden from the tree while preserving the full backend location graph
  for inspector lookups. Lighting / Media / HVAC / Appliances can resolve
  `_meta.shadow_area_id -> shadow.ha_area_id` and enumerate devices from
  the host's managed shadow HA area.
- **Managed shadow frontend state boundary** (frontend/docs): panel state now
  separates the canonical full location graph from the visible tree/selection
  list so tree hiding cannot remove system rows from semantic lookup context.

Commands run:
- `npm run test -- topomation-panel.test.ts`
- `npm run test:unit`
- `npm run test`
- `npm run build`
- `diff -u dist/topomation-panel.js topomation-panel.js`
- `bash scripts/check-docs-consistency.sh`
- `./scripts/test-comprehensive.sh`
- `source tests/ha-config.env && HA_URL_DEV="${HA_URL_LOCAL:-http://localhost:8123}" HA_TOKEN_DEV="${HA_TOKEN_LOCAL:-$HA_TOKEN_DEV}" make test-release-live`

Outcome:
- Version sync (`0.2.66`): **PASS** (2026-04-24)
- Focused panel regression (`npm run test -- topomation-panel.test.ts`):
  **PASS** (2026-04-24) — 34 panel tests green, including hidden managed
  shadow rows feeding structural-host Lighting target enumeration.
- Frontend unit suite (`npm run test:unit`): **PASS** (2026-04-24) —
  249 tests green.
- Frontend browser suite (`npm run test`): **PASS** (2026-04-24) —
  189 browser tests green.
- Docs consistency (`bash scripts/check-docs-consistency.sh`): **PASS**
  (2026-04-24).
- Local comprehensive gate (`./scripts/test-comprehensive.sh`): **PASS**
  (2026-04-24) — backend checks, frontend unit/build/parity, WTR, and
  Playwright mock/production-smoke suites green.
- Live HA release gate (`make test-release-live` pinned to local HA):
  **PASS** (2026-04-24) — comprehensive gate, 2 managed-action contract
  tests, and 6 live-browser tests green.

Notes:
- The first live-gate attempt failed because the local HA runtime was not
  running at `http://localhost:8123`; after starting `hass -c
  /workspaces/core/config --debug`, the same gate passed.
- After push to `main`, confirm CI and **Auto Release** are green for the
  release commit before considering the release complete.
