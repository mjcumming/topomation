#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/custom_components/topomation/frontend"

echo "==> Backend pytest suite"
cd "${ROOT_DIR}"
pytest tests/ -v

echo "==> Frontend unit suite (Vitest)"
cd "${FRONTEND_DIR}"
npm run test:unit

echo "==> Ensuring Playwright Chromium is installed"
npx playwright install chromium >/dev/null

CHROME_PATH="$(node -e 'const { chromium } = require("@playwright/test"); process.stdout.write(chromium.executablePath());')"
if [[ ! -x "${CHROME_PATH}" ]]; then
  echo "Failed to resolve Chromium executable for CHROME_PATH: ${CHROME_PATH}" >&2
  exit 1
fi
export CHROME_PATH

echo "==> Frontend component suite (Web Test Runner)"
npm run test

echo "==> Frontend workflow + production smoke suites (Playwright)"
npm run test:e2e

echo "==> Comprehensive automated suite completed"
