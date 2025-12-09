"""Tests for Ambient Light Module integration."""

from unittest.mock import Mock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.home_topology import HAPlatformAdapter
from custom_components.home_topology.const import DOMAIN


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


class TestAmbientLightSensorEntity:
    """Test AmbientLightSensor entity."""

    @pytest.mark.asyncio
    async def test_sensor_creation(self, mock_hass):
        """Test that ambient light sensor is created correctly."""
        from custom_components.home_topology.sensor import AmbientLightSensor
        from home_topology.modules.ambient import AmbientLightModule
        from home_topology.core.bus import EventBus

        # Setup
        bus = EventBus()
        platform_adapter = HAPlatformAdapter(mock_hass)
        ambient_module = AmbientLightModule(platform_adapter)

        # Create sensor
        sensor = AmbientLightSensor(
            "kitchen", "Kitchen", ambient_module, bus, mock_hass
        )

        # Assert
        assert sensor._location_id == "kitchen"
        assert sensor._location_name == "Kitchen"
        assert sensor._attr_unique_id == "ambient_light_kitchen"
        assert sensor._attr_name == "Kitchen Ambient Light"
        assert sensor._attr_device_class == "illuminance"
        assert sensor._attr_native_unit_of_measurement == "lx"

    @pytest.mark.asyncio
    async def test_sensor_update_reading(self, mock_hass):
        """Test sensor updates reading from module."""
        from custom_components.home_topology.sensor import AmbientLightSensor
        from home_topology.modules.ambient import (
            AmbientLightModule,
            AmbientLightReading,
        )
        from home_topology.core.bus import EventBus
        from datetime import datetime

        # Setup
        bus = EventBus()
        platform_adapter = HAPlatformAdapter(mock_hass)
        ambient_module = Mock(spec=AmbientLightModule)

        # Mock reading
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
        ambient_module.get_ambient_light.return_value = mock_reading

        # Create sensor
        sensor = AmbientLightSensor(
            "kitchen", "Kitchen", ambient_module, bus, mock_hass
        )

        # Update reading
        sensor.update_reading()

        # Assert
        assert sensor._attr_native_value == 100.0
        assert (
            sensor._attr_extra_state_attributes["source_sensor"] == "sensor.kitchen_lux"
        )
        assert sensor._attr_extra_state_attributes["is_dark"] is False
        assert sensor._attr_extra_state_attributes["is_bright"] is False


class TestAmbientLightBinarySensor:
    """Test AmbientLightBinarySensor entity."""

    @pytest.mark.asyncio
    async def test_is_dark_sensor_creation(self, mock_hass):
        """Test that is_dark binary sensor is created correctly."""
        from custom_components.home_topology.binary_sensor import (
            AmbientLightBinarySensor,
        )
        from home_topology.modules.ambient import AmbientLightModule
        from home_topology.core.bus import EventBus

        # Setup
        bus = EventBus()
        platform_adapter = HAPlatformAdapter(mock_hass)
        ambient_module = AmbientLightModule(platform_adapter)

        # Create sensor
        sensor = AmbientLightBinarySensor(
            "kitchen", "Kitchen", "is_dark", ambient_module, bus, mock_hass
        )

        # Assert
        assert sensor._location_id == "kitchen"
        assert sensor._sensor_type == "is_dark"
        assert sensor._attr_unique_id == "ambient_is_dark_kitchen"
        assert sensor._attr_name == "Kitchen Is Dark"
        assert sensor._attr_device_class == "light"

    @pytest.mark.asyncio
    async def test_is_dark_update_reading(self, mock_hass):
        """Test is_dark sensor updates correctly."""
        from custom_components.home_topology.binary_sensor import (
            AmbientLightBinarySensor,
        )
        from home_topology.modules.ambient import (
            AmbientLightModule,
            AmbientLightReading,
        )
        from home_topology.core.bus import EventBus
        from datetime import datetime

        # Setup
        bus = EventBus()
        platform_adapter = HAPlatformAdapter(mock_hass)
        ambient_module = Mock(spec=AmbientLightModule)

        # Mock reading - dark
        mock_reading = AmbientLightReading(
            lux=30.0,
            source_sensor="sensor.kitchen_lux",
            source_location="kitchen",
            is_inherited=False,
            is_dark=True,
            is_bright=False,
            dark_threshold=50.0,
            bright_threshold=500.0,
            fallback_method=None,
            timestamp=datetime.now(),
        )
        ambient_module.get_ambient_light.return_value = mock_reading

        # Create sensor
        sensor = AmbientLightBinarySensor(
            "kitchen", "Kitchen", "is_dark", ambient_module, bus, mock_hass
        )

        # Update reading
        sensor.update_reading()

        # Assert
        assert sensor._attr_is_on is True
        assert sensor._attr_extra_state_attributes["lux"] == 30.0


class TestAmbientWebSocketAPI:
    """Test Ambient Light WebSocket API commands."""

    def test_get_reading_command(self, mock_hass):
        """Test ambient/get_reading WebSocket command."""
        from custom_components.home_topology.websocket_api import (
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
            "type": "home_topology/ambient/get_reading",
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
        from custom_components.home_topology.websocket_api import (
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
            "type": "home_topology/ambient/set_sensor",
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
        from custom_components.home_topology.websocket_api import (
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

        msg = {"id": 1, "type": "home_topology/ambient/auto_discover"}

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
