"""Constants for Home Topology integration."""

DOMAIN = "home_topology"
NAME = "Home Topology"
VERSION = "0.1.0"

# Panel
PANEL_URL = "/home-topology"
PANEL_TITLE = "Location Manager"
PANEL_ICON = "mdi:floor-plan"

# WebSocket API types
WS_TYPE_LOCATIONS_LIST = f"{DOMAIN}/locations/list"
WS_TYPE_LOCATIONS_CREATE = f"{DOMAIN}/locations/create"
WS_TYPE_LOCATIONS_UPDATE = f"{DOMAIN}/locations/update"
WS_TYPE_LOCATIONS_DELETE = f"{DOMAIN}/locations/delete"
WS_TYPE_LOCATIONS_REORDER = f"{DOMAIN}/locations/reorder"
WS_TYPE_LOCATIONS_SET_MODULE_CONFIG = f"{DOMAIN}/locations/set_module_config"

