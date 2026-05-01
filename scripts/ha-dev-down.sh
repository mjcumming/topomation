#!/usr/bin/env bash
set -euo pipefail

PID_FILE="${HA_DEV_PID_FILE:-/tmp/topomation-ha-dev.pid}"
HA_DEV_PORT="${HA_DEV_PORT:-8123}"

PID=""
if [[ -f "${PID_FILE}" ]]; then
  PID="$(cat "${PID_FILE}" || true)"
fi
if [[ -z "${PID}" ]]; then
  PID="$(ss -ltnp "( sport = :${HA_DEV_PORT} )" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1 || true)"
fi

if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
  echo "Stopping HA dev runtime pid=${PID}"
  kill "${PID}" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "${PID}" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "${PID}" 2>/dev/null; then
    kill -9 "${PID}" 2>/dev/null || true
  fi
else
  echo "No HA dev runtime process found."
fi
rm -f "${PID_FILE}"
