# Current work

**Last updated**: 2026-02-26
**Purpose**: short live context for parallel work, handoff, and branch safety.

## Snapshot

- Active focus: managed-automation reliability hardening, admin authorization alignment, and release validation workflow.
- Recently completed: registry-permission fallback + external reconciliation for managed action toggles.
- Contract source set: `docs/contracts.md`, `docs/architecture.md`, `docs/adr-log.md`.

## In-flight work (update per session)

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Parallel branch updates | multiple | In progress | Verify `git status` before editing overlapping files. |
| Managed action rule resilience | active | Completed | Added fallback/reconciliation contracts + production smoke coverage. |
| Panel auth alignment | active | In progress | Move panel routes to admin-only to match HA automation config API requirements. |
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
