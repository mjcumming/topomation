#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/custom_components/topomation/frontend"
HA_DEV_PORT="${HA_DEV_PORT:-8123}"
HA_URL="${HA_URL:-http://127.0.0.1:${HA_DEV_PORT}}"
TOKEN_FILE="${ROOT_DIR}/ha_long_lived_token"

export HA_DEV_PORT
export HA_URL
export TEST_MODE="live"

if [[ -z "${HA_TOKEN:-}" && -f "${TOKEN_FILE}" ]]; then
  export HA_TOKEN="$(cat "${TOKEN_FILE}")"
fi
if [[ -z "${HA_TOKEN:-}" && -f "${ROOT_DIR}/tests/ha-config.env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/tests/ha-config.env"
  export HA_URL="${HA_URL_LOCAL:-${HA_URL_DEV:-${HA_URL}}}"
  export HA_TOKEN="${HA_TOKEN_LOCAL:-${HA_TOKEN_DEV:-${HA_TOKEN:-}}}"
fi
if [[ -z "${HA_TOKEN:-}" ]]; then
  echo "HA_TOKEN is required for HA dev e2e. Put the matching local token in ha_long_lived_token or tests/ha-config.env." >&2
  exit 1
fi

cleanup() {
  if [[ "${KEEP_HA:-0}" != "1" ]]; then
    "${ROOT_DIR}/scripts/ha-dev-down.sh" || true
  else
    echo "KEEP_HA=1 set; leaving HA dev runtime running at ${HA_URL}"
  fi
}
trap cleanup EXIT

"${ROOT_DIR}/scripts/ha-dev-reset.sh"
cd "${FRONTEND_DIR}"
npm run build

"${ROOT_DIR}/scripts/ha-dev-up.sh"
python "${ROOT_DIR}/tests/ha_dev_e2e/bootstrap.py"

pytest "${ROOT_DIR}/tests/ha_dev_e2e" -q --live-ha --no-cov

cd "${FRONTEND_DIR}"
HA_URL="${HA_URL}" HA_TOKEN="${HA_TOKEN}" LIVE_PANEL_PATH="/topomation" \
  npx playwright test --config playwright.ha-dev.config.ts
