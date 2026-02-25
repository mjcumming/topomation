#!/usr/bin/env python3
"""Bootstrap test topology for Topomation integration.

This creates a realistic house structure:
- Home (root)
  - Ground Floor
    - Living Room
    - Kitchen
    - Hallway
  - First Floor
    - Master Bedroom
    - Guest Bedroom
"""

import asyncio
import aiohttp


async def setup_topology():
    """Create test topology via WebSocket API."""

    # Connect to Home Assistant WebSocket
    session = aiohttp.ClientSession()

    try:
        async with session.ws_connect("ws://localhost:8123/api/websocket") as ws:
            # Auth handshake
            msg = await ws.receive_json()
            print(f"Connected: {msg}")

            # Send auth with your long-lived access token
            # Get this from: Profile → Long-Lived Access Tokens
            token = input("Enter your Home Assistant long-lived access token: ")

            await ws.send_json({"type": "auth", "access_token": token})

            auth_result = await ws.receive_json()
            if auth_result["type"] != "auth_ok":
                print(f"Auth failed: {auth_result}")
                return

            print("Authenticated!")

            # Create locations
            locations = [
                {"id": 1, "name": "Home", "parent_id": None},
                {"id": 2, "name": "Ground Floor", "parent_id": "home"},
                {"id": 3, "name": "Living Room", "parent_id": "ground_floor"},
                {"id": 4, "name": "Kitchen", "parent_id": "ground_floor"},
                {"id": 5, "name": "Hallway", "parent_id": "ground_floor"},
                {"id": 6, "name": "First Floor", "parent_id": "home"},
                {"id": 7, "name": "Master Bedroom", "parent_id": "first_floor"},
                {"id": 8, "name": "Guest Bedroom", "parent_id": "first_floor"},
            ]

            for loc in locations:
                print(f"Creating {loc['name']}...")
                await ws.send_json(
                    {
                        "id": loc["id"],
                        "type": "topomation/locations/create",
                        "name": loc["name"],
                        "parent_id": loc["parent_id"],
                    }
                )

                result = await ws.receive_json()
                if result.get("success"):
                    print(f"  ✓ Created {loc['name']}")
                else:
                    print(f"  ✗ Failed: {result}")

            print("\n✅ Topology setup complete!")

    finally:
        await session.close()


if __name__ == "__main__":
    asyncio.run(setup_topology())
