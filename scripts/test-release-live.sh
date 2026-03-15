#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/custom_components/topomation/frontend"
LOCAL_TOKEN_FILE="${ROOT_DIR}/ha_long_lived_token"

if [[ ! -f "${ROOT_DIR}/tests/ha-config.env" ]]; then
  echo "Missing ${ROOT_DIR}/tests/ha-config.env" >&2
  echo "Copy tests/ha-config.env.template and set HA_URL_DEV + HA_TOKEN_DEV (local/test)." >&2
  exit 1
fi

# Release gate defaults to local/test; override with HA_TARGET=prod for production
export HA_TARGET="${HA_TARGET:-dev}"
export TOPOMATION_PREFER_LOCAL_HA="${TOPOMATION_PREFER_LOCAL_HA:-1}"
source "${ROOT_DIR}/tests/ha-config.env"

# In the dev-container release path, prefer the local HA runtime plus local
# token file over any remote default baked into tests/ha-config.env.
if [[ "${HA_TARGET}" == "dev" && "${TOPOMATION_PREFER_LOCAL_HA}" == "1" ]]; then
  HA_URL_LOCAL="${HA_URL_LOCAL:-http://127.0.0.1:8123}"
  if [[ -z "${HA_TOKEN_LOCAL:-}" && -f "${LOCAL_TOKEN_FILE}" ]]; then
    HA_TOKEN_LOCAL="$(cat "${LOCAL_TOKEN_FILE}")"
  fi
  if [[ -n "${HA_URL_LOCAL:-}" && -n "${HA_TOKEN_LOCAL:-}" ]]; then
    export HA_URL="${HA_URL_LOCAL}"
    export HA_TOKEN="${HA_TOKEN_LOCAL}"
    echo "==> Release gate: using local dev HA override (${HA_URL})"
  fi
fi

if [[ -z "${HA_URL:-}" || -z "${HA_TOKEN:-}" ]]; then
  echo "HA_URL/HA_TOKEN not resolved for HA_TARGET=${HA_TARGET}" >&2
  echo "Set HA_URL_DEV + HA_TOKEN_DEV in tests/ha-config.env (or HA_URL_PROD + HA_TOKEN_PROD with HA_TARGET=prod)." >&2
  exit 1
fi

echo "==> Release gate: local comprehensive matrix"
"${ROOT_DIR}/scripts/test-comprehensive.sh"

echo "==> Release gate: real Home Assistant managed-action contract (local/test)"
"${ROOT_DIR}/tests/run-live-tests.sh" tests/test-live-managed-actions-contract.py

echo "==> Release gate: live Home Assistant browser workflow"
cd "${FRONTEND_DIR}"
# Use real panel at /topomation when targeting production (avoids static live-harness download issue)
if [[ "${HA_TARGET}" == "prod" ]]; then
  export LIVE_PANEL_PATH="/topomation"
fi
HA_URL="${HA_URL}" HA_TOKEN="${HA_TOKEN}" LIVE_PANEL_PATH="${LIVE_PANEL_PATH:-}" \
  npx playwright test --config playwright.live.config.ts playwright/live-automation-ui.spec.ts

echo "==> Release gate complete (local + live)"
