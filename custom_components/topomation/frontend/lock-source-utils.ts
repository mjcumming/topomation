export function humanReadableLockSource(sourceId: string): string {
  const raw = String(sourceId || "").trim();
  if (!raw) return "Unknown source";

  const normalized = raw.toLowerCase();
  if (
    normalized === "manual_ui" ||
    normalized === "manual-ui" ||
    normalized === "manual_panel" ||
    normalized === "manual-panel"
  ) {
    return "Manual panel";
  }

  if (normalized.startsWith("__group_member__")) {
    return "Occupancy group member";
  }

  if (normalized.startsWith("__group__")) {
    return "Occupancy group";
  }

  if (normalized === "unknown") {
    return "Unknown source";
  }

  return raw;
}
