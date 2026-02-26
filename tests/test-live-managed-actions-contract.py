"""Live HA contract tests for managed action rule registration/enumeration.

These tests hit a real Home Assistant instance and validate the same API path
the frontend uses for managed rules:

- POST /api/config/automation/config/{id}
- WS: config/entity_registry/list
- WS: automation/config
- DELETE /api/config/automation/config/{id}
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

import aiohttp
import pytest

pytestmark = [pytest.mark.live_ha]


def _ws_url_from_http(http_url: str) -> str:
    if http_url.startswith("https://"):
        return "wss://" + http_url.removeprefix("https://").rstrip("/") + "/api/websocket"
    return "ws://" + http_url.removeprefix("http://").rstrip("/") + "/api/websocket"


async def _ws_command(
    session: aiohttp.ClientSession,
    ws_url: str,
    token: str,
    payload: dict[str, Any],
    msg_id: int = 1,
) -> Any:
    async with session.ws_connect(ws_url) as ws:
        auth_required = await ws.receive_json(timeout=10)
        assert auth_required.get("type") == "auth_required"

        await ws.send_json({"type": "auth", "access_token": token})
        auth_ok = await ws.receive_json(timeout=10)
        assert auth_ok.get("type") == "auth_ok"

        await ws.send_json({"id": msg_id, **payload})

        while True:
            message = await ws.receive_json(timeout=20)
            if message.get("id") != msg_id:
                continue
            assert message.get("success") is True, message
            return message.get("result")


async def _wait_for(
    probe,
    *,
    timeout_seconds: float = 20.0,
    step_seconds: float = 0.5,
):
    deadline = asyncio.get_running_loop().time() + timeout_seconds
    while True:
        value = await probe()
        if value:
            return value
        if asyncio.get_running_loop().time() >= deadline:
            return None
        await asyncio.sleep(step_seconds)


@pytest.mark.asyncio
async def test_managed_action_rule_registers_and_enumerates_in_live_ha(live_ha_config):
    """Validate managed-rule contract against a real HA instance."""
    if live_ha_config["mode"] != "live":
        pytest.skip("Live HA test requires TEST_MODE=live")

    ha_url = live_ha_config["url"].rstrip("/")
    token = live_ha_config["token"]
    if not token:
        pytest.skip("Live HA test requires HA_TOKEN")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    automation_id = ""

    async with aiohttp.ClientSession(headers=headers) as session:
        states_resp = await session.get(f"{ha_url}/api/states")
        assert states_resp.status == 200
        states = await states_resp.json()
        assert isinstance(states, list)

        occupancy_state = next(
            (
                state
                for state in states
                if isinstance(state, dict)
                and str(state.get("entity_id", "")).startswith("binary_sensor.")
                and state.get("attributes", {}).get("device_class") == "occupancy"
                and state.get("attributes", {}).get("location_id")
            ),
            None,
        )
        if occupancy_state is None:
            pytest.skip("No occupancy binary sensor with location_id found in live HA")

        action_target = next(
            (
                state
                for state in states
                if isinstance(state, dict)
                and (
                    str(state.get("entity_id", "")).startswith("light.")
                    or str(state.get("entity_id", "")).startswith("switch.")
                    or str(state.get("entity_id", "")).startswith("fan.")
                )
            ),
            None,
        )
        if action_target is None:
            pytest.skip("No light/switch/fan entity available for action target")

        occupancy_entity_id = occupancy_state["entity_id"]
        location_id = occupancy_state["attributes"]["location_id"]
        action_entity_id = action_target["entity_id"]
        action_domain = action_entity_id.split(".", 1)[0]

        nonce = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        automation_id = f"topomation_live_contract_{nonce}"

        payload = {
            "alias": f"Topomation Live Contract ({location_id})",
            "description": (
                "Managed by Topomation.\n"
                f'[topomation] {{"version":2,"location_id":"{location_id}","trigger_type":"occupied"}}'
            ),
            "triggers": [
                {
                    "trigger": "state",
                    "entity_id": occupancy_entity_id,
                    "to": "on",
                }
            ],
            "conditions": [],
            "actions": [
                {
                    "action": f"{action_domain}.turn_on",
                    "target": {"entity_id": action_entity_id},
                }
            ],
            "mode": "single",
        }

        create_resp = await session.post(
            f"{ha_url}/api/config/automation/config/{automation_id}",
            json=payload,
        )
        assert create_resp.status in (200, 201), await create_resp.text()

        automation_entity_id = f"automation.{automation_id}"

        async def _state_exists():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            if resp.status == 200:
                return await resp.json()
            return None

        state_obj = await _wait_for(_state_exists, timeout_seconds=30)
        assert state_obj is not None, "Automation entity did not appear after config create"

        ws_url = _ws_url_from_http(ha_url)
        registry_entries = await _ws_command(
            session,
            ws_url,
            token,
            {"type": "config/entity_registry/list"},
            msg_id=11,
        )
        assert isinstance(registry_entries, list)

        matching_entry = next(
            (
                entry
                for entry in registry_entries
                if isinstance(entry, dict) and entry.get("unique_id") == automation_id
            ),
            None,
        )
        assert matching_entry is not None, "Automation did not register in entity registry"

        config_response = await _ws_command(
            session,
            ws_url,
            token,
            {"type": "automation/config", "entity_id": matching_entry["entity_id"]},
            msg_id=12,
        )
        assert isinstance(config_response, dict)
        config = config_response.get("config")
        assert isinstance(config, dict)
        assert config.get("id") == automation_id
        assert "[topomation]" in str(config.get("description", ""))

        delete_resp = await session.delete(
            f"{ha_url}/api/config/automation/config/{automation_id}"
        )
        assert delete_resp.status in (200, 201), await delete_resp.text()

        async def _state_removed():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            return resp.status in (404, 410)

        removed = await _wait_for(_state_removed, timeout_seconds=30)
        assert removed, "Automation entity did not disappear after delete"
