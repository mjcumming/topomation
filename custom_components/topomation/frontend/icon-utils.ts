import type { Location, LocationType } from "./types";

export function inferCategoryIcon(name: string): string | null {
  const lowerName = name.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"],
  };

  const categoryIcons: Record<string, string> = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater",
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      return categoryIcons[category] ?? null;
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
  };
  return typeIcons[type] ?? "mdi:map-marker";
}

function normalizeLocationType(rawType: unknown): LocationType {
  const normalized = String(rawType ?? "area").trim().toLowerCase();
  if (normalized === "room") return "area";
  if (normalized === "floor") return "floor";
  if (normalized === "area") return "area";
  if (normalized === "building") return "building";
  if (normalized === "grounds") return "grounds";
  if (normalized === "subarea") return "subarea";
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

