# Release Validation Runbook

**Last reviewed**: 2026-02-26
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

```bash
cp tests/ha-config.env.template tests/ha-config.env
# edit tests/ha-config.env with HA_URL + HA_TOKEN (+ optional AREA/entity IDs)
chmod 600 tests/ha-config.env

source tests/ha-config.env
pytest tests/test-live-managed-actions-contract.py -v --live-ha --no-cov
```

This verifies real HA automation registration, enumeration, config readback, and deletion.
The live contract now asserts against the entity registry `unique_id` and then uses the
resolved registry `entity_id` (automation entities are alias-slug based, not guaranteed to
be `automation.<config_id>`).

Local token policy:

1. Keep the token only in `tests/ha-config.env` (gitignored).
2. Never commit raw tokens into tracked docs or code.
3. Rotate token immediately if it leaks.

One-command release gate:

```bash
make test-release-live
```

## 4) Release cut checklist

1. Update `custom_components/topomation/manifest.json` version.
2. Add release notes entry in `CHANGELOG.md`.
3. Ensure docs/contracts/ADR updates are in the same change when behavior changed.
4. Run `make test-release-live` after final edits.
5. Push to `main` (auto-release workflow will publish when CI passes).

## 5) Common failure triage

- No rules created from panel actions:
  - confirm the acting user is an HA admin (panel/routes are admin-only)
  - inspect network response for `config/automation/config/*`:
    - `401/403` indicates permission issue
    - `400` indicates payload validation failure (inspect message body)
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
