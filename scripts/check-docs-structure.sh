#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail=0

pass() { echo "[PASS] $1"; }
fail_msg() { echo "[FAIL] $1"; fail=1; }

require_file() {
  local path="$1"
  local label="$2"
  if [[ -f "$path" ]]; then
    pass "$label"
  else
    fail_msg "$label (missing: $path)"
  fi
}

forbid_file() {
  local path="$1"
  local label="$2"
  if [[ -e "$path" ]]; then
    fail_msg "$label (found: $path)"
  else
    pass "$label"
  fi
}

echo "Running docs structure checks..."

require_file "docs/index.md" "Docs index exists"
require_file "docs/work-tracking.md" "Work tracking doc exists"
require_file "project/README.md" "Project execution framework exists"
require_file "project/roadmap.md" "Strategic roadmap exists"
require_file "project/history/README.md" "Project history README exists"

# Legacy planning/framework docs should remain archived, not restored to project/ root.
forbid_file "project/QUICK-START.md" "Legacy quick-start not at project root"
forbid_file "project/FRAMEWORK-OVERVIEW.md" "Legacy framework overview not at project root"
forbid_file "project/UI-TESTING-PLAN.md" "Legacy UI testing plan not at project root"
forbid_file "project/BASIC-LOCATION-MANAGER-PLAN.md" "Legacy location manager plan not at project root"

# Stale execution artifacts should stay in archive paths.
forbid_file "project/epics/epic-004-ui-integration-testing.md" "Stale EPIC-004 kept out of active epics"
forbid_file "project/epics/epic-005-basic-location-manager.md" "Stale EPIC-005 kept out of active epics"
forbid_file "project/issues/issue-030-ui-real-backend-testing.md" "Stale ISSUE-030 kept out of active issues"
forbid_file "project/issues/issue-040-implementation-plan.md" "Stale ISSUE-040 plan kept out of active issues"
forbid_file "project/issues/issue-040-panel-initialization.md" "Stale ISSUE-040 panel issue kept out of active issues"
forbid_file "project/issues/issue-040-test-checklist.md" "Stale ISSUE-040 checklist kept out of active issues"
forbid_file "project/issues/issue-040-test-results.md" "Stale ISSUE-040 results kept out of active issues"
forbid_file "project/issues/issue-040-testing-summary.md" "Stale ISSUE-040 summary kept out of active issues"

if [[ $fail -ne 0 ]]; then
  echo
  echo "Docs structure checks failed."
  exit 1
fi

echo

echo "Docs structure checks passed."
