# Real-World Tests - Quick Reference

One-page reference for running real-world integration tests.

## Setup (One Time)

```bash
# Install core library
pip install -e /workspaces/home-topology

# Install test dependencies
pip install pytest pytest-asyncio pytest-homeassistant-custom-component
```

## Running Tests

### All Real-World Tests

```bash
pytest tests/test-realworld.py -v
```

### By Category

```bash
# Location/Area sync
pytest tests/test-realworld.py::TestLocationAreaSync -v

# Event flow (sensors → modules)
pytest tests/test-realworld.py::TestEventFlowIntegration -v

# Timeout handling
pytest tests/test-realworld.py::TestTimeoutHandling -v

# End-to-end scenarios
pytest tests/test-realworld.py::TestEndToEndScenarios -v
```

### Single Test

```bash
pytest tests/test-realworld.py::TestEndToEndScenarios::test_morning_routine_scenario -v
```

### With Custom Config

```bash
pytest -c tests/pytest-realworld.ini
```

## Test Timeouts

All tests use **short timeouts** for fast testing:

| Setting           | Value | Default |
| ----------------- | ----- | ------- |
| Occupancy timeout | 10s   | 300s    |
| Coordinator check | 1s    | varies  |
| Trailing timeout  | 2s    | varies  |

⚠️ **These are for testing only - don't use in production!**

## Common Commands

### Debug Mode

```bash
pytest tests/test-realworld.py -v -s --log-cli-level=DEBUG
```

### Stop on First Failure

```bash
pytest tests/test-realworld.py -v -x
```

### Run Last Failed

```bash
pytest tests/test-realworld.py -v --lf
```

### Coverage Report

```bash
pytest tests/test-realworld.py --cov=custom_components.home_topology --cov-report=html
```

### Watch Mode (Auto-rerun)

```bash
pip install pytest-watch
ptw tests/test-realworld.py -v
```

## Test Scenarios

### Scenario 1: Morning Routine

**File**: `TestEndToEndScenarios::test_morning_routine_scenario`

```
1. Wake up: motion detected → Occupied
2. Turn on light → Still occupied (timeout extended)
3. Leave room → After 10s → Vacant
```

### Scenario 2: Movie Watching

**File**: `TestEndToEndScenarios::test_movie_watching_scenario`

```
1. Enter room: motion → Occupied
2. Lights off → Still occupied
3. Media playing → Still occupied
```

### Scenario 3: Multi-Room Tracking

**File**: `TestEndToEndScenarios::test_multi_room_tracking`

```
Person walks: Hallway → Kitchen → Living Room
Each room becomes occupied, then all expire after timeout
```

## Sensor Types Tested

- ✅ Motion sensors (`binary_sensor.motion`)
- ✅ Door/window sensors (`binary_sensor.door`)
- ✅ Light dimmers (brightness 0-100%)
- ✅ Media players (playing/paused/idle)

## House Structure

```
House
├── Ground Floor
│   ├── Living Room (motion, light, TV)
│   ├── Kitchen (motion, door)
│   └── Hallway
└── First Floor
    ├── Master Bedroom (motion, light)
    └── Guest Bedroom
```

## Troubleshooting

### Import Error

```bash
# Error: ModuleNotFoundError: No module named 'home_topology'
# Fix:
pip install -e /workspaces/home-topology
```

### Hanging Tests

```bash
# Timeout tests use simulated time
# No actual waiting - check test implementation
```

### Async Warnings

```bash
# Ensure test functions are marked with @pytest.mark.asyncio
# Use 'await' for all async calls
```

## What Gets Tested

| Category          | What                    | How                                          |
| ----------------- | ----------------------- | -------------------------------------------- |
| **Location Sync** | HA areas → locations    | Creates LocationManager, imports areas       |
| **Event Flow**    | Sensor → Event → Module | Publishes events, validates module reactions |
| **Timeouts**      | Occupancy expiration    | Fast-forwards time, checks state             |
| **Scenarios**     | Real user patterns      | Sequences of events simulating usage         |

## Adding Your Own Tests

### Template

```python
@pytest.mark.asyncio
async def test_your_scenario(self, hass: HomeAssistant):
    """Test your specific use case."""
    from home_topology import EventBus, LocationManager
    from home_topology.modules.occupancy import OccupancyModule

    # Setup
    loc_mgr = LocationManager()
    bus = EventBus()
    bus.set_location_manager(loc_mgr)

    loc_mgr.create_location(id="house", name="House", is_explicit_root=True)
    loc_mgr.create_location(id="room", name="Room", parent_id="house")

    occupancy = OccupancyModule()
    occupancy.attach(bus, loc_mgr)

    # Configure short timeout
    config = occupancy.default_config()
    config["timeout"] = 10  # 10 seconds
    loc_mgr.set_module_config("room", "occupancy", config)

    # Track events
    events = []
    bus.subscribe(lambda e: events.append(e), event_type="occupancy.changed")

    # Action
    bus.publish(
        event_type="sensor.motion",
        location_id="room",
        data={"entity_id": "binary_sensor.motion", "detected": True},
    )

    # Assert
    assert len(events) == 1
    assert events[0].payload["occupied"] is True
```

## Before Committing

```bash
# Run all tests
pytest tests/ -v

# Check real-world tests specifically
pytest tests/test-realworld.py -v

# Verify no regressions in unit tests
pytest tests/test_init.py tests/test_coordinator.py tests/test_event_bridge.py -v
```

## CI/CD Integration

### GitHub Actions (example)

```yaml
- name: Run real-world tests
  run: |
    pip install -e /workspaces/home-topology
    pytest tests/test-realworld.py -v
```

---

**Full Documentation**: See `REALWORLD-TESTS.md` for detailed explanations.

**Questions**: Check test code - heavily commented with inline explanations.
