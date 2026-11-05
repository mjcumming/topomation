"""Admin gate for every Topomation websocket command."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.topomation import websocket_api as ws
from custom_components.topomation.const import (
    WS_TYPE_ACTION_RULES_CREATE,
    WS_TYPE_ACTION_RULES_DELETE,
    WS_TYPE_ACTION_RULES_LIST,
    WS_TYPE_ACTION_RULES_SET_ENABLED,
    WS_TYPE_ADJACENCY_CREATE,
    WS_TYPE_ADJACENCY_DELETE,
    WS_TYPE_ADJACENCY_LIST,
    WS_TYPE_ADJACENCY_UPDATE,
    WS_TYPE_AMBIENT_AUTO_DISCOVER,
    WS_TYPE_AMBIENT_GET_READING,
    WS_TYPE_AMBIENT_SET_SENSOR,
    WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
    WS_TYPE_OCCUPANCY_STATES_LIST,
    WS_TYPE_SYNC_ENABLE,
    WS_TYPE_SYNC_IMPORT,
    WS_TYPE_SYNC_STATUS,
)

_EXPECTED_COMMANDS = {
    WS_TYPE_ACTION_RULES_CREATE,
    WS_TYPE_ACTION_RULES_DELETE,
    WS_TYPE_ACTION_RULES_LIST,
    WS_TYPE_ACTION_RULES_SET_ENABLED,
    WS_TYPE_ADJACENCY_CREATE,
    WS_TYPE_ADJACENCY_DELETE,
    WS_TYPE_ADJACENCY_LIST,
    WS_TYPE_ADJACENCY_UPDATE,
    WS_TYPE_AMBIENT_AUTO_DISCOVER,
    WS_TYPE_AMBIENT_GET_READING,
    WS_TYPE_AMBIENT_SET_SENSOR,
    WS_TYPE_LOCATIONS_ASSIGN_ENTITY,
    WS_TYPE_LOCATIONS_CREATE,
    WS_TYPE_LOCATIONS_DELETE,
    WS_TYPE_LOCATIONS_LIST,
    WS_TYPE_LOCATIONS_REORDER,
    WS_TYPE_LOCATIONS_SET_MODULE_CONFIG,
    WS_TYPE_LOCATIONS_UPDATE,
    WS_TYPE_OCCUPANCY_STATES_LIST,
    WS_TYPE_SYNC_ENABLE,
    WS_TYPE_SYNC_IMPORT,
    WS_TYPE_SYNC_STATUS,
}


def test_websocket_commands_require_admin() -> None:
    """Non-admins cannot call Topomation websocket commands, including reads."""
    commands = [
        getattr(ws, name)
        for name in dir(ws)
        if callable(getattr(ws, name)) and getattr(getattr(ws, name), "_ws_command", None)
    ]
    found = {command._ws_command for command in commands}

    assert found == _EXPECTED_COMMANDS
    connection = SimpleNamespace(user=SimpleNamespace(is_admin=False))
    for command in commands:
        with pytest.raises(Unauthorized):
            command(None, connection, {"id": 1})
