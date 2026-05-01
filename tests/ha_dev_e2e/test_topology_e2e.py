"""Production-shaped topology/HA anchoring checks against HA dev runtime."""

from __future__ import annotations

import aiohttp
import pytest

from .ha_client import HADevClient

pytestmark = pytest.mark.live_ha


def _locations(payload: dict) -> list[dict]:
    return [item for item in payload.get("locations", []) if isinstance(item, dict)]


async def test_ha_dev_topomation_loaded_with_expected_area_wrappers(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """Topomation must load from current HA dev runtime and import test areas."""
    result = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=201)
    names = {str(item.get("name")) for item in _locations(result)}

    for expected in {"Driveway", "Front Porch", "Kitchen", "Living Room", "Hottub"}:
        assert expected in names

    states = await ha_dev_client.rest_get("/api/states")
    occupancy_states = [
        state
        for state in states
        if isinstance(state, dict)
        and str(state.get("entity_id", "")).startswith("binary_sensor.")
        and state.get("attributes", {}).get("device_class") == "occupancy"
        and state.get("attributes", {}).get("location_id")
    ]
    assert occupancy_states, "Topomation occupancy binary sensors were not registered"


async def test_ha_dev_panel_route_serves_real_topomation_panel(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """The release-gate runtime must serve the HA shell and Topomation bundle."""
    async with aiohttp.ClientSession(headers=ha_dev_client.headers) as session:
        async with session.get(f"{ha_dev_client.base_url}/topomation") as response:
            assert response.status in {200, 304}
            shell = await response.text()
        async with session.get(
            f"{ha_dev_client.base_url}/api/topomation/static/topomation-panel.js"
        ) as response:
            assert response.status in {200, 304}
            bundle = await response.text()
    assert "home assistant" in shell.lower()
    assert "customElements.define(\"topomation-panel\"" in bundle
