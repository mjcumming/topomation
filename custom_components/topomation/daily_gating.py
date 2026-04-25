"""Daily-run gating for action rules (ADR-HA-091).

Pure evaluation logic. Persistence and HA wiring live elsewhere — this module
is intentionally side-effect-free so the gating semantics can be exercised
without spinning up Home Assistant.

The Path Y carve-out (ADR-HA-091 §7) is the load-bearing rule: a daily-gated
rule whose target vacuum is currently paused is allowed to re-fire so the
natural two-rule "pause on occupied + start on vacant resumes" composition
works.
"""

from __future__ import annotations

VACUUM_PAUSED_STATE = "paused"


def should_fire_with_daily_gating(
    *,
    daily_gating_enabled: bool,
    last_fired_date: str | None,
    today_local_date: str,
    target_vacuum_state: str | None,
) -> bool:
    """Return True if a rule should fire under its daily-gating policy.

    Path Y semantics per ADR-HA-091 §7:
        fire if (gating disabled)
             OR (not yet fired today)
             OR (already fired today AND target vacuum is currently paused)

    Args:
        daily_gating_enabled: User toggle on the rule card. False = always fire.
        last_fired_date: ISO local-date string (YYYY-MM-DD) of last successful
            dispatch, or None if never fired.
        today_local_date: ISO local-date string for "now" in the host's local
            time zone. Caller computes this from local time, not UTC.
        target_vacuum_state: Current state of the rule's target vacuum entity
            (e.g. "cleaning", "paused", "docked"), or None if unknown.

    Returns:
        True if the rule's trigger matched and the gate permits firing.
    """
    if not daily_gating_enabled:
        return True
    if last_fired_date != today_local_date:
        return True
    return target_vacuum_state == VACUUM_PAUSED_STATE
