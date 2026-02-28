# Release Validation Runbook

**Last reviewed**: 2026-02-27
**Scope**: release-candidate validation before bumping `manifest.json` version.

## 1) Local preflight

From repo root:

```bash
cd /workspaces/topomation
git status --short
```

- Confirm you understand any existing local changes before cutting a release.
- Do not release with an out-of-date frontend runtime bundle.

## 2) Mandatory local gate

Run the full gate:

```bash
./scripts/test-comprehensive.sh
```

This validates:

1. Backend pytest suite
2. Frontend unit tests
3. Frontend build + runtime bundle parity (`dist/topomation-panel.js` vs committed `topomation-panel.js`)
4. Frontend component tests (Web Test Runner)
5. Frontend Playwright suites (workflow + production smoke)

If parity fails, regenerate runtime bundle:

```bash
cd custom_components/topomation/frontend
npm run build
cp dist/topomation-panel.js topomation-panel.js
diff -u dist/topomation-panel.js topomation-panel.js
```

Then rerun `./scripts/test-comprehensive.sh`.

## 3) Mandatory live HA gate (real software, no mocks)

Every release must pass this gate against a running Home Assistant instance.
Do not cut a release from mock-only evidence.
Topomation integration must be loaded in that HA instance; the live contract
gate now fails fast when it is missing.

**Release gate uses local/test environment by default.** The gate runs against
`HA_URL_DEV` / `HA_TOKEN_DEV` (localhost). Production testing is optional and
can be done separately by setting `HA_TARGET=prod` before running.

```bash
cp tests/ha-config.env.template tests/ha-config.env
# Edit tests/ha-config.env:
#   HA_URL_DEV, HA_TOKEN_DEV (local/test - mandatory for release gate)
#   HA_URL_PROD, HA_TOKEN_PROD (production - optional)
chmod 600 tests/ha-config.env

# Release gate always uses dev
make test-release-live

# Optional: test against production
HA_TARGET=prod make test-release-live
```

This verifies real HA automation registration, enumeration, config readback, and deletion.
The live contract now asserts against the entity registry `unique_id` and then uses the
resolved registry `entity_id` (automation entities are alias-slug based, not guaranteed to
be `automation.<config_id>`).

Local token policy:

1. Keep tokens only in `tests/ha-config.env` (gitignored).
2. Never commit raw tokens into tracked docs or code.
3. Rotate token immediately if it leaks.

One-command release gate:

```bash
make test-release-live
```

## 4) Release cut checklist

1. Update version in **all three** places (CI will fail otherwise):
   - `custom_components/topomation/manifest.json` (`"version": "x.y.z"`)
   - `custom_components/topomation/const.py` (`VERSION = "x.y.z"`)
   - `pyproject.toml` (`version = "x.y.z"`)
2. Add release notes entry in `CHANGELOG.md`.
3. Ensure docs/contracts/ADR updates are in the same change when behavior changed.
4. Run `make test-release-live` after final edits.
5. Push to `main`. CI runs backend (version sync, ruff, mypy, pytest), frontend, and comprehensive gate; **Auto Release** waits for CI success then creates the GitHub release.

## 5) Common failure triage

- No rules created from panel actions:
  - confirm the acting user is an HA admin (panel/routes are admin-only)
  - inspect WS responses for `topomation/actions/rules/create`:
    - `not_loaded/module_not_loaded` indicates integration runtime wiring issue
    - `create_failed` indicates backend payload/validation issue (inspect message text)
  - confirm backend logs show managed action creation path execution (integration performs HA writes)
- `Saving...` then unchecked in managed actions:
  - validate fallback path for `config/entity_registry/list` permissions
  - inspect browser console logs for stage traces:
    `[ht-location-inspector] managed action ...`
  - if rule reads are blocked, expect explicit error:
    `Unable to read Topomation automation configs: ...`
  - run production smoke test:
    `npm run test:e2e -- playwright/production-smoke.spec.ts`
- Parity diff failure:
  - rebuild and copy runtime bundle, then commit `topomation-panel.js`.
- CI/release appears slow:
  - confirm jobs are de-duplicated per ADR-HA-031
  - avoid pushing extra version bumps while prior runs are still active.
