#!/usr/bin/env python3
"""
Query entities in a Home Assistant area via WebSocket API.

Lists entities (especially lights, switches) assigned to an area for comparison
with what Topomation shows in the SOURCES list.

Usage:
  Set HA_URL and HA_TOKEN in tests/ha-config.env, then:
  python scripts/query-area-entities.py [area_id]
  (default area_id: kitchen)

Example:
  python scripts/query-area-entities.py kitchen
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

# Load ha-config.env if present
_CONFIG_ENV = os.path.join(os.path.dirname(__file__), "..", "tests", "ha-config.env")
if os.path.isfile(_CONFIG_ENV):
    with open(_CONFIG_ENV) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("if ") or line.startswith("else") or line.startswith("fi") or "export " in line:
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip("'\"")
                os.environ.setdefault(k, v)

# Resolve dev vs prod (ha-config.env may have HA_URL_DEV/PROD + HA_TARGET)
_target = os.environ.get("HA_TARGET", "dev")
if _target == "prod" and os.environ.get("HA_URL_PROD"):
    HA_URL = os.environ.get("HA_URL_PROD", "http://localhost:8123").rstrip("/")
    HA_TOKEN = os.environ.get("HA_TOKEN_PROD", "")
else:
    HA_URL = os.environ.get("HA_URL_DEV", os.environ.get("HA_URL", "http://localhost:8123")).rstrip("/")
    HA_TOKEN = os.environ.get("HA_TOKEN_DEV", os.environ.get("HA_TOKEN", ""))
WS_URL = HA_URL.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"


async def main() -> int:
    if not HA_TOKEN:
        print("ERROR: HA_TOKEN required. Set HA_URL and HA_TOKEN in tests/ha-config.env")
        return 1

    area_id = (sys.argv[1] if len(sys.argv) > 1 else "kitchen").strip().lower()
    if not area_id:
        area_id = "kitchen"

    try:
        import websockets
    except ImportError:
        print("Install websockets: pip install websockets")
        return 1

    async with websockets.connect(WS_URL) as ws:
        # Receive auth_required
        msg = json.loads(await ws.recv())
        if msg.get("type") != "auth_required":
            print("Unexpected:", msg)
            return 1

        await ws.send(json.dumps({"type": "auth", "access_token": HA_TOKEN}))
        auth_result = json.loads(await ws.recv())
        if auth_result.get("type") != "auth_ok":
            print("Auth failed:", auth_result)
            return 1

        # Request entity and device registry
        await ws.send(json.dumps({"id": 1, "type": "config/entity_registry/list"}))
        await ws.send(json.dumps({"id": 2, "type": "config/device_registry/list"}))

        entities: list[dict] = []
        devices_by_id: dict[str, dict] = {}
        for _ in range(2):
            msg = json.loads(await ws.recv())
            if msg.get("id") == 1 and "result" in msg:
                entities = msg["result"]
            elif msg.get("id") == 2 and "result" in msg:
                for d in msg["result"]:
                    if d.get("id"):
                        devices_by_id[d["id"]] = d

    def area_for_entity(e: dict) -> str | None:
        if e.get("area_id"):
            return e["area_id"]
        device_id = e.get("device_id")
        if device_id and device_id in devices_by_id:
            return devices_by_id[device_id].get("area_id")
        return None

    in_area = [
        e for e in entities
        if area_for_entity(e) == area_id
    ]
    in_area.sort(key=lambda x: (x.get("entity_id") or "").lower())

    lights = [e for e in in_area if (e.get("entity_id") or "").startswith("light.")]
    switches = [e for e in in_area if (e.get("entity_id") or "").startswith("switch.")]
    binary_sensors = [e for e in in_area if (e.get("entity_id") or "").startswith("binary_sensor.")]
    other = [e for e in in_area if e not in lights and e not in switches and e not in binary_sensors]

    print(f"Entities in area '{area_id}' (entity registry + device area): {len(in_area)}")
    print()
    if lights:
        print("LIGHTS:")
        for e in lights:
            print(f"  {e.get('entity_id')}")
        print()
    if switches:
        print("SWITCHES:")
        for e in switches:
            print(f"  {e.get('entity_id')}")
        print()
    if binary_sensors:
        print("BINARY_SENSORS:")
        for e in binary_sensors:
            print(f"  {e.get('entity_id')}")
        print()
    if other:
        print("OTHER:")
        for e in other:
            print(f"  {e.get('entity_id')}")
    if not in_area:
        print("  (none)")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
