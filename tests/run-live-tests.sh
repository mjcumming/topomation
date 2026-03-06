#!/bin/bash
# Run real-world tests against live Home Assistant
# Usage: ./tests/run-live-tests.sh [pytest-args]

set -e

cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 Topomation - Live HA Testing${NC}\n"

REQUESTED_TEST_PATH="${1:-tests/test-realworld.py}"

# Check if ha-config.env exists
if [ ! -f "tests/ha-config.env" ]; then
    echo -e "${RED}❌ Missing tests/ha-config.env${NC}"
    echo ""
    echo "Copy tests/ha-config.env.template to ha-config.env and set:"
    echo "  HA_URL_DEV, HA_TOKEN_DEV (local/test - used by release gate)"
    echo "  HA_URL_PROD, HA_TOKEN_PROD (production - optional, set HA_TARGET=prod to use)"
    echo ""
    echo "Get token from HA: Profile → Security → Long-Lived Access Tokens"
    echo ""
    exit 1
fi

# Load config (HA_TARGET may be set by caller, e.g. test-release-live.sh sets HA_TARGET=dev)
source tests/ha-config.env

# In the dev-container release path, pin "dev" runs to the local HA runtime when
# explicitly requested by the caller. This avoids accidentally validating a
# remote/stale instance that is not serving the current workspace build.
if [ "${HA_TARGET:-dev}" = "dev" ] && [ "${TOPOMATION_PREFER_LOCAL_HA:-0}" = "1" ]; then
    if [ -z "${HA_URL_LOCAL:-}" ]; then
        HA_URL_LOCAL="http://127.0.0.1:8123"
    fi
    if [ -z "${HA_TOKEN_LOCAL:-}" ] && [ -f "ha_long_lived_token" ]; then
        HA_TOKEN_LOCAL="$(cat ha_long_lived_token)"
    fi
    if [ -n "${HA_URL_LOCAL:-}" ] && [ -n "${HA_TOKEN_LOCAL:-}" ]; then
        export HA_URL="${HA_URL_LOCAL}"
        export HA_TOKEN="${HA_TOKEN_LOCAL}"
        echo -e "${BLUE}🔒 Using local HA override for dev release validation: $HA_URL${NC}"
    fi
fi

# Verify required variables
if [ -z "$HA_URL" ]; then
    echo -e "${RED}❌ HA_URL not set for current target${NC}"
    echo "  For local/test: set HA_URL_DEV in tests/ha-config.env"
    echo "  For production: set HA_URL_PROD and HA_TARGET=prod"
    exit 1
fi

if [ -z "$HA_TOKEN" ]; then
    echo -e "${RED}❌ HA_TOKEN not set for current target${NC}"
    echo "  For local/test (release gate): set HA_TOKEN_DEV in tests/ha-config.env"
    echo "  For production: set HA_TOKEN_PROD and HA_TARGET=prod"
    exit 1
fi

# Check HA connectivity
echo -e "${BLUE}🔍 Checking Home Assistant at $HA_URL...${NC}"
if ! curl -s -f -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to Home Assistant at $HA_URL${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Is HA running? Check: $HA_URL"
    echo "  2. Is token valid? Check HA → Profile → Security"
    echo "  3. Is HA accessible from container?"
    echo ""
    echo "If using test HA, start it with:"
    echo "  cd tests && docker-compose -f docker-compose.test-ha.yml up -d"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Home Assistant is accessible${NC}"

# Check if integration is loaded.
# Prefer /api/config/integrations when available, but newer/alternate HA builds
# can return 404 there; in that case fall back to /api/config components.
echo -e "${BLUE}🔍 Checking if topomation integration is loaded...${NC}"
INTEGRATION_LOADED=0

INTEGRATIONS_HTTP_CODE=$(curl -s -o /tmp/topomation-integrations.json -w "%{http_code}" \
    -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/config/integrations" || true)

if [ "$INTEGRATIONS_HTTP_CODE" = "200" ]; then
    if grep -q "topomation" /tmp/topomation-integrations.json; then
        INTEGRATION_LOADED=1
    fi
else
    CONFIG_HTTP_CODE=$(curl -s -o /tmp/topomation-config.json -w "%{http_code}" \
        -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/config" || true)
    if [ "$CONFIG_HTTP_CODE" = "200" ] && grep -q "\"topomation\"" /tmp/topomation-config.json; then
        INTEGRATION_LOADED=1
    fi
fi

if [ "$INTEGRATION_LOADED" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  topomation integration not loaded in HA${NC}"
    echo ""
    echo "To load the integration:"
    echo "  1. Visit: $HA_URL/config/integrations"
    echo "  2. Click: Add Integration"
    echo "  3. Search: Topomation"
    echo "  4. Click: Topomation"
    echo ""
    if [[ "$REQUESTED_TEST_PATH" == *"test-live-managed-actions-contract.py"* ]]; then
        echo -e "${RED}❌ Managed-action live contract requires Topomation integration to be loaded${NC}"
        echo "Load the integration first, then re-run the live contract gate."
        exit 1
    fi
    echo "Continuing anyway (some tests may fail)..."
else
    echo -e "${GREEN}✅ topomation integration is loaded${NC}"
fi

# Install test dependencies if needed
echo -e "${BLUE}🔍 Checking test dependencies...${NC}"
if ! python -c "import homeassistant_api" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  homeassistant_api not installed, installing...${NC}"
    pip install homeassistant-api -q
fi
echo -e "${GREEN}✅ Test dependencies ready${NC}"

# Export variables for pytest
export HA_URL
export HA_TOKEN
export TEST_MODE="${TEST_MODE:-live}"
export TEST_TIMEOUT="${TEST_TIMEOUT:-10}"

# pytest-socket blocks non-local hosts by default in our test stack.
# Allow the configured HA host so live contract tests can connect.
HA_HOST="$(python - "$HA_URL" <<'PY'
from urllib.parse import urlparse
import sys

parsed = urlparse(sys.argv[1])
print(parsed.hostname or "")
PY
)"

# Run tests
echo ""
echo -e "${BLUE}🧪 Running real-world tests against live HA...${NC}"
echo ""

# Default to running all real-world tests
TEST_PATH="$REQUESTED_TEST_PATH"

# Shift first arg if it's a test path
if [ -f "$TEST_PATH" ] || [[ "$TEST_PATH" == tests/* ]]; then
    shift
fi

# Run pytest with live-ha mode enabled.
# Live contract checks should not trip coverage thresholds from unit suites.
if [ -n "$HA_HOST" ]; then
    pytest "$TEST_PATH" -v -m "not mock_only" --live-ha --no-cov --allow-hosts="$HA_HOST" "$@" || TEST_RESULT=$?
else
    pytest "$TEST_PATH" -v -m "not mock_only" --live-ha --no-cov "$@" || TEST_RESULT=$?
fi

echo ""
if [ ${TEST_RESULT:-0} -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit $TEST_RESULT
fi

# Optional: Show cleanup reminder
echo ""
echo -e "${YELLOW}💡 Tip: Check for test artifacts in HA:${NC}"
echo "   $HA_URL/config/areas"
echo "   Look for areas/entities starting with 'Test'"
echo ""
