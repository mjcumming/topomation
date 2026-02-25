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

# Check if ha-config.env exists
if [ ! -f "tests/ha-config.env" ]; then
    echo -e "${RED}❌ Missing tests/ha-config.env${NC}"
    echo ""
    echo "Create it with your HA connection details:"
    echo ""
    echo -e "${YELLOW}HA_URL=http://localhost:8123${NC}"
    echo -e "${YELLOW}HA_TOKEN=your_long_lived_access_token_here${NC}"
    echo -e "${YELLOW}TEST_MODE=live${NC}"
    echo -e "${YELLOW}TEST_TIMEOUT=10${NC}"
    echo ""
    echo "Get token from HA:"
    echo "  Profile → Security → Long-Lived Access Tokens"
    echo ""
    exit 1
fi

# Load config
source tests/ha-config.env

# Verify required variables
if [ -z "$HA_URL" ]; then
    echo -e "${RED}❌ HA_URL not set in tests/ha-config.env${NC}"
    exit 1
fi

if [ -z "$HA_TOKEN" ]; then
    echo -e "${RED}❌ HA_TOKEN not set in tests/ha-config.env${NC}"
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

# Check if integration is loaded
echo -e "${BLUE}🔍 Checking if topomation integration is loaded...${NC}"
INTEGRATIONS=$(curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/config/integrations" | grep -c "topomation" || true)
if [ "$INTEGRATIONS" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  topomation integration not loaded in HA${NC}"
    echo ""
    echo "To load the integration:"
    echo "  1. Visit: $HA_URL/config/integrations"
    echo "  2. Click: Add Integration"
    echo "  3. Search: Topomation"
    echo "  4. Click: Topomation"
    echo ""
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

# Run tests
echo ""
echo -e "${BLUE}🧪 Running real-world tests against live HA...${NC}"
echo ""

# Default to running all real-world tests
TEST_PATH="${1:-tests/test-realworld.py}"

# Shift first arg if it's a test path
if [ -f "$TEST_PATH" ] || [[ "$TEST_PATH" == tests/* ]]; then
    shift
fi

# Run pytest with live-ha marker
pytest "$TEST_PATH" -v -m "not mock_only" "$@" || TEST_RESULT=$?

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
