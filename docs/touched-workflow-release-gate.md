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

Commit under test: release-candidate worktree for `0.2.36` immediately before the final release commit
Frontend bundle rebuilt from same commit: yes

Touched workflows:
- Occupancy inspector shell layout now uses a fixed hero/tabs region with a dedicated scroll body so source rows and headings cannot paint behind the banner or tab strip

Commands run:
- `cd custom_components/topomation/frontend && npm test -- ht-location-inspector.test.ts topomation-panel.test.ts`
- `cd custom_components/topomation/frontend && npm run build`
- `cd custom_components/topomation/frontend && npx playwright test playwright/panel.spec.ts -g "occupancy inspector keeps the hero shell outside the scroll body"`
- `source /workspaces/topomation/tests/ha-config.env && cd custom_components/topomation/frontend && HA_URL="${HA_URL_DEV:-$HA_URL_LOCAL}" HA_TOKEN="${HA_TOKEN_DEV:-$HA_TOKEN_LOCAL}" npx playwright test --config playwright.live.config.ts playwright/live-automation-ui.spec.ts -g "live occupancy inspector keeps the hero shell outside the scroll body"`
- `./scripts/test-comprehensive.sh`
- `make test-release-live`

Outcome:
- Occupancy inspector shell layout now uses a fixed hero/tabs region with a dedicated scroll body so source rows and headings cannot paint behind the banner or tab strip: targeted frontend PASS, targeted mock browser PASS, targeted live browser PASS, full local gate PASS, full release gate PASS

Notes:
- This release replaces the prior sticky-stack workaround with a structural split between the fixed inspector shell and the scrollable body.
- The Auto Release workflow for this cut runs with the already-landed `actions/setup-node@v6` upgrade on `main`, so the release validation also confirms the Node 20 deprecation warning path is no longer tied to `setup-node@v4`.
