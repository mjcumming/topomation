#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

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
