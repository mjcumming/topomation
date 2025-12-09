"""Tests for the Home Topology timeout coordinator.

Following HA integration testing best practices:
- Test timeout scheduling logic
- Use proper fixtures and mocks
- Test error handling
- Follow GIVEN-WHEN-THEN structure
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import Mock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.home_topology.coordinator import HomeTopologyCoordinator


@pytest.fixture(name="mock_modules")
def mock_modules_fixture() -> dict[str, Mock]:
    """Create mock modules with timeout capabilities."""
    occupancy = Mock()
    occupancy.get_next_timeout = Mock(return_value=None)
    occupancy.check_timeouts = Mock()

    automation = Mock()
    automation.get_next_timeout = Mock(return_value=None)
    automation.check_timeouts = Mock()

    return {
        "occupancy": occupancy,
        "automation": automation,
    }


@pytest.fixture(name="coordinator")
def coordinator_fixture(
    hass: HomeAssistant,
    mock_modules: dict[str, Mock],
) -> HomeTopologyCoordinator:
    """Create a coordinator instance for testing."""
    return HomeTopologyCoordinator(hass, mock_modules)


def test_coordinator_initialization(
    coordinator: HomeTopologyCoordinator,
) -> None:
    """Test coordinator initializes correctly.

    GIVEN: Module configuration
    WHEN: Coordinator is created
    THEN: It stores modules and has no active timeout
    """
    # THEN
    assert coordinator is not None
    assert coordinator._timeout_cancel is None
    assert len(coordinator.modules) == 2


def test_schedule_with_no_timeouts(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test scheduling when no modules have timeouts.

    GIVEN: No modules have pending timeouts
    WHEN: schedule_next_timeout is called
    THEN: No timer is scheduled
    """
    # GIVEN
    mock_modules["occupancy"].get_next_timeout.return_value = None
    mock_modules["automation"].get_next_timeout.return_value = None

    # WHEN
    coordinator.schedule_next_timeout()

    # THEN
    assert coordinator._timeout_cancel is None


def test_schedule_with_single_timeout(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test scheduling when one module has a timeout.

    GIVEN: One module has a timeout in 30 seconds
    WHEN: schedule_next_timeout is called
    THEN: HA timer is scheduled for that time
    """
    # GIVEN
    now = datetime.now(UTC)
    timeout = now + timedelta(seconds=30)
    mock_modules["occupancy"].get_next_timeout.return_value = timeout
    mock_modules["automation"].get_next_timeout.return_value = None

    # WHEN
    with patch(
        "custom_components.home_topology.coordinator.async_track_point_in_time"
    ) as mock_track:
        mock_track.return_value = Mock()
        coordinator.schedule_next_timeout()

        # THEN
        mock_track.assert_called_once()
        call_args = mock_track.call_args
        assert call_args[0][0] == coordinator.hass
        assert call_args[0][2] == timeout


def test_schedule_earliest_timeout(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test coordinator picks the earliest timeout.

    GIVEN: Multiple modules with different timeouts
    WHEN: schedule_next_timeout is called
    THEN: The earliest timeout is scheduled
    """
    # GIVEN
    now = datetime.now(UTC)
    early_timeout = now + timedelta(seconds=10)
    late_timeout = now + timedelta(seconds=60)

    mock_modules["occupancy"].get_next_timeout.return_value = early_timeout
    mock_modules["automation"].get_next_timeout.return_value = late_timeout

    # WHEN
    with patch(
        "custom_components.home_topology.coordinator.async_track_point_in_time"
    ) as mock_track:
        mock_track.return_value = Mock()
        coordinator.schedule_next_timeout()

        # THEN
        call_args = mock_track.call_args
        assert call_args[0][2] == early_timeout


def test_cancel_existing_timeout_on_reschedule(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test existing timeout is cancelled when rescheduling.

    GIVEN: A scheduled timeout exists
    WHEN: schedule_next_timeout is called again
    THEN: Previous timeout is cancelled before new one is scheduled
    """
    # GIVEN
    now = datetime.now(UTC)
    timeout1 = now + timedelta(seconds=30)
    timeout2 = now + timedelta(seconds=60)

    mock_modules["occupancy"].get_next_timeout.return_value = timeout1

    with patch(
        "custom_components.home_topology.coordinator.async_track_point_in_time"
    ) as mock_track:
        # First schedule
        mock_cancel1 = Mock()
        mock_track.return_value = mock_cancel1
        coordinator.schedule_next_timeout()
        assert coordinator._timeout_cancel == mock_cancel1

        # WHEN - Reschedule
        mock_modules["occupancy"].get_next_timeout.return_value = timeout2
        mock_cancel2 = Mock()
        mock_track.return_value = mock_cancel2
        coordinator.schedule_next_timeout()

        # THEN
        mock_cancel1.assert_called_once()
        assert coordinator._timeout_cancel == mock_cancel2


def test_timeout_callback_checks_all_modules(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test timeout callback calls check_timeouts on all modules.

    GIVEN: A scheduled timeout that fires
    WHEN: The timeout callback is invoked
    THEN: check_timeouts is called on all modules
    """
    # GIVEN
    now = datetime.now(UTC)

    # WHEN
    with patch("custom_components.home_topology.coordinator.async_track_point_in_time"):
        coordinator._handle_timeout(now)

        # THEN
        mock_modules["occupancy"].check_timeouts.assert_called_once_with(now)
        mock_modules["automation"].check_timeouts.assert_called_once_with(now)


def test_timeout_callback_reschedules(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test coordinator reschedules after timeout fires.

    GIVEN: A timeout that fires, with a new timeout available
    WHEN: The timeout callback completes
    THEN: A new timeout is scheduled
    """
    # GIVEN
    now = datetime.now(UTC)
    next_timeout = now + timedelta(seconds=30)
    mock_modules["occupancy"].get_next_timeout.return_value = next_timeout

    # WHEN
    with patch(
        "custom_components.home_topology.coordinator.async_track_point_in_time"
    ) as mock_track:
        mock_track.return_value = Mock()
        coordinator._handle_timeout(now)

        # THEN
        mock_track.assert_called_once()


def test_get_next_timeout_error_handling(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test errors in get_next_timeout are handled gracefully.

    GIVEN: One module raises an exception in get_next_timeout
    WHEN: schedule_next_timeout is called
    THEN: Error is caught and other modules still work
    """
    # GIVEN
    mock_modules["occupancy"].get_next_timeout.side_effect = Exception("Test error")
    mock_modules["automation"].get_next_timeout.return_value = datetime.now(UTC) + timedelta(
        seconds=30
    )

    # WHEN / THEN - Should not raise
    with patch(
        "custom_components.home_topology.coordinator.async_track_point_in_time"
    ) as mock_track:
        mock_track.return_value = Mock()
        coordinator.schedule_next_timeout()

        # Should still schedule from working module
        mock_track.assert_called_once()


def test_check_timeouts_error_handling(
    coordinator: HomeTopologyCoordinator,
    mock_modules: dict[str, Mock],
) -> None:
    """Test errors in check_timeouts are handled gracefully.

    GIVEN: One module raises an exception in check_timeouts
    WHEN: Timeout callback is invoked
    THEN: Error is caught and other modules still process
    """
    # GIVEN
    now = datetime.now(UTC)
    mock_modules["occupancy"].check_timeouts.side_effect = Exception("Test error")

    # WHEN / THEN - Should not raise
    with patch("custom_components.home_topology.coordinator.async_track_point_in_time"):
        coordinator._handle_timeout(now)

        # Both modules should have been attempted
        mock_modules["occupancy"].check_timeouts.assert_called_once()
        mock_modules["automation"].check_timeouts.assert_called_once()


def test_module_without_timeout_support(
    coordinator: HomeTopologyCoordinator,
) -> None:
    """Test modules without timeout methods are skipped.

    GIVEN: A module without get_next_timeout method
    WHEN: schedule_next_timeout is called
    THEN: Module is skipped without error
    """
    # GIVEN
    mock_lighting = Mock(spec=["some_other_method"])
    coordinator.modules["lighting"] = mock_lighting

    # WHEN / THEN - Should not raise
    with patch("custom_components.home_topology.coordinator.async_track_point_in_time"):
        coordinator.schedule_next_timeout()
