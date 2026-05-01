"""Production-shaped occupancy checks against HA dev runtime."""

from __future__ import annotations

import asyncio
import time

import pytest

from .ha_client import HADevClient

pytestmark = pytest.mark.live_ha


def _location_by_name(payload: dict, name: str) -> dict:
    for item in payload.get("locations", []):
        if isinstance(item, dict) and item.get("name") == name:
            return item
    raise AssertionError(f"Location named {name!r} not found")


async def _occupancy_entity_for_location(client: HADevClient, location_id: str) -> str:
    states = await client.rest_get("/api/states")
    for state in states:
        attrs = state.get("attributes", {}) if isinstance(state, dict) else {}
        if (
            isinstance(state, dict)
            and attrs.get("device_class") == "occupancy"
            and attrs.get("location_id") == location_id
        ):
            return str(state["entity_id"])
    raise AssertionError(f"No occupancy entity for {location_id}")


async def test_regression_nested_rollup_and_manual_occupancy_projection(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """Manual service trigger/vacate must update HA occupancy and projection."""
    locations = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=301)
    driveway = _location_by_name(locations, "Driveway")
    location_id = str(driveway["id"])
    occupancy_entity = await _occupancy_entity_for_location(ha_dev_client, location_id)

    await ha_dev_client.rest_post(
        "/api/services/topomation/vacate_area",
        {"location_id": location_id, "source_id": "ha_dev_e2e", "include_locked": True},
    )
    await ha_dev_client.wait_for_state(occupancy_entity, "off", timeout=10)

    started = time.monotonic()
    await ha_dev_client.rest_post(
        "/api/services/topomation/trigger",
        {"location_id": location_id, "source_id": "ha_dev_e2e", "timeout": 30},
    )
    await ha_dev_client.wait_for_state(occupancy_entity, "on", timeout=10)
    assert time.monotonic() - started < 3.0

    projection = await ha_dev_client.ws({"type": "topomation/occupancy/states/list"}, msg_id=302)
    rows = projection.get("states", []) if isinstance(projection, dict) else []
    matching = [row for row in rows if isinstance(row, dict) and row.get("location_id") == location_id]
    assert matching
    assert matching[0].get("occupied") is True

    await ha_dev_client.rest_post(
        "/api/services/topomation/clear",
        {"location_id": location_id, "source_id": "ha_dev_e2e", "trailing_timeout": 0},
    )
    await ha_dev_client.rest_post(
        "/api/services/topomation/vacate_area",
        {"location_id": location_id, "source_id": "ha_dev_e2e", "include_locked": True},
    )
    await ha_dev_client.wait_for_state(occupancy_entity, "off", timeout=10)


async def test_regression_state_held_off_clear(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """State-like presence should not leave a room permanently stuck occupied."""
    locations = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=303)
    bedroom = _location_by_name(locations, "Main Bedroom")
    location_id = str(bedroom["id"])
    occupancy_entity = await _occupancy_entity_for_location(ha_dev_client, location_id)

    config = dict(bedroom.get("modules", {}).get("occupancy", {}))
    config["occupancy_sources"] = [
        {
            "entity_id": "binary_sensor.main_bedroom_presence",
            "source_id": "main_bedroom_presence",
            "on_timeout": None,
            "off_event": "clear",
            "off_trailing": 0,
        }
    ]
    await ha_dev_client.ws(
        {
            "type": "topomation/locations/set_module_config",
            "location_id": location_id,
            "module_id": "occupancy",
            "config": config,
        },
        msg_id=304,
    )

    await ha_dev_client.rest_post(
        "/api/services/input_boolean/turn_on",
        {"entity_id": "input_boolean.sim_main_bedroom_presence"},
    )
    await ha_dev_client.wait_for_state(occupancy_entity, "on", timeout=10)

    await ha_dev_client.rest_post(
        "/api/services/input_boolean/turn_off",
        {"entity_id": "input_boolean.sim_main_bedroom_presence"},
    )
    await asyncio.sleep(0.5)
    await ha_dev_client.wait_for_state(occupancy_entity, "off", timeout=10)
