"""Runtime English fallback and config-flow translation regression tests."""

from __future__ import annotations

import json
from pathlib import Path
from string import Formatter
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers.translation import async_get_translations
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation.const import DOMAIN

INTEGRATION_DIR = Path(__file__).resolve().parents[1] / "custom_components" / DOMAIN


def test_english_fallback_matches_source_strings() -> None:
    """Ship every source string, including placeholders, in the runtime fallback."""
    source = json.loads((INTEGRATION_DIR / "strings.json").read_text(encoding="utf-8"))
    english = json.loads(
        (INTEGRATION_DIR / "translations" / "en.json").read_text(encoding="utf-8")
    )
    assert english == source


@pytest.mark.usefixtures("enable_custom_integrations")
@pytest.mark.parametrize("language", ["en", "fr"])
async def test_config_flow_runtime_fallback(hass: HomeAssistant, language: str) -> None:
    """HA loads setup text and duplicate-entry abort text for untranslated languages."""
    translations = await async_get_translations(hass, language, "config", {DOMAIN})
    prefix = f"component.{DOMAIN}.config"
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == FlowResultType.FORM
    step = result["step_id"]
    assert translations[f"{prefix}.step.{step}.title"] == "Set up Topomation"
    assert "Click Submit" in translations[f"{prefix}.step.{step}.description"]
    assert not result["data_schema"].schema

    with patch("custom_components.topomation.async_setup_entry", return_value=True):
        created = await hass.config_entries.flow.async_configure(result["flow_id"], {})
        assert created["type"] == FlowResultType.CREATE_ENTRY
        await hass.async_block_till_done()

    duplicate = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert duplicate["type"] == FlowResultType.ABORT
    assert translations[f"{prefix}.abort.{duplicate['reason']}"] == (
        "Topomation is already configured."
    )


@pytest.mark.usefixtures("enable_custom_integrations")
@pytest.mark.parametrize("language", ["en", "fr"])
async def test_options_flow_runtime_fallback(hass: HomeAssistant, language: str) -> None:
    """HA loads the options form and supplies every description placeholder."""
    entry = MockConfigEntry(domain=DOMAIN, title="Topomation", data={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    translations = await async_get_translations(hass, language, "options", {DOMAIN})
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == FlowResultType.FORM
    prefix = f"component.{DOMAIN}.options.step.{result['step_id']}"
    assert translations[f"{prefix}.title"] == "Topomation"
    description = translations[f"{prefix}.description"]
    fields = {field for _, field, _, _ in Formatter().parse(description) if field}
    assert fields == {"version", "panel_url", "docs_url", "issues_url"}
    assert fields == set(result["description_placeholders"])
    rendered = description.format(**result["description_placeholders"])
    assert "Integration version:" in rendered
    assert not result["data_schema"].schema
    submitted = await hass.config_entries.options.async_configure(result["flow_id"], {})
    assert submitted["type"] == FlowResultType.CREATE_ENTRY
