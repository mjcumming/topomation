# Real-World Integration Testing

**Created**: 2025-12-09
**Status**: ✅ Implemented

## Overview

Real-world integration tests simulate realistic scenarios with actual data flows between Home Assistant and the home-topology kernel. These tests validate the complete stack from sensor state changes through to entity updates.

## Test Philosophy

### Why Real-World Tests?

The existing unit tests (`test_init.py`, `test_coordinator.py`, `test_event_bridge.py`) are excellent for testing individual components in isolation. Real-world tests complement these by:

1. **Testing Integration**: Validating that components work together correctly
2. **Simulating Reality**: Using realistic house structures and sensor patterns
3. **Validating Data Flow**: Ensuring events flow correctly through the entire stack
4. **Live Testing**: Short timeouts make it easy to test manually

### What's Different?

| Unit Tests          | Real-World Tests       |
| ------------------- | ---------------------- |
| Single component    | Full integration       |
| Mocked dependencies | Real kernel components |
| Instant results     | Time-based scenarios   |
| Component behavior  | User experience        |

## Test Structure

### File: `test-realworld.py`

The test suite is organized into four main test classes:

```python
1. TestLocationAreaSync          # HA areas ↔ Topology locations
2. TestEventFlowIntegration      # Sensors → Events → Modules
3. TestTimeoutHandling           # Short timeouts for live testing
4. TestEndToEndScenarios         # Complete user scenarios
```

## Test Configuration

### Short Timeouts for Easy Testing

All tests use **short timeouts** to make live testing practical:

```python
TEST_OCCUPANCY_TIMEOUT = 10     # 10 seconds (default: 300s)
TEST_COORDINATOR_INTERVAL = 1   # 1 second
TEST_TRAILING_TIMEOUT = 2       # 2 seconds
```

**Why Short Timeouts?**

- ✅ Fast test execution
- ✅ Easy manual verification
- ✅ Quick iteration during development
- ⚠️ **Don't use in production!**

### Realistic Test Fixtures

#### House Structure

```
House (root)
├── Ground Floor
│   ├── Living Room
│   │   ├── binary_sensor.living_room_motion
│   │   ├── light.living_room
│   │   └── media_player.living_room_tv
│   ├── Kitchen
│   │   ├── binary_sensor.kitchen_motion
│   │   └── binary_sensor.kitchen_door
│   └── Hallway
└── First Floor
    ├── Master Bedroom
    │   ├── binary_sensor.master_bedroom_motion
    │   └── light.master_bedroom
    └── Guest Bedroom
```

#### Sensor Types Covered

- **Motion sensors** (`binary_sensor.motion`)
- **Door/window sensors** (`binary_sensor.door`)
- **Lights** (with brightness/dimmer support)
- **Media players** (playing/paused/idle states)

## Test Categories

### 1. Location/Area Bidirectional Sync

**Tests**: `TestLocationAreaSync`

**What It Tests**:

- HA areas are imported as topology locations
- Entities are mapped to locations based on area assignments
- Location hierarchy is preserved (house → areas)

**Example**:

```python
test_ha_areas_imported_as_locations()
test_entities_mapped_to_locations()
test_location_hierarchy_preserved()
```

**Key Validation**:

- All HA areas become locations
- Entity-to-location mappings are correct
- Parent-child relationships maintained

### 2. Event Flow Integration

**Tests**: `TestEventFlowIntegration`

**What It Tests**:

- Motion sensors trigger occupancy
- Light dimmers trigger occupancy (activity detection)
- Media players trigger occupancy
- EventBridge translates HA states to kernel events

**Data Flow**:

```
HA State Change
    ↓
EventBridge (translation)
    ↓
EventBus.publish()
    ↓
OccupancyModule.handle_event()
    ↓
EventBus.publish(occupancy.changed)
    ↓
OccupancyBinarySensor.async_write_ha_state()
```

**Example Tests**:

```python
test_motion_sensor_triggers_occupancy()
test_light_dimmer_triggers_occupancy()
test_media_player_triggers_occupancy()
test_event_bridge_translates_ha_states()
```

### 3. Timeout Handling

**Tests**: `TestTimeoutHandling`

**What It Tests**:

- Occupancy expires after timeout with no activity
- Coordinator schedules timeout checks
- Multiple modules coordinate timeouts correctly

**Scenarios**:

1. **Single timeout**: Motion → 10s → Vacancy
2. **Coordinator scheduling**: Finds earliest timeout across modules
3. **Multiple timeouts**: Coordinator picks the soonest

**Example**:

```python
# Motion detected → Occupied
t=0s:  motion ON  → occupancy = True

# No more activity
t=10s: (timeout)  → occupancy = False
```

### 4. End-to-End Scenarios

**Tests**: `TestEndToEndScenarios`

**What It Tests**:

- Complete user scenarios with multiple events
- Realistic sequences (morning routine, movie watching)
- Multi-room tracking

**Scenario 1: Morning Routine**

```python
test_morning_routine_scenario()

1. Wake up: motion detected        → Occupied
2. Turn on light (70% brightness)  → Still occupied (timeout extended)
3. Leave room, no activity          → After 10s → Vacant
```

**Scenario 2: Movie Watching**

```python
test_movie_watching_scenario()

1. Enter room: motion               → Occupied
2. Turn off lights (darkness)       → Still occupied (lights off ≠ vacant)
3. Start movie: media playing       → Still occupied (active use)
```

**Scenario 3: Multi-Room Tracking**

```python
test_multi_room_tracking()

Person walks through house:
t=0s:   Hallway motion   → Hallway occupied
t=2s:   Kitchen motion   → Kitchen occupied
t=4s:   Living Room      → Living Room occupied

t=14s:  (all timeouts)   → All vacant
```

## Running the Tests

### Prerequisites

```bash
# Install dependencies
pip install -e /workspaces/home-topology  # Core library
pip install pytest pytest-asyncio pytest-homeassistant-custom-component

# Verify installation
python -c "from home_topology import LocationManager; print('✅ Core library installed')"
```

### Run All Real-World Tests

```bash
# Run the full real-world test suite
pytest tests/test-realworld.py -v

# Run with detailed output
pytest tests/test-realworld.py -v -s

# Run specific test class
pytest tests/test-realworld.py::TestEventFlowIntegration -v

# Run specific test
pytest tests/test-realworld.py::TestEndToEndScenarios::test_morning_routine_scenario -v
```

### Run with Coverage

```bash
# Generate coverage report
pytest tests/test-realworld.py --cov=custom_components.home_topology --cov-report=html

# View coverage
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Watch Mode (Development)

```bash
# Auto-run tests on file changes
pytest-watch tests/test-realworld.py -v
```

## Test Output Examples

### Successful Test Run

```
tests/test-realworld.py::TestLocationAreaSync::test_ha_areas_imported_as_locations PASSED
tests/test-realworld.py::TestLocationAreaSync::test_entities_mapped_to_locations PASSED
tests/test-realworld.py::TestEventFlowIntegration::test_motion_sensor_triggers_occupancy PASSED
tests/test-realworld.py::TestTimeoutHandling::test_occupancy_timeout_expires PASSED
tests/test-realworld.py::TestEndToEndScenarios::test_morning_routine_scenario PASSED

========================== 15 passed in 2.34s ==========================
```

### Failed Test (Example)

```
tests/test-realworld.py::TestEventFlowIntegration::test_motion_sensor_triggers_occupancy FAILED

E   AssertionError: assert 0 == 1
E   Expected 1 occupancy event, got 0
E
E   Event flow:
E     1. Published sensor.motion event
E     2. Expected occupancy.changed event
E     3. No event received (check event subscriptions?)
```

## Integration with Existing Tests

### Test Coverage Matrix

| Component          | Unit Tests                | Real-World Tests    | Coverage |
| ------------------ | ------------------------- | ------------------- | -------- |
| `__init__.py`      | ✅ `test_init.py`         | ✅ Location sync    | ~85%     |
| `coordinator.py`   | ✅ `test_coordinator.py`  | ✅ Timeout handling | ~95%     |
| `event_bridge.py`  | ✅ `test_event_bridge.py` | ✅ Event flow       | ~90%     |
| `binary_sensor.py` | ⚠️ Basic only             | ✅ Full scenarios   | ~75%     |
| `sensor.py`        | ✅ `test-ambient.py`      | ⚠️ Partial          | ~60%     |

### When to Use Each Test Type

**Use Unit Tests** (`test_init.py`, etc.) for:

- Component-level logic
- Error handling
- Edge cases
- Fast CI/CD pipelines

**Use Real-World Tests** (`test-realworld.py`) for:

- Integration validation
- User scenario testing
- Performance validation
- Pre-release verification

## Common Issues & Solutions

### Issue 1: `home-topology` Import Error

**Error**:

```
ModuleNotFoundError: No module named 'home_topology'
```

**Solution**:

```bash
# Install core library
pip install -e /workspaces/home-topology

# Or if using venv
source venv/bin/activate
pip install -e /workspaces/home-topology
```

### Issue 2: Async Test Warnings

**Warning**:

```
RuntimeWarning: coroutine was never awaited
```

**Solution**:

- Ensure all test functions are marked with `@pytest.mark.asyncio`
- Use `await` for async function calls

### Issue 3: Timeout Tests Hanging

**Issue**: Tests that check timeouts seem to hang

**Solution**:

- Tests use simulated time with `dt_util.utcnow()`
- Call `occupancy.check_timeouts(future_time)` explicitly
- Don't rely on real-time delays

## Future Enhancements

### Planned Test Additions

1. **Browser-Based UI Testing**

   - Test WebSocket API with real browser
   - Validate frontend updates in real-time

2. **Performance Testing**

   - Load testing with 100+ sensors
   - Event throughput benchmarks
   - Memory usage validation

3. **Real HA Instance Tests**

   - Run against actual Home Assistant
   - Validate with physical hardware
   - Test HA restart/reload scenarios

4. **Ambient Light Module Tests**
   - Integrate with real-world test suite
   - Test sensor inheritance
   - Validate sun fallback

### Test Automation

**GitHub Actions Workflow** (proposed):

```yaml
name: Real-World Tests

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
          pip install -e /workspaces/home-topology
          pip install pytest pytest-asyncio
      - name: Run real-world tests
        run: pytest tests/test-realworld.py -v
```

## Developer Workflow

### Test-Driven Development

1. **Write test first** (describing expected behavior)
2. **Run test** (should fail)
3. **Implement feature**
4. **Run test** (should pass)
5. **Refactor** (test should still pass)

### Before Committing

```bash
# Run all tests
pytest tests/ -v

# Check specific real-world scenarios
pytest tests/test-realworld.py::TestEndToEndScenarios -v

# Verify no regressions
pytest tests/test_init.py tests/test_coordinator.py tests/test_event_bridge.py -v
```

## Troubleshooting

### Enable Debug Logging

```python
# Add to test file
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Print Event Flow

```python
# Add to tests
events_received = []

def track_event(event):
    print(f"Event: {event.type} @ {event.location_id}")
    events_received.append(event)

bus.subscribe(track_event)
```

### Inspect Module State

```python
# Check occupancy state
state = occupancy.dump_state()
print(f"Occupancy state: {state}")

# Check location config
config = loc_mgr.get_module_config("living_room", "occupancy")
print(f"Config: {config}")
```

## Contributing

### Adding New Tests

1. Choose appropriate test class based on category
2. Use realistic sensor patterns and house structures
3. Include clear docstrings explaining scenario
4. Validate both positive and negative cases
5. Keep timeouts short for fast testing

### Test Template

```python
@pytest.mark.asyncio
async def test_your_scenario(self, hass: HomeAssistant):
    """Test description: what scenario are we validating?"""
    from home_topology import EventBus, LocationManager
    from home_topology.modules.occupancy import OccupancyModule

    # 1. Setup
    loc_mgr = LocationManager()
    bus = EventBus()
    # ... setup locations, modules

    # 2. Action
    bus.publish(event_type="...", location_id="...", data={...})

    # 3. Assert
    assert expected_condition
```

---

## Summary

Real-world integration tests provide **confidence** that the home-topology integration works correctly in realistic scenarios. They complement unit tests by validating the complete stack and ensuring that the user experience matches expectations.

**Key Benefits**:

- ✅ Validates full integration stack
- ✅ Tests realistic user scenarios
- ✅ Short timeouts for fast iteration
- ✅ Easy to add new scenarios
- ✅ Complements existing unit tests

**Next Steps**:

1. Run the tests: `pytest tests/test-realworld.py -v`
2. Review test output
3. Add custom scenarios for your use case
4. Integrate into CI/CD pipeline

---

**Questions?** Check the test code itself - it's heavily documented with inline comments explaining each scenario.
