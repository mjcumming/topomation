#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/custom_components/topomation/frontend"

cd "${ROOT_DIR}"

echo "==> Validate custom_components layout"
extra_dirs="$(find custom_components -mindepth 1 -maxdepth 1 -type d ! -name topomation ! -name __pycache__ -print)"
if [ -n "$extra_dirs" ]; then
  echo "Unexpected custom_components directories:"
  echo "$extra_dirs"
  exit 1
fi

echo "==> Verify version sync (manifest.json, const.py, pyproject.toml)"
python scripts/verify-version-sync.py

echo "==> Ruff"
ruff check custom_components/topomation tests

echo "==> Mypy"
mypy custom_components/topomation

echo "==> Backend pytest suite"
pytest tests/ -v

echo "==> Frontend unit suite (Vitest)"
cd "${FRONTEND_DIR}"
npm run test:unit

echo "==> Frontend production build + runtime bundle parity check"
npm run build
diff -u dist/topomation-panel.js topomation-panel.js

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
