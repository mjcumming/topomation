"""Config flow for Topomation integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from .const import (
    DOMAIN,
    NAME,
    PANEL_URL,
    VERSION,
)


class TopomationConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Topomation."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Return the options flow handler."""
        return TopomationOptionsFlow(config_entry)

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle the initial step."""
        # Only allow one instance of this integration
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({}),
            description_placeholders={"name": NAME},
        )


class TopomationOptionsFlow(OptionsFlow):
    """Options flow for Topomation."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show integration options and about info."""
        if user_input is not None:
            return self.async_create_entry(title="", data={})

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({}),
            description_placeholders={
                "version": VERSION,
                "panel_url": PANEL_URL,
                "docs_url": "https://github.com/mjcumming/topomation",
                "issues_url": "https://github.com/mjcumming/topomation/issues",
            },
        )
