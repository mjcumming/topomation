#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "${ROOT_DIR}/tests/ha-config.env" ]]; then
  echo "Missing ${ROOT_DIR}/tests/ha-config.env" >&2
  echo "Copy tests/ha-config.env.template and set HA_URL_DEV + HA_TOKEN_DEV (local/test)." >&2
  exit 1
fi

# Release gate defaults to local/test; override with HA_TARGET=prod for production
export HA_TARGET="${HA_TARGET:-dev}"

echo "==> Release gate: local comprehensive matrix"
"${ROOT_DIR}/scripts/test-comprehensive.sh"

echo "==> Release gate: real Home Assistant managed-action contract (local/test)"
"${ROOT_DIR}/tests/run-live-tests.sh" tests/test-live-managed-actions-contract.py

echo "==> Release gate complete (local + live)"
