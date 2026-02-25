# WiiM Integration Testing Patterns - Review & Application

**Date**: 2025-12-09

## Overview

Review of WiiM integration's testing approach to improve home-topology testing patterns.

## WiiM Testing Architecture

### Key Files Reviewed

- `/workspaces/wiim/tests/conftest.py` (567 lines)
- `/workspaces/wiim/pytest.ini`
- `/workspaces/wiim/Makefile`
- `/workspaces/wiim/scripts/test-smoke.py`
- `/workspaces/wiim/requirements_test.txt`

---

## WiiM Testing Patterns

### 1. Test Organization

```
tests/
├── conftest.py          # Global fixtures (567 lines!)
├── const.py             # Test constants
├── fixtures/            # Reusable test fixtures
│   └── realistic_player.py
├── unit/                # Unit tests (all test_*.py)
└── integration/         # Integration tests
```

**Pattern**: Clear separation between unit and integration tests.

---

### 2. conftest.py Structure

WiiM's conftest.py has excellent organization:

```python
# ============================================================================
# Autouse Fixtures (applied to all tests automatically)
# ============================================================================

@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield

@pytest.fixture(name="skip_notifications", autouse=True)
def skip_notifications_fixture():
    """Skip notification calls to prevent test failures."""
    with (
        patch("homeassistant.components.persistent_notification.async_create"),
        patch("homeassistant.components.persistent_notification.async_dismiss"),
    ):
        yield

@pytest.fixture(autouse=True)
def allow_unwatched_threads() -> bool:
    """Tell pytest-homeassistant that background threads are expected."""
    return True


# ============================================================================
# Core Mock Fixtures (basic mocks for unit tests)
# ============================================================================

@pytest.fixture(name="mock_wiim_client")
def mock_wiim_client_fixture():
    """Mock WiiM API client with common methods."""
    client = MagicMock()
    # ... extensive setup ...
    return client


# ============================================================================
# Error Simulation Fixtures (for testing error handling and API bypass)
# ============================================================================

@pytest.fixture(name="bypass_get_data")
def bypass_get_data_fixture(hass):
    """Bypass API calls and return mock data."""
    # ... comprehensive mocking to avoid HTTP requests ...
    yield
```

**Key Learnings**:

- ✅ Clear section organization with headers
- ✅ `autouse` fixtures for common setup
- ✅ Skip notifications to avoid test noise
- ✅ Allow unwatched threads (important for async!)
- ✅ Comprehensive fixture for bypassing API calls

---

### 3. pytest.ini Configuration

```ini
[pytest]
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --disable-warnings
    --cov=custom_components.wiim
    --cov-report=term-missing
    --cov-report=xml:build/coverage.xml
    --cov-fail-under=10
```

**Key Learnings**:

- ✅ `asyncio_mode = auto` - automatic async support
- ✅ `asyncio_default_fixture_loop_scope = function` - clean loop per test
- ✅ Coverage built into default pytest run
- ✅ XML coverage report for CI/CD
- ✅ Minimum coverage threshold (`--cov-fail-under=10`)

---

### 4. Makefile Testing Commands

WiiM has excellent Makefile organization:

```makefile
# Testing
test           - Run all unit tests
test-integration - Run integration tests
test-smoke     - Run smoke tests (requires HA_URL and HA_TOKEN)
test-multiroom - Run comprehensive multiroom tests
test-all       - Run all automated tests
test-quick     - Run unit tests without coverage (faster)
pre-release    - Run pre-release validation checklist

# Code Quality
pre-run        - Quick checks before running HA
pre-commit     - Run all pre-commit validation checks
lint           - Run linting checks
format         - Format code with ruff
```

**Key Learnings**:

- ✅ Separate targets for different test types
- ✅ `test-quick` for fast development iteration
- ✅ `test-smoke` for real HA testing (like our `test-live`)
- ✅ `pre-run` checks before starting HA
- ✅ `pre-commit` validation

---

### 5. Smoke Testing Pattern

WiiM's `test-smoke.py` is excellent for live HA testing:

```python
class SmokeTestSuite:
    """Quick smoke tests for critical functionality."""

    MAX_VOLUME = 0.10  # 10% max for safety

    def __init__(self, ha_url: str, token: str):
        self.ha_url = ha_url.rstrip("/")
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}"}

    def call_service(self, domain: str, service: str, entity_id: str, **data):
        """Call HA service via REST API."""
        url = f"{self.ha_url}/api/services/{domain}/{service}"
        # ...

    def get_state(self, entity_id: str):
        """Get entity state via REST API."""
        # ...

    def test_device_discovery(self):
        """Test 1: Can we discover devices?"""
        # Actual test implementation
```

**Key Learnings**:

- ✅ Uses HA REST API (not WebSocket) for simplicity
- ✅ Safety limits (MAX_VOLUME for audio devices)
- ✅ Structured test suite class
- ✅ Real-world validation (2-3 minute quick tests)
- ✅ Clear pass/fail reporting

---

### 6. Requirements Management

WiiM separates requirements clearly:

```python
# requirements_test.txt
-r requirements_dev.txt  # Imports dev requirements

# Testing framework
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
pytest-timeout>=2.1.0
pytest-homeassistant-custom-component>=0.12.0

# Test utilities
aresponses>=2.1.6
freezegun>=1.2.2
zeroconf

# Discovery dependencies
async-upnp-client==0.46.0
```

**Key Learnings**:

- ✅ Version pinning for stability
- ✅ Comprehensive test tooling
- ✅ `pytest-timeout` for hanging tests
- ✅ `freezegun` for time manipulation
- ✅ Domain-specific test tools (aresponses for HTTP)

---

### 7. Test Fixture Patterns

WiiM creates **realistic fixtures** for common scenarios:

```python
# tests/fixtures/realistic_player.py
from ..const import MOCK_DEVICE_DATA, MOCK_STATUS_RESPONSE

@pytest.fixture
def realistic_player():
    """Create a realistic player with full state."""
    player = MagicMock()
    player.name = MOCK_DEVICE_DATA.get("DeviceName", "WiiM Mini")
    player.host = MOCK_DEVICE_DATA.get("ip", "192.168.1.100")
    # ... 50+ properties properly configured ...
    return player

@pytest.fixture
def realistic_player_master():
    """Player configured as multiroom master."""
    # ...

@pytest.fixture
def realistic_player_slave():
    """Player configured as multiroom slave."""
    # ...
```

**Key Learnings**:

- ✅ Separate file for complex fixtures
- ✅ Named scenarios (master, slave, solo)
- ✅ All properties configured (not just MagicMock)
- ✅ Reusable across many tests

---

### 8. Integration Test Pattern

```python
class TestIntegrationSetup:
    """Test WiiM integration setup functionality."""

    @pytest.mark.asyncio
    async def test_setup_entry_connection_error(self, hass: HomeAssistant):
        """Test setup failure due to connection error."""
        # Mock hass.http to prevent AttributeError
        _setup_mock_http(hass)

        entry = MockConfigEntry(
            domain=DOMAIN,
            title="WiiM Mini",
            data=MOCK_CONFIG,
            unique_id=MOCK_DEVICE_DATA["uuid"],
        )
        entry.add_to_hass(hass)

        with patch(
            "pywiim.WiiMClient.get_device_info",
            side_effect=Exception("Connection error"),
        ):
            await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()

            assert entry.state is ConfigEntryState.SETUP_RETRY
```

**Key Learnings**:

- ✅ Test class organization
- ✅ Mock `hass.http` to avoid errors
- ✅ Test error states (SETUP_RETRY)
- ✅ Proper async handling with `async_block_till_done()`

---

### 9. Bypass API Fixture Pattern

WiiM has an **excellent pattern** for avoiding slow HTTP requests:

```python
@pytest.fixture(name="bypass_get_data")
def bypass_get_data_fixture(hass):
    """Bypass API calls and return mock data.

    Used for testing integration setup without real API calls.
    This prevents ~100+ HTTP requests per test (probing ports/protocols).
    """
    # Mock hass.http
    hass.http = Mock()
    hass.http.async_register_static_paths = AsyncMock()

    # Create comprehensive mock data
    mock_status = MOCK_STATUS_RESPONSE.copy()
    mock_status.update(MOCK_DEVICE_DATA)

    # Mock capabilities to avoid slow probing
    mock_capabilities = {
        "firmware_version": "4.6.328252",
        "device_type": "UP2STREAM_MINI_V3",
        # ... 20+ capability flags ...
    }

    # Patch at multiple import locations
    with (
        patch("pywiim.WiiMClient._detect_capabilities",
              return_value=mock_capabilities),
        patch("custom_components.wiim.__init__.WiiMClient._detect_capabilities",
              return_value=mock_capabilities),
        patch("pywiim.WiiMClient.get_player_status",
              return_value=mock_status),
        # ... more patches ...
    ):
        yield
```

**Key Learnings**:

- ✅ Comprehensive comment explaining why
- ✅ Patch at multiple import locations
- ✅ Avoid capability detection (slow!)
- ✅ Mock `hass.http` for static paths

---

## Application to Topomation

### What We Should Adopt

#### 1. Improve conftest.py Organization

```python
# Our conftest.py should have clear sections like WiiM:

# ============================================================================
# Autouse Fixtures
# ============================================================================

@pytest.fixture(autouse=True)
def skip_notifications():
    """Skip notification calls."""
    with (
        patch("homeassistant.components.persistent_notification.async_create"),
        patch("homeassistant.components.persistent_notification.async_dismiss"),
    ):
        yield

@pytest.fixture(autouse=True)
def allow_unwatched_threads() -> bool:
    """Allow background threads for async operations."""
    return True


# ============================================================================
# Mock HA Registry Fixtures
# ============================================================================

@pytest.fixture
def mock_area_registry(hass):
    """Mock HA area registry with test areas."""
    # ...


# ============================================================================
# Topology-Specific Fixtures
# ============================================================================

@pytest.fixture
def bypass_topology_setup(hass):
    """Bypass slow topology initialization for unit tests."""
    # Similar to WiiM's bypass_get_data
    # ...
```

#### 2. Update pytest.ini

```ini
[pytest]
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
testpaths = tests
python_files = test_*.py test-*.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --disable-warnings
    --cov=custom_components.topomation
    --cov-report=term-missing
    --cov-report=xml:build/coverage.xml
    --cov-report=html:htmlcov
    --cov-fail-under=70
markers =
    live_ha: Tests requiring live Home Assistant
    mock_only: Tests that only work with mocked HA
    realworld: Real-world integration tests
    slow: Tests that take >5 seconds
```

#### 3. Improve Makefile

```makefile
# Add test-quick like WiiM
test-quick:
	pytest tests/ -v --no-cov  # Fast iteration

# Add pre-run checks
pre-run:
	@echo "🔍 Quick pre-run checks..."
	python -m py_compile custom_components/topomation/*.py
	@echo "✅ Syntax OK"

# Add pre-commit
pre-commit: lint test-quick
	@echo "✅ Pre-commit checks passed"

# Rename test-live to test-smoke (matches WiiM pattern)
test-smoke: test-live
	@echo "Alias for test-live"
```

#### 4. Create Smoke Test Script

Following WiiM's pattern, create `scripts/test-smoke.py`:

```python
#!/usr/bin/env python3
"""Topomation - Smoke Tests

Quick validation (2-3 minutes) for critical functionality.
"""

import argparse
import requests

class SmokeTestSuite:
    def __init__(self, ha_url: str, token: str):
        self.ha_url = ha_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {token}"}

    def test_integration_loaded(self):
        """Test: Is integration loaded?"""
        # Check via REST API
        pass

    def test_area_import(self):
        """Test: Are HA areas imported as locations?"""
        pass

    def test_motion_detection(self):
        """Test: Does motion sensor trigger occupancy?"""
        pass
```

#### 5. Create Realistic Fixtures

Create `tests/fixtures/realistic_house.py`:

```python
"""Realistic house fixtures for testing."""

import pytest

@pytest.fixture
def realistic_house_small():
    """Small house: 1 floor, 3 rooms."""
    return {
        "floors": ["ground_floor"],
        "areas": ["living_room", "kitchen", "bedroom"],
        "sensors": {
            "living_room": ["motion", "light"],
            "kitchen": ["motion", "door"],
            "bedroom": ["motion", "light"],
        }
    }

@pytest.fixture
def realistic_house_large():
    """Large house: 2 floors, 8 rooms."""
    # ...
```

#### 6. Add Test Utilities

```python
# tests/utils.py
"""Test utilities and helpers."""

def setup_mock_http(hass):
    """Helper to mock hass.http."""
    from unittest.mock import AsyncMock, Mock
    hass.http = Mock()
    hass.http.async_register_static_paths = AsyncMock()

def create_test_area(hass, name: str):
    """Helper to create test area via HA registry."""
    # ...

def wait_for_occupancy(hass, location_id: str, timeout: float = 1.0):
    """Wait for occupancy sensor to update."""
    # ...
```

---

## Differences Between WiiM & Topomation

### WiiM Characteristics

- **Hardware integration**: Real devices, REST API, multiroom
- **External library**: `pywiim` package with complex capabilities
- **Device discovery**: Network scanning, capability detection
- **State polling**: Regular HTTP requests to devices

### Topomation Characteristics

- **Virtual integration**: No hardware, pure HA abstraction
- **Core library**: `home-topology` kernel (LocationManager, EventBus)
- **Registry integration**: HA areas/floors → locations
- **Event-driven**: HA state changes → module events

### Testing Implications

| Aspect              | WiiM                                 | Topomation                   |
| ------------------- | ------------------------------------ | ------------------------------- |
| **API mocking**     | Extensive (avoid 100+ HTTP requests) | Minimal (kernel is lightweight) |
| **Device fixtures** | Complex (50+ properties)             | Simpler (areas/locations)       |
| **Network tests**   | Real devices for smoke tests         | HA registries for smoke tests   |
| **Speed concern**   | Capability detection slow            | Kernel operations fast          |
| **Live testing**    | REST API to devices                  | REST API to HA                  |

---

## Recommendations

### High Priority

1. **✅ Add `autouse` fixtures** for notifications and threads
2. **✅ Update pytest.ini** with async settings and coverage
3. **✅ Create test utilities** (`utils.py`)
4. **✅ Add `test-quick` to Makefile**
5. **✅ Organize conftest.py** with clear sections

### Medium Priority

6. **Create realistic_house fixtures** (separate file)
7. **Add `pre-run` and `pre-commit` Makefile targets**
8. **Create smoke test script** (`scripts/test-smoke.py`)
9. **Add `pytest-timeout`** to requirements

### Low Priority

10. Separate `unit/` and `integration/` test directories
11. Add `freezegun` for time manipulation tests
12. Create `TEST-COVERAGE.md` like WiiM
13. Add XML coverage report for CI/CD

---

## Action Items

### Immediate (Today)

```bash
# 1. Update conftest.py structure
# 2. Update pytest.ini
# 3. Add test-quick to Makefile
# 4. Create tests/utils.py
```

### This Week

```bash
# 5. Create fixtures/realistic_house.py
# 6. Create scripts/test-smoke.py
# 7. Add pre-run checks
# 8. Update requirements_test.txt
```

---

## Summary

WiiM's testing approach is **excellent** and well-suited for hardware integrations. Key takeaways for home-topology:

✅ **Adopt**: Clear conftest.py organization, autouse fixtures, pytest.ini settings
✅ **Adopt**: Makefile testing commands (test-quick, pre-run)
✅ **Adapt**: Smoke testing pattern (use HA REST API instead of device API)
✅ **Keep**: Our dual-mode testing (mock/live) is unique and valuable
✅ **Improve**: Test utilities, realistic fixtures, coverage reporting

Our approach is **already strong** - we just need to adopt WiiM's organizational patterns and add some helper utilities!

---

**Status**: Review complete, recommendations ready for implementation.

**Next**: Apply high-priority recommendations to improve test suite.
