# Topomation Tests

Comprehensive test suite for the Topomation Home Assistant integration.

## Test Files

### Unit Tests

- **`test_init.py`** - Integration setup/teardown lifecycle tests
- **`test_coordinator.py`** - Timeout scheduling and coordination tests
- **`test_event_bridge.py`** - Event translation and bridge tests
- **`test-ambient.py`** - Ambient light module tests

### Integration Tests

- **`test-realworld.py`** - ✨ Real-world integration tests with realistic scenarios

### Configuration

- **`conftest.py`** - Shared pytest fixtures and test configuration
- **`pytest-realworld.ini`** - Pytest configuration for real-world tests

## Documentation

### Testing Guides

- **`DEV-CONTAINER-HA.md`** - Canonical run/restart workflow for HA in this repo's dev container
- **`QUICK-START-LIVE.md`** - 🚀 5-minute guide to test against live HA
- **`RUN-AGAINST-HA.md`** - Complete guide for live HA testing
- **`REALWORLD-TESTS.md`** - Comprehensive guide to real-world testing
- **`QUICK-REFERENCE.md`** - One-page command reference

### Background

- **`TEST-IMPROVEMENTS.md`** - History of test improvements
- **`HA-BEST-PRACTICES.md`** - Home Assistant testing best practices
- **`BEFORE-AFTER.md`** - Before/after comparison of test quality
- **`2025.12.09-realworld-tests-summary.md`** - Implementation summary

## Quick Start

### Setup (One Time)

```bash
# Install core library
pip install -e /workspaces/topomation

# Install test dependencies
pip install pytest pytest-asyncio pytest-homeassistant-custom-component home-assistant-frontend

# For live HA testing (optional)
pip install homeassistant-api
```

### Run Tests

#### Mock HA Tests (Fast)

```bash
# All tests
pytest tests/ -v

# Unit tests only
pytest tests/test_init.py tests/test_coordinator.py tests/test_event_bridge.py -v

# Real-world integration tests
pytest tests/test-realworld.py -v

# Ambient light tests
pytest tests/test-ambient.py -v

# With coverage
pytest tests/ --cov=custom_components.topomation --cov-report=html
```

#### Dependency Update Smoke Test (Recommended)

Use this right after bumping a dependency pin (for example `home-topology`):

```bash
pytest -q --no-cov tests/test_init.py tests/test_event_bridge.py tests/test_services.py
```

Why `--no-cov`: the repo enforces a global coverage threshold, so focused test subsets can fail coverage even when behavior is correct.

#### Live HA Tests (Real Integration)

```bash
# Quick setup
cp tests/ha-config.env.template tests/ha-config.env
# Edit ha-config.env with your HA URL and token

# Run against live HA
make test-live

# Or use script
./tests/run-live-tests.sh

# Or pytest directly
source tests/ha-config.env
pytest tests/test-realworld.py -v --live-ha
```

**See**: `QUICK-START-LIVE.md` for 5-minute setup guide!
**Dev container**: `DEV-CONTAINER-HA.md` is the canonical HA run/restart reference.

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Characteristics**:

- Fast execution (< 1 second)
- Mocked dependencies
- Component-level validation
- Error handling

**Files**: `test_init.py`, `test_coordinator.py`, `test_event_bridge.py`

### 2. Real-World Integration Tests

**Purpose**: Test complete data flows with realistic scenarios

**Characteristics**:

- Real kernel components
- Realistic house structures
- Multiple sensor types
- Short timeouts for fast testing

**Files**: `test-realworld.py`

Current status:

- The `test-realworld.py` suite is currently marked `skip` in default CI while it is being refreshed for `home-topology` v1 event/registry contracts.
- Keep the file for scenario reference; remove the module-level skip once the v1 refresh is complete.

**Test Categories**:

1. **Location/Area Sync** - HA areas ↔ topology locations
2. **Event Flow** - Sensors → Events → Modules
3. **Timeout Handling** - Occupancy expiration with coordination
4. **End-to-End Scenarios** - Complete user workflows

## Test Configuration

### Short Timeouts for Testing

Real-world tests use short timeouts for fast iteration:

| Setting           | Test Value | Production Default |
| ----------------- | ---------- | ------------------ |
| Occupancy timeout | 10s        | 300s (5min)        |
| Coordinator check | 1s         | varies             |
| Trailing timeout  | 2s         | varies             |

⚠️ **These are for testing only!**

### Realistic Test Data

**House Structure**:

```
House (root)
├── Ground Floor
│   ├── Living Room (motion, light, TV)
│   ├── Kitchen (motion, door)
│   └── Hallway
└── First Floor
    ├── Master Bedroom (motion, light)
    └── Guest Bedroom
```

**Sensor Types**:

- Motion sensors (`binary_sensor.motion`)
- Door/window sensors (`binary_sensor.door`)
- Light dimmers (brightness 0-100%)
- Media players (playing/paused/idle)

## Coverage

### Current Status

| Component          | Unit Tests | Integration Tests | Combined |
| ------------------ | ---------- | ----------------- | -------- |
| `__init__.py`      | 70%        | ✅ Location sync  | ~85%     |
| `coordinator.py`   | 95%        | ✅ Timeouts       | ~95%     |
| `event_bridge.py`  | 90%        | ✅ Event flow     | ~90%     |
| `binary_sensor.py` | Basic      | ✅ Scenarios      | ~75%     |
| `sensor.py`        | 60%        | Partial           | ~60%     |
| **Overall**        | **~85%**   | **~80%**          | **~90%** |

## Common Commands

### Run Specific Test

```bash
pytest tests/test-realworld.py::TestEndToEndScenarios::test_morning_routine_scenario -v
```

### Debug Mode

```bash
pytest tests/test-realworld.py -v -s --log-cli-level=DEBUG
```

### Stop on First Failure

```bash
pytest tests/ -v -x
```

### Run Last Failed

```bash
pytest tests/ -v --lf
```

### Watch Mode

```bash
pip install pytest-watch
ptw tests/ -v
```

## Adding New Tests

### Unit Test Template

```python
def test_my_component_behavior(mock_dependency):
    """Test that my component behaves correctly."""
    # Setup
    component = MyComponent(mock_dependency)

    # Action
    result = component.do_something()

    # Assert
    assert result == expected_value
```

### Integration Test Template

```python
@pytest.mark.asyncio
async def test_my_scenario(self, hass: HomeAssistant):  # noqa: ARG002
    """Test my specific use case."""
    from home_topology import EventBus, LocationManager  # noqa: PLC0415

    # Setup
    loc_mgr = LocationManager()
    bus = EventBus()
    # ... setup locations, modules

    # Action
    bus.publish(event_type="...", location_id="...", data={...})

    # Assert
    assert expected_condition
```

## Troubleshooting

### Import Errors

```bash
# Error: ModuleNotFoundError: No module named 'topomation'
pip install -e /workspaces/topomation
```

### Async Warnings

Ensure test functions are marked with `@pytest.mark.asyncio`

### Hanging Tests

Tests use simulated time - no actual waiting needed

### Coverage Not Generated

```bash
pip install pytest-cov
pytest tests/ --cov=custom_components.topomation --cov-report=html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: |
          pip install -e /workspaces/topomation
          pip install pytest pytest-asyncio pytest-cov
      - name: Run tests
        run: pytest tests/ -v --cov=custom_components.topomation
```

## Best Practices

### Test Organization

- ✅ One test per behavior/scenario
- ✅ Clear test names describing what's tested
- ✅ Comprehensive docstrings
- ✅ Use fixtures for reusable setup

### Test Quality

- ✅ Test behavior, not implementation
- ✅ Include error cases
- ✅ Keep tests independent
- ✅ Use realistic test data

### Performance

- ✅ Unit tests should be fast (< 1s)
- ✅ Integration tests can be slower (< 5s)
- ✅ Use short timeouts for testing
- ✅ Avoid unnecessary waiting

## Further Reading

- **`REALWORLD-TESTS.md`** - Deep dive into integration testing
- **`QUICK-REFERENCE.md`** - Command cheat sheet
- **`HA-BEST-PRACTICES.md`** - Home Assistant testing patterns
- **`TEST-IMPROVEMENTS.md`** - Evolution of test suite

---

**Questions?** Check the documentation files or the test code itself - heavily commented!

**Contributing?** Follow the templates above and existing test patterns.

**Need Help?** Review `REALWORLD-TESTS.md` for detailed explanations.
