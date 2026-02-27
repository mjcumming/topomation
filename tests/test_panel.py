"""Tests for Topomation panel registration."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.topomation.const import PANEL_DEFINITIONS
from custom_components.topomation.panel import FRONTEND_URL, async_register_panel


@pytest.mark.asyncio
async def test_async_register_panel_registers_all_sidebar_views() -> None:
    """Register primary panel plus alias routes with expected metadata."""
    hass = SimpleNamespace(
        http=SimpleNamespace(
            async_register_static_paths=AsyncMock(),
        )
    )

    with patch("custom_components.topomation.panel.frontend.async_register_built_in_panel") as register_mock:
        await async_register_panel(hass, "entry_123")

    hass.http.async_register_static_paths.assert_awaited_once()
    static_paths = hass.http.async_register_static_paths.await_args.args[0]
    assert len(static_paths) == 1
    assert getattr(static_paths[0], "url_path", None) == FRONTEND_URL

    assert register_mock.call_count == len(PANEL_DEFINITIONS)

    for call, expected in zip(register_mock.call_args_list, PANEL_DEFINITIONS, strict=False):
        assert call.args[0] is hass
        assert call.kwargs["component_name"] == "custom"
        assert call.kwargs["sidebar_title"] == expected["title"]
        assert call.kwargs["sidebar_icon"] == expected["icon"]
        assert call.kwargs["frontend_url_path"] == expected["url"].lstrip("/")
        assert call.kwargs["require_admin"] is True
        config = call.kwargs["config"]
        assert config["topomation_view"] == expected["view"]
        assert config["entry_id"] == "entry_123"
        assert config["_panel_custom"]["name"] == "topomation-panel"
        assert config["_panel_custom"]["module_url"].startswith(
            f"{FRONTEND_URL}/topomation-panel.js?v="
        )

    visible_sidebar_calls = [
        call
        for call in register_mock.call_args_list
        if call.kwargs["sidebar_title"] is not None
    ]
    assert len(visible_sidebar_calls) == 1
    assert visible_sidebar_calls[0].kwargs["frontend_url_path"] == "topomation"
