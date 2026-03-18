# Current work

**Last updated**: 2026-03-18
**Purpose**: short live context for parallel work, handoff, and branch safety.

Status markers:
- Execution: `Pending`, `In progress`, `Blocked`, `Done`
- Delivery: `Target`, `Implemented`, `Released`, `Live-validated`

## Snapshot

- Active focus: repo workflow reset and authority-chain hardening (ADR-HA-063): dev mode only, ambiguity stop rule, and exact touched-workflow validation gate.
- Active focus: managed shadow area contract + implementation checklist (ADR-HA-049 / ISSUE-057).
- Active focus: HA-canonical managed-rule sync (ADR-HA-053) with stable rule identity and in-place upserts.
- Active focus: automation UX + persistence realignment (ADR-HA-054/055/056/060/061/062/063/066/067): the active rule UI is scoped to Lighting/Media/HVAC, Detection uses `Shared Space` as the primary occupancy relationship model, and shared-space occupancy is now documented as binary-sensor authoritative with contribution-union timeout semantics.
- Active execution checklist: `project/issues/issue-058-automation-ui-contract-implementation.md`.
- New planning track: ambient light v1 design baseline captured in `docs/ambient-light-v1-design.md` before dusk/dawn coupling work.
- Future work captured: a house-wide modes/activities context layer (for example `watching_tv`, `evening`, `overnight`, `party`, `bedtime`) that can modulate lighting/media/HVAC behavior is promising, but is intentionally deferred until the simpler lighting-behavior UX lands.
- Recently completed: Tree DnD now uses explicit drop targets (before/inside/after/outdent) from pointer Y and optional outdent strip; zone-only resolver; heuristic x-offset logic removed. User order preserved by existing backend (`manual_order` + A-Z until first reorder).
- Contract source set: `docs/working-agreement.md`, `docs/contracts.md`, `docs/automation-ui-guide.md`, `docs/architecture.md`, `docs/adr-log.md`.

## In-flight work (update per session)

| Item | Owner | Execution | Delivery | Notes |
| --- | --- | --- | --- | --- |
| Repo workflow reset + authority-chain hardening | active | Done | Implemented | ADR-HA-063, `docs/working-agreement.md`, and `docs/touched-workflow-release-gate.md` landed to stop ambiguity drift, legacy carryover, and status inflation. |
| Managed shadow areas + assignment remap | active | In progress | Target | ADR-HA-049 approved; ISSUE-057 tracks backend/UI/test checklist. |
| Automation UX + contracts reset | active | Done | Live-validated | Detection `Shared Space`, docked explainability refinements, and panel shell reload fixes reran through `make test-release-live` on the exact 2026-03-17 branch state. |
| Automation UX implementation checklist (ISSUE-058) | active | Done | Live-validated | Detection/Ambient draft flow, HA-canonical/card-local Lighting workflow, dev-mode no-legacy cleanup, and Media/HVAC card simplification are in repo and reran against local live HA on 2026-03-17. |
| Ambient light v1 design + implementation sequencing | active | In progress | Target | Design guide added; next step is phase-A inspector read path and config UX. |
| Parallel branch updates | multiple | In progress | n/a | Verify `git status` before editing overlapping files. |
| Managed action rule resilience | active | Done | Live-validated | Added fallback/reconciliation contracts + production smoke coverage; live managed-actions contract rerun passed on 2026-03-06. |
| Managed rule HA-canonical upsert sync | active | Done | Live-validated | Save path now upserts by automation id + stable `rule_uuid`; live lighting rule UUID upsert/delete contract passed on 2026-03-06, and the post-create list race was fixed the same day. |
| Panel auth alignment | active | Done | Implemented | Panel routes are admin-only to match HA write APIs. |
| Managed action backend WS path | active | Done | Implemented | Frontend now routes rule save/delete/enable to integration backend commands. |
| Registration verification hardening | active | Done | Implemented | Create now fails+rolls back when HA does not register automation after reload. |
| Docs/rules hardening for faster agent startup | active | Done | Implemented | Added quickstart/contracts/current-work and instruction routing. |

## Parallel-work guardrails

1. Check `git status --short` before edits.
2. If unexpected edits appear in files you are touching, pause and coordinate.
3. Avoid reverting unrelated changes from other in-flight work.
4. Keep behavioral docs in sync with code changes in the same change set.
5. Use `docs/working-agreement.md` and `docs/touched-workflow-release-gate.md`
   before resuming behavior changes or release testing.

## Handoff checklist

1. Record what changed and why (1-3 lines).
2. List files touched.
3. Note validation commands and result.
4. Capture open risks or follow-ups.

## Open follow-ups

1. Keep this file current when parallel work shifts focus areas.
2. Optionally add CI enforcement for contract/doc timestamp freshness.
3. Keep the touched-workflow gate record current for the exact branch state
   under release; rerun it after any further user-facing workflow change.
4. Revisit a house-wide modes/activities layer after lighting rules move from
   raw trigger mechanics to named behaviors and time/profile overrides.
