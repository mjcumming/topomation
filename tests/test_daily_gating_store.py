"""Tests for the persistent fired-today store (ADR-HA-091)."""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant

from custom_components.topomation.daily_gating_store import DailyGatingStore

TODAY = "2026-04-25"
LATER = "2026-04-26"
RULE_A = "rule-aaaa-1111"
RULE_B = "rule-bbbb-2222"


@pytest.mark.asyncio
async def test_empty_store_returns_none(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    assert store.get_last_fired(RULE_A) is None


@pytest.mark.asyncio
async def test_mark_fired_then_get(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    await store.async_mark_fired(RULE_A, TODAY)
    assert store.get_last_fired(RULE_A) == TODAY


@pytest.mark.asyncio
async def test_mark_fired_overwrites_same_rule(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    await store.async_mark_fired(RULE_A, TODAY)
    await store.async_mark_fired(RULE_A, LATER)
    assert store.get_last_fired(RULE_A) == LATER


@pytest.mark.asyncio
async def test_separate_rules_tracked_independently(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    await store.async_mark_fired(RULE_A, TODAY)
    await store.async_mark_fired(RULE_B, LATER)
    assert store.get_last_fired(RULE_A) == TODAY
    assert store.get_last_fired(RULE_B) == LATER


@pytest.mark.asyncio
async def test_persistence_across_reload(hass: HomeAssistant) -> None:
    first = DailyGatingStore(hass)
    await first.async_load()
    await first.async_mark_fired(RULE_A, TODAY)

    second = DailyGatingStore(hass)
    await second.async_load()
    assert second.get_last_fired(RULE_A) == TODAY


@pytest.mark.asyncio
async def test_clear_rule_removes_state(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    await store.async_mark_fired(RULE_A, TODAY)
    await store.async_clear_rule(RULE_A)
    assert store.get_last_fired(RULE_A) is None


@pytest.mark.asyncio
async def test_clear_rule_no_op_for_unknown(hass: HomeAssistant) -> None:
    store = DailyGatingStore(hass)
    await store.async_load()
    # Should not raise, should not corrupt state.
    await store.async_clear_rule(RULE_A)
    assert store.get_last_fired(RULE_A) is None


@pytest.mark.asyncio
async def test_clear_rule_persists(hass: HomeAssistant) -> None:
    first = DailyGatingStore(hass)
    await first.async_load()
    await first.async_mark_fired(RULE_A, TODAY)
    await first.async_clear_rule(RULE_A)

    second = DailyGatingStore(hass)
    await second.async_load()
    assert second.get_last_fired(RULE_A) is None


@pytest.mark.asyncio
async def test_corrupt_payload_treated_as_empty(hass: HomeAssistant) -> None:
    # Pre-populate the underlying Store with non-dict garbage to ensure
    # async_load coerces to empty rather than raising.
    store = DailyGatingStore(hass)
    await store._store.async_save({"fired_today": "not-a-dict"})
    await store.async_load()
    assert store.get_last_fired(RULE_A) is None
