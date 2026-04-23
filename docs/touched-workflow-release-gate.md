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

Commit under test: **release-candidate worktree for Topomation `0.2.59`**
(linked-room occupancy propagation fix + ADR-HA-087 action-rule scoping +
occupancy-reason surface consolidation + release metadata).
Frontend bundle rebuilt from same commit: **yes** (`npm run build` →
committed `topomation-panel.js`; parity verified by
`./scripts/test-comprehensive.sh`).

Touched workflows:
- **Linked-room occupancy propagation across mesh members** (backend):
  `_apply_linked_location_contributors` now mirrors the source area's
  remaining effective timeout instead of passing `None`. Prevents the
  indefinite-contribution circular hold produced when the occupancy-group
  mesh mirrors `linked:*` sources across members as `__group_member__:*`.
- **Action-rule target device picker scoping** (frontend, ADR-HA-087):
  Lighting / Media / HVAC / Appliances rule editors on structural hosts
  (`property`, `building`, `grounds`, `floor`) now enumerate only the
  host's own HA area + managed shadow area — never descendant rooms.
- **Occupancy reason/explainability display** (frontend): standalone
  `ht-room-explainability` panel removed; reason line now renders inline on
  the left-tree occupancy dot tooltip via the new `occupancy-reason.ts`
  module. Same computed copy, different surface.
- **Inspector occupancy-group copy** (frontend, Detection tab, structural
  hosts): replaced "Create local shared-occupancy groups for …" with
  "Group …'s direct child areas when they should behave like one occupied
  space."

Commands run:
- `./scripts/test-comprehensive.sh` (backend Ruff/Mypy/Pytest, frontend unit
  tests, build, runtime-bundle parity, Playwright mock + production-smoke)
- `make test-release-live` (local gate: comprehensive + live HA automation
  contract + `live-automation-ui.spec.ts`)

Outcome:
- Version sync (`0.2.59`): **PASS** (2026-04-23)
- Local comprehensive gate (`./scripts/test-comprehensive.sh`): **PASS**
  (2026-04-23) — all 34 Playwright + backend + frontend unit tests green,
  `topomation-panel.js` parity clean.
- Live HA release gate
  (`TOPOMATION_PREFER_LOCAL_HA=0 make test-release-live`): **PASS**
  (2026-04-23) — 2 managed-action contract tests + 6 live-browser tests
  green against the configured dev HA target.

Notes:
- `live-automation-ui.spec.ts`'s detection-reason test was updated in the
  same change to assert against the tree-dot tooltip rather than the removed
  explainability panel — the live browser path for that workflow remains
  covered.
- While running the live gate, the `expandTreeAncestors` helper was found to
  short-circuit outside the real-panel path, leaving deeply nested tree
  items unrendered when a test asserted against them. The gate was removed
  (the DOM manipulation is valid in both real and mock-harness modes), and
  the tree-dot test now expands ancestors before the visibility check. The
  harness-only tests that did not depend on this helper are unaffected.
- The default localhost override was unavailable in this dev container, so
  `TOPOMATION_PREFER_LOCAL_HA=0` was used to validate against the configured
  reachable dev HA target — same pattern recorded for 0.2.58.
- After push to `main`, confirm CI and **Auto Release** are green for the
  release commit before considering the release complete.
- Post-release monitoring for the occupancy fix: install, trigger a leaf
  area (e.g. Front Entry) with a 30-min hold, wait past the hold, and
  confirm the area actually vacates and the mesh dissolves down through
  any `__follow_parent__:*` ancestors.
