# HA <-> Topology Sync Contract and Drift Guard

**Date**: 2026-02-24  
**Status**: Active  
**Purpose**: Prevent design drift between docs, code, and tests for HA sync behavior.

---

## Why this exists

We previously kept an older "full bidirectional writeback" design after the implementation moved to a stricter wrapper policy. This file is now the guardrail that must be checked before any sync-related change.

This is a **contract + process** document, not a speculative future design.

---

## Canonical contract (current behavior)

1. Home Assistant is canonical for HA registry-backed metadata on wrappers
   (`ha_area_id`, `ha_floor_id`, registry names/floor linkage).
2. Location lifecycle is supported via WebSocket API with guardrails:
   - `locations/create` supports topology locations and HA-linked area wrappers.
   - `locations/update` supports rename/reparent with hierarchy and ownership checks.
   - `locations/delete` supports non-root delete with reparenting + HA cleanup when linked.
3. Topology hierarchy reorder/reparent is allowed as an overlay.
4. Reorder of an HA-backed area syncs HA `area.floor_id` from the nearest floor ancestor.
5. If an HA-backed area is moved outside any floor lineage, HA `area.floor_id` is cleared (`null`).
6. No synthetic `house` root exists (rootless topology model).
7. `sync/enable` is blocked for HA-backed floor/area wrappers and allowed for topology-only locations.
8. Managed shadow areas are integration-owned and reconciled automatically.

References:
- `docs/architecture.md`
- `docs/adr-log.md` (ADR-HA-017+)
- `project/issues/issue-050-ha-integration-contract-hardening.md`
- `project/issues/issue-051-floor-area-sync-validation.md`

---

## Direction matrix

| Change origin | Operation | Allowed | Notes |
| --- | --- | --- | --- |
| HA -> Topology | floor/area create | Yes | Imported by SyncManager |
| HA -> Topology | floor/area rename | Yes | Propagates to wrapper location |
| HA -> Topology | area floor move | Yes | Updates topology parent linkage |
| HA -> Topology | floor/area delete | Yes | Removes/reparents wrapper location as implemented |
| Topology -> HA | create linked area wrapper | Yes | Creates HA area and links wrapper when needed |
| Topology -> HA | rename linked area/floor wrapper | Yes | Propagates rename to HA registry when linked |
| Topology -> HA | delete linked area/floor wrapper | Yes | Deletes linked HA registry object when present |
| Topology -> HA | reorder/reparent area | Yes | Updates HA `area.floor_id` from nearest floor ancestor |
| Topology-only | create/update/delete non-HA locations | Yes | Topology-owned lifecycle only |

---

## WTF checks (mandatory before sync changes)

Run this checklist before editing sync-related code or docs:

1. Did I read `docs/architecture.md`, `docs/adr-log.md`, ISSUE-050, and ISSUE-051?
2. Am I proposing behavior that conflicts with wrapper ownership and HA metadata canonicality?
3. Am I accidentally bypassing guardrails for linked HA wrappers or managed shadows?
4. Am I preserving the rootless model (no `house` root assumptions)?
5. If a move is involved, is `floor_id` nearest-ancestor/`null` behavior preserved?
6. Did I update both docs and tests for any contract change?
7. Did I run targeted tests and verify the exact affected paths?

If any answer is "No", stop and resolve before continuing.

---

## Required validation before merge

Minimum backend validation:

```bash
pytest -q tests/test_sync_manager.py tests/test_websocket_contract.py --no-cov
pytest -q tests/test_persistence.py tests/test_init.py --no-cov
```

If frontend reorder/contract behavior changed:

```bash
cd custom_components/topomation/frontend
npm test
npx playwright test
```

---

## Drift detection quick checks

Use these to catch policy regressions quickly:

```bash
rg -n "def handle_locations_create|def handle_locations_update|def handle_locations_delete" custom_components/topomation/websocket_api.py
rg -n "_sync_ha_area_floor_assignment|_rename_ha_backed_location|_reconcile_managed_shadow_areas" custom_components/topomation/websocket_api.py
rg -n "\\bhouse\\b|\\broom\\b|\\bzone\\b" docs/architecture.md docs/bidirectional-sync-design.md
```

Expected outcomes:
- WebSocket lifecycle handlers exist and enforce guardrails.
- Wrapper-linked HA updates are explicit and bounded to linked objects/fields.
- No stale root/type assumptions in active architecture docs.

---

## Historical note

The previous 2025-12-09 bidirectional design text is retired.  
Current implementation policy is intentionally narrower and wrapper-focused.
