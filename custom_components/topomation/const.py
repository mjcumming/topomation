"""Constants for Topomation integration."""

DOMAIN = "topomation"
NAME = "Topomation"
VERSION = "0.1.11"

# Storage
STORAGE_VERSION = 1
STORAGE_KEY_CONFIG = f"{DOMAIN}.config"
STORAGE_KEY_STATE = f"{DOMAIN}.state"
AUTOSAVE_DEBOUNCE_SECONDS = 5.0

# Panel
PANEL_URL = "/topomation"
PANEL_TITLE = "TopoMation"
PANEL_ICON = "mdi:floor-plan"
PANEL_OCCUPANCY_URL = "/topomation-occupancy"
PANEL_OCCUPANCY_TITLE = "Occupancy Manager"
PANEL_OCCUPANCY_ICON = "mdi:home-account"
PANEL_ACTIONS_URL = "/topomation-actions"
PANEL_ACTIONS_TITLE = "Actions Manager"
PANEL_ACTIONS_ICON = "mdi:flash"

PANEL_DEFINITIONS = (
    {
        "view": "location",
        "url": PANEL_URL,
        "title": PANEL_TITLE,
        "icon": PANEL_ICON,
        "sidebar_visible": True,
    },
    {
        "view": "occupancy",
        "url": PANEL_OCCUPANCY_URL,
        "title": None,
        "icon": None,
        "sidebar_visible": False,
    },
    {
        "view": "actions",
        "url": PANEL_ACTIONS_URL,
        "title": None,
        "icon": None,
        "sidebar_visible": False,
    },
)

# WebSocket API types
WS_TYPE_LOCATIONS_LIST = f"{DOMAIN}/locations/list"
WS_TYPE_LOCATIONS_CREATE = f"{DOMAIN}/locations/create"
WS_TYPE_LOCATIONS_UPDATE = f"{DOMAIN}/locations/update"
WS_TYPE_LOCATIONS_DELETE = f"{DOMAIN}/locations/delete"
WS_TYPE_LOCATIONS_REORDER = f"{DOMAIN}/locations/reorder"
WS_TYPE_LOCATIONS_SET_MODULE_CONFIG = f"{DOMAIN}/locations/set_module_config"

# Ambient Light WebSocket API types
WS_TYPE_AMBIENT_GET_READING = f"{DOMAIN}/ambient/get_reading"
WS_TYPE_AMBIENT_SET_SENSOR = f"{DOMAIN}/ambient/set_sensor"
WS_TYPE_AMBIENT_AUTO_DISCOVER = f"{DOMAIN}/ambient/auto_discover"

# Sync Manager WebSocket API types
WS_TYPE_SYNC_IMPORT = f"{DOMAIN}/sync/import"
WS_TYPE_SYNC_STATUS = f"{DOMAIN}/sync/status"
WS_TYPE_SYNC_ENABLE = f"{DOMAIN}/sync/enable"

# Managed actions WebSocket API types
WS_TYPE_ACTION_RULES_LIST = f"{DOMAIN}/actions/rules/list"
WS_TYPE_ACTION_RULES_CREATE = f"{DOMAIN}/actions/rules/create"
WS_TYPE_ACTION_RULES_DELETE = f"{DOMAIN}/actions/rules/delete"
WS_TYPE_ACTION_RULES_SET_ENABLED = f"{DOMAIN}/actions/rules/set_enabled"

# Actions automation metadata/logging
TOPOMATION_AUTOMATION_METADATA_PREFIX = "[topomation]"
AUTOMATION_REAPPLY_CONFIG_KEY = "reapply_last_state_on_startup"
AUTOMATION_STARTUP_BUFFER_SECONDS = 20
EVENT_TOPOMATION_ACTIONS_SUMMARY = f"{DOMAIN}_actions_summary"
