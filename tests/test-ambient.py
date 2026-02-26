"""Tests for Ambient Light Module integration."""

from unittest.mock import Mock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.topomation import HAPlatformAdapter
from custom_components.topomation.const import DOMAIN


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = Mock(spec=HomeAssistant)
    hass.states = Mock()
    hass.bus = Mock()
    return hass


@pytest.fixture
def platform_adapter(mock_hass):
    """Create a platform adapter."""
    return HAPlatformAdapter(mock_hass)


class TestHAPlatformAdapter:
    """Test HAPlatformAdapter functionality."""

    def test_get_numeric_state_valid(self, platform_adapter, mock_hass):
        """Test getting valid numeric state."""
        # Setup mock state
        mock_state = Mock()
        mock_state.state = "100.5"
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_numeric_state("sensor.test_lux")

        # Assert
        assert result == 100.5
        mock_hass.states.get.assert_called_once_with("sensor.test_lux")

    def test_get_numeric_state_invalid(self, platform_adapter, mock_hass):
        """Test getting invalid numeric state."""
        # Setup mock state
        mock_state = Mock()
        mock_state.state = "not_a_number"
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_numeric_state("sensor.test_lux")

        # Assert
        assert result is None

    def test_get_numeric_state_unavailable(self, platform_adapter, mock_hass):
        """Test getting unavailable state."""
        # Setup mock state
        mock_state = Mock()
        mock_state.state = "unavailable"
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_numeric_state("sensor.test_lux")

        # Assert
        assert result is None

    def test_get_numeric_state_unknown(self, platform_adapter, mock_hass):
        """Test getting unknown state."""
        # Setup mock state
        mock_state = Mock()
        mock_state.state = "unknown"
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_numeric_state("sensor.test_lux")

        # Assert
        assert result is None

    def test_get_numeric_state_none(self, platform_adapter, mock_hass):
        """Test getting state when entity doesn't exist."""
        # Setup mock state
        mock_hass.states.get.return_value = None

        # Test
        result = platform_adapter.get_numeric_state("sensor.nonexistent")

        # Assert
        assert result is None

    def test_get_state(self, platform_adapter, mock_hass):
        """Test getting state string."""
        # Setup mock state
        mock_state = Mock()
        mock_state.state = "above_horizon"
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_state("sun.sun")

        # Assert
        assert result == "above_horizon"

    def test_get_device_class(self, platform_adapter, mock_hass):
        """Test getting device class."""
        # Setup mock state
        mock_state = Mock()
        mock_state.attributes = {"device_class": "illuminance"}
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_device_class("sensor.test_lux")

        # Assert
        assert result == "illuminance"

    def test_get_unit_of_measurement(self, platform_adapter, mock_hass):
        """Test getting unit of measurement."""
        # Setup mock state
        mock_state = Mock()
        mock_state.attributes = {"unit_of_measurement": "lx"}
        mock_hass.states.get.return_value = mock_state

        # Test
        result = platform_adapter.get_unit_of_measurement("sensor.test_lux")

        # Assert
        assert result == "lx"


class TestAmbientEntityPlatforms:
    """Test ambient-related platform behavior."""

    @pytest.mark.asyncio
    async def test_sensor_platform_publishes_no_entities(self, mock_hass):
        """Sensor platform should not expose ambient entities."""
        from custom_components.topomation.sensor import async_setup_entry

        entry = Mock(entry_id="test_entry")
        location_manager = Mock()
        location_manager.all_locations.return_value = [Mock(id="kitchen", name="Kitchen")]
        mock_hass.data = {
            DOMAIN: {
                "test_entry": {
                    "location_manager": location_manager,
                    "event_bus": Mock(),
                    "modules": {"ambient": Mock()},
                }
            }
        }

        captured: list = []

        def add_entities(entities):
            captured.extend(entities)

        await async_setup_entry(mock_hass, entry, add_entities)
        assert captured == []

    @pytest.mark.asyncio
    async def test_binary_sensor_platform_publishes_occupancy_only(self, mock_hass):
        """Binary sensor platform should expose occupancy entities only."""
        from custom_components.topomation.binary_sensor import async_setup_entry

        entry = Mock(entry_id="test_entry")
        location_manager = Mock()
        location_manager.all_locations.return_value = [
            Mock(id="kitchen", name="Kitchen"),
            Mock(id="hallway", name="Hallway"),
        ]
        mock_hass.data = {
            DOMAIN: {
                "test_entry": {
                    "location_manager": location_manager,
                    "event_bus": Mock(),
                    "modules": {"occupancy": Mock(), "ambient": Mock()},
                }
            }
        }

        captured: list = []

        def add_entities(entities):
            captured.extend(entities)

        await async_setup_entry(mock_hass, entry, add_entities)

        assert len(captured) == 2
        assert {entity.unique_id for entity in captured} == {
            "occupancy_kitchen",
            "occupancy_hallway",
        }


class TestAmbientWebSocketAPI:
    """Test Ambient Light WebSocket API commands."""

    def test_get_reading_command(self, mock_hass):
        """Test ambient/get_reading WebSocket command."""
        from custom_components.topomation.websocket_api import (
            handle_ambient_get_reading,
        )
        from home_topology.modules.ambient import AmbientLightReading
        from datetime import datetime

        # Setup
        mock_connection = Mock()
        mock_reading = AmbientLightReading(
            lux=100.0,
            source_sensor="sensor.kitchen_lux",
            source_location="kitchen",
            is_inherited=False,
            is_dark=False,
            is_bright=False,
            dark_threshold=50.0,
            bright_threshold=500.0,
            fallback_method=None,
            timestamp=datetime.now(),
        )

        mock_ambient_module = Mock()
        mock_ambient_module.get_ambient_light.return_value = mock_reading

        mock_hass.data = {
            DOMAIN: {"test_entry": {"modules": {"ambient": mock_ambient_module}}}
        }

        msg = {
            "id": 1,
            "type": "topomation/ambient/get_reading",
            "location_id": "kitchen",
        }

        # Execute
        handle_ambient_get_reading(mock_hass, mock_connection, msg)

        # Assert
        mock_connection.send_result.assert_called_once()
        result = mock_connection.send_result.call_args[0][1]
        assert result["lux"] == 100.0
        assert result["source_sensor"] == "sensor.kitchen_lux"

    def test_set_sensor_command(self, mock_hass):
        """Test ambient/set_sensor WebSocket command."""
        from custom_components.topomation.websocket_api import (
            handle_ambient_set_sensor,
        )

        # Setup
        mock_connection = Mock()
        mock_ambient_module = Mock()

        mock_hass.data = {
            DOMAIN: {"test_entry": {"modules": {"ambient": mock_ambient_module}}}
        }

        msg = {
            "id": 1,
            "type": "topomation/ambient/set_sensor",
            "location_id": "kitchen",
            "entity_id": "sensor.kitchen_lux",
        }

        # Execute
        handle_ambient_set_sensor(mock_hass, mock_connection, msg)

        # Assert
        mock_ambient_module.set_lux_sensor.assert_called_once_with(
            "kitchen", "sensor.kitchen_lux"
        )
        mock_connection.send_result.assert_called_once()

    def test_auto_discover_command(self, mock_hass):
        """Test ambient/auto_discover WebSocket command."""
        from custom_components.topomation.websocket_api import (
            handle_ambient_auto_discover,
        )

        # Setup
        mock_connection = Mock()
        mock_ambient_module = Mock()
        mock_ambient_module.auto_discover_sensors.return_value = {
            "kitchen": "sensor.kitchen_lux",
            "bedroom": "sensor.bedroom_illuminance",
        }

        mock_hass.data = {
            DOMAIN: {"test_entry": {"modules": {"ambient": mock_ambient_module}}}
        }

        msg = {"id": 1, "type": "topomation/ambient/auto_discover"}

        # Execute
        handle_ambient_auto_discover(mock_hass, mock_connection, msg)

        # Assert
        mock_ambient_module.auto_discover_sensors.assert_called_once()
        mock_connection.send_result.assert_called_once()
        result = mock_connection.send_result.call_args[0][1]
        assert "discovered" in result
        assert result["discovered"]["kitchen"] == "sensor.kitchen_lux"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
