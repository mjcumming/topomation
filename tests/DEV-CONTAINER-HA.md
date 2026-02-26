# Dev Container HA Runbook

Use this as the canonical workflow for running and restarting Home Assistant while developing in this repo's dev container.

## Where We Work

- Repo root (integration code): `/workspaces/topomation`
- Default dev HA config directory: `/workspaces/core/config`
- Optional isolated test HA config directory: `/workspaces/topomation/tests/test-ha-config`
- Mounted integration source: `/workspaces/topomation/custom_components/topomation`

## One-Time Setup

From repo root, ensure the integration is linked into the default dev HA config:

```bash
mkdir -p /workspaces/core/config/custom_components
ln -sfn /workspaces/topomation/custom_components/topomation \
  /workspaces/core/config/custom_components/topomation
```

## Start HA (Default Dev Runtime)

Run HA directly with `hass` using the dev config that preserves your existing entities/state:

```bash
hass -c /workspaces/core/config --debug
```

Keep this running in a dedicated terminal while testing.

## Restart HA

Use one of these methods:

1. Terminal-managed restart (most reliable in dev work):

```bash
# In the terminal running hass: Ctrl+C
hass -c /workspaces/core/config --debug
```

2. HA API restart (when token-based auth is configured):

```bash
source /workspaces/topomation/tests/ha-config.env
curl -X POST -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/services/homeassistant/restart"
```

## Verify HA Is Up

```bash
# HTTP health (302 or 200 are both fine for base URL)
curl -I http://localhost:8123/

# Authenticated API health (requires HA_TOKEN)
source /workspaces/topomation/tests/ha-config.env
curl -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/"
```

Expected API response includes: `{"message":"API running."}`

## Optional: Isolated Test Config Runtime

Use this only when you explicitly want a clean/simulated setup:

```bash
mkdir -p /workspaces/topomation/tests/test-ha-config/custom_components
ln -sfn /workspaces/topomation/custom_components/topomation \
  /workspaces/topomation/tests/test-ha-config/custom_components/topomation
hass -c /workspaces/topomation/tests/test-ha-config --debug
```

## Live Test Setup

```bash
cd /workspaces/topomation
cp tests/ha-config.env.template tests/ha-config.env
```

Set values in `tests/ha-config.env`:

```bash
HA_URL="http://localhost:8123"
HA_TOKEN="your_long_lived_access_token_here"
TEST_MODE="live"
TEST_TIMEOUT=10
```

Then run live tests:

```bash
make test-live
```

## Notes

- Some environments include Docker/Compose, but this runbook is the default for this dev container workflow.
- Runtime files under `/workspaces/core/config/` are your normal dev state.
- Runtime files under `tests/test-ha-config/` are isolated test state.

## Daily Change Workflow (Backend + Frontend + Live HA)

Use this loop when changing Topomation behavior (for example occupancy `Test On/Test Off`):

1. Start HA in the canonical dev runtime:

```bash
/home/vscode/.local/ha-venv/bin/hass -c /workspaces/core/config --debug
```

2. Make code changes in `/workspaces/topomation`.

3. Restart HA after Python/backend changes:

```bash
# In the hass terminal
# Ctrl+C
/home/vscode/.local/ha-venv/bin/hass -c /workspaces/core/config --debug
```

4. Verify HA is healthy before testing UI:

```bash
TOKEN=$(cat /workspaces/topomation/ha_long_lived_token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8123/api/
```

Expected response: `{"message":"API running."}`

5. Validate behavior in panel UI:
- Open Topomation panel.
- For occupancy source testing, run `Test On` then `Test Off`.
- Confirm area status chip and tree dot transition as expected.

6. If behavior is wrong, check logs immediately:

```bash
rg -n "topomation|entry_required|Failed to clear occupancy|Failed to trigger occupancy" \
  /workspaces/core/config/home-assistant.log
```

7. For multi-entry setups:
- Ensure service calls include `entry_id`, or backend resolves by `location_id`.
- If logs show ambiguity (`Multiple Topomation entries contain location ...`), provide explicit `entry_id`.
