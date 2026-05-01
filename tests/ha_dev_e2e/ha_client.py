"""Small Home Assistant API helpers for production-shaped dev e2e tests."""

from __future__ import annotations

import asyncio
import os
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

import aiohttp


def ws_url_from_http(http_url: str) -> str:
    """Return HA websocket URL for an HTTP base URL."""
    base = http_url.rstrip("/")
    if base.startswith("https://"):
        return "wss://" + base.removeprefix("https://") + "/api/websocket"
    return "ws://" + base.removeprefix("http://") + "/api/websocket"


@dataclass(slots=True)
class HADevClient:
    """Minimal authenticated Home Assistant REST/WebSocket client."""

    base_url: str
    token: str

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def rest_get(self, path: str) -> Any:
        """GET a HA REST path and return JSON."""
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(f"{self.base_url.rstrip('/')}{path}") as response:
                response.raise_for_status()
                return await response.json()

    async def rest_post(self, path: str, payload: dict[str, Any] | None = None) -> Any:
        """POST a HA REST path and return JSON when present."""
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.post(
                f"{self.base_url.rstrip('/')}{path}",
                json=payload or {},
            ) as response:
                response.raise_for_status()
                if response.content_type == "application/json":
                    return await response.json()
                text = await response.text()
                return {"text": text}

    async def ws(self, payload: dict[str, Any], *, msg_id: int = 1) -> Any:
        """Send one HA websocket command and return the result."""
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.ws_connect(ws_url_from_http(self.base_url)) as ws:
                auth_required = await ws.receive_json(timeout=10)
                if auth_required.get("type") != "auth_required":
                    raise AssertionError(auth_required)

                await ws.send_json({"type": "auth", "access_token": self.token})
                auth_ok = await ws.receive_json(timeout=10)
                if auth_ok.get("type") != "auth_ok":
                    raise AssertionError(auth_ok)

                await ws.send_json({"id": msg_id, **payload})
                while True:
                    message = await ws.receive_json(timeout=20)
                    if message.get("id") != msg_id:
                        continue
                    if message.get("success") is False:
                        raise AssertionError(message)
                    return message.get("result")

    async def wait_for_state(
        self,
        entity_id: str,
        expected: str | Iterable[str],
        *,
        timeout: float = 15.0,
        step: float = 0.25,
    ) -> dict[str, Any]:
        """Wait for an entity to reach one of the expected states."""
        expected_states = {expected} if isinstance(expected, str) else set(expected)
        deadline = asyncio.get_running_loop().time() + timeout
        last: dict[str, Any] | None = None
        while asyncio.get_running_loop().time() < deadline:
            try:
                last = await self.rest_get(f"/api/states/{entity_id}")
            except aiohttp.ClientResponseError:
                last = None
            if isinstance(last, dict) and str(last.get("state")) in expected_states:
                return last
            await asyncio.sleep(step)
        raise AssertionError(
            f"{entity_id} did not reach {sorted(expected_states)}; last={last}"
        )

    async def wait_for_entity(
        self,
        entity_id: str,
        *,
        timeout: float = 15.0,
        step: float = 0.25,
    ) -> dict[str, Any]:
        """Wait until an entity exists in HA state machine."""
        deadline = asyncio.get_running_loop().time() + timeout
        last_error: Exception | None = None
        while asyncio.get_running_loop().time() < deadline:
            try:
                state = await self.rest_get(f"/api/states/{entity_id}")
                if isinstance(state, dict) and state.get("entity_id") == entity_id:
                    return state
            except Exception as err:  # noqa: BLE001
                last_error = err
            await asyncio.sleep(step)
        raise AssertionError(f"{entity_id} did not appear in HA states: {last_error}")

    async def wait_for_topomation(self, *, timeout: float = 30.0) -> dict[str, Any]:
        """Wait until the Topomation websocket API is available."""
        deadline = asyncio.get_running_loop().time() + timeout
        last_error: Exception | None = None
        while asyncio.get_running_loop().time() < deadline:
            try:
                result = await self.ws({"type": "topomation/locations/list"})
                if isinstance(result, dict):
                    return result
            except Exception as err:  # noqa: BLE001
                last_error = err
            await asyncio.sleep(0.5)
        raise AssertionError(f"Topomation websocket API did not become ready: {last_error}")


def client_from_env() -> HADevClient:
    """Create a dev client from HA_URL/HA_TOKEN."""
    base_url = os.environ.get("HA_URL", "http://127.0.0.1:8123").rstrip("/")
    token = os.environ.get("HA_TOKEN", "").strip()
    if not token:
        raise RuntimeError("HA_TOKEN is required")
    return HADevClient(base_url=base_url, token=token)


DEV_AREAS = {
    "driveway": "Driveway",
    "front_porch": "Front Porch",
    "kitchen": "Kitchen",
    "living_room": "Living Room",
    "hallway": "Hallway",
    "main_bedroom": "Main Bedroom",
    "guest_bedroom": "Guest Bedroom",
    "back_deck": "Back Deck",
    "south_side_yard": "South Side Yard",
    "hottub": "Hottub",
}

AREA_ENTITY_MAP = {
    "driveway": [
        "binary_sensor.driveway_motion",
        "sensor.driveway_lux",
        "light.driveway_test_light",
    ],
    "front_porch": [
        "binary_sensor.front_porch_motion",
        "sensor.front_porch_lux",
        "light.front_porch_test_light",
    ],
    "kitchen": [
        "binary_sensor.kitchen_motion",
        "sensor.kitchen_lux",
        "light.kitchen_test_light",
    ],
    "living_room": [
        "binary_sensor.living_room_motion",
        "sensor.living_room_lux",
        "light.living_room_test_light",
    ],
    "main_bedroom": ["binary_sensor.main_bedroom_presence"],
    "back_deck": ["switch.back_deck_test_switch"],
    "hottub": ["binary_sensor.hottub_motion"],
}


async def ensure_area(client: HADevClient, name: str) -> str:
    """Ensure an HA area exists and return its area_id."""
    areas = await client.ws({"type": "config/area_registry/list"}, msg_id=100)
    for area in areas or []:
        if isinstance(area, dict) and area.get("name") == name:
            return str(area["area_id"])
    created = await client.ws(
        {"type": "config/area_registry/create", "name": name},
        msg_id=101,
    )
    return str(created["area_id"])


async def ensure_topomation_config_entry(client: HADevClient) -> str:
    """Ensure Topomation has a loaded config entry and return entry_id."""
    entries = await client.ws({"type": "config_entries/get"}, msg_id=110)
    for entry in entries or []:
        if isinstance(entry, dict) and entry.get("domain") == "topomation":
            return str(entry.get("entry_id", ""))

    init = await client.rest_post(
        "/api/config/config_entries/flow",
        {"handler": "topomation"},
    )
    flow_id = str(init.get("flow_id", ""))
    if not flow_id:
        raise AssertionError(f"Could not start Topomation config flow: {init}")
    result = await client.rest_post(f"/api/config/config_entries/flow/{flow_id}", {})
    entry = result.get("result") if isinstance(result, dict) else None
    if not isinstance(entry, dict) or not entry.get("entry_id"):
        raise AssertionError(f"Could not create Topomation config entry: {result}")
    return str(entry["entry_id"])


async def bootstrap_dev_ha(client: HADevClient) -> dict[str, Any]:
    """Create deterministic HA areas/entity assignments and load Topomation."""
    # Wait for configured template entities before assigning them to areas.
    for entity_id in [
        "light.driveway_test_light",
        "light.front_porch_test_light",
        "binary_sensor.driveway_motion",
        "sensor.driveway_lux",
    ]:
        await client.wait_for_entity(entity_id, timeout=30)

    area_ids: dict[str, str] = {}
    for slug, name in DEV_AREAS.items():
        area_ids[slug] = await ensure_area(client, name)

    for slug, entity_ids in AREA_ENTITY_MAP.items():
        area_id = area_ids[slug]
        for entity_id in entity_ids:
            try:
                await client.ws(
                    {
                        "type": "config/entity_registry/update",
                        "entity_id": entity_id,
                        "area_id": area_id,
                    },
                    msg_id=120,
                )
            except AssertionError:
                # Some demo/template entities may not be registry-backed on every HA build.
                # The state still exists, so tests can use direct service/entity ids.
                continue

    entry_id = await ensure_topomation_config_entry(client)
    await client.wait_for_topomation(timeout=45)
    try:
        await client.ws({"type": "topomation/sync/import", "entry_id": entry_id}, msg_id=130)
    except AssertionError:
        # Older loaded states can already be imported; the following locations
        # wait is the behavior gate.
        pass

    locations = await client.wait_for_topomation(timeout=30)
    return {"entry_id": entry_id, "area_ids": area_ids, "locations": locations}
