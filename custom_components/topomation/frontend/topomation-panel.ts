// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, LocationType } from "./types";
import { sharedStyles } from "./styles";

import "./ht-location-tree";
import "./ht-location-inspector";
import "./ht-location-dialog";
import "./ht-rule-dialog";

type ManagerView = "location" | "occupancy" | "actions";

console.log("[topomation-panel] module loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
// This keeps iteration fast in the mock harness without leaving stale component definitions.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

/**
 * Main Topomation panel
 * Two-column layout: tree on left, inspector on right
 */
// @customElement("topomation-panel")
export class TopomationPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;
  @property({ attribute: false }) public panel?: { config?: { topomation_view?: ManagerView } };
  @property({ attribute: false }) public route?: { path?: string };

  // CRITICAL: Explicit static properties for Vite dev mode compatibility
  static properties = {
    hass: { attribute: false },
    narrow: { attribute: false },
    panel: { attribute: false },
    route: { attribute: false },
    // Internal state
    _locations: { state: true },
    _locationsVersion: { state: true },
    _selectedId: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _pendingChanges: { state: true },
    _saving: { state: true },
    _discarding: { state: true },
    _locationDialogOpen: { state: true },
    _ruleDialogOpen: { state: true },
    _editingLocation: { state: true },
    _editingRule: { state: true },
    _ruleDialogDefaultTriggerType: { state: true },
    _renameConflict: { state: true },
    _newLocationDefaults: { state: true },
    _eventLogOpen: { state: true },
    _eventLogEntries: { state: true },
    _occupancyStateByLocation: { state: true },
  };

  @state() private _locations: Location[] = [];
  @state() private _locationsVersion = 0; // bump to force tree rerender when data changes
  @state() private _selectedId?: string;
  @state() private _loading = true;
  @state() private _error?: string;
  @state() private _pendingChanges = new Map<string, {
    type: 'update' | 'delete' | 'create',
    original?: Location,
    updated: Partial<Location>
  }>();
  @state() private _saving = false;
  @state() private _discarding = false;
  @state() private _locationDialogOpen = false;
  @state() private _ruleDialogOpen = false;
  @state() private _editingLocation?: Location;
  @state() private _editingRule?: any;
  @state() private _ruleDialogDefaultTriggerType?: "occupied" | "vacant";
  @state() private _renameConflict?: {
    locationId: string;
    localName: string;
    haName: string;
  };
  @state() private _eventLogOpen = false;
  @state() private _eventLogScope: "subtree" | "all" = "subtree";
  @state() private _eventLogEntries: Array<{
    ts: string;
    type: string;
    message: string;
    data?: any;
  }> = [];
  @state() private _occupancyStateByLocation: Record<string, boolean> = {};

  private _hasLoaded = false;
  private _pendingLoadTimer?: number;
  private _unsubUpdates?: () => void;
  private _unsubStateChanged?: () => void;
  private _unsubOccupancyChanged?: () => void;
  @state() private _newLocationDefaults?: { parentId?: string; type?: LocationType };
  private _loadSeq = 0;
  private _reloadTimer?: number;
  private _opQueueByLocationId = new Map<string, Promise<void>>();

  private _enqueueLocationOp(locationId: string, op: () => Promise<void>): Promise<void> {
    const prev = this._opQueueByLocationId.get(locationId) ?? Promise.resolve();
    const next = prev
      .catch(() => {
        // swallow prior error to keep queue moving
      })
      .then(op);
    this._opQueueByLocationId.set(locationId, next);
    return next;
  }

  private _scheduleReload(silent = true): void {
    if (this._reloadTimer) {
      window.clearTimeout(this._reloadTimer);
      this._reloadTimer = undefined;
    }
    this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = undefined;
      this._loadLocations(silent);
    }, 150);
  }

  constructor() {
    super();
    console.log("TopomationPanel constructed");
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (!this._hasLoaded && this.hass) {
      this._hasLoaded = true;
      console.log("Hass available, loading locations...");
      this._loadLocations();
    }

    if (changedProps.has("hass") && this.hass) {
      this._subscribeToUpdates();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    console.log("TopomationPanel connected");
    this._scheduleInitialLoad();

    // Keyboard shortcuts
    this._handleKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);

    if (this._pendingLoadTimer) {
      clearTimeout(this._pendingLoadTimer);
      this._pendingLoadTimer = undefined;
    }

    // Clean up subscriptions
    if (this._unsubUpdates) {
      this._unsubUpdates();
      this._unsubUpdates = undefined;
    }
    if (this._unsubStateChanged) {
      this._unsubStateChanged();
      this._unsubStateChanged = undefined;
    }
    if (this._unsubOccupancyChanged) {
      this._unsubOccupancyChanged();
      this._unsubOccupancyChanged = undefined;
    }
  }

  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/history/2026.02.24-frontend-patterns.md Section 1.1
   */
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    // Always update for any change that is not solely a hass refresh.
    // (We aggressively filter hass-only updates for performance, but we must never
    // accidentally drop local UI state updates like dialog open/close.)
    for (const prop of changedProps.keys()) {
      if (prop !== "hass") return true;
    }

    // For hass updates, only re-render if areas registry changed
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (!oldHass) return true;

      // Check if area registry changed (used for initial data load)
      if (oldHass.areas !== this.hass.areas) {
        return true;
      }

      // hass changed but nothing we care about changed
      return false;
    }

    return true;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      /* Tree Panel ~40% (min 300px) - from docs/history/2026.02.24-ui-design.md Section 2.1 */
      .panel-left {
        flex: 0 0 40%;
        min-width: 300px;
        max-width: 500px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
          min-width: 280px;
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
          min-width: unset;
          max-width: unset;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .property-context {
        margin: var(--spacing-md) var(--spacing-md) 0;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.07);
      }

      .property-context-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .property-context-name {
        margin-top: 4px;
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .property-context-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .empty-state-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 0 4px 4px 0;
      }

      .empty-state-banner ha-icon {
        flex-shrink: 0;
        color: var(--primary-color);
      }

      .empty-state-banner-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--primary-text-color);
      }

      .empty-state-banner .button {
        flex-shrink: 0;
        text-decoration: none;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `,
  ];

  protected render() {
    if (this._loading && !this._locations.length) {
      return html`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    }

    const selectedLocation = this._locations.find(
      (loc) => loc.id === this._selectedId
    );
    const managerView = this._managerView();
    const managerHeader = this._managerHeader(managerView);
    const forcedInspectorTab = managerView === "location" ? undefined : managerView;
    const rightHeaderTitle =
      managerView === "occupancy"
        ? "Occupancy"
        : managerView === "actions"
          ? "Actions"
          : "Location";
    const rightHeaderSubtitle = selectedLocation
      ? `${selectedLocation.name} · ${selectedLocation.id}`
      : "Select a location to configure modules";
    const canCreateStructure = true;
    const deleteDisabledReason = this._deleteDisabledReason(selectedLocation);

    return html`
      <div class="panel-container">
        <div class="panel-left">
          ${this._renderPropertyContext()}
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${managerHeader.title}</div>
            <div class="header-subtitle">
              ${managerHeader.subtitle}
            </div>
            <div class="header-actions">
              ${canCreateStructure
                ? html`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `
                : ""}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${deleteDisabledReason}
              >
                Delete Selected
              </button>
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${false}
            .allowMove=${true}
            .allowRename=${true}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-move-blocked=${this._handleLocationMoveBlocked}
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${rightHeaderTitle}</div>
            <div class="header-subtitle">${rightHeaderSubtitle}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${selectedLocation}
            .forcedTab=${forcedInspectorTab}
            @add-rule=${this._handleAddRule}
            @source-test=${this._handleSourceTest}
          ></ht-location-inspector>
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }

  private _renderPropertyContext() {
    const config = (this.hass as any)?.config;
    if (!config) return "";

    const locationName = String(config.location_name || "Home Assistant Property").trim();
    const latitude = typeof config.latitude === "number" ? config.latitude : undefined;
    const longitude = typeof config.longitude === "number" ? config.longitude : undefined;
    const timezone = config.time_zone ? String(config.time_zone) : "";
    const country = config.country ? String(config.country) : "";

    const metaParts: string[] = [];
    if (latitude !== undefined && longitude !== undefined) {
      metaParts.push(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
    if (timezone) {
      metaParts.push(timezone);
    }
    if (country) {
      metaParts.push(country);
    }

    return html`
      <div class="property-context">
        <div class="property-context-title">Property</div>
        <div class="property-context-name">${locationName}</div>
        ${metaParts.length
          ? html`<div class="property-context-meta">${metaParts.join(" · ")}</div>`
          : ""}
      </div>
    `;
  }

  private _managerViewFromPath(path: string): ManagerView {
    if (path.startsWith("/topomation-occupancy")) return "occupancy";
    if (path.startsWith("/topomation-actions")) return "actions";
    return "location";
  }

  private _managerView(): ManagerView {
    const configuredView = this.panel?.config?.topomation_view;
    if (
      configuredView === "location" ||
      configuredView === "occupancy" ||
      configuredView === "actions"
    ) {
      return configuredView;
    }
    if (this.route?.path) {
      return this._managerViewFromPath(this.route.path);
    }
    return this._managerViewFromPath(window.location.pathname || "");
  }

  private _managerHeader(view: ManagerView): { title: string; subtitle: string } {
    if (view === "occupancy") {
      return {
        title: "Occupancy Manager",
        subtitle:
          "Locations are synced from Home Assistant Areas/Floors. Configure occupancy sources and timeout behavior here.",
      };
    }
    if (view === "actions") {
      return {
        title: "Actions Manager",
        subtitle:
          "Locations are synced from Home Assistant Areas/Floors. Configure occupancy-driven Home Assistant automations here.",
      };
    }
    return {
      title: "Topomation",
      subtitle:
        "Manage locations and hierarchy here. Floors, areas, buildings, grounds, and subareas can all be created here.",
    };
  }

  private _renderDialogs() {
    const selectedLocation = this._getSelectedLocation();

    return html`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
        .defaultParentId=${this._newLocationDefaults?.parentId}
        .defaultType=${this._newLocationDefaults?.type}
        @dialog-closed=${() => {
          console.log("[Panel] Dialog closed event received");
          this._locationDialogOpen = false;
          this._editingLocation = undefined;
          this._newLocationDefaults = undefined;
        }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>

      <ht-rule-dialog
        .hass=${this.hass}
        .open=${this._ruleDialogOpen}
        .location=${selectedLocation}
        .rule=${this._editingRule}
        .defaultTriggerType=${this._ruleDialogDefaultTriggerType}
        @dialog-closed=${() => {
          this._ruleDialogOpen = false;
          this._editingRule = undefined;
          this._ruleDialogDefaultTriggerType = undefined;
        }}
        @rule-saved=${this._handleRuleSaved}
      ></ht-rule-dialog>
    `;
  }

  private async _loadLocations(silent = false): Promise<void> {
    const seq = ++this._loadSeq;
    const skipSpinner = silent || this._locations.length > 0;
    this._loading = !skipSpinner;
    this._error = undefined;

    try {
      if (!this.hass) {
        throw new Error("Home Assistant connection not ready");
      }

      console.log("Calling WebSocket API: topomation/locations/list");
      console.log("hass.callWS available:", typeof this.hass.callWS);

      const result = await Promise.race([
        this.hass.callWS<{ locations: Location[] }>({
          type: "topomation/locations/list",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout loading locations")), 8000)
        ),
      ]);

      console.log("WebSocket result:", result);
      const response = result as { locations?: Location[] };
      if (!response || !response.locations) {
        throw new Error("Invalid response format: missing locations array");
      }

      // Prevent out-of-order loads from reverting UI state when rapid updates occur.
      if (seq !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq, current: this._loadSeq });
        return;
      }

      // Defensive: collapse any duplicate IDs to prevent UI duplication if backend ever misbehaves.
      const byId = new Map<string, Location>();
      for (const loc of response.locations) byId.set(loc.id, loc);
      const uniqueLocations = Array.from(byId.values());
      if (uniqueLocations.length !== response.locations.length) {
        console.warn("[Panel] Deduped locations from backend", {
          before: response.locations.length,
          after: uniqueLocations.length,
        });
      }
      const visibleLocations = uniqueLocations.filter((loc) => !loc.is_explicit_root);
      if (visibleLocations.length !== uniqueLocations.length) {
        console.log("[Panel] Hidden explicit root locations from manager tree", {
          hidden: uniqueLocations.length - visibleLocations.length,
        });
      }
      this._locations = [...visibleLocations];
      this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates();
      this._locationsVersion += 1;
      console.log("Loaded locations:", this._locations.length, this._locations);
      this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length,
      });

      // Keep selection valid against the visible/non-root subset.
      if (
        !this._selectedId ||
        !this._locations.some((loc) => loc.id === this._selectedId)
      ) {
        this._selectedId = this._locations[0]?.id;
      }
    } catch (err: any) {
      console.error("Failed to load locations:", err);
      this._error = err.message || "Failed to load locations";
      this._logEvent("error", "locations/list failed", err?.message || err);
    } finally {
      this._loading = false;
      this.requestUpdate(); // Force re-render
    }
  }

  private _scheduleInitialLoad(): void {
    if (this._hasLoaded) return;
    if (this.hass) {
      this._hasLoaded = true;
      console.log("Hass available, loading locations...");
      this._loadLocations();
      return;
    }
    // hass not yet injected; try again shortly
    this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
  }

  private _handleLocationSelected(e: CustomEvent): void {
    this._selectedId = e.detail.locationId;
  }

  /**
   * Render rename conflict notification banner
   */
  private _renderEmptyStateBanner() {
    const nav = (this.hass as any)?.navigate;
    const openSettings = (e: Event) => {
      e.preventDefault();
      if (typeof nav === "function") {
        nav("/config/areas");
      } else {
        window.location.href = "/config/areas";
      }
    };

    return html`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${openSettings}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }

  private _renderConflictBanner() {
    if (!this._renameConflict) {
      return "";
    }

    const { locationId, localName, haName } = this._renameConflict;
    const location = this._locations.find(loc => loc.id === locationId);

    return html`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${location?.name || locationId}" was renamed in Home Assistant to "${haName}".
            Your local name is "${localName}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }

  private _handleConflictKeepLocal() {
    if (!this._renameConflict) return;

    const { locationId, localName } = this._renameConflict;
    console.log(`[Panel] Keeping local name "${localName}" for location ${locationId}`);

    // In a real implementation, this would update HA with the local name
    // For now, just dismiss the conflict
    this._renameConflict = undefined;
  }

  private _handleConflictAcceptHA() {
    if (!this._renameConflict) return;

    const { locationId, haName } = this._renameConflict;
    console.log(`[Panel] Accepting HA name "${haName}" for location ${locationId}`);

    // Update the local location with HA's name
    const location = this._locations.find(loc => loc.id === locationId);
    if (location) {
      location.name = haName;
      this._locations = [...this._locations]; // Trigger reactivity
    }

    this._renameConflict = undefined;
  }

  private _handleConflictDismiss() {
    console.log('[Panel] Dismissing rename conflict');
    this._renameConflict = undefined;
  }

  private _handleNewLocation = (e?: Event): void => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this._editingLocation = undefined;
    this._newLocationDefaults = {
      parentId: null,
      type: "building",
    };
    this._locationDialogOpen = true;
  }

  private _handleLocationCreate(): void {
    this._handleNewLocation();
  }

  private _canDeleteLocation(location: Location | undefined): boolean {
    if (!location) return false;
    if (location.is_explicit_root) return false;
    return true;
  }

  private _deleteDisabledReason(location: Location | undefined): string {
    if (!location) return "Select a location to delete";
    if (location.is_explicit_root) return "Home root cannot be deleted";
    return "Delete selected location";
  }

  private _handleDeleteSelected = (e?: Event): void => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const location = this._getSelectedLocation();
    if (!location) {
      this._showToast("Select a location to delete", "warning");
      return;
    }
    if (!this._canDeleteLocation(location)) {
      this._showToast(this._deleteDisabledReason(location), "warning");
      return;
    }
    if (!confirm(`Delete "${location.name}"?`)) {
      return;
    }
    void this._handleLocationDelete(
      new CustomEvent("location-delete", {
        detail: { location },
      })
    );
  }

  private _handleLocationEdit(e: CustomEvent): void {
    e.stopPropagation();
    const locationId = e?.detail?.locationId as string | undefined;
    const location = locationId
      ? this._locations.find((loc) => loc.id === locationId)
      : this._getSelectedLocation();
    if (!location) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = location;
    this._newLocationDefaults = undefined;
    this._locationDialogOpen = true;
  }

  private async _handleLocationMoved(e: CustomEvent): Promise<void> {
    e.stopPropagation();
    const { locationId, newParentId, newIndex } = e.detail || {};
    if (!locationId || typeof newIndex !== "number") {
      this._showToast("Invalid move request", "error");
      return;
    }

    await this._enqueueLocationOp(locationId, async () => {
      try {
        await this.hass.callWS({
          type: "topomation/locations/reorder",
          location_id: locationId,
          new_parent_id: newParentId ?? null,
          new_index: newIndex,
        });
        await this._loadLocations(true);
        this._locationsVersion += 1;
      } catch (error: any) {
        console.error("Failed to move location:", error);
        this._showToast(error?.message || "Failed to move location", "error");
      }
    });
  }

  private _handleLocationMoveBlocked(e: CustomEvent): void {
    e.stopPropagation();
    const reason = e?.detail?.reason;
    this._showToast(
      typeof reason === "string" && reason.trim()
        ? reason
        : "That move is not allowed for this location.",
      "warning"
    );
  }

  private async _handleLocationLockToggle(e: CustomEvent): Promise<void> {
    e.stopPropagation();
    const locationId = e?.detail?.locationId as string | undefined;
    const lock = Boolean(e?.detail?.lock);
    if (!locationId) {
      this._showToast("Invalid lock request", "error");
      return;
    }

    await this._enqueueLocationOp(locationId, async () => {
      try {
        const service = lock ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service,
          service_data: {
            location_id: locationId,
            source_id: "manual_ui",
          },
        });
        this._logEvent("ui", service, { locationId, source_id: "manual_ui" });
        await this._loadLocations(true);
        this._locationsVersion += 1;
        const locationName = this._locations.find((loc) => loc.id === locationId)?.name || locationId;
        this._showToast(`${lock ? "Locked" : "Unlocked"} "${locationName}"`, "success");
      } catch (error: any) {
        console.error("Failed to toggle lock:", error);
        this._showToast(error?.message || "Failed to update lock", "error");
      }
    });
  }

  private async _handleLocationRenamed(e: CustomEvent): Promise<void> {
    e.stopPropagation();
    const { locationId, newName } = e.detail || {};
    if (!locationId || !newName) {
      this._showToast("Invalid rename request", "error");
      return;
    }

    await this._enqueueLocationOp(locationId, async () => {
      try {
        await this.hass.callWS({
          type: "topomation/locations/update",
          location_id: locationId,
          changes: { name: String(newName) },
        });
        await this._loadLocations(true);
        this._locationsVersion += 1;
        this._showToast(`Renamed to "${newName}"`, "success");
      } catch (error: any) {
        console.error("Failed to rename location:", error);
        this._showToast(error?.message || "Failed to rename location", "error");
      }
    });
  }

  private async _handleLocationDelete(e: CustomEvent): Promise<void> {
    e.stopPropagation();
    const location = e?.detail?.location as Location | undefined;
    if (!location?.id) {
      this._showToast("Invalid delete request", "error");
      return;
    }
    if (location.is_explicit_root) {
      this._showToast("Home root cannot be deleted", "warning");
      return;
    }

    await this._enqueueLocationOp(location.id, async () => {
      try {
        const selectedWasDeleted = this._selectedId === location.id;
        const deletedParentId = location.parent_id ?? undefined;

        await this.hass.callWS({
          type: "topomation/locations/delete",
          location_id: location.id,
        });

        await this._loadLocations(true);
        this._locationsVersion += 1;

        if (selectedWasDeleted) {
          const fallbackId =
            (deletedParentId && this._locations.some((loc) => loc.id === deletedParentId)
              ? deletedParentId
              : this._locations[0]?.id) ?? undefined;
          this._selectedId = fallbackId;
        }

        this._showToast(`Deleted "${location.name}"`, "success");
      } catch (error: any) {
        console.error("Failed to delete location:", error);
        this._showToast(error?.message || "Failed to delete location", "error");
      }
    });
  }

  private async _handleLocationDialogSaved(e: CustomEvent): Promise<void> {
    const locationData = e.detail;
    console.log("Location saved from dialog", locationData);

    // Dialog already called the WebSocket API, just reload locations
    const wasEditing = !!this._editingLocation;
    try {
      await this._loadLocations(true);
      this._locationsVersion += 1;
      this._locationDialogOpen = false;
      this._editingLocation = undefined;
      this._showToast(
        wasEditing
          ? `Updated "${locationData.name}"`
          : `Created "${locationData.name}"`,
        'success'
      );
    } catch (error: any) {
      console.error("Failed to reload locations:", error);
      this._showToast(`Failed to reload: ${error.message}`, 'error');
    }
  }

  private _handleAddRule(e?: CustomEvent): void {
    const requestedTrigger = e?.detail?.trigger_type;
    this._ruleDialogDefaultTriggerType = requestedTrigger === "vacant" ? "vacant" : "occupied";
    this._editingRule = undefined;
    this._ruleDialogOpen = true;
  }

  private async _handleRuleSaved(e: CustomEvent): Promise<void> {
    const { rule } = e.detail;
    console.log("Rule saved", rule);

    this._showToast(`Automation "${rule.name}" saved`, 'success');
    await this._loadLocations(true);
    this._ruleDialogOpen = false;
    this._editingRule = undefined;
    this._ruleDialogDefaultTriggerType = undefined;
  }

  private _handleKeyDown = (e: KeyboardEvent): void => {
    // Ctrl+S (or Cmd+S) - Save changes
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (this._pendingChanges.size > 0 && !this._saving) {
        this._handleSaveChanges();
      }
    }

    // Ctrl+Z (or Cmd+Z) - Undo (future implementation)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // TODO: Implement undo
      console.log('Undo requested');
    }

    // Ctrl+Shift+Z or Ctrl+Y - Redo (future implementation)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      // TODO: Implement redo
      console.log('Redo requested');
    }

    // Escape - Discard pending changes
    if (e.key === 'Escape' && this._pendingChanges.size > 0 && !this._saving) {
      if (confirm('Discard all pending changes?')) {
        this._handleDiscardChanges();
      }
    }

    // ? - Show keyboard shortcuts help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      this._showKeyboardShortcutsHelp();
    }
  };

  private async _subscribeToUpdates(): Promise<void> {
    if (!this.hass || !this.hass.connection) return;

    // Clean up any prior subscription
    if (this._unsubUpdates) {
      this._unsubUpdates();
      this._unsubUpdates = undefined;
    }
    if (this._unsubStateChanged) {
      this._unsubStateChanged();
      this._unsubStateChanged = undefined;
    }
    if (this._unsubOccupancyChanged) {
      this._unsubOccupancyChanged();
      this._unsubOccupancyChanged = undefined;
    }

    try {
      this._unsubUpdates = await this.hass.connection.subscribeEvents(
        (event: any) => {
          this._logEvent("ha", "topomation_updated", event?.data || {});
          this._scheduleReload(true);
        },
        "topomation_updated"
      );
    } catch (err) {
      console.warn("Failed to subscribe to topomation_updated events", err);
      this._logEvent("error", "subscribe failed: topomation_updated", String(err));
    }

    try {
      this._unsubStateChanged = await this.hass.connection.subscribeEvents(
        (event: any) => {
          const entityId = event?.data?.entity_id;
          if (!entityId) return;

          const newStateObj = event?.data?.new_state;
          const attrs = newStateObj?.attributes || {};
          if (
            entityId.startsWith("binary_sensor.") &&
            attrs.device_class === "occupancy" &&
            attrs.location_id
          ) {
            this._setOccupancyState(attrs.location_id, newStateObj?.state === "on");
          }

          if (!this._shouldTrackEntity(entityId)) return;
          const newState = event?.data?.new_state?.state;
          const oldState = event?.data?.old_state?.state;
          this._logEvent("ha", "state_changed", { entityId, oldState, newState });
        },
        "state_changed"
      );
    } catch (err) {
      console.warn("Failed to subscribe to state_changed events", err);
      this._logEvent("error", "subscribe failed: state_changed", String(err));
    }

    try {
      this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
        (event: any) => {
          const locationId = event?.data?.location_id;
          const occupied = event?.data?.occupied;
          if (!locationId || typeof occupied !== "boolean") return;
          this._setOccupancyState(locationId, occupied);
          this._logEvent("ha", "topomation_occupancy_changed", { locationId, occupied });
        },
        "topomation_occupancy_changed"
      );
    } catch (err) {
      console.warn("Failed to subscribe to topomation_occupancy_changed events", err);
      this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(err));
    }
  }

  private _setOccupancyState(locationId: string, occupied: boolean): void {
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [locationId]: occupied,
    };
  }

  private _buildOccupancyStateMapFromStates(): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    const states = this.hass?.states || {};
    for (const state of Object.values(states) as any[]) {
      const attrs = state?.attributes || {};
      if (attrs?.device_class !== "occupancy") continue;
      const locationId = attrs.location_id;
      if (!locationId) continue;
      map[locationId] = state?.state === "on";
    }
    return map;
  }

  private _toggleEventLog = (): void => {
    this._eventLogOpen = !this._eventLogOpen;
  };

  private _clearEventLog = (): void => {
    this._eventLogEntries = [];
  };

  private _renderEventLog() {
    return html`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0
            ? html`<div class="event-log-item event-log-meta">No events captured yet.</div>`
            : this._eventLogEntries.map(
                (entry) => html`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${entry.ts}] ${entry.type}</div>
                    <div>${entry.message}</div>
                    ${entry.data !== undefined
                      ? html`<div class="event-log-meta">${this._safeStringify(entry.data)}</div>`
                      : ""}
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }

  private _handleSourceTest = (e: CustomEvent): void => {
    this._logEvent("ui", "source test", e.detail);
  };

  private _shouldTrackEntity(entityId: string): boolean {
    if (this._eventLogScope === "all") {
      return this._isTrackedEntity(entityId);
    }
    return this._isTrackedEntityInSelectedSubtree(entityId);
  }

  private _isTrackedEntity(entityId: string): boolean {
    const tracked = new Set<string>();
    for (const location of this._locations) {
      for (const entity of location.entity_ids || []) tracked.add(entity);
      const sources = location.modules?.occupancy?.occupancy_sources || [];
      for (const source of sources) tracked.add(source.entity_id);
    }
    return tracked.has(entityId);
  }

  private _isTrackedEntityInSelectedSubtree(entityId: string): boolean {
    const subtreeIds = this._getSelectedSubtreeLocationIds();
    if (subtreeIds.size === 0) return false;

    for (const location of this._locations) {
      if (!subtreeIds.has(location.id)) continue;
      if ((location.entity_ids || []).includes(entityId)) return true;
      const sources = location.modules?.occupancy?.occupancy_sources || [];
      if (sources.some((source: any) => source.entity_id === entityId)) return true;
    }
    return false;
  }

  private _getSelectedSubtreeLocationIds(): Set<string> {
    const ids = new Set<string>();
    if (!this._selectedId) return ids;
    ids.add(this._selectedId);

    let added = true;
    while (added) {
      added = false;
      for (const loc of this._locations) {
        if (loc.parent_id && ids.has(loc.parent_id) && !ids.has(loc.id)) {
          ids.add(loc.id);
          added = true;
        }
      }
    }
    return ids;
  }

  private _toggleEventLogScope = (): void => {
    this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree";
    this._logEvent(
      "ui",
      `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
    );
  };

  private _getEventLogScopeLabel(): string {
    if (this._eventLogScope === "all") return "all locations";
    const selected = this._locations.find((loc) => loc.id === this._selectedId);
    if (!selected) return "selected subtree";
    const count = this._getSelectedSubtreeLocationIds().size;
    return `${selected.name} subtree (${count} locations)`;
  }

  private _safeStringify(data: any): string {
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }

  private _logEvent(type: string, message: string, data?: any): void {
    const entry = {
      ts: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    this._eventLogEntries = [entry, ...this._eventLogEntries].slice(0, 200);
  }

  private _showKeyboardShortcutsHelp(): void {
    const shortcuts = [
      { key: 'Drag', description: 'Move location in hierarchy (tree handle)' },
      { key: '?', description: 'Show this help' }
    ];

    const message = shortcuts.map(s => `${s.key}: ${s.description}`).join('\n');
    alert(`Keyboard Shortcuts:\n\n${message}`);
  }

  private _getSelectedLocation(): Location | undefined {
    if (!this._selectedId) return undefined;
    return this._locations.find((loc) => loc.id === this._selectedId);
  }

  /**
   * Batch save all pending changes
   * See: docs/history/2026.02.24-frontend-patterns.md Section 13.2
   */
  private async _handleSaveChanges(): Promise<void> {
    if (this._pendingChanges.size === 0 || this._saving) return;

    this._saving = true;
    const changes = Array.from(this._pendingChanges.entries());
    const results = await Promise.allSettled(
      changes.map(([id, change]) => this._saveChange(id, change))
    );

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length === 0) {
      // All saved successfully
      this._pendingChanges.clear();
      this._showToast('All changes saved successfully', 'success');
    } else if (failures.length < results.length) {
      // Partial failure
      this._showToast(`Saved ${results.length - failures.length} changes, ${failures.length} failed`, 'warning');
      // Remove successful changes from pending
      changes.forEach(([id, _], idx) => {
        if (results[idx].status === 'fulfilled') {
          this._pendingChanges.delete(id);
        }
      });
    } else {
      // All failed
      this._showToast('Failed to save changes', 'error');
    }

    this._saving = false;
    await this._loadLocations(); // Reload to sync with server
  }

  /**
   * Discard all pending changes and reload from server.
   */
  private async _handleDiscardChanges(): Promise<void> {
    if (this._pendingChanges.size === 0 || this._discarding) return;
    this._discarding = true;
    this._pendingChanges.clear();
    await this._loadLocations(true);
    this._discarding = false;
  }

  private async _saveChange(id: string, change: {
    type: 'update' | 'delete' | 'create',
    original?: Location,
    updated: Partial<Location>
  }): Promise<void> {
    switch (change.type) {
      case 'update':
        await this.hass.callWS({
          type: 'topomation/locations/update',
          location_id: id,
          changes: change.updated
        });
        break;
      case 'delete':
        await this.hass.callWS({
          type: 'topomation/locations/delete',
          location_id: id
        });
        break;
      case 'create':
        await this.hass.callWS({
          type: 'topomation/locations/create',
          ...change.updated
        });
        break;
    }
  }

  private _showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Use HA's notification system via custom event
    const event = new CustomEvent("hass-notification", {
      detail: {
        message,
        type: type === 'error' ? 'error' : undefined,
        duration: type === 'error' ? 5000 : 3000,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);

    // Fallback log for debugging
    console.log(`[Toast:${type}] ${message}`);
  }

  private async _seedDemoData(): Promise<void> {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
}

if (!customElements.get("topomation-panel")) {
  try {
    console.log("[topomation-panel] registering custom element");
    customElements.define("topomation-panel", TopomationPanel);
  } catch (err) {
    console.error("[topomation-panel] failed to define element", err);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "topomation-panel": TopomationPanel;
  }

  interface HASSDomEvents {
    "location-selected": { locationId: string };
    "location-create": {};
  }
}
