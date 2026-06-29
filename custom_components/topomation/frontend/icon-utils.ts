import type { Location, LocationType } from "./types";

export function inferCategoryIcon(name: string): string | null {
  const lowerName = name.toLowerCase();

  const keywordIcons: Array<[string, string[]]> = [
    ["mdi:toilet", ["toilet", "powder room", "half bath", "wc"]],
    ["mdi:shower", ["bathroom", "bath room", "bath", "ensuite", "en suite"]],
    ["mdi:bed-king", ["primary bedroom", "master bedroom", "owner suite"]],
    ["mdi:bed", ["bedroom", "guest room", "kids room", "kid room", "nursery"]],
    ["mdi:silverware-fork-knife", ["kitchen", "kitchenette"]],
    ["mdi:sofa", ["living room", "family room", "great room", "den", "lounge"]],
    ["mdi:table-chair", ["dining room", "dining"]],
    ["mdi:desk", ["office", "study", "library"]],
    ["mdi:washing-machine", ["laundry", "utility room", "mudroom", "mud room"]],
    ["mdi:garage", ["garage", "carport"]],
    ["mdi:stairs", ["stairs", "stair", "stairway", "stairwell"]],
    ["mdi:door-open", ["entry", "entrance", "foyer", "vestibule", "hallway", "hall"]],
    ["mdi:wardrobe", ["closet", "wardrobe"]],
    ["mdi:food-apple-outline", ["pantry"]],
    ["mdi:archive", ["storage", "store room"]],
    ["mdi:home-floor-a", ["attic", "loft"]],
    ["mdi:home-floor-b", ["basement", "cellar"]],
    ["mdi:dumbbell", ["gym", "exercise", "fitness"]],
    ["mdi:theater", ["media room", "theater", "cinema"]],
    ["mdi:gamepad-variant", ["game room", "play room", "playroom"]],
    ["mdi:pool", ["pool", "spa", "hot tub"]],
    ["mdi:grill", ["patio", "deck", "porch", "terrace", "balcony", "lanai"]],
    ["mdi:flower", ["garden", "yard", "courtyard"]],
    ["mdi:greenhouse", ["greenhouse"]],
    ["mdi:car", ["driveway", "parking"]],
    ["mdi:tools", ["workshop", "shop"]],
    ["mdi:server", ["server", "network", "rack"]],
    ["mdi:music", ["music", "studio"]],
    ["mdi:baby-carriage", ["baby", "nursery"]],
  ];

  for (const [icon, keywords] of keywordIcons) {
    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      return icon;
    }
  }

  return null;
}

export function getTypeFallbackIcon(type: LocationType): string {
  const typeIcons: Record<LocationType, string> = {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius",
    property: "mdi:home-city-outline",
  };
  return typeIcons[type] ?? "mdi:map-marker";
}

function normalizeLocationType(rawType: unknown): LocationType {
  const normalized = String(rawType ?? "area").trim().toLowerCase();
  if (normalized === "floor") return "floor";
  if (normalized === "area") return "area";
  if (normalized === "building") return "building";
  if (normalized === "grounds") return "grounds";
  if (normalized === "subarea") return "subarea";
  if (normalized === "property") return "property";
  return "area";
}

export function getLocationIcon(location: Location): string {
  const meta = location.modules?._meta as any;

  // 1) Explicit override
  if (meta?.icon) return String(meta.icon);

  // 2) Category inference from name
  const categoryIcon = inferCategoryIcon(location.name);
  if (categoryIcon) return categoryIcon;

  // 3) Type fallback
  const type = normalizeLocationType(meta?.type);
  return getTypeFallbackIcon(type);
}
