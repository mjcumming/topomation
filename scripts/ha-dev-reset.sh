#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="${ROOT_DIR}/tests/ha-dev-template"
RUNTIME_DIR="${HA_DEV_RUNTIME_DIR:-${ROOT_DIR}/tests/ha-dev-runtime}"
if [[ -n "${HA_DEV_AUTH_SOURCE_DIR:-}" ]]; then
  AUTH_SOURCE_DIR="${HA_DEV_AUTH_SOURCE_DIR}"
elif [[ -d "/workspaces/core/config/.storage" && -f "${ROOT_DIR}/ha_long_lived_token" ]]; then
  # Default dev-container token files are usually minted by /workspaces/core/config.
  # Prefer that auth store so ha_long_lived_token works after reset.
  AUTH_SOURCE_DIR="/workspaces/core/config/.storage"
else
  AUTH_SOURCE_DIR="${ROOT_DIR}/tests/test-ha-config/.storage"
fi

if [[ ! -d "${TEMPLATE_DIR}" ]]; then
  echo "Missing HA dev template: ${TEMPLATE_DIR}" >&2
  exit 1
fi

if [[ -f "${ROOT_DIR}/.ha-dev.pid" ]]; then
  PID="$(cat "${ROOT_DIR}/.ha-dev.pid" || true)"
  if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
    echo "HA dev runtime is running (pid ${PID}); stop it before reset." >&2
    exit 1
  fi
fi

rm -rf "${RUNTIME_DIR}"
mkdir -p "${RUNTIME_DIR}/custom_components"
cp -R "${TEMPLATE_DIR}/." "${RUNTIME_DIR}/"
ln -sfn "${ROOT_DIR}/custom_components/topomation" "${RUNTIME_DIR}/custom_components/topomation"

# If a local auth store exists, copy it so dev-container e2e can run without
# re-onboarding HA every reset. This directory is not tracked by git.
if [[ -d "${AUTH_SOURCE_DIR}" ]]; then
  mkdir -p "${RUNTIME_DIR}/.storage"
  for name in auth auth_provider.homeassistant core.uuid http http.auth onboarding; do
    if [[ -f "${AUTH_SOURCE_DIR}/${name}" ]]; then
      cp "${AUTH_SOURCE_DIR}/${name}" "${RUNTIME_DIR}/.storage/${name}"
    fi
  done
fi

echo "Prepared isolated HA dev runtime: ${RUNTIME_DIR}"
