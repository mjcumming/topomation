"""Live HA contract tests for managed action rule registration/enumeration.

These tests hit a real Home Assistant instance and validate the same API path
the frontend uses for managed rules:

- WS: topomation/actions/rules/create
- WS: topomation/actions/rules/list
- WS: config/entity_registry/list
- WS: automation/config
- WS: topomation/actions/rules/delete
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
    *,
    expect_success: bool = True,
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
            if expect_success:
                assert message.get("success") is True, message
                return message.get("result")
            return message


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
async def test_managed_action_rule_registers_and_enumerates_in_live_ha(
    live_ha_config,
    socket_enabled,
):
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
    automation_entity_id = ""

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

        location_id = occupancy_state["attributes"]["location_id"]
        action_entity_id = action_target["entity_id"]
        ws_url = _ws_url_from_http(ha_url)

        nonce = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        create_message = await _ws_command(
            session,
            ws_url,
            token,
            {
                "type": "topomation/actions/rules/create",
                "location_id": location_id,
                "name": f"Topomation Live Contract ({location_id}) {nonce}",
                "trigger_type": "occupied",
                "action_entity_id": action_entity_id,
                "action_service": "turn_on",
                "require_dark": False,
            },
            msg_id=10,
            expect_success=False,
        )

        if create_message.get("success") is not True:
            error = create_message.get("error", {})
            raise AssertionError(
                "Topomation managed-action WS contract unavailable or failed. "
                f"Expected topomation/actions/rules/create success, got: {error}"
            )

        result = create_message.get("result")
        assert isinstance(result, dict)
        rule = result.get("rule")
        assert isinstance(rule, dict)
        automation_id = str(rule.get("id", ""))
        assert automation_id
        automation_entity_id = str(rule.get("entity_id", ""))
        assert automation_entity_id.startswith("automation.")

        async def _find_registry_entry():
            registry_entries = await _ws_command(
                session,
                ws_url,
                token,
                {"type": "config/entity_registry/list"},
                msg_id=11,
            )
            if not isinstance(registry_entries, list):
                return None

            return next(
                (
                    entry
                    for entry in registry_entries
                    if isinstance(entry, dict) and entry.get("unique_id") == automation_id
                ),
                None,
            )

        matching_entry = await _wait_for(_find_registry_entry, timeout_seconds=30)
        assert matching_entry is not None, "Automation did not register in entity registry"
        automation_entity_id = matching_entry["entity_id"]

        listed_rules = await _ws_command(
            session,
            ws_url,
            token,
            {
                "type": "topomation/actions/rules/list",
                "location_id": location_id,
            },
            msg_id=13,
        )
        assert isinstance(listed_rules, dict)
        listed = listed_rules.get("rules")
        assert isinstance(listed, list)
        assert any(isinstance(item, dict) and item.get("id") == automation_id for item in listed)

        async def _state_exists():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            if resp.status == 200:
                return await resp.json()
            return None

        state_obj = await _wait_for(_state_exists, timeout_seconds=30)
        assert state_obj is not None, "Automation state did not appear after config create"

        config_response = await _ws_command(
            session,
            ws_url,
            token,
            {"type": "automation/config", "entity_id": matching_entry["entity_id"]},
            msg_id=14,
        )
        assert isinstance(config_response, dict)
        config = config_response.get("config")
        assert isinstance(config, dict)
        assert config.get("id") == automation_id
        assert "[topomation]" in str(config.get("description", ""))

        set_disabled_message = await _ws_command(
            session,
            ws_url,
            token,
            {
                "type": "topomation/actions/rules/set_enabled",
                "entity_id": automation_entity_id,
                "enabled": False,
            },
            msg_id=15,
            expect_success=False,
        )
        assert set_disabled_message.get("success") is True, set_disabled_message

        async def _state_disabled():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            if resp.status != 200:
                return None
            payload = await resp.json()
            return payload if payload.get("state") == "off" else None

        disabled_state = await _wait_for(_state_disabled, timeout_seconds=20)
        assert disabled_state is not None, "Automation did not transition to disabled state"

        set_enabled_message = await _ws_command(
            session,
            ws_url,
            token,
            {
                "type": "topomation/actions/rules/set_enabled",
                "entity_id": automation_entity_id,
                "enabled": True,
            },
            msg_id=16,
            expect_success=False,
        )
        assert set_enabled_message.get("success") is True, set_enabled_message

        async def _state_enabled():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            if resp.status != 200:
                return None
            payload = await resp.json()
            return payload if payload.get("state") == "on" else None

        enabled_state = await _wait_for(_state_enabled, timeout_seconds=20)
        assert enabled_state is not None, "Automation did not transition to enabled state"

        delete_message = await _ws_command(
            session,
            ws_url,
            token,
            {
                "type": "topomation/actions/rules/delete",
                "automation_id": automation_id,
                "entity_id": automation_entity_id,
            },
            msg_id=17,
            expect_success=False,
        )
        assert delete_message.get("success") is True, delete_message

        async def _state_removed():
            resp = await session.get(f"{ha_url}/api/states/{automation_entity_id}")
            return resp.status in (404, 410)

        removed = await _wait_for(_state_removed, timeout_seconds=30)
        assert removed, "Automation entity did not disappear after delete"
