"""Production-shaped ambient checks against HA dev runtime."""

from __future__ import annotations

import pytest

from .ha_client import HADevClient

pytestmark = pytest.mark.live_ha


def _location_by_name(payload: dict, name: str) -> dict:
    for item in payload.get("locations", []):
        if isinstance(item, dict) and item.get("name") == name:
            return item
    raise AssertionError(f"Location named {name!r} not found")


async def test_ambient_lux_thresholds_and_dark_reading(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """Assigned lux sensor should drive ambient dark/bright reading in real HA."""
    locations = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=401)
    driveway = _location_by_name(locations, "Driveway")
    location_id = str(driveway["id"])

    config = {
        **dict(driveway.get("modules", {}).get("ambient", {})),
        "lux_sensor": "sensor.driveway_lux",
        "auto_discover": False,
        "dark_threshold": 800,
        "bright_threshold": 1200,
        "fallback_to_sun": True,
    }
    await ha_dev_client.ws(
        {
            "type": "topomation/locations/set_module_config",
            "location_id": location_id,
            "module_id": "ambient",
            "config": config,
        },
        msg_id=402,
    )
    await ha_dev_client.rest_post(
        "/api/services/input_number/set_value",
        {"entity_id": "input_number.sim_driveway_lux", "value": 5},
    )

    reading = await ha_dev_client.ws(
        {
            "type": "topomation/ambient/get_reading",
            "location_id": location_id,
            "dark_threshold": 800,
            "bright_threshold": 1200,
        },
        msg_id=403,
    )
    assert reading["lux"] <= 5
    assert reading["is_dark"] is True
    assert reading["is_bright"] is False
