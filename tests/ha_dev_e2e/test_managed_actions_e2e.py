"""Production-shaped managed automation checks against HA dev runtime."""

from __future__ import annotations

import uuid

import pytest

from .ha_client import HADevClient

pytestmark = pytest.mark.live_ha


def _location_by_name(payload: dict, name: str) -> dict:
    for item in payload.get("locations", []):
        if isinstance(item, dict) and item.get("name") == name:
            return item
    raise AssertionError(f"Location named {name!r} not found")


async def _delete_rule(client: HADevClient, automation_id: str) -> None:
    if not automation_id:
        return
    try:
        await client.ws(
            {"type": "topomation/actions/rules/delete", "automation_id": automation_id},
            msg_id=599,
        )
    except AssertionError:
        pass


async def test_regression_outdoor_dark_lights_and_only_if_off(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """Driveway dark rule must register and turn on the light through real HA."""
    locations = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=501)
    driveway = _location_by_name(locations, "Driveway")
    location_id = str(driveway["id"])
    rule_uuid = f"ha-dev-dark-{uuid.uuid4().hex[:12]}"
    automation_id = ""

    try:
        created = await ha_dev_client.ws(
            {
                "type": "topomation/actions/rules/create",
                "location_id": location_id,
                "name": "HA Dev Driveway Dark",
                "trigger_type": "on_dark",
                "trigger_types": ["on_dark"],
                "ambient_condition": "any",
                "actions": [
                    {
                        "entity_id": "light.driveway_test_light",
                        "service": "turn_on",
                        "only_if_off": True,
                    }
                ],
                "run_on_startup": True,
                "rule_uuid": rule_uuid,
            },
            msg_id=502,
        )
        rule = created.get("rule", created) if isinstance(created, dict) else {}
        automation_id = str(rule.get("id", ""))
        automation_entity_id = str(rule.get("entity_id", f"automation.{automation_id}"))
        assert automation_id

        config = await ha_dev_client.ws(
            {"type": "automation/config", "entity_id": automation_entity_id},
            msg_id=503,
        )
        automation_config = config.get("config", config)
        assert "[topomation]" in str(automation_config.get("description", ""))
        assert "only_if_off" not in str(automation_config.get("actions", ""))
        assert "choose" in str(automation_config.get("actions", ""))

        await ha_dev_client.rest_post(
            "/api/services/light/turn_off",
            {"entity_id": "light.driveway_test_light"},
        )
        await ha_dev_client.wait_for_state("light.driveway_test_light", "off", timeout=10)

        await ha_dev_client.rest_post(
            "/api/services/automation/trigger",
            {"entity_id": automation_entity_id, "skip_condition": False},
        )
        await ha_dev_client.wait_for_state("light.driveway_test_light", "on", timeout=10)
    finally:
        await _delete_rule(ha_dev_client, automation_id)


async def test_regression_shadow_host_rule_save_has_real_registration_path(
    ha_dev_client: HADevClient,
    ha_dev_bootstrap,
) -> None:
    """Managed rule list endpoint must remain available for structural/action workflows."""
    locations = await ha_dev_client.ws({"type": "topomation/locations/list"}, msg_id=504)
    front_porch = _location_by_name(locations, "Front Porch")
    listed = await ha_dev_client.ws(
        {
            "type": "topomation/actions/rules/list",
            "location_id": str(front_porch["id"]),
        },
        msg_id=505,
    )
    assert isinstance(listed.get("rules"), list)
