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
- **Hard release rule**: never cut/publish a release when any required build/check is failing (local or CI).

## 2) Mandatory local gate (mirrors CI)

Run the full gate **before every release push**. It runs the same checks as CI so you don't push and then see failures:

```bash
./scripts/test-comprehensive.sh
```

or `make test-comprehensive`.

This validates (in the same order as CI):

1. **Backend:** custom_components layout, version sync (manifest + const.py + pyproject.toml), Ruff, Mypy, Pytest
2. **Frontend:** unit tests (Vitest), build, runtime bundle parity (`dist/topomation-panel.js` vs committed `topomation-panel.js`)
3. **Comprehensive:** Web Test Runner (component tests), Playwright e2e

If any step fails, fix it before pushing. Do not push then fix in a follow-up.
If any step fails, release work is blocked until the step passes.

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

1. Run **`./scripts/test-comprehensive.sh`** and ensure it passes (no pushing until it does).
2. Update version in **all three** places (CI will fail otherwise):
   - `custom_components/topomation/manifest.json` (`"version": "x.y.z"`)
   - `custom_components/topomation/const.py` (`VERSION = "x.y.z"`)
   - `pyproject.toml` (`version = "x.y.z"`)
3. Add release notes entry in `CHANGELOG.md`.
4. Ensure docs/contracts/ADR updates are in the same change when behavior changed.
5. Run `make test-release-live` after final edits (if you have `tests/ha-config.env`).
6. Run **`./scripts/test-comprehensive.sh`** again after any last edits; only then push to `main`.
7. After pushing, verify CI required jobs are green on the release commit:
   - `Backend checks`
   - `Frontend checks`
   - `Comprehensive gate (browser suites)`
8. Verify `Auto Release` job result is green before considering the release complete.
   If any required check/release job fails, treat release as failed and fix before retry.

CI runs the same backend/frontend/comprehensive checks. **Auto Release** runs when any of the three version files change and creates the release once CI passes. It also runs the release job when the release for the current version does not exist yet (e.g. after fixing CI or the changelog step without bumping again). If a release was skipped and you did not push another version-file change, go to **Actions → Auto Release → Run workflow** to create the release for the current version.

## 5) Rule for discovered prerequisites

When you discover/fix a recurring environment or workflow prerequisite (for example `CHROME_PATH` resolution), do both in the same change:

1. Automate the prerequisite where possible (scripts/workflow).
2. Document it in active operational docs (runbook/quickstart/workflow docs).

Do not rely on tribal memory for repeat setup requirements.

## 6) Common failure triage

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
