# Running Real-World Tests Against Home Assistant

**Created**: 2025-12-09

## Overview

This guide explains how to run the real-world integration tests against an actual Home Assistant instance from your dev container.

## Two Testing Modes

### Mode 1: Mock HA (Current Default)

Uses `pytest-homeassistant-custom-component` fixtures - fast, isolated, no real HA needed.

**Use for**: Unit testing, CI/CD, quick validation

### Mode 2: Live HA Instance (Real-World)

Tests against a running Home Assistant instance - validates real integration behavior.

**Use for**: Integration testing, pre-release validation, debugging

## Setup: Running Against Live HA

### Option A: Use Your Existing HA Instance

#### 1. Find Your HA Instance Details

```bash
# Your HA instance needs to be accessible from the dev container
# Common scenarios:
# - HA running on host: http://localhost:8123
# - HA in Docker: http://homeassistant.local:8123
# - Remote HA: http://your-ha-ip:8123

# You'll need:
# - HA URL
# - Long-lived access token (from HA Profile → Security)
```

#### 2. Create Test Configuration

Create `/workspaces/home-topology-ha/tests/ha-config.env`:

```bash
# Home Assistant Connection
HA_URL="http://localhost:8123"
HA_TOKEN="your_long_lived_access_token_here"

# Test Configuration
TEST_MODE="live"  # or "mock" for standard pytest fixtures
TEST_TIMEOUT=10   # Short timeout for testing
```

**Get Token**:

1. In HA: Profile → Security → Long-Lived Access Tokens
2. Create token named "Integration Testing"
3. Copy token to `HA_TOKEN` above

#### 3. Run Tests Against Live HA

```bash
# Load config
source tests/ha-config.env

# Run all real-world tests
pytest tests/test-realworld.py -v --live-ha

# Run specific test
pytest tests/test-realworld.py::TestLocationAreaSync::test_ha_areas_imported_as_locations -v --live-ha
```

### Option B: Spin Up Test HA Instance

#### 1. Create Docker Compose for Test HA

I'll create this for you - see `tests/docker-compose.test-ha.yml`

#### 2. Start Test HA Instance

```bash
cd tests
docker-compose -f docker-compose.test-ha.yml up -d

# Wait for HA to start (check logs)
docker-compose -f docker-compose.test-ha.yml logs -f

# HA will be available at http://localhost:8124
```

#### 3. Initial Setup

```bash
# First time: complete HA onboarding
# Visit http://localhost:8124
# Create user: test / test123456
# Skip location/analytics

# Get token from HA UI
# Profile → Security → Create Long-Lived Access Token
# Name: "Test Integration"
# Copy token to ha-config.env
```

#### 4. Install Integration in Test HA

```bash
# From dev container, symlink integration
docker-compose -f docker-compose.test-ha.yml exec test-ha bash
cd /config/custom_components
ln -s /workspace/custom_components/home_topology home_topology

# Restart HA
docker-compose -f docker-compose.test-ha.yml restart

# Add integration via UI
# Settings → Devices & Services → Add Integration → Home Topology
```

## Running Tests

### Standard Tests (Mock HA)

```bash
# Fast, isolated, no real HA needed
pytest tests/test-realworld.py -v
```

### Live HA Tests

```bash
# Against your HA instance
source tests/ha-config.env
pytest tests/test-realworld.py -v --live-ha

# Specific category
pytest tests/test-realworld.py::TestLocationAreaSync -v --live-ha

# With detailed output
pytest tests/test-realworld.py -v -s --live-ha --log-cli-level=DEBUG
```

### Bidirectional Sync Tests

```bash
# These tests MUST run against live HA (they modify registries)
pytest tests/test-bidirectional-sync.py -v --live-ha
```

## Test Markers

### Add to pyproject.toml

```toml
[tool.pytest.ini_options]
markers = [
    "live_ha: Tests that require a live Home Assistant instance",
    "realworld: Real-world integration tests",
    "mock_only: Tests that only work with mocked HA",
]
```

### Usage in Tests

```python
import pytest

@pytest.mark.live_ha
@pytest.mark.asyncio
async def test_with_real_ha(hass_live: HomeAssistant):
    """This test runs against real HA."""
    # Test implementation
    pass

@pytest.mark.mock_only
def test_with_mock_ha(hass: HomeAssistant):
    """This test only works with mocked HA."""
    # Test implementation
    pass
```

## Creating Live HA Test Fixtures

### conftest.py Addition

```python
import os
import pytest
from homeassistant.core import HomeAssistant

@pytest.fixture
async def hass_live():
    """Connect to live Home Assistant instance."""
    if os.getenv("TEST_MODE") != "live":
        pytest.skip("Live HA tests require TEST_MODE=live")

    ha_url = os.getenv("HA_URL", "http://localhost:8123")
    ha_token = os.getenv("HA_TOKEN")

    if not ha_token:
        pytest.skip("Live HA tests require HA_TOKEN")

    # Use HA REST API client
    from homeassistant_api import Client

    client = Client(ha_url, ha_token)
    yield client

    # Cleanup: remove test entities/areas
    # (implement cleanup logic)
```

## Test Scenarios

### Scenario 1: Area Import Test

```python
@pytest.mark.live_ha
@pytest.mark.asyncio
async def test_import_real_areas(hass_live):
    """Test importing actual HA areas into topology."""
    # 1. Create test area in HA via API
    area = await hass_live.create_area(name="Test Living Room")

    # 2. Trigger integration reload
    await hass_live.reload_integration("home_topology")

    # 3. Verify area imported as location
    # (check via WebSocket API)

    # 4. Cleanup
    await hass_live.delete_area(area.id)
```

### Scenario 2: Motion Sensor Trigger

```python
@pytest.mark.live_ha
@pytest.mark.asyncio
async def test_real_motion_sensor(hass_live):
    """Test real motion sensor triggering occupancy."""
    # 1. Create test area
    area = await hass_live.create_area(name="Test Room")

    # 2. Create test motion sensor
    sensor = await hass_live.create_entity(
        entity_id="binary_sensor.test_motion",
        state="off",
        device_class="motion",
        area_id=area.id
    )

    # 3. Set motion sensor to ON
    await hass_live.set_state("binary_sensor.test_motion", "on")

    # 4. Wait for occupancy update (short timeout)
    await asyncio.sleep(1)

    # 5. Check occupancy binary sensor
    occupancy_state = await hass_live.get_state(
        f"binary_sensor.home_topology_{area.id}_occupancy"
    )
    assert occupancy_state == "on"

    # 6. Cleanup
    await hass_live.delete_entity(sensor.entity_id)
    await hass_live.delete_area(area.id)
```

### Scenario 3: Bidirectional Sync

```python
@pytest.mark.live_ha
@pytest.mark.asyncio
async def test_bidirectional_area_rename(hass_live):
    """Test area rename propagates both ways."""
    # 1. Create area in HA
    area = await hass_live.create_area(name="Kitchen")

    # 2. Reload integration
    await hass_live.reload_integration("home_topology")

    # 3. Rename via HA
    await hass_live.update_area(area.id, name="New Kitchen")

    # 4. Verify location name updated
    # (check via WebSocket API)

    # 5. Rename via topology WebSocket API
    await hass_live.call_websocket(
        "home_topology/location/rename",
        location_id=f"area_{area.id}",
        name="Updated Kitchen"
    )

    # 6. Verify HA area name updated
    updated_area = await hass_live.get_area(area.id)
    assert updated_area.name == "Updated Kitchen"

    # 7. Cleanup
    await hass_live.delete_area(area.id)
```

## Helper Script

### Run Script: tests/run-live-tests.sh

```bash
#!/bin/bash
# Run real-world tests against live HA

set -e

# Check config
if [ ! -f "tests/ha-config.env" ]; then
    echo "❌ Missing tests/ha-config.env"
    echo "Create it with:"
    echo "  HA_URL=http://localhost:8123"
    echo "  HA_TOKEN=your_token"
    exit 1
fi

# Load config
source tests/ha-config.env

# Verify HA is accessible
echo "🔍 Checking HA at $HA_URL..."
if ! curl -s -f -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/" > /dev/null; then
    echo "❌ Cannot connect to HA at $HA_URL"
    exit 1
fi
echo "✅ HA is accessible"

# Run tests
echo "🧪 Running real-world tests against live HA..."
pytest tests/test-realworld.py -v --live-ha "$@"
```

Make executable:

```bash
chmod +x tests/run-live-tests.sh
```

## Cleanup After Tests

### Manual Cleanup

```bash
# List test areas
curl -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/area_registry/list

# Delete test area
curl -X DELETE \
     -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/area_registry/delete/AREA_ID
```

### Automatic Cleanup Fixture

```python
@pytest.fixture
async def auto_cleanup_areas(hass_live):
    """Automatically cleanup test areas after test."""
    created_areas = []

    async def create_test_area(name):
        area = await hass_live.create_area(name)
        created_areas.append(area.id)
        return area

    yield create_test_area

    # Cleanup
    for area_id in created_areas:
        try:
            await hass_live.delete_area(area_id)
        except Exception as e:
            print(f"Warning: Failed to cleanup area {area_id}: {e}")
```

## Troubleshooting

### Connection Issues

```bash
# Test HA connection
curl -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/

# Should return: {"message": "API running."}
```

### Integration Not Loaded

```bash
# Check if integration is loaded
curl -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/integrations

# Reload integration
curl -X POST \
     -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/integrations/home_topology/reload
```

### Tests Hanging

- Check HA logs: `docker-compose -f docker-compose.test-ha.yml logs -f`
- Verify short timeouts are set: `TEST_TIMEOUT=10` in ha-config.env
- Check WebSocket connection in HA logs

### Permission Errors

- Ensure token has full access (not restricted)
- Check user has admin privileges
- Verify token hasn't expired

## CI/CD Integration

### GitHub Actions with Test HA

```yaml
name: Real-World Tests

on: [push, pull_request]

jobs:
  test-live:
    runs-on: ubuntu-latest
    services:
      homeassistant:
        image: homeassistant/home-assistant:latest
        ports:
          - 8123:8123
        options: >-
          --health-cmd "curl -f http://localhost:8123/api/ || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -e /workspaces/home-topology
          pip install -e .
          pip install pytest pytest-asyncio homeassistant-api

      - name: Wait for HA
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8123/api/; do sleep 2; done'

      - name: Setup HA token
        run: |
          # Create token via HA REST API
          # (requires initial setup script)
          echo "HA_URL=http://localhost:8123" > tests/ha-config.env
          echo "HA_TOKEN=${{ secrets.HA_TEST_TOKEN }}" >> tests/ha-config.env

      - name: Run real-world tests
        run: |
          source tests/ha-config.env
          pytest tests/test-realworld.py -v --live-ha
```

## Best Practices

### 1. Use Test Prefix

Always prefix test entities/areas with "Test " for easy identification:

```python
area = await hass_live.create_area(name="Test Kitchen")
```

### 2. Always Cleanup

Use fixtures or try/finally to ensure cleanup:

```python
try:
    area = await hass_live.create_area(name="Test Room")
    # ... test code ...
finally:
    await hass_live.delete_area(area.id)
```

### 3. Short Timeouts

Use 10s timeouts for testing, not production defaults:

```python
config["timeout"] = 10  # seconds
```

### 4. Isolated Tests

Each test should be independent - don't rely on other tests' state.

### 5. Verify Cleanup

After test suite runs, verify no test artifacts remain:

```bash
# List areas - should not see "Test *" areas
curl -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/area_registry/list
```

---

**Ready to test against live HA?**

1. Choose Option A (existing HA) or Option B (test HA)
2. Create `ha-config.env`
3. Run: `./tests/run-live-tests.sh`

**Questions?** Check the troubleshooting section or HA logs for details.
