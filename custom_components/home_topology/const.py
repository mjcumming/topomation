"""Constants for Home Topology integration."""

DOMAIN = "home_topology"
NAME = "Home Topology"
VERSION = "0.1.0"

# Storage
STORAGE_VERSION = 1
STORAGE_KEY_CONFIG = f"{DOMAIN}.config"
STORAGE_KEY_STATE = f"{DOMAIN}.state"

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

# Ambient Light WebSocket API types
WS_TYPE_AMBIENT_GET_READING = f"{DOMAIN}/ambient/get_reading"
WS_TYPE_AMBIENT_SET_SENSOR = f"{DOMAIN}/ambient/set_sensor"
WS_TYPE_AMBIENT_AUTO_DISCOVER = f"{DOMAIN}/ambient/auto_discover"

# Sync Manager WebSocket API types
WS_TYPE_SYNC_IMPORT = f"{DOMAIN}/sync/import"
WS_TYPE_SYNC_STATUS = f"{DOMAIN}/sync/status"
WS_TYPE_SYNC_ENABLE = f"{DOMAIN}/sync/enable"
