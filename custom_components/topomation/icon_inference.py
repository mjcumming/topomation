"""Location icon inference helpers for Topomation."""

from __future__ import annotations

from typing import Any

SUPPORTED_LOCATION_TYPES = frozenset(
    {"floor", "area", "building", "grounds", "subarea", "property"}
)

TYPE_FALLBACK_ICONS: dict[str, str] = {
    "floor": "mdi:layers",
    "area": "mdi:map-marker",
    "building": "mdi:office-building",
    "grounds": "mdi:pine-tree",
    "subarea": "mdi:map-marker-radius",
    "property": "mdi:home-city-outline",
}

DEFAULT_LOCATION_ICONS = frozenset(TYPE_FALLBACK_ICONS.values())

_KEYWORD_ICONS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("mdi:toilet", ("toilet", "powder room", "half bath", "wc")),
    ("mdi:shower", ("bathroom", "bath room", "bath", "ensuite", "en suite")),
    ("mdi:bed-king", ("primary bedroom", "master bedroom", "owner suite")),
    ("mdi:bed", ("bedroom", "guest room", "kids room", "kid room", "nursery")),
    ("mdi:silverware-fork-knife", ("kitchen", "kitchenette")),
    ("mdi:sofa", ("living room", "family room", "great room", "den", "lounge")),
    ("mdi:table-chair", ("dining room", "dining")),
    ("mdi:desk", ("office", "study", "library")),
    ("mdi:washing-machine", ("laundry", "utility room", "mudroom", "mud room")),
    ("mdi:garage", ("garage", "carport")),
    ("mdi:stairs", ("stairs", "stair", "stairway", "stairwell")),
    ("mdi:door-open", ("entry", "entrance", "foyer", "vestibule", "hallway", "hall")),
    ("mdi:wardrobe", ("closet", "wardrobe")),
    ("mdi:food-apple-outline", ("pantry",)),
    ("mdi:archive", ("storage", "store room")),
    ("mdi:home-floor-a", ("attic", "loft")),
    ("mdi:home-floor-b", ("basement", "cellar")),
    ("mdi:dumbbell", ("gym", "exercise", "fitness")),
    ("mdi:theater", ("media room", "theater", "cinema")),
    ("mdi:gamepad-variant", ("game room", "play room", "playroom")),
    ("mdi:pool", ("pool", "spa", "hot tub")),
    ("mdi:grill", ("patio", "deck", "porch", "terrace", "balcony", "lanai")),
    ("mdi:flower", ("garden", "yard", "courtyard")),
    ("mdi:greenhouse", ("greenhouse",)),
    ("mdi:car", ("driveway", "parking")),
    ("mdi:tools", ("workshop", "shop")),
    ("mdi:server", ("server", "network", "rack")),
    ("mdi:music", ("music", "studio")),
    ("mdi:baby-carriage", ("baby", "nursery")),
)


def normalize_location_type(raw_type: Any) -> str:
    """Normalize stored location type strings to adapter-supported values."""
    normalized = str(raw_type or "area").strip().lower()
    if normalized in SUPPORTED_LOCATION_TYPES:
        return normalized
    return "area"


def normalize_ha_icon(raw_icon: Any) -> str | None:
    """Return a valid HA Material Design Icons id, or None."""
    if not isinstance(raw_icon, str):
        return None
    icon = raw_icon.strip()
    if not icon:
        return None
    return icon if icon.startswith("mdi:") else None


def is_missing_or_default_icon(raw_icon: Any) -> bool:
    """Return True when an icon should be replaced by an inferred guess."""
    icon = normalize_ha_icon(raw_icon)
    return icon is None or icon in DEFAULT_LOCATION_ICONS


def infer_location_icon(name: str, location_type: Any = "area") -> str:
    """Infer the best HA icon for a location name and type."""
    normalized_name = str(name or "").strip().lower()
    for icon, keywords in _KEYWORD_ICONS:
        if any(keyword in normalized_name for keyword in keywords):
            return icon

    return TYPE_FALLBACK_ICONS.get(
        normalize_location_type(location_type),
        TYPE_FALLBACK_ICONS["area"],
    )
