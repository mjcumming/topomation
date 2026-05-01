#!/usr/bin/env bash
set -euo pipefail

HA_DEV_PORT="${HA_DEV_PORT:-8123}"
HA_DEV_TIMEOUT="${HA_DEV_TIMEOUT:-90}"
URL="http://127.0.0.1:${HA_DEV_PORT}"
LOG_FILE="${HA_DEV_LOG:-/tmp/topomation-ha-dev.log}"

deadline=$((SECONDS + HA_DEV_TIMEOUT))
while (( SECONDS < deadline )); do
  if curl -sS --max-time 2 "${URL}/" >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for HA dev runtime at ${URL}" >&2
if [[ -f "${LOG_FILE}" ]]; then
  tail -n 80 "${LOG_FILE}" >&2
fi
exit 1
