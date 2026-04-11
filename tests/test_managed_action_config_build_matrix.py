"""Parametrized tests for Topomation managed-action automation config builders.

These assert the integration's compilation of HA automation triggers/conditions.
Kernel occupancy math and HA core automation runtime are out of scope; see
tests/OCCUPANCY-LIGHTING-MATRIX.md.
"""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.core import HomeAssistant

from custom_components.topomation.managed_actions import TopomationManagedActions

OCC = "binary_sensor.topomation_occupancy_test_room"


@pytest.fixture
def build_manager(hass: HomeAssistant) -> TopomationManagedActions:
    return TopomationManagedActions(hass)


@pytest.mark.parametrize(
    ("trigger_types", "ambient_config", "expected_triggers"),
    [
        pytest.param(
            ("on_occupied",),
            {},
            [
                {
                    "trigger": "state",
                    "entity_id": OCC,
                    "to": "on",
                }
            ],
            id="on_occupied",
        ),
        pytest.param(
            ("on_vacant",),
            {},
            [
                {
                    "trigger": "state",
                    "entity_id": OCC,
                    "to": "off",
                }
            ],
            id="on_vacant",
        ),
        pytest.param(
            ("on_dark",),
            {
                "lux_sensor": None,
                "dark_threshold": 50.0,
                "bright_threshold": 500.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "trigger": "state",
                    "entity_id": "sun.sun",
                    "to": "below_horizon",
                }
            ],
            id="on_dark_sun_only",
        ),
        pytest.param(
            ("on_bright",),
            {
                "lux_sensor": None,
                "dark_threshold": 50.0,
                "bright_threshold": 500.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "trigger": "state",
                    "entity_id": "sun.sun",
                    "to": "above_horizon",
                }
            ],
            id="on_bright_sun_only",
        ),
        pytest.param(
            ("on_dark",),
            {
                "lux_sensor": "sensor.living_lux",
                "dark_threshold": 42.0,
                "bright_threshold": 400.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "trigger": "numeric_state",
                    "entity_id": "sensor.living_lux",
                    "below": 42.0,
                },
                {
                    "trigger": "state",
                    "entity_id": "sun.sun",
                    "to": "below_horizon",
                },
            ],
            id="on_dark_lux_and_sun",
        ),
        pytest.param(
            ("on_dark",),
            {
                "lux_sensor": "sensor.living_lux",
                "dark_threshold": 42.0,
                "bright_threshold": 400.0,
                "fallback_to_sun": False,
            },
            [
                {
                    "trigger": "numeric_state",
                    "entity_id": "sensor.living_lux",
                    "below": 42.0,
                }
            ],
            id="on_dark_lux_no_sun_fallback",
        ),
        pytest.param(
            ("on_bright",),
            {
                "lux_sensor": "sensor.living_lux",
                "dark_threshold": 10.0,
                "bright_threshold": 999.0,
                "fallback_to_sun": False,
            },
            [
                {
                    "trigger": "numeric_state",
                    "entity_id": "sensor.living_lux",
                    "above": 999.0,
                }
            ],
            id="on_bright_lux_no_sun_fallback",
        ),
    ],
)
def test_managed_action_trigger_build_matrix(
    build_manager: TopomationManagedActions,
    trigger_types: tuple[str, ...],
    ambient_config: dict[str, Any],
    expected_triggers: list[dict[str, Any]],
) -> None:
    triggers = build_manager._build_trigger_definitions(  # noqa: SLF001
        trigger_types=trigger_types,  # type: ignore[arg-type]
        occupancy_entity_id=OCC,
        ambient_config=ambient_config,
    )
    assert triggers == expected_triggers


def test_managed_action_trigger_occupancy_required(build_manager: TopomationManagedActions) -> None:
    with pytest.raises(ValueError, match="no occupancy entity"):
        build_manager._build_trigger_definitions(  # noqa: SLF001
            trigger_types=("on_occupied",),
            occupancy_entity_id=None,
            ambient_config={},
        )


@pytest.mark.parametrize(
    (
        "ambient_condition",
        "must_be_occupied",
        "time_condition_enabled",
        "start_time",
        "end_time",
        "ambient_config",
        "expected_conditions",
    ),
    [
        pytest.param(
            "any",
            None,
            False,
            "09:00",
            "17:00",
            {"lux_sensor": None, "fallback_to_sun": True},
            [],
            id="ambient_any_no_extras",
        ),
        pytest.param(
            "dark",
            None,
            False,
            "09:00",
            "17:00",
            {
                "lux_sensor": None,
                "dark_threshold": 50.0,
                "bright_threshold": 500.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "below_horizon",
                }
            ],
            id="ambient_dark_sun_only",
        ),
        pytest.param(
            "bright",
            None,
            False,
            "09:00",
            "17:00",
            {
                "lux_sensor": None,
                "dark_threshold": 50.0,
                "bright_threshold": 500.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "above_horizon",
                }
            ],
            id="ambient_bright_sun_only",
        ),
        pytest.param(
            "dark",
            None,
            False,
            "09:00",
            "17:00",
            {
                "lux_sensor": "sensor.lux1",
                "dark_threshold": 55.0,
                "bright_threshold": 600.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "condition": "or",
                    "conditions": [
                        {
                            "condition": "numeric_state",
                            "entity_id": "sensor.lux1",
                            "below": 55.0,
                        },
                        {
                            "condition": "state",
                            "entity_id": "sun.sun",
                            "state": "below_horizon",
                        },
                    ],
                }
            ],
            id="ambient_dark_lux_or_sun",
        ),
        pytest.param(
            "bright",
            None,
            False,
            "09:00",
            "17:00",
            {
                "lux_sensor": "sensor.lux1",
                "dark_threshold": 55.0,
                "bright_threshold": 600.0,
                "fallback_to_sun": False,
            },
            [
                {
                    "condition": "numeric_state",
                    "entity_id": "sensor.lux1",
                    "above": 600.0,
                }
            ],
            id="ambient_bright_lux_only",
        ),
        pytest.param(
            "any",
            True,
            False,
            "09:00",
            "17:00",
            {"lux_sensor": None, "fallback_to_sun": True},
            [
                {
                    "condition": "state",
                    "entity_id": OCC,
                    "state": "on",
                }
            ],
            id="must_be_occupied_true",
        ),
        pytest.param(
            "any",
            False,
            False,
            "09:00",
            "17:00",
            {"lux_sensor": None, "fallback_to_sun": True},
            [
                {
                    "condition": "state",
                    "entity_id": OCC,
                    "state": "off",
                }
            ],
            id="must_be_occupied_false",
        ),
        pytest.param(
            "any",
            None,
            True,
            "09:30",
            "16:45",
            {"lux_sensor": None, "fallback_to_sun": True},
            [
                {
                    "condition": "time",
                    "after": "09:30",
                    "before": "16:45",
                }
            ],
            id="time_same_day",
        ),
        pytest.param(
            "any",
            None,
            True,
            "22:00",
            "06:00",
            {"lux_sensor": None, "fallback_to_sun": True},
            [
                {
                    "condition": "time",
                    "after": "22:00",
                    "before": "06:00",
                }
            ],
            id="time_overnight_shape",
        ),
        pytest.param(
            "dark",
            True,
            True,
            "08:00",
            "12:00",
            {
                "lux_sensor": None,
                "dark_threshold": 50.0,
                "bright_threshold": 500.0,
                "fallback_to_sun": True,
            },
            [
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "below_horizon",
                },
                {
                    "condition": "state",
                    "entity_id": OCC,
                    "state": "on",
                },
                {
                    "condition": "time",
                    "after": "08:00",
                    "before": "12:00",
                },
            ],
            id="stack_dark_occupied_time",
        ),
    ],
)
def test_managed_action_condition_build_matrix(
    build_manager: TopomationManagedActions,
    ambient_condition: str,
    must_be_occupied: bool | None,
    time_condition_enabled: bool,
    start_time: str,
    end_time: str,
    ambient_config: dict[str, Any],
    expected_conditions: list[dict[str, Any]],
) -> None:
    conditions = build_manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition=ambient_condition,  # type: ignore[arg-type]
        must_be_occupied=must_be_occupied,
        occupancy_entity_id=OCC,
        time_condition_enabled=time_condition_enabled,
        start_time=start_time,
        end_time=end_time,
        ambient_config=ambient_config,
    )
    assert conditions == expected_conditions


def test_managed_action_condition_requires_entity_for_occupancy_guard(
    build_manager: TopomationManagedActions,
) -> None:
    with pytest.raises(ValueError, match="Occupancy condition requires"):
        build_manager._build_condition_definitions(  # noqa: SLF001
            ambient_condition="any",
            must_be_occupied=True,
            occupancy_entity_id=None,
            time_condition_enabled=False,
            start_time="09:00",
            end_time="17:00",
            ambient_config={"lux_sensor": None, "fallback_to_sun": True},
        )


@pytest.mark.parametrize(
    ("require_dark", "ambient_condition", "trigger_types", "expected"),
    [
        pytest.param(True, None, ("on_occupied",), "dark", id="require_dark_forces_dark"),
        pytest.param(False, None, ("on_occupied",), "any", id="on_occupied_default_any"),
        pytest.param(False, "bright", ("on_occupied",), "bright", id="explicit_bright"),
        pytest.param(False, None, ("on_dark",), "dark", id="on_dark_default_dark"),
        pytest.param(False, None, ("on_bright",), "bright", id="on_bright_default_bright"),
    ],
)
def test_normalize_ambient_condition_matrix(
    build_manager: TopomationManagedActions,
    require_dark: bool,
    ambient_condition: str | None,
    trigger_types: tuple[str, ...],
    expected: str,
) -> None:
    result = build_manager._normalize_ambient_condition(  # noqa: SLF001
        ambient_condition=ambient_condition,
        trigger_types=trigger_types,  # type: ignore[arg-type]
        require_dark=require_dark,
    )
    assert result == expected
