/**
 * HA area ids used to find illuminance entities for the Ambient lux picker on
 * structural hosts (floor / building / grounds / property). Kept pure for
 * Vitest coverage without mounting Lit.
 */

export type HassAreaEntry = {
  area_id?: string;
  name?: string;
};

export type AmbientLuxHaAreaParams = {
  /** From topology host `ha_area_id` and managed-shadow internal HA area. */
  coreHaAreaIds: readonly string[];
  /**
   * When true (same idea as `HtLocationInspector._isManagedShadowHost()`),
   * also include any `hass.areas` entry whose name matches the host display
   * name (case-insensitive).
   */
  includeNameMatchedHomeAssistantAreas: boolean;
  hostDisplayName: string;
  hassAreas: Record<string, HassAreaEntry> | undefined;
};

export function ambientLuxEnumerationHaAreaIds(params: AmbientLuxHaAreaParams): string[] {
  const ids = new Set<string>(params.coreHaAreaIds);
  if (!params.includeNameMatchedHomeAssistantAreas) {
    return [...ids];
  }
  const label = (params.hostDisplayName || "").trim().toLowerCase();
  if (!label) {
    return [...ids];
  }
  const areas = params.hassAreas;
  if (!areas || typeof areas !== "object") {
    return [...ids];
  }
  for (const entry of Object.values(areas)) {
    const aid =
      typeof entry?.area_id === "string" && entry.area_id.trim() ? entry.area_id.trim() : "";
    const nm = typeof entry?.name === "string" ? entry.name.trim().toLowerCase() : "";
    if (aid && nm === label) {
      ids.add(aid);
    }
  }
  return [...ids];
}
