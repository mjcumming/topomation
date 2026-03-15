#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Use ripgrep if available; otherwise fall back to grep -E so the script runs in minimal envs
if ! command -v rg &>/dev/null; then
  echo "Note: rg (ripgrep) not found; using grep -E for doc consistency checks."
  rg() {
    local args=("$@")
    local pattern="" start=0 i
    for ((i=0; i<${#args[@]}; i++)); do
      if [[ "${args[i]}" == "-e" && $((i+1)) -lt ${#args[@]} ]]; then
        pattern="${args[i+1]}"
        start=$((i+2))
        break
      fi
    done
    [[ -z "$pattern" ]] && return 0
    grep -n -E "$pattern" "${args[@]:start}" 2>/dev/null || true
  }
  export -f rg 2>/dev/null || true
fi

fail=0

check_matches() {
  local label="$1"
  local pattern="$2"
  shift 2
  local files=("$@")
  local output
  output="$(rg -n -e "$pattern" "${files[@]}" || true)"
  if [[ -n "$output" ]]; then
    echo "[FAIL] ${label}"
    echo "$output"
    echo
    fail=1
  else
    echo "[PASS] ${label}"
  fi
}

require_match() {
  local label="$1"
  local pattern="$2"
  shift 2
  local files=("$@")
  local output
  output="$(rg -n -e "$pattern" "${files[@]}" || true)"
  if [[ -n "$output" ]]; then
    echo "[PASS] ${label}"
  else
    echo "[FAIL] ${label}"
    echo "Expected pattern: $pattern"
    echo "Files: ${files[*]}"
    echo
    fail=1
  fi
}

echo "Running docs consistency checks..."

ACTIVE_DOCS=(
  "README.md"
  "docs/index.md"
  "docs/architecture.md"
  "docs/bidirectional-sync-design.md"
  "docs/coding-standards.md"
  "docs/frontend-dev-workflow.md"
  "docs/setup-test-topology.md"
)

POLICY_DOCS=(
  "README.md"
  "docs/working-agreement.md"
  "docs/contracts.md"
  "docs/automation-ui-guide.md"
  "docs/architecture.md"
  "docs/coding-standards.md"
  "docs/frontend-dev-workflow.md"
  "docs/setup-test-topology.md"
)

# Active docs should not instruct users to mutate lifecycle via WS commands.
check_matches \
  "No lifecycle WS mutation commands in active policy docs" \
  "topomation/locations/(create|update|delete)" \
  "${POLICY_DOCS[@]}"

# Active docs should not define legacy structural taxonomy examples.
check_matches \
  "No legacy location type taxonomy in active docs" \
  "\"type\": \"(room|zone|suite|building|outdoor)\"|\\| \"(room|zone|suite|building|outdoor)\"" \
  "${POLICY_DOCS[@]}"

# Active policy docs should not use deprecated automation UX labels/controls.
if command -v rg &>/dev/null; then
  sync_rooms_output="$(rg -n -e "\\bSync Rooms\\b" "${POLICY_DOCS[@]}" | rg -v 'not `Sync Rooms`' || true)"
else
  sync_rooms_output="$(grep -n -E "\\bSync Rooms\\b" "${POLICY_DOCS[@]}" 2>/dev/null | grep -v 'not `Sync Rooms`' || true)"
fi
if [[ -n "$sync_rooms_output" ]]; then
  echo "[FAIL] No deprecated Sync Rooms label in active policy docs"
  echo "$sync_rooms_output"
  echo
  fail=1
else
  echo "[PASS] No deprecated Sync Rooms label in active policy docs"
fi

check_matches \
  "No legacy Lighting startup reapply control in active policy docs" \
  "Reapply lighting rules on startup" \
  "${POLICY_DOCS[@]}"

check_matches \
  "No legacy Media/HVAC global startup reapply controls in active policy docs" \
  "Reapply media rules on startup|Reapply HVAC rules on startup|startup reapply setting is rendered per automation tab" \
  "${POLICY_DOCS[@]}"

check_matches \
  "No legacy startup fallback wording in active policy docs" \
  "compatibility fallback.*run_on_startup|Legacy location-global startup config|legacy location-global startup bit|older occupied/vacant rules until they are re-saved" \
  "${POLICY_DOCS[@]}"

require_match \
  "Active policy docs describe per-rule startup controls" \
  'Run on startup|per-rule `Run on startup`|run_on_startup' \
  "docs/contracts.md" "docs/automation-ui-guide.md" "docs/architecture.md"

check_matches \
  "No legacy dusk_dawn migration wording in active policy docs" \
  "migration compatibility.*dusk_dawn|may be present during migration|Target-state Lighting rule persistence is HA automation entities" \
  "docs/contracts.md" "docs/automation-ui-guide.md" "docs/architecture.md"

if command -v rg &>/dev/null; then
  legacy_automation_tabs_output="$(rg -n -e 'Lighting`, `Appliances`, `Media`, and `HVAC`|Detection`, `Ambient`, `Lighting`, `Appliances`, `Media`, `HVAC`|`Appliances` -> `switch\\.\\*`|/topomation-appliances' "${POLICY_DOCS[@]}" || true)"
else
  legacy_automation_tabs_output="$(grep -n -E 'Lighting`, `Appliances`, `Media`, and `HVAC`|Detection`, `Ambient`, `Lighting`, `Appliances`, `Media`, `HVAC`|`Appliances` -> `switch\.\*`|/topomation-appliances' "${POLICY_DOCS[@]}" 2>/dev/null || true)"
fi
if [[ -n "$legacy_automation_tabs_output" ]]; then
  echo "[FAIL] No legacy Appliances-first automation IA in active policy docs"
  echo "$legacy_automation_tabs_output"
  echo
  fail=1
else
  echo "[PASS] No legacy Appliances-first automation IA in active policy docs"
fi

check_matches \
  "Docs index does not list dusk-dawn lighting spec as active" \
  '^\| `docs/dusk-dawn-lighting-ui-spec\.md` \|.*\| Active' \
  "docs/index.md"

require_match \
  "Docs index lists working agreement as active" \
  '^\| `docs/working-agreement\.md` \|.*\| Active' \
  "docs/index.md"

require_match \
  "Docs index lists touched-workflow release gate as active" \
  '^\| `docs/touched-workflow-release-gate\.md` \|.*\| Active' \
  "docs/index.md"

require_match \
  "Docs index defines working agreement as authority-chain priority 1" \
  '^1\. `docs/working-agreement\.md`' \
  "docs/index.md"

require_match \
  "Working agreement defines dev-mode only rule" \
  '^1\. Dev mode only:' \
  "docs/working-agreement.md"

require_match \
  "Working agreement defines ambiguity stop rule" \
  '^2\. Ambiguity stop rule:' \
  "docs/working-agreement.md"

require_match \
  "Working agreement requires touched-workflow gate" \
  'Touched-workflow gate is mandatory' \
  "docs/working-agreement.md"

require_match \
  "Release docs reference touched-workflow release gate" \
  'docs/touched-workflow-release-gate\.md' \
  "docs/release-validation-runbook.md" "docs/live-ha-validation-checklist.md"

require_match \
  "Docs index defines delivery status vocabulary" \
  "^## Delivery Status Vocabulary" \
  "docs/index.md"

check_matches \
  "Issue template no longer uses a single ambiguous Status field" \
  "^\\*\\*Status\\*\\*:" \
  "project/issues/issue-template.md"

require_match \
  "Issue template defines Execution Status" \
  "^\\*\\*Execution Status\\*\\*:" \
  "project/issues/issue-template.md"

require_match \
  "Issue template defines Delivery Status" \
  "^\\*\\*Delivery Status\\*\\*:" \
  "project/issues/issue-template.md"

require_match \
  "ISSUE-058 defines Execution Status" \
  "^\\*\\*Execution Status\\*\\*:" \
  "project/issues/issue-058-automation-ui-contract-implementation.md"

require_match \
  "ISSUE-058 defines Delivery Status" \
  "^\\*\\*Delivery Status\\*\\*:" \
  "project/issues/issue-058-automation-ui-contract-implementation.md"

if command -v rg &>/dev/null; then
  automation_live_pending="$(rg -n -e "^- \\[ \\] Repeat these checks on a live HA runtime \\(outside mock harness\\) and record outcome\\." "docs/live-ha-validation-checklist.md" || true)"
else
  automation_live_pending="$(grep -n -E "^- \\[ \\] Repeat these checks on a live HA runtime \\(outside mock harness\\) and record outcome\\." "docs/live-ha-validation-checklist.md" 2>/dev/null || true)"
fi

if [[ -n "$automation_live_pending" ]]; then
  check_matches \
    "ISSUE-058 does not claim Done execution while live automation delta validation is pending" \
    "^\\*\\*Execution Status\\*\\*: Done" \
    "project/issues/issue-058-automation-ui-contract-implementation.md"

  check_matches \
    "ISSUE-058 does not claim Live-validated delivery while live automation delta validation is pending" \
    "^\\*\\*Delivery Status\\*\\*: .*Live-validated" \
    "project/issues/issue-058-automation-ui-contract-implementation.md"

  check_matches \
    "Current work does not mark automation UX reset as Completed while live automation delta validation is pending" \
    "^\\| Automation UX \\+ contracts reset \\| .*\\| Completed \\|" \
    "docs/current-work.md"

  check_matches \
    "Work tracking does not claim full live checklist pass while automation delta validation is pending" \
    'All sections of `docs/live-ha-validation-checklist.md` pass' \
    "docs/work-tracking.md"
fi

# Archived design docs should not reappear at docs/ top-level.
LEGACY_TOP_LEVEL=(
  "docs/ui-design.md"
  "docs/frontend-patterns.md"
  "docs/frontend-quick-reference.md"
  "docs/frontend-state-management.md"
  "docs/frontend-testing-patterns.md"
  "docs/frontend-error-handling.md"
  "docs/mock-component-strategy.md"
  "docs/accessibility-checklist.md"
  "docs/drag-drop-design-pattern.md"
  "docs/cleanup-pr-scope.md"
)

for legacy in "${LEGACY_TOP_LEVEL[@]}"; do
  if [[ -e "$legacy" ]]; then
    echo "[FAIL] Legacy top-level doc restored unexpectedly: $legacy"
    fail=1
  fi
done

if [[ $fail -ne 0 ]]; then
  echo
  echo "Docs consistency checks failed."
  exit 1
fi

echo
echo "Docs consistency checks passed."

echo
"$ROOT_DIR/scripts/check-docs-structure.sh"
