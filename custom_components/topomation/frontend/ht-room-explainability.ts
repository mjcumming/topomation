import { LitElement, html, css } from "lit";
import type { HomeAssistant, Location, OccupancyConfig, OccupancySource } from "./types";
import { sharedStyles } from "./styles";
import { getLocationType } from "./hierarchy-rules";
import { effectiveOccupancyTopologyId } from "./shadow-location-utils";

type OccupancyTransitionState = {
  occupied: boolean;
  previousOccupied?: boolean;
  reason?: string;
  changedAt?: string;
};

type ExplainabilityChange = {
  kind: "signal" | "state";
  event: string;
  sourceId?: string;
  reason?: string;
  occupied?: boolean;
  changedAt?: string;
};

type LockDirective = {
  sourceId: string;
  mode: string;
  scope: string;
};

export class HtRoomExplainability extends LitElement {
  static properties = {
    hass: { attribute: false },
    location: { attribute: false },
    locations: { attribute: false },
    occupancyStates: { attribute: false },
    occupancyTransitions: { attribute: false },
    _collapsed: { state: true },
    _nowEpochMs: { state: true },
  };

  public hass!: HomeAssistant;
  public location?: Location;
  public locations: Location[] = [];
  public occupancyStates: Record<string, boolean> = {};
  public occupancyTransitions: Record<string, OccupancyTransitionState> = {};

  private _collapsed = false;
  private _nowEpochMs = Date.now();

  private _clockTimer?: number;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        border-top: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }

      .dock {
        padding: 12px;
      }

      .dock-card {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.98);
        overflow: hidden;
      }

      .dock-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.05);
        border-bottom: 1px solid var(--divider-color);
      }

      .dock-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--primary-text-color);
      }

      .dock-body {
        padding: 12px;
        max-height: 40vh;
        overflow: auto;
      }

      .dock.collapsed .dock-body {
        display: none;
      }

      .dock-help {
        margin-bottom: 10px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--secondary-text-color);
      }

      .occupancy-at-a-glance {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .occupancy-primary-detail {
        font-size: 13px;
        line-height: 1.45;
        color: var(--primary-text-color);
      }

      .occupancy-meta-lines {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--secondary-text-color);
      }

      .occupancy-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
      }

      .occupancy-status-chip.is-occupied {
        background: rgba(var(--rgb-success-color), 0.12);
        color: var(--success-color);
      }

      .occupancy-status-chip.is-vacant {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .occupancy-empty-state {
        border: 1px dashed var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        color: var(--secondary-text-color);
        background: rgba(var(--rgb-primary-color), 0.02);
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._clockTimer !== undefined) {
      window.clearInterval(this._clockTimer);
      this._clockTimer = undefined;
    }
  }

  protected willUpdate(changedProps: Map<string, unknown>): void {
    if (changedProps.has("location")) {
      this._collapsed = false;
    }
  }

  protected render() {
    if (!this.location) return "";

    const currentState = this._recentExplainabilityCurrentState();
    const recentChanges = this._recentExplainabilityChanges();
    const primaryDetail = this._occupancyAtAGlancePrimary(currentState, recentChanges);
    const metaLines: string[] = [];
    if (currentState?.nextChange) metaLines.push(currentState.nextChange);
    if (currentState?.lockedSummary) metaLines.push(currentState.lockedSummary);

    return html`
      <div
        class="dock ${this._collapsed ? "collapsed" : ""}"
        data-testid="room-explainability-panel"
      >
        <div class="dock-card">
          <div class="dock-header">
            <div class="dock-title">
              <ha-icon .icon=${"mdi:home-motion"}></ha-icon>
              Occupancy
            </div>
            <button
              class="button button-secondary"
              type="button"
              style="padding: 2px 8px; font-size: 11px;"
              data-testid="room-explainability-collapse-toggle"
              @click=${() => {
                this._collapsed = !this._collapsed;
              }}
            >
              ${this._collapsed ? "Open" : "Collapse"}
            </button>
          </div>
          <div class="dock-body">
            <div class="dock-help">Whether this location is occupied and the latest occupancy-related note.</div>

            ${!currentState && recentChanges.length === 0
              ? html`
                  <div class="occupancy-empty-state">
                    No occupancy data for this location yet.
                  </div>
                `
              : html`
                  <div class="occupancy-at-a-glance">
                    ${currentState
                      ? html`
                          <div
                            class="occupancy-status-chip ${currentState.occupied
                              ? "is-occupied"
                              : "is-vacant"}"
                          >
                            ${currentState.occupied ? "Occupied" : "Vacant"}
                          </div>
                        `
                      : ""}
                    <div class="occupancy-primary-detail">${primaryDetail}</div>
                    ${metaLines.length
                      ? html`<div class="occupancy-meta-lines">${metaLines.map((line) => html`<div>${line}</div>`)}</div>`
                      : ""}
                  </div>
                `}
          </div>
        </div>
      </div>
    `;
  }

  /** One line: prefer newest log entry, else current “why” / fallback. */
  private _occupancyAtAGlancePrimary(
    currentState:
      | {
          occupied: boolean;
          why: string;
          nextChange?: string;
          lockedSummary?: string;
          contributors: unknown[];
        }
      | undefined,
    recentChanges: Array<{ title: string; description: string; relativeTime: string }>
  ): string {
    if (recentChanges.length > 0) {
      const latest = recentChanges[0];
      return `Last event: ${latest.title} — ${latest.description} (${latest.relativeTime})`;
    }
    if (currentState?.why) {
      return currentState.why;
    }
    return "No recent occupancy events are logged yet.";
  }

  private _getOccupancyConfig(): OccupancyConfig {
    const raw = this.location?.modules?.occupancy;
    return {
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      ...(raw && typeof raw === "object" ? raw : {}),
    };
  }

  private _getOccupancyState() {
    if (!this.location) return undefined;
    const topologyId = effectiveOccupancyTopologyId(this.location, this.locations);
    return this._getOccupancyStateForLocation(topologyId);
  }

  private _getOccupancyStateForLocation(locationId: string) {
    const states = this.hass?.states || {};
    for (const stateObj of Object.values(states)) {
      const attrs = stateObj?.attributes || {};
      if (attrs.device_class !== "occupancy") continue;
      if (attrs.location_id !== locationId) continue;
      return stateObj as Record<string, any>;
    }
    return undefined;
  }

  private _descendantLocationIds(locationId: string): string[] {
    const childrenByParent = new Map<string, string[]>();
    for (const loc of this.locations || []) {
      if (!loc.parent_id) continue;
      if (!childrenByParent.has(loc.parent_id)) childrenByParent.set(loc.parent_id, []);
      childrenByParent.get(loc.parent_id)!.push(loc.id);
    }

    const result: string[] = [];
    const stack = [...(childrenByParent.get(locationId) || [])];
    while (stack.length) {
      const current = stack.pop()!;
      result.push(current);
      stack.push(...(childrenByParent.get(current) || []));
    }
    return result;
  }

  private _aggregateOccupiedState(): boolean | undefined {
    if (!this.location) return undefined;
    const ownState = this._resolveOccupiedState(this._getOccupancyState());
    if (ownState === true) return true;

    const descendantIds = this._descendantLocationIds(this.location.id);
    if (!descendantIds.length) return ownState;

    const descendantStates = descendantIds
      .map((locationId) => this.occupancyStates?.[locationId])
      .filter((state): state is boolean => typeof state === "boolean");

    if (descendantStates.includes(true)) return true;
    if (ownState === false) return false;
    if (descendantStates.length > 0 && descendantStates.every((state) => state === false)) {
      return false;
    }
    return ownState;
  }

  private _aggregateContributors(): Array<{
    sourceLabel: string;
    sourceId: string;
    stateLabel: string;
    timeLabel?: string;
  }> {
    const direct = this._occupancyContributions(this._getOccupancyConfig(), true);
    if (direct.length) return direct;
    if (!this.location) return [];

    const seen = new Set<string>();
    const descendantRows = this._descendantLocationIds(this.location.id)
      .flatMap((locationId) => {
        if (this.occupancyStates?.[locationId] !== true) return [];
        const childLocation = (this.locations || []).find((item) => item.id === locationId);
        const childState = this._getOccupancyStateForLocation(locationId);
        const childConfig = {
          default_timeout: 300,
          default_trailing_timeout: 120,
          occupancy_sources: [],
          ...((childLocation?.modules?.occupancy &&
          typeof childLocation.modules.occupancy === "object"
            ? childLocation.modules.occupancy
            : {}) as OccupancyConfig),
        };
        const attrs = childState?.attributes || {};
        const rawContributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
        return rawContributions
          .map((contribution: any) => {
            if (!this._isContributionActive(contribution)) return undefined;
            const sourceId =
              typeof contribution?.source_id === "string" && contribution.source_id
                ? contribution.source_id
                : typeof contribution?.source === "string" && contribution.source
                  ? contribution.source
                  : "";
            if (!sourceId) return undefined;
            const dedupeKey = `${locationId}::${sourceId}`;
            if (seen.has(dedupeKey)) return undefined;
            seen.add(dedupeKey);
            const timestamp =
              this._parseDateValue(contribution?.updated_at) ||
              this._parseDateValue(contribution?.changed_at) ||
              this._parseDateValue(contribution?.last_changed) ||
              this._parseDateValue(contribution?.timestamp);
            const stateLabel =
              String(contribution?.state || contribution?.state_value || "").trim() || "active";
            const innerLabel = this._sourceLabelForSourceId(childConfig, sourceId);
            const childName = childLocation?.name || locationId;
            return {
              sourceId,
              innerLabel,
              childName,
              stateLabel,
              timeLabel: timestamp ? `${this._formatElapsedDuration(timestamp)} ago` : undefined,
              timestampMs: timestamp ? timestamp.getTime() : this._nowEpochMs,
            };
          })
          .filter(
            (
              item
            ): item is {
              sourceId: string;
              innerLabel: string;
              childName: string;
              stateLabel: string;
              timeLabel?: string;
              timestampMs: number;
            } => Boolean(item)
          );
      })
      .sort((left, right) => right.timestampMs - left.timestampMs);

    const mergedBySource = new Map<
      string,
      {
        sourceId: string;
        innerLabel: string;
        childNames: string[];
        stateLabel: string;
        timeLabel?: string;
        timestampMs: number;
      }
    >();
    for (const row of descendantRows) {
      const existing = mergedBySource.get(row.sourceId);
      if (!existing) {
        mergedBySource.set(row.sourceId, {
          sourceId: row.sourceId,
          innerLabel: row.innerLabel,
          childNames: [row.childName],
          stateLabel: row.stateLabel,
          timeLabel: row.timeLabel,
          timestampMs: row.timestampMs,
        });
        continue;
      }
      if (!existing.childNames.includes(row.childName)) {
        existing.childNames.push(row.childName);
      }
      if (row.timestampMs > existing.timestampMs) {
        existing.timestampMs = row.timestampMs;
        existing.timeLabel = row.timeLabel;
        existing.stateLabel = row.stateLabel;
      }
    }

    const MAX_AREAS_LISTED = 3;
    return [...mergedBySource.values()]
      .sort((left, right) => right.timestampMs - left.timestampMs)
      .map(({ sourceId, innerLabel, childNames, stateLabel, timeLabel }) => {
        const sortedNames = [...childNames].sort((a, b) => a.localeCompare(b));
        let sourceLabelOut: string;
        if (sortedNames.length === 1) {
          sourceLabelOut = `${sortedNames[0]}: ${innerLabel}`;
        } else {
          const listed = sortedNames.slice(0, MAX_AREAS_LISTED);
          const remainder = sortedNames.length - listed.length;
          const suffix =
            remainder > 0
              ? `${listed.join(", ")}, +${remainder} more`
              : listed.join(", ");
          sourceLabelOut = `${innerLabel} · ${sortedNames.length} areas: ${suffix}`;
        }
        return { sourceLabel: sourceLabelOut, sourceId, stateLabel, timeLabel };
      });
  }

  private _resolveOccupiedState(occupancyState?: Record<string, any>): boolean | undefined {
    const locationId = this.location
      ? effectiveOccupancyTopologyId(this.location, this.locations)
      : undefined;
    const transition = locationId ? this.occupancyTransitions?.[locationId] : undefined;
    const transitionChangedAt = this._parseDateValue(transition?.changedAt)?.getTime();
    const stateChangedAt = this._parseDateValue(
      occupancyState?.last_changed || occupancyState?.last_updated
    )?.getTime();

    if (
      transition &&
      typeof transition.occupied === "boolean" &&
      (stateChangedAt === undefined ||
        (transitionChangedAt !== undefined && transitionChangedAt > stateChangedAt))
    ) {
      return transition.occupied;
    }

    if (occupancyState?.state === "on") return true;
    if (occupancyState?.state === "off") return false;

    const override = locationId ? this.occupancyStates?.[locationId] : undefined;
    if (typeof override === "boolean") return override;
    return undefined;
  }

  private _getLockState(): {
    isLocked: boolean;
    lockedBy: string[];
    lockModes: string[];
    directLocks: LockDirective[];
  } {
    const occupancyState = this._getOccupancyState();
    const attrs = occupancyState?.attributes || {};
    const lockedBy = Array.isArray(attrs.locked_by)
      ? attrs.locked_by.map((item: unknown) => String(item))
      : [];
    const lockModes = Array.isArray(attrs.lock_modes)
      ? attrs.lock_modes.map((item: unknown) => String(item))
      : [];
    const directLocks = Array.isArray(attrs.direct_locks)
      ? attrs.direct_locks.map((item: any) => ({
          sourceId: String(item?.source_id || "unknown"),
          mode: String(item?.mode || "freeze"),
          scope: String(item?.scope || "self"),
        }))
      : [];
    return {
      isLocked: Boolean(attrs.is_locked),
      lockedBy,
      lockModes,
      directLocks,
    };
  }

  private _resolveVacantAt(attrs: Record<string, any>, occupied: boolean): Date | null | undefined {
    if (!occupied) return undefined;

    const explicitVacantAt =
      this._parseDateValue(attrs.vacant_at) ||
      this._parseDateValue(attrs.effective_timeout_at);
    if (explicitVacantAt) return explicitVacantAt;

    const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
    let hasIndefiniteContribution = false;
    let latestExpiry: Date | undefined;
    for (const contribution of contributions) {
      const expiresAt = contribution?.expires_at;
      if (expiresAt === null || expiresAt === undefined) {
        hasIndefiniteContribution = true;
        continue;
      }
      const parsed = this._parseDateValue(expiresAt);
      if (!parsed) continue;
      if (!latestExpiry || parsed.getTime() > latestExpiry.getTime()) {
        latestExpiry = parsed;
      }
    }
    if (hasIndefiniteContribution) return null;
    return latestExpiry;
  }

  private _resolveVacancyReason(
    occupancyState: Record<string, any> | undefined,
    occupiedState: boolean | undefined
  ): string | undefined {
    if (occupiedState !== false) return undefined;
    const locationId = this.location?.id;
    if (!locationId) return undefined;
    const transition = this.occupancyTransitions?.[locationId];
    if (transition?.occupied === false) {
      const formatted = this._formatOccupancyReason(transition.reason, "vacancy");
      if (formatted) return formatted;
    }
    return this._formatOccupancyReason(occupancyState?.attributes?.reason, "vacancy");
  }

  private _resolveOccupiedReason(
    occupancyState: Record<string, any> | undefined,
    occupiedState: boolean | undefined
  ): string | undefined {
    if (occupiedState !== true) return undefined;
    const locationId = this.location?.id;
    if (!locationId) return undefined;
    const transition = this.occupancyTransitions?.[locationId];
    if (transition?.occupied === true) {
      const formatted = this._formatOccupancyReason(transition.reason, "occupied");
      if (formatted) return formatted;
    }
    const occupancyReason = this._formatOccupancyReason(
      occupancyState?.attributes?.reason,
      "occupied"
    );
    if (occupancyReason) return occupancyReason;
    const contributors = this._occupancyContributions(this._getOccupancyConfig(), true);
    if (!contributors.length) return "Active source events detected";
    return `Currently held by ${contributors[0].sourceLabel}`;
  }

  private _formatOccupancyReason(
    reason: unknown,
    mode?: "occupied" | "vacancy"
  ): string | undefined {
    if (typeof reason !== "string") return undefined;
    const rawReason = reason.trim();
    if (!rawReason) return undefined;
    const normalized = rawReason.toLowerCase();
    if (normalized === "timeout") {
      return mode === "occupied" ? undefined : "Vacated by timeout";
    }
    if (normalized === "propagation:parent") {
      return mode === "occupied" ? undefined : "Vacated because the parent location cleared";
    }
    if (normalized.startsWith("propagation:child:")) {
      const childId = rawReason.split(":").slice(2).join(":").trim();
      return mode === "occupied"
        ? undefined
        : childId
          ? `Vacated because child location ${this._locationName(childId)} cleared`
          : "Vacated because a child location cleared";
    }
    if (normalized.startsWith("event:")) {
      const eventType = normalized.split(":", 2)[1];
      if (eventType === "clear") return mode === "occupied" ? undefined : "Vacated by clear event";
      if (eventType === "vacate") return mode === "occupied" ? undefined : "Vacated explicitly";
      if (eventType === "trigger" || eventType === "handoff" || eventType === "inherit") {
        return mode === "vacancy"
          ? undefined
          : this._formatOccupancyEventReason(eventType, "occupied");
      }
      if (eventType) {
        return this._formatOccupancyEventReason(
          eventType,
          mode === "occupied" ? "occupied" : "vacancy"
        );
      }
    }
    if (normalized.startsWith("occupancy:")) {
      const eventType = normalized.split(":", 2)[1];
      if (eventType) {
        return mode === "vacancy"
          ? undefined
          : this._formatOccupancyEventReason(eventType, "occupied");
      }
    }
    if (mode === "occupied") return `Occupied: ${rawReason}`;
    if (mode === "vacancy") return `Vacated: ${rawReason}`;
    return `Reason: ${rawReason}`;
  }

  private _recentExplainabilityCurrentState():
    | {
        occupied: boolean;
        why: string;
        nextChange?: string;
        lockedSummary?: string;
        contributors: Array<{ sourceLabel: string; stateLabel: string; timeLabel?: string }>;
      }
    | undefined {
    const occupancyState = this._getOccupancyState();
    if (!occupancyState) return undefined;

    const aggregateOccupied = this._aggregateOccupiedState();
    const occupied = aggregateOccupied === true;
    const attrs = occupancyState.attributes || {};
    const contributors = this._aggregateContributors();
    const vacantAt = this._resolveVacantAt(attrs, occupied);
    const lockState = this._getLockState();
    const why =
      aggregateOccupied === true
        ? this._resolveOccupiedReason(occupancyState, this._resolveOccupiedState(occupancyState)) ||
          (contributors.length
            ? `Occupied via ${contributors[0].sourceLabel}`
            : "Active source events detected")
        : this._resolveVacancyReason(occupancyState, false) || "No active contributors remain";

    let nextChange: string | undefined;
    if (occupied) {
      if (vacantAt === null) {
        nextChange = "No timeout scheduled";
      } else if (vacantAt instanceof Date) {
        nextChange = `Vacates ${this._formatDateTime(vacantAt)}`;
      }
    }

    let lockedSummary: string | undefined;
    if (lockState.isLocked) {
      lockedSummary = lockState.lockedBy.length
        ? `Held by ${lockState.lockedBy.join(", ")}`
        : "Occupancy is held by a lock";
    }

    return {
      occupied,
      why,
      nextChange,
      lockedSummary,
      contributors,
    };
  }

  private _recentExplainabilityChanges(): Array<{
    title: string;
    description: string;
    timeLabel: string;
    relativeTime: string;
    changedAtMs: number;
  }> {
    const occupancyState = this._getOccupancyState();
    const attrs = occupancyState?.attributes || {};
    const rawChanges = Array.isArray(attrs.recent_changes) ? attrs.recent_changes : [];
    return rawChanges
      .map((item: any) => this._normalizeExplainabilityChange(item))
      .filter((item): item is ExplainabilityChange => Boolean(item))
      .map((item) => {
        const timestamp = this._parseDateValue(item.changedAt);
        const sourceLabel = item.sourceId
          ? this._sourceLabelForSourceId(this._getOccupancyConfig(), item.sourceId)
          : undefined;
        return {
          title: this._explainabilityChangeTitle(item),
          description: this._explainabilityChangeDescription(item, sourceLabel),
          timeLabel: timestamp ? this._formatTimeOnly(timestamp) : "Now",
          relativeTime: timestamp ? `${this._formatElapsedDuration(timestamp)} ago` : "just now",
          changedAtMs: timestamp?.getTime() || this._nowEpochMs,
        };
      })
      .sort((left, right) => right.changedAtMs - left.changedAtMs);
  }

  private _normalizeExplainabilityChange(item: any): ExplainabilityChange | undefined {
    if (!item || typeof item !== "object") return undefined;
    const kind = item.kind === "signal" ? "signal" : item.kind === "state" ? "state" : undefined;
    const event = typeof item.event === "string" ? item.event.trim().toLowerCase() : "";
    if (!kind || !event) return undefined;
    return {
      kind,
      event,
      sourceId:
        typeof item.source_id === "string" && item.source_id.trim()
          ? item.source_id.trim()
          : undefined,
      reason:
        typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : undefined,
      occupied: typeof item.occupied === "boolean" ? item.occupied : undefined,
      changedAt:
        typeof item.changed_at === "string" && item.changed_at.trim()
          ? item.changed_at
          : undefined,
    };
  }

  private _explainabilityChangeTitle(item: ExplainabilityChange): string {
    if (item.kind === "state") {
      return item.event === "occupied" ? "Location became occupied" : "Location became vacant";
    }
    if (item.event === "trigger") return "Source triggered";
    if (item.event === "clear") return "Source cleared";
    if (item.event === "vacate") return "Vacate requested";
    return `Source ${item.event}`;
  }

  private _explainabilityChangeDescription(item: ExplainabilityChange, sourceLabel?: string): string {
    if (item.kind === "state") {
      const reason = this._formatOccupancyReason(
        item.reason,
        item.event === "occupied" ? "occupied" : "vacancy"
      );
      return reason || (item.event === "occupied" ? "Occupancy turned on" : "Occupancy turned off");
    }
    const sourceText = sourceLabel
      ? `${sourceLabel}${item.sourceId && sourceLabel !== item.sourceId ? ` (${item.sourceId})` : ""}`
      : item.sourceId || "Unknown source";
    if (item.event === "trigger") return `${sourceText} reported activity`;
    if (item.event === "clear") return `${sourceText} cleared its contribution`;
    if (item.event === "vacate") return `${sourceText} requested vacancy`;
    return `${sourceText} reported ${item.event}`;
  }

  private _formatOccupancyEventReason(eventType: string, mode: "occupied" | "vacancy"): string {
    const prefix = mode === "occupied" ? "Occupied by" : "Vacated by";
    if (eventType === "handoff") return `${prefix} room handoff`;
    if (eventType === "trigger") return `${prefix} trigger`;
    if (eventType === "inherit") return `${prefix} inherited state`;
    return `${prefix} ${eventType} event`;
  }

  private _occupancyContributions(
    config: OccupancyConfig,
    onlyActive = false
  ): Array<{ sourceLabel: string; sourceId: string; stateLabel: string; timeLabel?: string }> {
    const occupancyState = this._getOccupancyState();
    if (!occupancyState) return [];
    const attrs = occupancyState.attributes || {};
    const rawContributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];

    type ContributionRow = {
      sourceLabel: string;
      sourceId: string;
      stateLabel: string;
      timeLabel?: string;
      timestampMs: number;
      active: boolean;
    };

    const mapped = rawContributions
      .map((contribution: any) => {
        const rawSourceId =
          typeof contribution?.source_id === "string" && contribution.source_id
            ? contribution.source_id
            : typeof contribution?.source === "string" && contribution.source
              ? contribution.source
              : "";
        if (!rawSourceId) return undefined;

        const sourceLabel = this._sourceLabelForSourceId(config, rawSourceId);
        const state = String(contribution?.state || contribution?.state_value || "").trim() || "active";
        const timestamp =
          this._parseDateValue(contribution?.updated_at) ||
          this._parseDateValue(contribution?.changed_at) ||
          this._parseDateValue(contribution?.last_changed) ||
          this._parseDateValue(contribution?.timestamp);
        const active = this._isContributionActive(contribution);

        return {
          sourceLabel,
          sourceId: rawSourceId,
          stateLabel: state,
          timeLabel: timestamp ? `${this._formatElapsedDuration(timestamp)} ago` : undefined,
          timestampMs: timestamp ? timestamp.getTime() : this._nowEpochMs,
          active,
        };
      })
      .filter((item): item is ContributionRow => Boolean(item));

    const dedupedBySource = new Map<string, ContributionRow>();
    for (const item of mapped) {
      const prev = dedupedBySource.get(item.sourceId);
      if (!prev || item.timestampMs > prev.timestampMs) {
        dedupedBySource.set(item.sourceId, item);
      }
    }

    const rows = [...dedupedBySource.values()].sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      return right.timestampMs - left.timestampMs;
    });

    const filtered = onlyActive ? rows.filter((item) => item.active) : rows;
    return filtered.map(({ sourceLabel, stateLabel, timeLabel, sourceId }) => ({
      sourceLabel:
        sourceLabel === sourceId || Boolean(this._structuralSourceLabel(sourceId))
          ? sourceLabel
          : `${sourceLabel} (${sourceId})`,
      sourceId,
      stateLabel,
      timeLabel,
    }));
  }

  private _isContributionActive(contribution: any): boolean {
    if (!contribution) return false;
    const state = String(contribution.state || contribution.value || "").toLowerCase();
    if (state === "on" || state === "active" || state === "occupied" || state === "trigger") {
      return true;
    }
    const expiresAt = this._parseDateValue(contribution.expires_at);
    return Boolean(expiresAt && expiresAt.getTime() > this._nowEpochMs);
  }

  private _sourceLabelForSourceId(config: OccupancyConfig, sourceId: string): string {
    const structuralSourceLabel = this._structuralSourceLabel(sourceId);
    if (structuralSourceLabel) {
      return structuralSourceLabel;
    }
    const exact = (config.occupancy_sources || []).find(
      (source) => source.source_id === sourceId || source.entity_id === sourceId
    );
    if (exact) {
      return this._sourceDisplayLabel(exact.entity_id, exact.signal_key);
    }
    if (sourceId.includes("::")) {
      const [entityId] = sourceId.split("::");
      return this._sourceDisplayLabel(entityId);
    }
    return this._entityName(sourceId);
  }

  private _structuralSourceLabel(sourceId: string): string | undefined {
    const raw = String(sourceId || "").trim();
    if (!raw) return undefined;

    const prefixedLocationLabel = (
      prefix: string,
      separator: ":" | ".",
      label: string
    ): string | undefined => {
      const marker = `${prefix}${separator}`;
      if (!raw.startsWith(marker)) return undefined;
      const locationId = raw.slice(marker.length).trim();
      if (!locationId) return undefined;
      return `${label}: ${this._locationName(locationId)}`;
    };

    const groupMemberLabel = (): string | undefined => {
      const markerColon = "__group_member__:";
      const markerDot = "__group_member__.";
      let memberId = "";
      if (raw.startsWith(markerColon)) {
        memberId = raw.slice(markerColon.length).trim();
      } else if (raw.startsWith(markerDot)) {
        memberId = raw.slice(markerDot.length).trim();
      }
      if (!memberId) return undefined;
      return `Occupancy group: ${this._displayNameForLocationOrAreaId(memberId)}`;
    };

    return (
      prefixedLocationLabel("__child__", ":", "Child location") ||
      prefixedLocationLabel("__child__", ".", "Child location") ||
      prefixedLocationLabel("__follow__", ":", "Parent location") ||
      prefixedLocationLabel("__follow__", ".", "Parent location") ||
      groupMemberLabel() ||
      (raw.startsWith("linked:")
        ? `Linked location: ${this._locationName(raw.slice("linked:".length).trim())}`
        : undefined) ||
      this._knownLocationLabel(raw)
    );
  }

  /** Resolve topology location id or HA area id to a short display name. */
  private _displayNameForLocationOrAreaId(rawId: string): string {
    const id = String(rawId || "").trim();
    if (!id) return "";
    const haArea = this.hass?.areas?.[id];
    if (haArea && typeof haArea.name === "string" && haArea.name.trim()) {
      return haArea.name.trim();
    }
    const topo = this._locationName(id);
    if (topo !== id) return topo;
    return this._humanizeTechnicalId(id);
  }

  private _humanizeTechnicalId(id: string): string {
    const stripped = id.replace(/^area_/i, "").replace(/_/g, " ").trim();
    if (!stripped) return id;
    return stripped.replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  private _knownLocationLabel(locationId: string): string | undefined {
    const normalizedId = String(locationId || "").trim();
    if (!normalizedId) return undefined;
    const match = (this.locations || []).find((candidate) => candidate.id === normalizedId);
    if (!match) return undefined;
    const type = getLocationType(match);
    const prefix =
      type === "building"
        ? "Building"
        : type === "grounds"
          ? "Grounds"
          : type === "floor"
            ? "Floor"
            : "Location";
    return `${prefix}: ${match.name}`;
  }

  private _locationName(locationId: string): string {
    const match = (this.locations || []).find((candidate) => candidate.id === locationId);
    return match?.name || locationId;
  }

  private _sourceDisplayLabel(entityId: string, signalKey?: OccupancySource["signal_key"]): string {
    const label = this._entityName(entityId);
    if (!signalKey) return label;
    const suffixMap: Record<string, string> = {
      playback: "playback",
      volume: "volume",
      mute: "mute",
      power: "power",
      level: "brightness",
      color: "color",
    };
    return `${label} ${suffixMap[signalKey] || signalKey}`;
  }

  private _entityName(entityId: string): string {
    return this.hass?.states?.[entityId]?.attributes?.friendly_name || entityId;
  }

  private _parseDateValue(value: unknown): Date | undefined {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      const milli = value > 1e12 ? value : value * 1000;
      const dateValue = new Date(milli);
      return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
    }
    if (typeof value !== "string" || !value) return undefined;
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
  }

  private _formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  }

  private _formatTimeOnly(value: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
    }).format(value);
  }

  private _formatElapsedDuration(since: Date): string {
    const totalSeconds = Math.max(0, Math.floor((this._nowEpochMs - since.getTime()) / 1000));
    if (totalSeconds <= 0) return "just now";
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`);
    if (parts.length === 0 || (days === 0 && hours === 0 && minutes === 0)) {
      parts.push(`${seconds}s`);
    }
    return parts.slice(0, 2).join(" ");
  }
}

if (!customElements.get("ht-room-explainability")) {
  customElements.define("ht-room-explainability", HtRoomExplainability);
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-room-explainability": HtRoomExplainability;
  }
}
