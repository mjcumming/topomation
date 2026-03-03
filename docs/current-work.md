# Current work

**Last updated**: 2026-03-03
**Purpose**: short live context for parallel work, handoff, and branch safety.

## Snapshot

- Active focus: managed shadow area contract + implementation checklist (ADR-HA-049 / ISSUE-057).
- New planning track: ambient light v1 design baseline captured in `docs/ambient-light-v1-design.md` before dusk/dawn coupling work.
- Recently completed: Tree DnD now uses explicit drop targets (before/inside/after/outdent) from pointer Y and optional outdent strip; zone-only resolver; heuristic x-offset logic removed. User order preserved by existing backend (`manual_order` + A-Z until first reorder).
- Contract source set: `docs/contracts.md`, `docs/architecture.md`, `docs/adr-log.md`.

## In-flight work (update per session)

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Managed shadow areas + assignment remap | active | In progress | ADR-HA-049 approved; ISSUE-057 tracks backend/UI/test checklist. |
| Ambient light v1 design + implementation sequencing | active | In progress | Design guide added; next step is phase-A inspector read path and config UX. |
| Parallel branch updates | multiple | In progress | Verify `git status` before editing overlapping files. |
| Managed action rule resilience | active | Completed | Added fallback/reconciliation contracts + production smoke coverage. |
| Panel auth alignment | active | Completed | Panel routes are admin-only to match HA write APIs. |
| Managed action backend WS path | active | Completed | Frontend now routes rule save/delete/enable to integration backend commands. |
| Registration verification hardening | active | Completed | Create now fails+rolls back when HA does not register automation after reload. |
| Docs/rules hardening for faster agent startup | active | Completed | Added quickstart/contracts/current-work and instruction routing. |

## Parallel-work guardrails

1. Check `git status --short` before edits.
2. If unexpected edits appear in files you are touching, pause and coordinate.
3. Avoid reverting unrelated changes from other in-flight work.
4. Keep behavioral docs in sync with code changes in the same change set.

## Handoff checklist

1. Record what changed and why (1-3 lines).
2. List files touched.
3. Note validation commands and result.
4. Capture open risks or follow-ups.

## Open follow-ups

1. Keep this file current when parallel work shifts focus areas.
2. Optionally add CI enforcement for contract/doc timestamp freshness.
