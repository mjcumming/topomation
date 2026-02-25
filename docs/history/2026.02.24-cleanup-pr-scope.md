# Cleanup PR Scope Plan

This file defines how to split the current in-flight work into reviewable
change sets.

## Scope A: Backend Integration Contract

Purpose: keep HA wrapper behavior aligned with core module contracts.

Includes:
- `custom_components/home_topology/services.py`
- `custom_components/home_topology/services.yaml`
- `custom_components/home_topology/__init__.py`
- `custom_components/home_topology/sync_manager.py`
- `tests/test_services.py`
- `tests/test_init.py`
- `docs/architecture.md`
- `docs/adr-log.md`
- `docs/integration-guide.md`
- `CHANGELOG.md`

Suggested checks:
- `ruff check custom_components/home_topology tests`
- `PYTHONPATH=$PWD pytest -q --no-cov tests/test_services.py tests/test_init.py`

## Scope B: Frontend Tree/UI Iteration

Purpose: complete and stabilize tree view/dialog UX work.

Includes:
- `custom_components/home_topology/frontend/*`
- UI-focused docs:
  - `docs/ui-design.md`
  - `docs/frontend-*.md`
  - `docs/accessibility-checklist.md`
  - `docs/drag-drop-design-pattern.md`

Suggested checks:
- frontend unit tests + storybook/playwright checks
- visual QA in HA panel

## Scope C: Historical/Process Artifacts

Purpose: archive old one-off status docs and keep current status in ADR/changelog.

Includes:
- Remove legacy root status files:
  - `BIDIRECTIONAL-SYNC-COMPLETE.md`
  - `COMPLETION-SUMMARY.md`
  - `IMPLEMENTATION-STATUS.md`
  - `NEXT-STEPS.md`
- Keep active status in:
  - `CHANGELOG.md`
  - `docs/adr-log.md`
  - `docs/history/*`

## Staging Pattern

Use explicit path staging per scope:

```bash
git add <scope-files...>
git commit -m "<scope commit message>"
```

Do not mix Scope A/B/C into one commit.
