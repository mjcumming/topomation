# Live HA Testing Setup - Summary

**Date**: 2025-12-09
**Status**: ✅ **COMPLETE**

## What Was Created

Complete setup for running real-world tests against live Home Assistant instances from the dev container.

### 📦 New Files

1. **`RUN-AGAINST-HA.md`** - Comprehensive guide

   - Two testing modes (mock vs live)
   - Setup instructions for both existing HA and test HA
   - Example test scenarios
   - Troubleshooting guide
   - CI/CD integration

2. **`QUICK-START-LIVE.md`** - 5-minute quick start

   - Option 1: Use existing HA
   - Option 2: Spin up test HA
   - Quick verification steps
   - Common commands

3. **`docker-compose.test-ha.yml`** - Test HA container

   - HA running on port 8124 (avoid conflicts)
   - Integration auto-mounted
   - Health checks
   - Volume mounts for config

4. **`run-live-tests.sh`** - Test runner script

   - Validates HA connection
   - Checks integration is loaded
   - Runs tests with proper environment
   - Color-coded output

5. **`ha-config.env.template`** - Configuration template

   - HA URL and token
   - Test mode settings
   - Timeout configuration
   - Cleanup options

6. **`.gitignore`** - Protect sensitive data

   - Excludes ha-config.env (contains tokens)
   - Excludes test HA config directory
   - Standard Python ignores

7. **Updated `conftest.py`** - Live HA fixtures

   - `pytest_addoption` for `--live-ha` flag
   - Custom markers (live_ha, mock_only)
   - `hass_live` fixture for real HA connection
   - Auto-skip logic based on mode

8. **Updated `Makefile`** - Live test commands
   - `make test-live` - Run against live HA
   - `make test-ha-up` - Start test HA
   - `make test-ha-down` - Stop test HA
   - `make test-ha-logs` - View logs

## Usage

### Quick Start (5 minutes)

```bash
# 1. Copy config template
cp tests/ha-config.env.template tests/ha-config.env

# 2. Edit with your HA details
nano tests/ha-config.env
# Set: HA_URL, HA_TOKEN

# 3. Run tests!
make test-live
```

### Using Test HA

```bash
# Start test HA
make test-ha-up

# Complete setup at http://localhost:8124

# Run tests
make test-live

# View logs
make test-ha-logs

# Stop when done
make test-ha-down
```

## Two Testing Modes

### Mode 1: Mock HA (Default)

- **Use**: Unit testing, CI/CD, quick validation
- **Speed**: Very fast (< 5 seconds)
- **Requirements**: None (all mocked)
- **Command**: `pytest tests/test-realworld.py -v`

### Mode 2: Live HA (Real-World)

- **Use**: Integration testing, pre-release validation, debugging
- **Speed**: Moderate (10-30 seconds)
- **Requirements**: Running HA instance + token
- **Command**: `pytest tests/test-realworld.py -v --live-ha`

## Test Markers

Tests can be marked for specific modes:

```python
@pytest.mark.live_ha
async def test_with_real_ha(hass_live):
    """Requires live HA instance."""
    pass

@pytest.mark.mock_only
def test_with_mock_ha(hass):
    """Only works with mocked HA."""
    pass
```

## What Gets Tested

### Mock Mode

✅ Component logic
✅ Event flow (simulated)
✅ Timeout handling (simulated time)
✅ Error handling

### Live Mode

✅ Real area import from HA
✅ Real sensor state changes
✅ Real timeout coordination
✅ Real entity updates in HA
✅ Real WebSocket API
✅ Real bidirectional sync

## Key Features

### 1. Dual-Mode Support

Same tests can run in both mock and live modes:

```bash
# Mock (fast)
pytest tests/test-realworld.py -v

# Live (real HA)
pytest tests/test-realworld.py -v --live-ha
```

### 2. Isolated Test HA

Test HA runs on separate port (8124) to avoid conflicts:

```yaml
ports:
  - "8124:8123" # Test HA
  # 8123 still available for your main HA
```

### 3. Auto-Cleanup

Tests can automatically cleanup after themselves:

```bash
# In ha-config.env
AUTO_CLEANUP="true"
```

### 4. Connection Validation

Script checks HA accessibility before running tests:

```bash
./tests/run-live-tests.sh
# 🔍 Checking Home Assistant at http://localhost:8123...
# ✅ Home Assistant is accessible
# 🧪 Running real-world tests against live HA...
```

### 5. Make Commands

Simple commands for common tasks:

```bash
make test-live      # Run against live HA
make test-ha-up     # Start test HA
make test-ha-down   # Stop test HA
make test-ha-logs   # View logs
```

## Configuration

### Required Settings

```bash
# ha-config.env
HA_URL="http://localhost:8123"
HA_TOKEN="eyJ0eXAiOiJ..."  # From HA Profile → Security
TEST_MODE="live"
```

### Optional Settings

```bash
TEST_TIMEOUT=10              # Occupancy timeout (seconds)
TEST_COORDINATOR_INTERVAL=1  # Coordinator check interval
AUTO_CLEANUP="true"          # Delete test artifacts
TEST_LOG_LEVEL="INFO"        # Logging level
```

## Example Test Scenarios

### 1. Area Import

```python
@pytest.mark.live_ha
async def test_import_real_areas(hass_live):
    # Create area in HA via API
    area = await hass_live.create_area(name="Test Living Room")

    # Reload integration
    await hass_live.reload_integration("home_topology")

    # Verify area imported as location
    # ...
```

### 2. Motion Sensor

```python
@pytest.mark.live_ha
async def test_real_motion_sensor(hass_live):
    # Set motion sensor state
    await hass_live.set_state("binary_sensor.test_motion", "on")

    # Wait for occupancy update
    await asyncio.sleep(1)

    # Check occupancy binary sensor
    state = await hass_live.get_state("binary_sensor.occupancy_room")
    assert state == "on"
```

### 3. Bidirectional Sync

```python
@pytest.mark.live_ha
async def test_bidirectional_rename(hass_live):
    # Rename via HA
    await hass_live.update_area(area_id, name="New Kitchen")

    # Verify location updated
    # ...

    # Rename via topology
    await hass_live.call_websocket(
        "home_topology/location/rename",
        location_id=location_id,
        name="Updated Kitchen"
    )

    # Verify HA area updated
    area = await hass_live.get_area(area_id)
    assert area.name == "Updated Kitchen"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Live HA Tests

on: [push, pull_request]

jobs:
  test-live:
    runs-on: ubuntu-latest
    services:
      homeassistant:
        image: homeassistant/home-assistant:latest
        ports:
          - 8123:8123

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
          pip install pytest homeassistant-api

      - name: Wait for HA
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8123/api/; do sleep 2; done'

      - name: Run tests
        run: |
          echo "HA_URL=http://localhost:8123" > tests/ha-config.env
          echo "HA_TOKEN=${{ secrets.HA_TEST_TOKEN }}" >> tests/ha-config.env
          echo "TEST_MODE=live" >> tests/ha-config.env
          make test-live
```

## Troubleshooting

### Cannot Connect to HA

**Check HA is running**:

```bash
curl http://localhost:8123/api/
# Should return: {"message": "API running."}
```

**Check from dev container**:

```bash
# If HA is on host machine
curl http://host.docker.internal:8123/api/
```

### Integration Not Loaded

**Via UI**: Settings → Devices & Services → Add Integration → Home Topology

**Via API**:

```bash
curl -X POST \
     -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/config/integrations/home_topology/reload
```

### Tests Hang

- Verify `TEST_TIMEOUT=10` in ha-config.env
- Check HA logs: `make test-ha-logs`
- Ensure integration is loaded in HA

### Token Issues

- Tokens don't expire but can be deleted
- Create new: Profile → Security → Long-Lived Access Tokens
- Update ha-config.env with new token

## Security

### Protected Files

- `ha-config.env` - **Contains sensitive tokens** - excluded from git
- `test-ha-config/` - Test HA config directory - excluded from git

### Best Practices

1. **Never commit tokens** - Use template file instead
2. **Use test HA for CI/CD** - Don't expose production HA
3. **Rotate tokens regularly** - Especially for CI/CD
4. **Limit token scope** - Create dedicated test tokens

## Benefits

✅ **Validates real integration** - Not just mocked components
✅ **Catches HA-specific issues** - Real async behavior, timing
✅ **Tests WebSocket API** - Real frontend communication
✅ **Pre-release confidence** - Know it works before users install
✅ **Debugging aid** - Test against your actual HA setup
✅ **Flexible setup** - Use existing HA or spin up test instance

## Next Steps

1. ✅ Basic setup complete
2. Run first live test: `make test-live`
3. Create test areas/sensors in HA
4. Run bidirectional sync tests
5. Test with your actual home setup!

---

**Status**: ✅ **READY TO USE**

**Quick Start**: See `QUICK-START-LIVE.md`
**Full Guide**: See `RUN-AGAINST-HA.md`
**Questions**: Check troubleshooting sections

**Ready to test against real HA!** 🚀
