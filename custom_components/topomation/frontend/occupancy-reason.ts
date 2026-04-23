import type {
  HomeAssistant,
  Location,
  OccupancySource,
} from "./types";
import { effectiveOccupancyTopologyId } from "./shadow-location-utils";

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
  status: OccupancyStatus;
  nowMs?: number;
}

export function buildOccupancyReasonLine(ctx: OccupancyReasonContext): string {
  if (ctx.status === "unknown") return "Occupancy unknown";

  const topologyId = effectiveOccupancyTopologyId(ctx.location, ctx.locations);
  const stateObj = findOccupancyStateForId(ctx.hass, topologyId);
  const attrs: Record<string, any> = stateObj?.attributes || {};
  const transition = ctx.occupancyTransitions?.[ctx.location.id];
  const now = ctx.nowMs ?? Date.now();
  const timeLabel = formatElapsed(
    latestTimestamp(transition?.changedAt, stateObj?.last_changed, stateObj?.last_updated),
    now,
  );

  const header = ctx.status === "occupied" ? "Occupied" : "Vacant";

  let detail: string | undefined;

  if (ctx.status === "occupied") {
    detail =
      topActiveContributorLabel(attrs, ctx) ||
      formatOccupancyReason(transition?.reason, "occupied", ctx) ||
      formatOccupancyReason(attrs.reason, "occupied", ctx) ||
      occupiedDescendantLabel(ctx);
  } else {
    detail =
      formatOccupancyReason(transition?.reason, "vacancy", ctx) ||
      formatOccupancyReason(attrs.reason, "vacancy", ctx);
  }

  const line = detail ? `${header} · ${detail}` : header;
  return timeLabel ? `${line} (${timeLabel})` : line;
}

function findOccupancyStateForId(
  hass: HomeAssistant | undefined,
  topologyId: string,
): Record<string, any> | undefined {
  if (!hass?.states || !topologyId) return undefined;
  for (const stateObj of Object.values(hass.states)) {
    const attrs = (stateObj as any)?.attributes || {};
    if (attrs.device_class !== "occupancy") continue;
    if (attrs.location_id !== topologyId) continue;
    return stateObj as Record<string, any>;
  }
  return undefined;
}

function topActiveContributorLabel(
  attrs: Record<string, any>,
  ctx: OccupancyReasonContext,
): string | undefined {
  const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
  if (!contributions.length) return undefined;

  const now = ctx.nowMs ?? Date.now();
  const sources = getOccupancySources(ctx.location);

  type Row = { sourceId: string; label: string; ts: number };
  const rows: Row[] = [];
  for (const contribution of contributions) {
    if (!isContributionActive(contribution, now)) continue;
    const sourceId = String(
      contribution?.source_id || contribution?.source || "",
    ).trim();
    if (!sourceId) continue;
    const ts =
      parseDateMs(contribution?.updated_at) ??
      parseDateMs(contribution?.changed_at) ??
      parseDateMs(contribution?.last_changed) ??
      parseDateMs(contribution?.timestamp) ??
      0;
    rows.push({
      sourceId,
      label: sourceLabelForSourceId(sourceId, sources, ctx),
      ts,
    });
  }

  if (!rows.length) return undefined;
  rows.sort((a, b) => b.ts - a.ts);
  return rows[0].label;
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

function occupiedDescendantLabel(ctx: OccupancyReasonContext): string | undefined {
  const childrenByParent = new Map<string, string[]>();
  for (const loc of ctx.locations) {
    if (!loc.parent_id) continue;
    if (!childrenByParent.has(loc.parent_id)) childrenByParent.set(loc.parent_id, []);
    childrenByParent.get(loc.parent_id)!.push(loc.id);
  }

  const stack = [...(childrenByParent.get(ctx.location.id) || [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (ctx.occupancyStates?.[id] === true) {
      const child = ctx.locations.find((l) => l.id === id);
      if (child?.name) return `${child.name} is occupied`;
    }
    stack.push(...(childrenByParent.get(id) || []));
  }
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
