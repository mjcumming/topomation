# Working Agreement

**Last reviewed**: 2026-03-06  
**Status**: Active (Operational)  
**Purpose**: active repo operating contract for ongoing Topomation work.

This file exists because the repo repeatedly drifted in the same ways:
ambiguous UX was implemented without a stop, legacy behavior survived explicit
requests to remove it, tests did not prove the exact touched workflow on the
exact shipped bundle, and status docs over-claimed what was actually validated.

## 1. Non-Negotiable Rules

1. Dev mode only:
   - do not keep legacy compatibility, migration logic, or old route aliases
     unless the user explicitly asks for them in the same change set.
2. Ambiguity stop rule:
   - if desired UI, UX, workflow, or runtime behavior is not explicit in the
     active authority chain, stop and ask before coding.
3. Document-first behavior changes:
   - update the canonical docs in the same change set as the behavior change.
   - do not treat docs as post-hoc explanation for behavior that was already
     inferred in code.
4. Exact-branch validation only:
   - release or live-validation claims are valid only for the exact commit and
     rebuilt runtime bundle under test.
5. Touched-workflow gate is mandatory:
   - every touched workflow must be rerun through the required validation
     matrix in `docs/touched-workflow-release-gate.md`.
6. No status inflation:
   - `Implemented`, `Released`, and `Live-validated` are distinct states and
     must not be collapsed.
7. Shared abstractions do not define UX:
   - if a shared component conflicts with the product contract, the contract
     wins and the shared component must narrow or split.

## 2. Active Authority Chain

For behavior-changing work, use this order and stop at the first explicit rule:

1. `docs/working-agreement.md`
2. `docs/contracts.md`
3. `docs/automation-ui-guide.md`
4. `docs/architecture.md`
5. `docs/adr-log.md`

Supplemental rules:

- `docs/bidirectional-sync-design.md` is sync-specific and does not override
  the chain above outside sync behavior.
- Operational docs, issue checklists, and old release notes do not override the
  authority chain.
- Historical docs are reference-only.

## 3. Mandatory Stop Conditions

Stop and ask the user before continuing when any of these are true:

1. The desired workflow is ambiguous.
2. Two active docs conflict.
3. A new UI pattern seems reasonable but is not explicitly contracted.
4. You are about to preserve or add legacy behavior without explicit approval.
5. The touched workflow does not have exact validation evidence yet.

## 4. Release / Live Claim Rules

1. No release claim without the touched-workflow gate for the exact branch
   state.
2. No live-validation claim carried forward across later behavior changes.
3. No “some tests passed” substitute for exact workflow evidence.
4. If the runtime bundle changed, rebuild it and validate that exact bundle.
5. If the touched workflow changed after a prior live run, status returns to
   `Implemented` until rerun.

## 5. Definition of Done for UI Workflows

For any work that touches a **user-facing workflow** (e.g. rule create/update/delete
from the panel, save/discard, shared space):

- **Done** means: the user can perform the **exact contracted action** in **real
  Home Assistant** (not just mocks), and we have a **recorded pass** for that
  action on the **exact branch and bundle** in the touched-workflow gate.
- Passing unit tests, backend contract tests, or mock-harness tests do **not**
  substitute for this. The live gate (e.g. `playwright/live-automation-ui.spec.ts`
  or the manual live checklist for that workflow) must pass and be recorded.
- Do not claim `Live-validated` or close the issue for that workflow until this
  criterion is met.

## 6. Cadence Rule (Prevent Evidence Drift)

After a workflow’s **live gate has passed** and been recorded:

- Do **not** add further behavior changes to that same workflow (e.g. “cleanup,”
  “align to contract,” “surface errors”) without **re-running the live gate** and
  **re-recording** the outcome for the new branch state.
- If you add such changes, treat the previous live evidence as **stale** and
  block any release/live claim until the gate is rerun and recorded again.

This keeps “we passed the gate” aligned with “this branch state is what we
validated.”

## 7. Session Checklist

Before changing behavior:

1. Name the touched workflow(s).
2. Confirm the intended outcome in the authority chain.
3. If unclear, stop and ask.

Before closing work:

1. Update canonical docs.
2. Run the touched-workflow validation matrix (for UI workflows: include the
   live gate that performs the user action in real HA).
3. Update status docs honestly.
4. Push only after the exact branch state is proven.
