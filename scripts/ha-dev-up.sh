#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${HA_DEV_RUNTIME_DIR:-${ROOT_DIR}/tests/ha-dev-runtime}"
PID_FILE="${HA_DEV_PID_FILE:-/tmp/topomation-ha-dev.pid}"
LOG_FILE="${HA_DEV_LOG:-/tmp/topomation-ha-dev.log}"
HA_BIN="${HA_DEV_BIN:-/home/vscode/.local/ha-venv/bin/hass}"
HA_DEV_PORT="${HA_DEV_PORT:-8123}"

if [[ ! -d "${RUNTIME_DIR}" ]]; then
  "${ROOT_DIR}/scripts/ha-dev-reset.sh"
fi

if [[ -f "${PID_FILE}" ]]; then
  PID="$(cat "${PID_FILE}" || true)"
  if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
    if curl -sS --max-time 2 "http://127.0.0.1:${HA_DEV_PORT}/" >/dev/null 2>&1; then
      echo "HA dev runtime already running: pid=${PID} url=http://127.0.0.1:${HA_DEV_PORT}"
      exit 0
    fi
    kill "${PID}" 2>/dev/null || true
  fi
fi

if [[ ! -x "${HA_BIN}" ]]; then
  HA_BIN="$(command -v hass || true)"
fi
if [[ -z "${HA_BIN}" || ! -x "${HA_BIN}" ]]; then
  echo "hass executable not found. Set HA_DEV_BIN or install Home Assistant in the dev env." >&2
  exit 1
fi

echo "Starting HA dev runtime: ${HA_BIN} -c ${RUNTIME_DIR} --debug"
if command -v setsid >/dev/null 2>&1; then
  HA_DEV_PORT="${HA_DEV_PORT}" setsid "${HA_BIN}" -c "${RUNTIME_DIR}" --debug >"${LOG_FILE}" 2>&1 &
else
  HA_DEV_PORT="${HA_DEV_PORT}" nohup "${HA_BIN}" -c "${RUNTIME_DIR}" --debug >"${LOG_FILE}" 2>&1 &
fi
echo "$!" >"${PID_FILE}"

"${ROOT_DIR}/scripts/ha-dev-wait.sh"
echo "HA dev runtime ready: http://127.0.0.1:${HA_DEV_PORT} log=${LOG_FILE} pid=$(cat "${PID_FILE}")"
