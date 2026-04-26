import type {
  HomeAssistant,
  Location,
  OccupancySource,
} from "./types";

export type OccupancyStatus = "occupied" | "vacant" | "unknown";

export interface OccupancyTransitionState {
  occupied: boolean;
  previousOccupied?: boolean;
  reason?: string;
  changedAt?: string;
}

export interface OccupancyReasonContext {
  location: Location;
  locations: readonly Location[];
  hass: HomeAssistant | undefined;
  occupancyStates: Readonly<Record<string, boolean | undefined>>;
  occupancyTransitions: Readonly<Record<string, OccupancyTransitionState>>;
  occupancyRuntimeStates?: Readonly<Record<string, Record<string, any> | undefined>>;
  status: OccupancyStatus;
  nowMs?: number;
}

export interface OccupancyExplanation {
  status: OccupancyStatus;
  statusLabel: string;
  summary: string;
  reasonLine: string;
  details: string[];
}

export function buildOccupancyReasonLine(ctx: OccupancyReasonContext): string {
  return buildOccupancyExplanation(ctx).reasonLine;
}

export function buildOccupancyExplanation(ctx: OccupancyReasonContext): OccupancyExplanation {
  if (ctx.status === "unknown") {
    return {
      status: "unknown",
      statusLabel: "Unknown",
      summary: "Occupancy is unknown.",
      reasonLine: "Occupancy unknown",
      details: ["No occupancy state is available for this location yet."],
    };
  }

  const stateObj = occupancyRuntimeStateForLocation(ctx, ctx.location.id);
  const attrs: Record<string, any> = stateObj?.attributes || {};
  const transition = ctx.occupancyTransitions?.[ctx.location.id];
  const now = ctx.nowMs ?? Date.now();
  const timeLabel = formatElapsed(
    latestTimestamp(transition?.changedAt, stateObj?.last_changed, stateObj?.last_updated),
    now,
  );

  const header = ctx.status === "occupied" ? "Occupied" : "Vacant";

  let detail: string | undefined;
  const activeContributors = activeContributorRows(attrs, ctx);
  const details: string[] = [];

  if (ctx.status === "occupied") {
    detail =
      activeContributors[0]?.lineLabel ||
      formatOccupancyReason(transition?.reason, "occupied", ctx) ||
      formatOccupancyReason(attrs.reason, "occupied", ctx);
  } else {
    detail =
      formatOccupancyReason(transition?.reason, "vacancy", ctx) ||
      formatOccupancyReason(attrs.reason, "vacancy", ctx);
  }

  const line = detail ? `${header} · ${detail}` : header;
  const reasonLine = timeLabel ? `${line} (${timeLabel})` : line;

  if (activeContributors.length) {
    const shown = activeContributors.slice(0, 4).map((row) => row.detailLabel);
    const more =
      activeContributors.length > shown.length
        ? `, +${activeContributors.length - shown.length} more`
        : "";
    details.push(
      `Active ${activeContributors.length === 1 ? "source" : "sources"}: ${shown.join(", ")}${more}.`
    );
  } else if (ctx.status === "vacant") {
    details.push("No active occupancy sources are currently holding this location.");
  }

  const nextChange = nextChangeDetail(attrs, activeContributors, ctx);
  if (nextChange) details.push(nextChange);

  const latestChange = latestRecentChange(attrs, ctx);
  if (latestChange) details.push(latestChange);

  const lockedBy = Array.isArray(attrs.locked_by)
    ? attrs.locked_by.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  if (attrs.is_locked || lockedBy.length) {
    details.push(
      lockedBy.length
        ? `Lock: held by ${lockedBy.map((item) => humanizeTechnicalId(item)).join(", ")}.`
        : "Lock: occupancy is currently locked."
    );
  }

  if (!details.length && ctx.status === "occupied") {
    details.push("No source-level evidence is available from the occupancy entity yet.");
  }

  return {
    status: ctx.status,
    statusLabel: header,
    summary:
      ctx.status === "occupied"
        ? occupiedSummary(detail, activeContributors)
        : vacantSummary(detail),
    reasonLine,
    details,
  };
}

type ContributorRow = {
  sourceId: string;
  lineLabel: string;
  detailLabel: string;
  sentence: string;
  ts: number;
  expiresMs?: number;
  indefinite: boolean;
};

function activeContributorRows(
  attrs: Record<string, any>,
  ctx: OccupancyReasonContext,
): ContributorRow[] {
  const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
  if (!contributions.length) return [];

  const now = ctx.nowMs ?? Date.now();
  const sources = getOccupancySources(ctx.location);

  const rows: ContributorRow[] = [];
  for (const contribution of contributions) {
    if (!isContributionActive(contribution, now)) continue;
    const sourceId = String(
      contribution?.source_id || contribution?.source || "",
    ).trim();
    if (!sourceId) continue;
    const lineLabel = sourceLabelForSourceId(sourceId, sources, ctx);
    const ts =
      parseDateMs(contribution?.updated_at) ??
      parseDateMs(contribution?.changed_at) ??
      parseDateMs(contribution?.last_changed) ??
      parseDateMs(contribution?.timestamp) ??
      0;
    const expiresMs = parseDateMs(contribution?.expires_at);
    rows.push({
      sourceId,
      lineLabel,
      detailLabel: detailContributorLabel(lineLabel, ts, now, expiresMs),
      sentence: contributorSentence(sourceId, lineLabel, ctx),
      ts,
      expiresMs,
      indefinite: contribution?.expires_at === null || contribution?.expires_at === undefined,
    });
  }

  if (!rows.length) return [];
  rows.sort((a, b) => b.ts - a.ts);
  const deduped = new Map<string, ContributorRow>();
  for (const row of rows) {
    if (!deduped.has(row.sourceId)) deduped.set(row.sourceId, row);
  }
  return [...deduped.values()];
}

function isContributionActive(contribution: any, nowMs: number): boolean {
  if (!contribution) return false;
  const state = String(contribution.state || contribution.value || "").toLowerCase();
  if (state === "on" || state === "active" || state === "occupied" || state === "trigger") {
    return true;
  }
  const expires = parseDateMs(contribution.expires_at);
  return Boolean(expires && expires > nowMs);
}

function getOccupancySources(location: Location): OccupancySource[] {
  const raw = (location?.modules?.occupancy as any) || {};
  return Array.isArray(raw.occupancy_sources) ? raw.occupancy_sources : [];
}

function detailContributorLabel(
  label: string,
  timestampMs: number,
  nowMs: number,
  expiresMs: number | undefined,
): string {
  const parts: string[] = [];
  const elapsed = timestampMs ? formatElapsed(timestampMs, nowMs) : undefined;
  if (elapsed) parts.push(`${elapsed} ago`);
  if (expiresMs && expiresMs > nowMs) {
    const remaining = formatRemaining(expiresMs, nowMs);
    if (remaining) parts.push(`holds ${remaining}`);
  }
  return parts.length ? `${label} (${parts.join("; ")})` : label;
}

function contributorSentence(
  sourceId: string,
  label: string,
  ctx: OccupancyReasonContext,
): string {
  const raw = String(sourceId || "").trim();
  const locationIdAfterMarker = (marker: string): string =>
    raw.startsWith(marker) ? raw.slice(marker.length).trim() : "";

  const childId =
    locationIdAfterMarker("__child__:") || locationIdAfterMarker("__child__.");
  if (childId) return `${displayNameForLocationOrAreaId(childId, ctx)} is occupied`;

  const groupId =
    locationIdAfterMarker("__group_member__:") ||
    locationIdAfterMarker("__group_member__.");
  if (groupId) {
    return `${displayNameForLocationOrAreaId(groupId, ctx)} is occupied through the group`;
  }

  const linkedId = locationIdAfterMarker("linked:");
  if (linkedId) {
    return `${displayNameForLocationOrAreaId(linkedId, ctx)} is linked as occupied`;
  }

  if (label.endsWith(" is occupied")) return label;
  return `${label} is active`;
}

function sourceLabelForSourceId(
  sourceId: string,
  sources: OccupancySource[],
  ctx: OccupancyReasonContext,
): string {
  const structural = structuralSourceLabel(sourceId, ctx);
  if (structural) return structural;

  const exact = sources.find(
    (s) => s.source_id === sourceId || s.entity_id === sourceId,
  );
  if (exact) return entityFriendlyName(exact.entity_id, ctx.hass);

  if (sourceId.includes("::")) {
    const [entityId] = sourceId.split("::");
    return entityFriendlyName(entityId, ctx.hass);
  }

  return entityFriendlyName(sourceId, ctx.hass);
}

function structuralSourceLabel(
  sourceId: string,
  ctx: OccupancyReasonContext,
): string | undefined {
  const raw = String(sourceId || "").trim();
  if (!raw) return undefined;

  const prefixedLabel = (
    prefix: string,
    separator: ":" | ".",
    template: (name: string) => string,
  ): string | undefined => {
    const marker = `${prefix}${separator}`;
    if (!raw.startsWith(marker)) return undefined;
    const id = raw.slice(marker.length).trim();
    if (!id) return undefined;
    return template(displayNameForLocationOrAreaId(id, ctx));
  };

  return (
    prefixedLabel("__child__", ":", (n) => `${n} is occupied`) ||
    prefixedLabel("__child__", ".", (n) => `${n} is occupied`) ||
    prefixedLabel("__follow__", ":", (n) => `linked to ${n}`) ||
    prefixedLabel("__follow__", ".", (n) => `linked to ${n}`) ||
    prefixedLabel("__group_member__", ":", (n) => `group member ${n}`) ||
    prefixedLabel("__group_member__", ".", (n) => `group member ${n}`) ||
    (raw.startsWith("linked:")
      ? `linked from ${displayNameForLocationOrAreaId(raw.slice("linked:".length).trim(), ctx)}`
      : undefined)
  );
}

function displayNameForLocationOrAreaId(
  rawId: string,
  ctx: OccupancyReasonContext,
): string {
  const id = String(rawId || "").trim();
  if (!id) return "";
  const haArea = (ctx.hass as any)?.areas?.[id];
  if (haArea && typeof haArea.name === "string" && haArea.name.trim()) {
    return haArea.name.trim();
  }
  const topo = (ctx.locations || []).find((l) => l.id === id);
  if (topo?.name) return topo.name;
  return humanizeTechnicalId(id);
}

function humanizeTechnicalId(id: string): string {
  const stripped = id.replace(/^area_/i, "").replace(/_/g, " ").trim();
  if (!stripped) return id;
  return stripped.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function entityFriendlyName(entityId: string, hass: HomeAssistant | undefined): string {
  const name = (hass as any)?.states?.[entityId]?.attributes?.friendly_name;
  return typeof name === "string" && name ? name : entityId;
}

function formatOccupancyReason(
  reason: unknown,
  mode: "occupied" | "vacancy",
  ctx: OccupancyReasonContext,
): string | undefined {
  if (typeof reason !== "string") return undefined;
  const raw = reason.trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();

  if (lower === "timeout") {
    return mode === "vacancy" ? "timed out" : undefined;
  }
  if (lower === "propagation:parent") {
    return mode === "vacancy" ? "parent location cleared" : undefined;
  }
  if (lower.startsWith("propagation:child:")) {
    if (mode !== "vacancy") return undefined;
    const childId = raw.split(":").slice(2).join(":").trim();
    return childId
      ? `child ${displayNameForLocationOrAreaId(childId, ctx)} cleared`
      : "a child location cleared";
  }
  if (lower.startsWith("event:")) {
    const eventType = lower.split(":", 2)[1];
    if (eventType === "clear") return mode === "vacancy" ? "cleared" : undefined;
    if (eventType === "vacate") return mode === "vacancy" ? "vacated" : undefined;
    if (eventType === "handoff") return mode === "occupied" ? "room handoff" : undefined;
    if (eventType === "inherit") return mode === "occupied" ? "inherited state" : undefined;
    if (eventType === "trigger") return undefined;
    if (eventType) return `${eventType} event`;
  }
  if (lower.startsWith("occupancy:")) {
    return mode === "occupied" ? lower.slice("occupancy:".length) || undefined : undefined;
  }

  return raw;
}

function occupiedSummary(
  detail: string | undefined,
  contributors: ContributorRow[],
): string {
  if (contributors.length) {
    const first = contributors[0].sentence;
    if (contributors.length === 1) return `Occupied because ${first}.`;
    return `Occupied because ${first} and ${contributors.length - 1} other source${contributors.length === 2 ? "" : "s"} are active.`;
  }
  if (!detail) return "Occupied, but no active reason is available yet.";
  if (detail.endsWith(".")) return `Occupied because ${detail}`;
  return `Occupied because ${detail}.`;
}

function vacantSummary(detail: string | undefined): string {
  if (!detail) return "Vacant because no occupancy sources are active.";
  if (detail === "timed out") return "Vacant because the hold timer expired.";
  if (detail === "cleared") return "Vacant because the active source cleared.";
  if (detail === "vacated") return "Vacant because it was explicitly vacated.";
  if (detail.endsWith(".")) return `Vacant because ${detail}`;
  return `Vacant because ${detail}.`;
}

function nextChangeDetail(
  attrs: Record<string, any>,
  contributors: ContributorRow[],
  ctx: OccupancyReasonContext,
): string | undefined {
  if (ctx.status !== "occupied") return undefined;
  const now = ctx.nowMs ?? Date.now();
  const explicitVacantAt =
    parseDateMs(attrs.vacant_at) ?? parseDateMs(attrs.effective_timeout_at);
  if (explicitVacantAt && explicitVacantAt > now) {
    const remaining = formatRemaining(explicitVacantAt, now);
    return remaining
      ? `Expected to become vacant when the hold timer expires in ${remaining}.`
      : "Expected to become vacant when the hold timer expires.";
  }

  const latestContributionExpiry = contributors
    .map((row) => row.expiresMs)
    .filter((value): value is number => typeof value === "number" && value > now)
    .sort((a, b) => b - a)[0];
  if (latestContributionExpiry) {
    const remaining = formatRemaining(latestContributionExpiry, now);
    return remaining
      ? `Expected to become vacant after active source holds expire in ${remaining}.`
      : "Expected to become vacant after active source holds expire.";
  }

  if (contributors.some((row) => row.indefinite)) {
    return "Stays occupied until the active source clears.";
  }
  return undefined;
}

function latestRecentChange(
  attrs: Record<string, any>,
  ctx: OccupancyReasonContext,
): string | undefined {
  const changes = Array.isArray(attrs.recent_changes) ? attrs.recent_changes : [];
  const latest = changes[0];
  if (!latest || typeof latest !== "object") return undefined;
  const kind = String(latest.kind || "").toLowerCase();
  const event = String(latest.event || "").toLowerCase();
  const sourceId = typeof latest.source_id === "string" ? latest.source_id.trim() : "";
  const sourceLabel = sourceId
    ? sourceLabelForSourceId(sourceId, getOccupancySources(ctx.location), ctx)
    : "";
  const changedAt = parseDateMs(latest.changed_at);
  const age = changedAt ? formatElapsed(changedAt, ctx.nowMs ?? Date.now()) : undefined;
  const suffix = age ? ` ${age} ago` : "";
  if (kind === "signal" && event === "trigger") {
    return `Latest event: ${sourceLabel || "a source"} reported activity${suffix}.`;
  }
  if (kind === "signal" && event === "clear") {
    return `Latest event: ${sourceLabel || "a source"} cleared${suffix}.`;
  }
  if (kind === "state" && event === "occupied") {
    return `Latest event: location became occupied${suffix}.`;
  }
  if (kind === "state" && event === "vacant") {
    return `Latest event: location became vacant${suffix}.`;
  }
  if (event) return `Latest event: ${event}${suffix}.`;
  return undefined;
}

function parseDateMs(value: unknown): number | undefined {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? undefined : ms;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value !== "string" || !value) return undefined;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function occupancyRuntimeStateForLocation(
  ctx: OccupancyReasonContext,
  locationId: string,
): Record<string, any> | undefined {
  const runtimeState = ctx.occupancyRuntimeStates?.[locationId];
  if (runtimeState) return runtimeState;

  const occupied = ctx.occupancyStates?.[locationId];
  if (typeof occupied !== "boolean") return undefined;
  const transition = ctx.occupancyTransitions?.[locationId];
  return {
    entity_id: `binary_sensor.topomation_occupancy_projection_${locationId}`,
    state: occupied ? "on" : "off",
    last_changed: transition?.changedAt,
    last_updated: transition?.changedAt,
    attributes: {
      device_class: "occupancy",
      location_id: locationId,
      previous_occupied: transition?.previousOccupied,
      reason: transition?.reason,
      locked_by: [],
      is_locked: false,
      lock_modes: [],
      direct_locks: [],
      contributions: [],
      recent_changes: [],
    },
  };
}

function latestTimestamp(...values: Array<unknown>): number | undefined {
  let latest: number | undefined;
  for (const v of values) {
    const ms = parseDateMs(v);
    if (ms === undefined) continue;
    if (latest === undefined || ms > latest) latest = ms;
  }
  return latest;
}

function formatElapsed(sinceMs: number | undefined, nowMs: number): string | undefined {
  if (sinceMs === undefined) return undefined;
  const totalSeconds = Math.max(0, Math.floor((nowMs - sinceMs) / 1000));
  if (totalSeconds <= 0) return "just now";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${seconds}s`);
  return parts.slice(0, 2).join(" ");
}

function formatRemaining(targetMs: number, nowMs: number): string | undefined {
  const totalSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  if (totalSeconds <= 0) return undefined;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${seconds}s`);
  return parts.slice(0, 2).join(" ");
}
