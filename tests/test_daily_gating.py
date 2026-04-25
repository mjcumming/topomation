"""Unit tests for daily-run gating evaluation (ADR-HA-091)."""

from __future__ import annotations

import pytest

from custom_components.topomation.daily_gating import (
    VACUUM_PAUSED_STATE,
    should_fire_with_daily_gating,
)

TODAY = "2026-04-25"
YESTERDAY = "2026-04-24"


class TestGatingDisabled:
    """When daily-gating is off, the gate is always open."""

    @pytest.mark.parametrize("last_fired", [None, TODAY, YESTERDAY])
    @pytest.mark.parametrize(
        "vacuum_state", [None, "docked", "cleaning", VACUUM_PAUSED_STATE]
    )
    def test_always_fires(self, last_fired: str | None, vacuum_state: str | None) -> None:
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=False,
                last_fired_date=last_fired,
                today_local_date=TODAY,
                target_vacuum_state=vacuum_state,
            )
            is True
        )


class TestGatingEnabledNeverFired:
    """A rule that has never fired (last_fired_date is None) always passes."""

    @pytest.mark.parametrize(
        "vacuum_state", [None, "docked", "cleaning", VACUUM_PAUSED_STATE]
    )
    def test_first_fire_passes(self, vacuum_state: str | None) -> None:
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=None,
                today_local_date=TODAY,
                target_vacuum_state=vacuum_state,
            )
            is True
        )


class TestGatingEnabledFiredYesterday:
    """A rule fired on a prior day passes today (midnight rollover)."""

    @pytest.mark.parametrize(
        "vacuum_state", [None, "docked", "cleaning", VACUUM_PAUSED_STATE]
    )
    def test_passes_after_rollover(self, vacuum_state: str | None) -> None:
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=YESTERDAY,
                today_local_date=TODAY,
                target_vacuum_state=vacuum_state,
            )
            is True
        )


class TestGatingEnabledFiredToday:
    """The Path Y carve-out: re-fire only if the target vacuum is paused."""

    def test_blocked_when_vacuum_idle(self) -> None:
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=TODAY,
                today_local_date=TODAY,
                target_vacuum_state="docked",
            )
            is False
        )

    def test_blocked_when_vacuum_cleaning(self) -> None:
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=TODAY,
                today_local_date=TODAY,
                target_vacuum_state="cleaning",
            )
            is False
        )

    def test_blocked_when_vacuum_state_unknown(self) -> None:
        # Conservative default: if we can't see the vacuum state, treat the
        # carve-out as inapplicable. The rule already fired today; without
        # evidence that the vacuum is paused, don't re-fire.
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=TODAY,
                today_local_date=TODAY,
                target_vacuum_state=None,
            )
            is False
        )

    def test_passes_when_vacuum_paused(self) -> None:
        # The Path Y carve-out: enables the natural two-rule pause/resume
        # composition described in ADR-HA-091 §7.
        assert (
            should_fire_with_daily_gating(
                daily_gating_enabled=True,
                last_fired_date=TODAY,
                today_local_date=TODAY,
                target_vacuum_state=VACUUM_PAUSED_STATE,
            )
            is True
        )
