// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AdjacencyEdge,
  HandoffTrace,
  HomeAssistant,
  Location,
  LocationType,
} from "./types";
import { sharedStyles } from "./styles";
import { getLocationType } from "./hierarchy-rules";
import { isSystemShadowLocation, managedShadowLocationIdSet } from "./shadow-location-utils";

import "./ht-location-tree";
import "./ht-location-inspector";
import "./ht-location-dialog";

type ManagerView =
  | "location"
  | "occupancy"
  | "appliances"
  | "media"
  | "hvac";
type RightPanelMode = "inspector" | "assign";
type AssignmentFilter = "all" | "unassigned" | "assigned";
type OccupancyTransitionState = {
  occupied: boolean;
  previousOccupied?: boolean;
  reason?: string;
  changedAt?: string;
};

const TREE_PANEL_SPLIT_STORAGE_KEY = "topomation:panel-tree-split";
const RIGHT_PANEL_MODE_STORAGE_KEY = "topomation:panel-right-mode";
const TREE_PANEL_SPLIT_DEFAULT = 0.4;
const TREE_PANEL_SPLIT_MIN = 0.25;
const TREE_PANEL_SPLIT_MAX = 0.75;
const ENTITY_DND_MIME = "application/x-topomation-entity-id";

type DeviceGroup = {
  key: string;
  label: string;
  type: "unassigned" | "area" | "subarea" | "floor" | "building" | "grounds" | "other";
  locationId?: string;
  entities: string[];
};

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
  @property({ attribute: false }) public panel?: {
    config?: { topomation_view?: ManagerView; entry_id?: string };
  };
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
    _editingLocation: { state: true },
    _renameConflict: { state: true },
    _newLocationDefaults: { state: true },
    _eventLogOpen: { state: true },
    _eventLogEntries: { state: true },
    _occupancyStateByLocation: { state: true },
    _occupancyTransitionByLocation: { state: true },
    _adjacencyEdges: { state: true },
    _handoffTraceByLocation: { state: true },
    _treePanelSplit: { state: true },
    _isResizingPanels: { state: true },
    _entityAreaById: { state: true },
    _entitySearch: { state: true },
    _assignBusyByEntityId: { state: true },
    _rightPanelMode: { state: true },
    _assignmentFilter: { state: true },
    _deviceGroupExpanded: { state: true },
    _haRegistryRevision: { state: true },
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
  @state() private _editingLocation?: Location;
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
  @state() private _occupancyTransitionByLocation: Record<string, OccupancyTransitionState> = {};
  @state() private _adjacencyEdges: AdjacencyEdge[] = [];
  @state() private _handoffTraceByLocation: Record<string, HandoffTrace[]> = {};
  @state() private _treePanelSplit = TREE_PANEL_SPLIT_DEFAULT;
  @state() private _isResizingPanels = false;
  @state() private _entityAreaById: Record<string, string | null> = {};
  @state() private _entitySearch = "";
  @state() private _assignBusyByEntityId: Record<string, boolean> = {};
  @state() private _rightPanelMode: RightPanelMode = "inspector";
  @state() private _assignmentFilter: AssignmentFilter = "all";
  @state() private _deviceGroupExpanded: Record<string, boolean> = {};
  @state() private _haRegistryRevision = 0;

  private _hasLoaded = false;
  private _pendingLoadTimer?: number;
  private _unsubUpdates?: () => void;
  private _unsubStateChanged?: () => void;
  private _unsubOccupancyChanged?: () => void;
  private _unsubHandoffTrace?: () => void;
  private _unsubActionsSummary?: () => void;
  private _unsubEntityRegistryUpdated?: () => void;
  private _unsubDeviceRegistryUpdated?: () => void;
  private _unsubAreaRegistryUpdated?: () => void;
  @state() private _newLocationDefaults?: { parentId?: string; type?: LocationType };
  private _loadSeq = 0;
  private _reloadTimer?: number;
  private _registryRefreshTimer?: number;
  private _entityAreaIndexLoaded = false;
  private _entityAreaIndexPromise?: Promise<void>;
  private _entityAreaRevision = 0;
  private _deviceGroupsCacheKey?: string;
  private _deviceGroupsCache: DeviceGroup[] = [];
  private _lastKnownEntryId?: string;
  private _opQueueByLocationId = new Map<string, Promise<void>>();
  private _panelResizePointerId?: number;

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
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (!this._hasLoaded && this.hass) {
      this._hasLoaded = true;
      this._loadLocations();
    }

    if (changedProps.has("hass") && this.hass) {
      this._subscribeToUpdates();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._restorePanelSplitPreference();
    this._restoreRightPanelModePreference();
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
    this._stopPanelSplitterDrag();

    if (this._pendingLoadTimer) {
      clearTimeout(this._pendingLoadTimer);
      this._pendingLoadTimer = undefined;
    }
    if (this._reloadTimer) {
      clearTimeout(this._reloadTimer);
      this._reloadTimer = undefined;
    }
    if (this._registryRefreshTimer) {
      clearTimeout(this._registryRefreshTimer);
      this._registryRefreshTimer = undefined;
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
    if (this._unsubHandoffTrace) {
      this._unsubHandoffTrace();
      this._unsubHandoffTrace = undefined;
    }
    if (this._unsubActionsSummary) {
      this._unsubActionsSummary();
      this._unsubActionsSummary = undefined;
    }
    if (this._unsubEntityRegistryUpdated) {
      this._unsubEntityRegistryUpdated();
      this._unsubEntityRegistryUpdated = undefined;
    }
    if (this._unsubDeviceRegistryUpdated) {
      this._unsubDeviceRegistryUpdated();
      this._unsubDeviceRegistryUpdated = undefined;
    }
    if (this._unsubAreaRegistryUpdated) {
      this._unsubAreaRegistryUpdated();
      this._unsubAreaRegistryUpdated = undefined;
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
        min-height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        --tree-panel-basis: 40%;
        display: flex;
        height: 100%;
        min-width: 0;
      }

      /* Tree Panel defaults to ~40%, now user-resizable via splitter */
      .panel-left {
        flex: 0 0 var(--tree-panel-basis);
        min-width: 300px;
        max-width: calc(100% - 410px);
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .panel-splitter {
        flex: 0 0 10px;
        position: relative;
        cursor: col-resize;
        touch-action: none;
        user-select: none;
      }

      .panel-splitter::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 4px;
        width: 2px;
        background: var(--divider-color);
        transition: background-color 0.15s ease;
      }

      .panel-splitter:hover::before,
      .panel-splitter.dragging::before,
      .panel-splitter:focus-visible::before {
        background: var(--primary-color);
      }

      .panel-splitter:focus-visible {
        outline: none;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          min-width: 280px;
          max-width: calc(100% - 310px);
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        :host {
          height: auto;
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .panel-container {
          flex-direction: column;
          height: auto;
        }

        .panel-left,
        .panel-right {
          flex: 0 0 auto;
          min-width: unset;
          max-width: unset;
          overflow: visible;
        }

        .panel-splitter {
          display: none;
        }

        ht-location-tree {
          flex: 0 0 auto;
          min-height: 200px;
          max-height: 52vh;
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

      .right-panel-modes {
        margin-top: var(--spacing-sm);
        display: flex;
        gap: 8px;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      ht-location-tree {
        flex: 1 1 auto;
        min-height: 0;
      }

      ht-location-inspector {
        flex: 1 1 auto;
        min-height: 0;
      }

      .device-assignment-panel {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0 var(--spacing-md) var(--spacing-md);
      }

      .device-panel-head {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--card-background-color);
        padding: var(--spacing-md) 0 var(--spacing-sm);
      }

      .device-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .device-panel-subtitle {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-search {
        width: 100%;
        margin-top: var(--spacing-sm);
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .device-toolbar {
        margin-top: var(--spacing-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-chip {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .device-group-actions {
        display: flex;
        gap: 6px;
      }

      .device-group {
        margin-top: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
      }

      .device-group-header {
        width: 100%;
        border: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.06);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        cursor: pointer;
        color: var(--primary-text-color);
        text-align: left;
      }

      .device-group-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }

      .device-group-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .device-group-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-group-chevron {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-group-count {
        color: var(--text-secondary-color);
        font-weight: 600;
        font-size: 11px;
      }

      .device-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 8px 10px;
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        background: var(--card-background-color);
      }

      .device-row[draggable="true"] {
        cursor: grab;
      }

      .device-row[draggable="true"]:active {
        cursor: grabbing;
      }

      .device-name {
        font-size: 13px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-assign-btn {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .device-empty {
        padding: 14px 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
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
    const rightHeaderTitle = "Automation";
    const canCreateStructure = true;
    const deleteDisabledReason = this._deleteDisabledReason(selectedLocation);
    const treePanelBasis = `${(this._treePanelSplit * 100).toFixed(1)}%`;

    return html`
      <div class="panel-container" style=${`--tree-panel-basis: ${treePanelBasis};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${managerHeader.title}</div>
            <div class="header-subtitle">
              ${managerHeader.subtitle}
            </div>
            <div class="header-actions">
              ${this._isSplitStackedLayout()
                ? html`
                    <button
                      class="button button-secondary"
                      @click=${this._handleOpenSidebar}
                      aria-label="Open Home Assistant sidebar"
                    >
                      Sidebar
                    </button>
                  `
                : ""}
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
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
            @entity-dropped=${this._handleEntityDropped}
          ></ht-location-tree>
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(TREE_PANEL_SPLIT_MIN * 100)}
          aria-valuemax=${Math.round(TREE_PANEL_SPLIT_MAX * 100)}
          aria-valuenow=${Math.round(this._treePanelSplit * 100)}
          tabindex="0"
          title="Drag to resize panes. Double-click to reset."
          @pointerdown=${this._handlePanelSplitterPointerDown}
          @keydown=${this._handlePanelSplitterKeyDown}
          @dblclick=${this._handlePanelSplitterReset}
        ></div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${rightHeaderTitle}</div>
            <div class="right-panel-modes" role="tablist" aria-label="Right panel mode">
              <button
                class="button ${this._rightPanelMode === "inspector" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "inspector"}
                data-testid="right-mode-configure"
                @click=${() => this._handleRightPanelModeChange("inspector")}
              >
                Configure
              </button>
              <button
                class="button ${this._rightPanelMode === "assign" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "assign"}
                data-testid="right-mode-assign"
                @click=${() => this._handleRightPanelModeChange("assign")}
              >
                Assign Devices
              </button>
            </div>
          </div>
          ${this._rightPanelMode === "assign"
            ? this._renderDeviceAssignmentPanel(selectedLocation)
            : html`
                <ht-location-inspector
                  .hass=${this.hass}
                  .location=${selectedLocation}
                  .allLocations=${this._locations}
                  .adjacencyEdges=${this._adjacencyEdges}
                  .entryId=${this._activeEntryId()}
                  .entityRegistryRevision=${this._haRegistryRevision}
                  .forcedTab=${forcedInspectorTab}
                  .occupancyStates=${this._occupancyStateByLocation}
                  .occupancyTransitions=${this._occupancyTransitionByLocation}
                  .handoffTraces=${selectedLocation
                    ? this._handoffTraceByLocation[selectedLocation.id] || []
                    : []}
                  @source-test=${this._handleSourceTest}
                  @adjacency-changed=${this._handleAdjacencyChanged}
                  @location-meta-changed=${this._handleLocationMetaChanged}
                ></ht-location-inspector>
              `}
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }

  private _managerViewFromPath(path: string): ManagerView {
    if (path.startsWith("/topomation-occupancy")) return "occupancy";
    if (path.startsWith("/topomation-appliances")) return "appliances";
    if (path.startsWith("/topomation-media")) return "media";
    if (path.startsWith("/topomation-hvac")) return "hvac";
    return "location";
  }

  private _managerView(): ManagerView {
    const configuredView = this.panel?.config?.topomation_view;
    if (
      configuredView === "location" ||
      configuredView === "occupancy" ||
      configuredView === "appliances" ||
      configuredView === "media" ||
      configuredView === "hvac"
    ) {
      return configuredView;
    }
    if (this.route?.path) {
      return this._managerViewFromPath(this.route.path);
    }
    return this._managerViewFromPath(window.location.pathname || "");
  }

  private _managerHeader(view: ManagerView): { title: string; subtitle: string } {
    return {
      title: "Topology",
      subtitle:
        "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation.",
    };
  }

  private _renderDialogs() {
    return html`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._parentSelectableLocations()}
        .entryId=${this._activeEntryId()}
        .defaultParentId=${this._newLocationDefaults?.parentId}
        .defaultType=${this._newLocationDefaults?.type}
        @dialog-closed=${() => {
          this._locationDialogOpen = false;
          this._editingLocation = undefined;
          this._newLocationDefaults = undefined;
        }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>
    `;
  }

  private async _ensureEntityAreaIndex(force = false): Promise<void> {
    if (!this.hass?.callWS) return;
    if (!force && this._entityAreaIndexLoaded) return;
    if (this._entityAreaIndexPromise) {
      await this._entityAreaIndexPromise;
      return;
    }

    this._entityAreaIndexPromise = (async () => {
      try {
        const [entityRegistry, deviceRegistry] = await Promise.all([
          this.hass.callWS<any[]>({ type: "config/entity_registry/list" }),
          this.hass.callWS<any[]>({ type: "config/device_registry/list" }),
        ]);

        const deviceAreaById = new Map<string, string>();
        if (Array.isArray(deviceRegistry)) {
          for (const device of deviceRegistry) {
            const deviceId = typeof device?.id === "string" ? device.id : undefined;
            const areaId = typeof device?.area_id === "string" ? device.area_id : undefined;
            if (deviceId && areaId) {
              deviceAreaById.set(deviceId, areaId);
            }
          }
        }

        const areaByEntityId: Record<string, string | null> = {};
        if (Array.isArray(entityRegistry)) {
          for (const entity of entityRegistry) {
            const entityId = typeof entity?.entity_id === "string" ? entity.entity_id : undefined;
            if (!entityId) continue;
            const explicitAreaId = typeof entity?.area_id === "string" ? entity.area_id : undefined;
            const inheritedAreaId =
              typeof entity?.device_id === "string"
                ? deviceAreaById.get(entity.device_id)
                : undefined;
            areaByEntityId[entityId] = explicitAreaId || inheritedAreaId || null;
          }
        }

        const previous = this._entityAreaById;
        const prevKeys = Object.keys(previous);
        const nextKeys = Object.keys(areaByEntityId);
        const changed =
          prevKeys.length !== nextKeys.length ||
          nextKeys.some((key) => previous[key] !== areaByEntityId[key]);

        if (changed) {
          this._entityAreaById = areaByEntityId;
          this._entityAreaRevision += 1;
        }
        this._entityAreaIndexLoaded = true;
      } catch (err) {
        // Non-admin or restricted installs may block registry endpoints; fallback to state attrs.
      }
    })();

    try {
      await this._entityAreaIndexPromise;
    } finally {
      this._entityAreaIndexPromise = undefined;
    }
  }

  private _renderDeviceAssignmentPanel(selectedLocation?: Location) {
    const loadingAreaIndex = !this._entityAreaIndexLoaded && !!this._entityAreaIndexPromise;
    const groups = this._buildDeviceGroups();
    const visibleGroups = this._prioritizeDeviceGroupsForSelection(
      this._visibleDeviceGroups(groups),
      selectedLocation?.id
    );
    const stats = this._assignmentFilterStats(groups);
    const targetLabel = selectedLocation ? selectedLocation.name : "Select a location";

    return html`
      <div class="device-assignment-panel">
        <div class="device-panel-head">
          <div class="device-panel-title">Device Assignment</div>
          <div class="device-panel-subtitle">
            Assign target: <strong>${targetLabel}</strong>
          </div>
          <input
            class="device-search"
            type="search"
            .value=${this._entitySearch}
            placeholder="Search devices..."
            @input=${this._handleDeviceSearch}
          />
          <div class="device-toolbar">
            <div class="device-filter-group">
              <button
                class="button ${this._assignmentFilter === "all" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("all")}
              >
                All (${stats.all})
              </button>
              <button
                class="button ${this._assignmentFilter === "unassigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("unassigned")}
              >
                Unassigned (${stats.unassigned})
              </button>
              <button
                class="button ${this._assignmentFilter === "assigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("assigned")}
              >
                Assigned (${stats.assigned})
              </button>
            </div>
            <div class="device-group-actions">
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(true, visibleGroups)}>
                Expand all
              </button>
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(false, visibleGroups)}>
                Collapse all
              </button>
            </div>
          </div>
        </div>
        ${loadingAreaIndex
          ? html`<div class="device-empty">Loading area mapping…</div>`
          : ""}

        ${visibleGroups.length === 0
          ? html`<div class="device-empty">No devices match the current filter.</div>`
          : visibleGroups.map((group) => this._renderDeviceGroup(group, selectedLocation?.id))}
      </div>
    `;
  }

  private _renderDeviceGroup(group: DeviceGroup, selectedLocationId?: string) {
    const expanded = this._isGroupExpanded(group.key);
    return html`
      <section class="device-group" data-testid=${`device-group-${group.key}`}>
        <button
          class="device-group-header"
          @click=${() => this._toggleDeviceGroup(group.key)}
          aria-expanded=${expanded}
          aria-label=${`Toggle ${group.label} devices`}
        >
          <span class="device-group-header-left">
            <span class="device-group-chevron">${expanded ? "▾" : "▸"}</span>
            <span class="device-group-label">${group.label}</span>
          </span>
          <span class="device-group-count">${group.entities.length}</span>
        </button>
        ${!expanded
          ? ""
          : group.entities.length === 0
          ? html`<div class="device-empty">No devices in this group.</div>`
          : group.entities.map((entityId) => {
              const busy = Boolean(this._assignBusyByEntityId[entityId]);
              const entityName = this._entityDisplayName(entityId);
              return html`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${entityId}
                  @dragstart=${(event: DragEvent) => this._handleDeviceDragStart(event, entityId)}
                >
                  <div>
                    <div class="device-name">${entityName}</div>
                    <div class="device-meta">${this._deviceMetaForGroup(entityId, group)}</div>
                  </div>
                  <button
                    class="button button-secondary device-assign-btn"
                    ?disabled=${!selectedLocationId || busy}
                    @click=${() => this._handleAssignButton(entityId, selectedLocationId)}
                  >
                    ${busy ? "Assigning..." : "Assign"}
                  </button>
                </div>
              `;
            })}
      </section>
    `;
  }

  private _handleDeviceSearch = (event: Event): void => {
    const value = (event.target as HTMLInputElement | null)?.value ?? "";
    this._entitySearch = value;
  };

  private _handleAssignmentFilterChange(filter: AssignmentFilter): void {
    this._assignmentFilter = filter;
  }

  private _assignmentFilterStats(groups: DeviceGroup[]): { all: number; unassigned: number; assigned: number } {
    const unassigned = groups
      .filter((group) => group.type === "unassigned")
      .reduce((sum, group) => sum + group.entities.length, 0);
    const assigned = groups
      .filter((group) => group.type !== "unassigned")
      .reduce((sum, group) => sum + group.entities.length, 0);
    return { all: unassigned + assigned, unassigned, assigned };
  }

  private _visibleDeviceGroups(groups: DeviceGroup[]): DeviceGroup[] {
    if (this._assignmentFilter === "all") return groups;
    if (this._assignmentFilter === "unassigned") {
      return groups.filter((group) => group.type === "unassigned");
    }
    return groups.filter((group) => group.type !== "unassigned");
  }

  private _prioritizeDeviceGroupsForSelection(
    groups: DeviceGroup[],
    selectedLocationId?: string
  ): DeviceGroup[] {
    if (!selectedLocationId || groups.length <= 1) return groups;
    const selectedIndex = groups.findIndex((group) => group.locationId === selectedLocationId);
    if (selectedIndex <= 0) return groups;
    const selected = groups[selectedIndex];
    return [selected, ...groups.slice(0, selectedIndex), ...groups.slice(selectedIndex + 1)];
  }

  private _isGroupExpanded(groupKey: string): boolean {
    const value = this._deviceGroupExpanded[groupKey];
    if (typeof value === "boolean") return value;
    return groupKey === "unassigned";
  }

  private _toggleDeviceGroup(groupKey: string): void {
    const expanded = this._isGroupExpanded(groupKey);
    this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [groupKey]: !expanded,
    };
  }

  private _setAllDeviceGroups(expanded: boolean, groups: DeviceGroup[]): void {
    const next = { ...this._deviceGroupExpanded };
    for (const group of groups) {
      next[group.key] = expanded;
    }
    this._deviceGroupExpanded = next;
  }

  private _deviceMetaForGroup(entityId: string, group: DeviceGroup): string {
    if (group.type !== "unassigned") {
      return entityId;
    }
    const areaLabel = this._areaLabel(this._effectiveAreaIdForEntity(entityId));
    if (areaLabel === "Unassigned") {
      return entityId;
    }
    return `${entityId} · HA Area: ${areaLabel}`;
  }

  private _handleDeviceDragStart(event: DragEvent, entityId: string): void {
    event.dataTransfer?.setData(ENTITY_DND_MIME, entityId);
    event.dataTransfer?.setData("text/plain", entityId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  private _handleEntityDropped = (event: CustomEvent): void => {
    event.stopPropagation();
    const entityId = event.detail?.entityId;
    const targetLocationId = event.detail?.targetLocationId;
    if (!entityId || !targetLocationId) return;
    void this._assignEntityToLocation(entityId, targetLocationId);
  };

  private _handleAssignButton(entityId: string, selectedLocationId?: string): void {
    if (!selectedLocationId) {
      this._showToast("Select a location first", "warning");
      return;
    }
    void this._assignEntityToLocation(entityId, selectedLocationId);
  }

  private _allKnownEntityIds(): string[] {
    const ids = new Set<string>();
    for (const entityId of Object.keys(this.hass?.states || {})) ids.add(entityId);
    for (const entityId of Object.keys(this._entityAreaById)) ids.add(entityId);
    for (const location of this._locations) {
      for (const entityId of location.entity_ids || []) {
        ids.add(entityId);
      }
    }
    return [...ids];
  }

  private _entityDisplayName(entityId: string): string {
    const stateObj = this.hass?.states?.[entityId];
    const friendly = stateObj?.attributes?.friendly_name;
    return typeof friendly === "string" && friendly.trim() ? friendly : entityId;
  }

  private _effectiveAreaIdForEntity(entityId: string): string | null {
    if (Object.prototype.hasOwnProperty.call(this._entityAreaById, entityId)) {
      return this._entityAreaById[entityId];
    }
    const attrs = this.hass?.states?.[entityId]?.attributes || {};
    return typeof attrs.area_id === "string" ? attrs.area_id : null;
  }

  private _areaLabel(areaId: string | null): string {
    if (!areaId) return "Unassigned";
    return this.hass?.areas?.[areaId]?.name || areaId;
  }

  private _isAssignableEntity(entityId: string): boolean {
    const attrs = this.hass?.states?.[entityId]?.attributes || {};
    return !(attrs?.device_class === "occupancy" && attrs?.location_id);
  }

  private _groupTypeForLocation(location: Location): DeviceGroup["type"] {
    const type = getLocationType(location);
    if (type === "area") return "area";
    if (type === "subarea") return "subarea";
    if (type === "floor") return "floor";
    if (type === "building") return "building";
    if (type === "grounds") return "grounds";
    return "other";
  }

  private _buildDeviceGroups(): DeviceGroup[] {
    const query = this._entitySearch.trim().toLowerCase();
    const stateCount = Object.keys(this.hass?.states || {}).length;
    const cacheKey = `${query}|${stateCount}|${this._locationsVersion}|${this._entityAreaRevision}`;
    if (this._deviceGroupsCacheKey === cacheKey) {
      return this._deviceGroupsCache;
    }

    const byLocationId = new Map(this._locations.map((location) => [location.id, location]));
    const assignedByEntityId = new Map<string, string>();
    for (const location of this._locations) {
      for (const entityId of location.entity_ids || []) {
        if (entityId && !assignedByEntityId.has(entityId)) {
          assignedByEntityId.set(entityId, location.id);
        }
      }
    }

    const groupsByKey = new Map<string, DeviceGroup>();

    const ensureGroup = (key: string, label: string, type: DeviceGroup["type"], locationId?: string): DeviceGroup => {
      const existing = groupsByKey.get(key);
      if (existing) return existing;
      const created: DeviceGroup = { key, label, type, locationId, entities: [] };
      groupsByKey.set(key, created);
      return created;
    };

    ensureGroup("unassigned", "Unassigned", "unassigned");

    for (const entityId of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(entityId)) continue;
      const entityName = this._entityDisplayName(entityId);
      const assignedLocationId = assignedByEntityId.get(entityId);
      const assignedLocation = assignedLocationId ? byLocationId.get(assignedLocationId) : undefined;
      const areaLabel = this._areaLabel(this._effectiveAreaIdForEntity(entityId));

      if (query) {
        const haystack = `${entityName} ${entityId} ${assignedLocation?.name || ""} ${areaLabel}`.toLowerCase();
        if (!haystack.includes(query)) continue;
      }

      if (!assignedLocation) {
        ensureGroup("unassigned", "Unassigned", "unassigned").entities.push(entityId);
        continue;
      }

      const groupType = this._groupTypeForLocation(assignedLocation);
      ensureGroup(
        assignedLocation.id,
        assignedLocation.name,
        groupType,
        assignedLocation.id
      ).entities.push(entityId);
    }

    for (const group of groupsByKey.values()) {
      group.entities.sort((left, right) =>
        this._entityDisplayName(left).localeCompare(this._entityDisplayName(right))
      );
    }

    const rank: Record<DeviceGroup["type"], number> = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6,
    };

    const groups = [...groupsByKey.values()]
      .filter((group) => group.entities.length > 0 || group.key === "unassigned")
      .sort((left, right) => {
        const rankDiff = rank[left.type] - rank[right.type];
        if (rankDiff !== 0) return rankDiff;
        return left.label.localeCompare(right.label);
      });
    this._deviceGroupsCacheKey = cacheKey;
    this._deviceGroupsCache = groups;
    return groups;
  }

  private _applyEntityAssignmentLocally(entityId: string, targetLocationId: string): void {
    const nextLocations = this._locations.map((location) => ({
      ...location,
      entity_ids: (location.entity_ids || []).filter((item) => item !== entityId),
    }));

    const target = nextLocations.find((location) => location.id === targetLocationId);
    if (target && !target.entity_ids.includes(entityId)) {
      target.entity_ids = [...target.entity_ids, entityId];
    }

    this._locations = nextLocations;
    this._locationsVersion += 1;
    if (target) {
      this._deviceGroupExpanded = {
        ...this._deviceGroupExpanded,
        [target.id]: true,
      };
    }
    if (target?.ha_area_id) {
      this._entityAreaById = { ...this._entityAreaById, [entityId]: target.ha_area_id };
      this._entityAreaRevision += 1;
    }
  }

  private async _assignEntityToLocation(entityId: string, targetLocationId: string): Promise<void> {
    if (!entityId || !targetLocationId) return;
    if (this._assignBusyByEntityId[entityId]) return;
    const target = this._locations.find((location) => location.id === targetLocationId);
    if (!target) {
      this._showToast("Target location not found", "error");
      return;
    }

    const snapshot = this._locations.map((location) => ({
      ...location,
      entity_ids: [...(location.entity_ids || [])],
    }));
    this._assignBusyByEntityId = { ...this._assignBusyByEntityId, [entityId]: true };
    this._applyEntityAssignmentLocally(entityId, targetLocationId);

    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/assign_entity",
          entity_id: entityId,
          target_location_id: targetLocationId,
        })
      );
      await this._loadLocations(true);
    } catch (error: any) {
      this._locations = snapshot;
      this._locationsVersion += 1;
      console.error("Failed to assign entity:", error);
      this._showToast(error?.message || "Failed to assign device", "error");
    } finally {
      const { [entityId]: _omit, ...remaining } = this._assignBusyByEntityId;
      this._assignBusyByEntityId = remaining;
    }
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

      const result = await Promise.race([
        this.hass.callWS<{ locations: Location[]; adjacency_edges?: AdjacencyEdge[] }>(
          this._withEntryId({
            type: "topomation/locations/list",
          })
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout loading locations")), 8000)
        ),
      ]);

      const response = result as { locations?: Location[]; adjacency_edges?: AdjacencyEdge[] };
      if (!response || !response.locations) {
        throw new Error("Invalid response format: missing locations array");
      }

      // Prevent out-of-order loads from reverting UI state when rapid updates occur.
      if (seq !== this._loadSeq) {
        return;
      }

      // Defensive: collapse any duplicate IDs to prevent UI duplication if backend ever misbehaves.
      const byId = new Map<string, Location>();
      for (const loc of response.locations) byId.set(loc.id, loc);
      const uniqueLocations = Array.from(byId.values());
      const visibleLocations = uniqueLocations.filter(
        (loc) => !loc.is_explicit_root && !this._isManagedShadowLocation(loc)
      );
      this._locations = [...visibleLocations];
      this._adjacencyEdges = Array.isArray(response.adjacency_edges)
        ? [...response.adjacency_edges]
        : [];
      this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates();
      this._occupancyTransitionByLocation = this._buildOccupancyTransitionsFromStates();
      this._locationsVersion += 1;
      this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length,
      });

      // Keep selection valid against the visible/non-root subset.
      if (
        !this._selectedId ||
        !this._locations.some((loc) => loc.id === this._selectedId) ||
        this._isManagedShadowLocation(this._locations.find((loc) => loc.id === this._selectedId))
      ) {
        this._selectedId = this._preferredSelectedLocationId();
      }
      if (this._rightPanelMode === "assign") {
        void this._ensureEntityAreaIndex();
      }
    } catch (err: any) {
      console.error("Failed to load locations:", err);
      this._error = err.message || "Failed to load locations";
      this._logEvent("error", "locations/list failed", err?.message || err);
    } finally {
      this._loading = false;
    }
  }

  private _scheduleInitialLoad(): void {
    if (this._hasLoaded) return;
    if (this.hass) {
      this._hasLoaded = true;
      this._loadLocations();
      return;
    }
    // hass not yet injected; try again shortly
    this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
  }

  private _handleLocationSelected(e: CustomEvent): void {
    this._selectedId = e.detail.locationId;
  }

  private _handleAdjacencyChanged(): void {
    void this._loadLocations(true);
  }

  private _handleLocationMetaChanged(): void {
    void this._loadLocations(true);
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

    // In a real implementation, this would update HA with the local name.
    this._renameConflict = undefined;
  }

  private _handleConflictAcceptHA() {
    if (!this._renameConflict) return;

    const { locationId, haName } = this._renameConflict;

    // Update the local location with HA's name
    const location = this._locations.find(loc => loc.id === locationId);
    if (location) {
      location.name = haName;
      this._locations = [...this._locations]; // Trigger reactivity
    }

    this._renameConflict = undefined;
  }

  private _handleConflictDismiss() {
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
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/reorder",
            location_id: locationId,
            new_parent_id: newParentId ?? null,
            new_index: newIndex,
          })
        );
        await this._loadLocations(true);
        this._locationsVersion += 1;
      } catch (error: any) {
        console.error("Failed to move location:", error);
        this._showToast(error?.message || "Failed to move location", "error");
      }
    });
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
          service_data: this._serviceDataWithEntryId({
            location_id: locationId,
            source_id: "manual_ui",
          }),
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

  private _getLocationLockState(locationId: string): { isLocked: boolean; lockedBy: string[] } {
    const states = this.hass?.states || {};
    for (const state of Object.values(states) as any[]) {
      const attrs = state?.attributes || {};
      if (attrs?.device_class !== "occupancy") continue;
      if (String(attrs?.location_id) !== String(locationId)) continue;
      const lockedBy = Array.isArray(attrs?.locked_by)
        ? attrs.locked_by.map((item: unknown) => String(item))
        : [];
      return {
        isLocked: Boolean(attrs?.is_locked),
        lockedBy,
      };
    }

    return { isLocked: false, lockedBy: [] };
  }

  private async _handleLocationOccupancyToggle(e: CustomEvent): Promise<void> {
    e.stopPropagation();
    const locationId = e?.detail?.locationId as string | undefined;
    const occupied = Boolean(e?.detail?.occupied);
    if (!locationId) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }

    await this._enqueueLocationOp(locationId, async () => {
      const location = this._locations.find((loc) => loc.id === locationId);
      const locationName = location?.name || locationId;
      const { isLocked, lockedBy } = this._getLocationLockState(locationId);
      if (isLocked) {
        const lockDetails = lockedBy.length ? ` (${lockedBy.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${locationName}" is locked${lockDetails}.`, "warning");
        return;
      }

      try {
        if (!location) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }

        const service = occupied ? "trigger" : "vacate_area";
        const serviceData: Record<string, unknown> = {
          location_id: locationId,
          source_id: "manual_ui",
        };

        if (occupied) {
          const configuredTimeout = location.modules?.occupancy?.default_timeout;
          if (typeof configuredTimeout === "number" && configuredTimeout >= 0) {
            serviceData.timeout = Math.floor(configuredTimeout);
          }
        } else {
          serviceData.include_locked = false;
        }

        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service,
          service_data: this._serviceDataWithEntryId(serviceData),
        });
        this._logEvent("ui", service, { locationId, source_id: "manual_ui" });
        await this._loadLocations(true);
        this._locationsVersion += 1;
        this._showToast(
          occupied
            ? `Marked "${locationName}" as occupied`
            : `Marked "${locationName}" as unoccupied (vacated)`,
          "success"
        );
      } catch (error: any) {
        console.error("Failed to toggle occupancy:", error);
        this._showToast(error?.message || "Hey, can't do it.", "error");
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
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/update",
            location_id: locationId,
            changes: { name: String(newName) },
          })
        );
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

        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: location.id,
          })
        );

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
    }

    // Ctrl+Shift+Z or Ctrl+Y - Redo (future implementation)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      // TODO: Implement redo
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

  private _handleOpenSidebar = (): void => {
    this.dispatchEvent(
      new CustomEvent("hass-toggle-menu", {
        bubbles: true,
        composed: true,
        detail: { open: true },
      })
    );
  };

  private _isSplitStackedLayout(): boolean {
    if (this.narrow) return true;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  }

  private _clampPanelSplit(split: number): number {
    if (!Number.isFinite(split)) return TREE_PANEL_SPLIT_DEFAULT;
    return Math.min(TREE_PANEL_SPLIT_MAX, Math.max(TREE_PANEL_SPLIT_MIN, split));
  }

  private _setPanelSplit(split: number, persist = false): void {
    const clamped = this._clampPanelSplit(split);
    if (Math.abs(clamped - this._treePanelSplit) < 0.001) {
      return;
    }
    this._treePanelSplit = clamped;
    if (persist) {
      this._persistPanelSplitPreference();
    }
  }

  private _restorePanelSplitPreference(): void {
    try {
      const raw = window.localStorage?.getItem(TREE_PANEL_SPLIT_STORAGE_KEY);
      if (!raw) return;
      const parsed = Number(raw);
      this._setPanelSplit(parsed);
    } catch {
      // ignore storage failures
    }
  }

  private _persistPanelSplitPreference(): void {
    try {
      window.localStorage?.setItem(TREE_PANEL_SPLIT_STORAGE_KEY, this._treePanelSplit.toFixed(4));
    } catch {
      // ignore storage failures
    }
  }

  private _restoreRightPanelModePreference(): void {
    try {
      const saved = window.localStorage?.getItem(RIGHT_PANEL_MODE_STORAGE_KEY);
      if (saved === "assign" || saved === "inspector") {
        this._rightPanelMode = saved;
      }
    } catch {
      // ignore storage failures
    }
    if (this._rightPanelMode === "assign") {
      void this._ensureEntityAreaIndex();
    }
  }

  private _persistRightPanelModePreference(): void {
    try {
      window.localStorage?.setItem(RIGHT_PANEL_MODE_STORAGE_KEY, this._rightPanelMode);
    } catch {
      // ignore storage failures
    }
  }

  private _handleRightPanelModeChange(mode: RightPanelMode): void {
    if (this._rightPanelMode === mode) return;
    this._rightPanelMode = mode;
    this._persistRightPanelModePreference();
    if (mode === "assign") {
      void this._ensureEntityAreaIndex();
    }
  }

  private _applyPanelSplitFromClientX(clientX: number, persist = false): void {
    const container = this.shadowRoot?.querySelector(".panel-container") as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const split = (clientX - rect.left) / rect.width;
    this._setPanelSplit(split, persist);
  }

  private _handlePanelSplitterPointerDown = (e: PointerEvent): void => {
    if (this._isSplitStackedLayout()) return;
    e.preventDefault();
    this._panelResizePointerId = e.pointerId;
    this._isResizingPanels = true;
    this._applyPanelSplitFromClientX(e.clientX);
    window.addEventListener("pointermove", this._handlePanelSplitterPointerMove);
    window.addEventListener("pointerup", this._handlePanelSplitterPointerUp);
    window.addEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  };

  private _handlePanelSplitterPointerMove = (e: PointerEvent): void => {
    if (!this._isResizingPanels) return;
    if (this._panelResizePointerId !== undefined && e.pointerId !== this._panelResizePointerId) {
      return;
    }
    this._applyPanelSplitFromClientX(e.clientX);
  };

  private _handlePanelSplitterPointerUp = (e: PointerEvent): void => {
    if (!this._isResizingPanels) return;
    if (this._panelResizePointerId !== undefined && e.pointerId !== this._panelResizePointerId) {
      return;
    }
    this._applyPanelSplitFromClientX(e.clientX, true);
    this._stopPanelSplitterDrag();
  };

  private _stopPanelSplitterDrag(): void {
    this._isResizingPanels = false;
    this._panelResizePointerId = undefined;
    window.removeEventListener("pointermove", this._handlePanelSplitterPointerMove);
    window.removeEventListener("pointerup", this._handlePanelSplitterPointerUp);
    window.removeEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  }

  private _handlePanelSplitterKeyDown = (e: KeyboardEvent): void => {
    if (this._isSplitStackedLayout()) return;
    const step = e.shiftKey ? 0.08 : 0.03;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      this._setPanelSplit(this._treePanelSplit - step, true);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      this._setPanelSplit(this._treePanelSplit + step, true);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      this._setPanelSplit(TREE_PANEL_SPLIT_MIN, true);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      this._setPanelSplit(TREE_PANEL_SPLIT_MAX, true);
    }
  };

  private _handlePanelSplitterReset = (): void => {
    this._setPanelSplit(TREE_PANEL_SPLIT_DEFAULT, true);
  };

  private async _subscribeToUpdates(): Promise<void> {
    if (!this.hass || !this.hass.connection) return;
    if (typeof this.hass.connection.subscribeEvents !== "function") return;

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
    if (this._unsubHandoffTrace) {
      this._unsubHandoffTrace();
      this._unsubHandoffTrace = undefined;
    }
    if (this._unsubActionsSummary) {
      this._unsubActionsSummary();
      this._unsubActionsSummary = undefined;
    }
    if (this._unsubEntityRegistryUpdated) {
      this._unsubEntityRegistryUpdated();
      this._unsubEntityRegistryUpdated = undefined;
    }
    if (this._unsubDeviceRegistryUpdated) {
      this._unsubDeviceRegistryUpdated();
      this._unsubDeviceRegistryUpdated = undefined;
    }
    if (this._unsubAreaRegistryUpdated) {
      this._unsubAreaRegistryUpdated();
      this._unsubAreaRegistryUpdated = undefined;
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
      this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
        (event: any) => {
          const locationId = event?.data?.location_id;
          const occupied = event?.data?.occupied;
          if (!locationId || typeof occupied !== "boolean") return;
          const previousOccupied = event?.data?.previous_occupied;
          const reason =
            typeof event?.data?.reason === "string" && event.data.reason.trim().length
              ? event.data.reason.trim()
              : undefined;
          this._setOccupancyState(locationId, occupied, {
            previousOccupied: typeof previousOccupied === "boolean" ? previousOccupied : undefined,
            reason,
          });
          this._logEvent("ha", "topomation_occupancy_changed", {
            locationId,
            occupied,
            previousOccupied:
              typeof previousOccupied === "boolean" ? previousOccupied : undefined,
            reason,
          });
        },
        "topomation_occupancy_changed"
      );
    } catch (err) {
      console.warn("Failed to subscribe to topomation_occupancy_changed events", err);
      this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(err));
    }

    try {
      this._unsubHandoffTrace = await this.hass.connection.subscribeEvents(
        (event: any) => {
          const data = event?.data || {};
          const edgeId =
            typeof data.edge_id === "string" && data.edge_id.trim()
              ? data.edge_id.trim()
              : "";
          const fromLocationId =
            typeof data.from_location_id === "string" && data.from_location_id.trim()
              ? data.from_location_id.trim()
              : "";
          const toLocationId =
            typeof data.to_location_id === "string" && data.to_location_id.trim()
              ? data.to_location_id.trim()
              : "";
          if (!edgeId || !fromLocationId || !toLocationId) return;

          const trace: HandoffTrace = {
            edge_id: edgeId,
            from_location_id: fromLocationId,
            to_location_id: toLocationId,
            trigger_entity_id:
              typeof data.trigger_entity_id === "string" ? data.trigger_entity_id : "",
            trigger_source_id:
              typeof data.trigger_source_id === "string" ? data.trigger_source_id : "",
            boundary_type: typeof data.boundary_type === "string" ? data.boundary_type : "virtual",
            handoff_window_sec:
              typeof data.handoff_window_sec === "number" ? data.handoff_window_sec : 12,
            status: typeof data.status === "string" ? data.status : "provisional_triggered",
            timestamp:
              typeof data.timestamp === "string" && data.timestamp.trim()
                ? data.timestamp
                : new Date().toISOString(),
          };

          const appendTrace = (
            map: Record<string, HandoffTrace[]>,
            locationId: string,
            nextTrace: HandoffTrace
          ): Record<string, HandoffTrace[]> => {
            const existing = map[locationId] || [];
            return {
              ...map,
              [locationId]: [nextTrace, ...existing].slice(0, 25),
            };
          };

          let next = appendTrace(this._handoffTraceByLocation, fromLocationId, trace);
          next = appendTrace(next, toLocationId, trace);
          this._handoffTraceByLocation = next;
          this._logEvent("ha", "topomation_handoff_trace", trace);
        },
        "topomation_handoff_trace"
      );
    } catch (err) {
      console.warn("Failed to subscribe to topomation_handoff_trace events", err);
      this._logEvent("error", "subscribe failed: topomation_handoff_trace", String(err));
    }

    try {
      this._unsubActionsSummary = await this.hass.connection.subscribeEvents(
        (event: any) => {
          this._logEvent("ha", "topomation_actions_summary", event?.data || {});
        },
        "topomation_actions_summary"
      );
    } catch (err) {
      console.warn("Failed to subscribe to topomation_actions_summary events", err);
      this._logEvent("error", "subscribe failed: topomation_actions_summary", String(err));
    }

    try {
      this._unsubEntityRegistryUpdated = await this.hass.connection.subscribeEvents(
        (event: any) => {
          this._scheduleRegistryRefresh("entity_registry_updated", event?.data || {});
        },
        "entity_registry_updated"
      );
    } catch (err) {
      console.warn("Failed to subscribe to entity_registry_updated events", err);
      this._logEvent("error", "subscribe failed: entity_registry_updated", String(err));
    }

    try {
      this._unsubDeviceRegistryUpdated = await this.hass.connection.subscribeEvents(
        (event: any) => {
          this._scheduleRegistryRefresh("device_registry_updated", event?.data || {});
        },
        "device_registry_updated"
      );
    } catch (err) {
      console.warn("Failed to subscribe to device_registry_updated events", err);
      this._logEvent("error", "subscribe failed: device_registry_updated", String(err));
    }

    try {
      this._unsubAreaRegistryUpdated = await this.hass.connection.subscribeEvents(
        (event: any) => {
          this._scheduleRegistryRefresh("area_registry_updated", event?.data || {});
        },
        "area_registry_updated"
      );
    } catch (err) {
      console.warn("Failed to subscribe to area_registry_updated events", err);
      this._logEvent("error", "subscribe failed: area_registry_updated", String(err));
    }

    await this._syncStateChangedSubscription();
  }

  private _scheduleRegistryRefresh(eventType: string, data: Record<string, unknown>): void {
    this._logEvent("ha", eventType, data);
    if (this._registryRefreshTimer) {
      window.clearTimeout(this._registryRefreshTimer);
      this._registryRefreshTimer = undefined;
    }
    this._registryRefreshTimer = window.setTimeout(() => {
      this._registryRefreshTimer = undefined;
      this._haRegistryRevision += 1;
      this._entityAreaIndexLoaded = false;
      this._entityAreaRevision += 1;
      if (this._rightPanelMode === "assign") {
        void this._ensureEntityAreaIndex(true);
      }
      this._scheduleReload(true);
    }, 200);
  }

  private _setOccupancyState(
    locationId: string,
    occupied: boolean,
    details?: {
      previousOccupied?: boolean;
      reason?: string;
      changedAt?: string;
    }
  ): void {
    const reason =
      typeof details?.reason === "string" && details.reason.trim().length
        ? details.reason.trim()
        : undefined;
    const changedAt =
      typeof details?.changedAt === "string" && details.changedAt.trim().length
        ? details.changedAt
        : new Date().toISOString();

    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [locationId]: occupied,
    };
    this._occupancyTransitionByLocation = {
      ...this._occupancyTransitionByLocation,
      [locationId]: {
        occupied,
        previousOccupied:
          typeof details?.previousOccupied === "boolean"
            ? details.previousOccupied
            : undefined,
        reason,
        changedAt,
      },
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

  private _buildOccupancyTransitionsFromStates(): Record<string, OccupancyTransitionState> {
    const map: Record<string, OccupancyTransitionState> = {};
    const states = this.hass?.states || {};
    for (const state of Object.values(states) as any[]) {
      const attrs = state?.attributes || {};
      if (attrs?.device_class !== "occupancy") continue;
      const locationId = attrs.location_id;
      if (!locationId) continue;
      const previousOccupied = attrs.previous_occupied;
      const reason =
        typeof attrs.reason === "string" && attrs.reason.trim().length
          ? attrs.reason.trim()
          : undefined;
      const changedAt =
        typeof state?.last_changed === "string" && state.last_changed.trim().length
          ? state.last_changed
          : undefined;
      map[locationId] = {
        occupied: state?.state === "on",
        previousOccupied: typeof previousOccupied === "boolean" ? previousOccupied : undefined,
        reason,
        changedAt,
      };
    }
    return map;
  }

  private _toggleEventLog = (): void => {
    this._eventLogOpen = !this._eventLogOpen;
    void this._syncStateChangedSubscription();
  };

  private async _syncStateChangedSubscription(): Promise<void> {
    if (!this.hass?.connection) return;
    if (typeof this.hass.connection.subscribeEvents !== "function") return;

    if (!this._eventLogOpen) {
      if (this._unsubStateChanged) {
        this._unsubStateChanged();
        this._unsubStateChanged = undefined;
      }
      return;
    }

    if (this._unsubStateChanged) return;

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
            this._setOccupancyState(attrs.location_id, newStateObj?.state === "on", {
              previousOccupied:
                typeof attrs.previous_occupied === "boolean"
                  ? attrs.previous_occupied
                  : undefined,
              reason:
                typeof attrs.reason === "string" && attrs.reason.trim().length
                  ? attrs.reason.trim()
                  : undefined,
              changedAt:
                typeof newStateObj?.last_changed === "string" &&
                newStateObj.last_changed.trim().length
                  ? newStateObj.last_changed
                  : undefined,
            });
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
  }

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
      { key: 'Left/Right', description: 'Resize panes when splitter is focused' },
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
        await this.hass.callWS(this._withEntryId({
          type: 'topomation/locations/update',
          location_id: id,
          changes: change.updated
        }));
        break;
      case 'delete':
        await this.hass.callWS(this._withEntryId({
          type: 'topomation/locations/delete',
          location_id: id
        }));
        break;
      case 'create':
        await this.hass.callWS(this._withEntryId({
          type: 'topomation/locations/create',
          ...change.updated
        }));
        break;
    }
  }

  private _activeEntryId(): string | undefined {
    const configured = this.panel?.config?.entry_id;
    if (typeof configured === "string" && configured.trim()) {
      const resolved = configured.trim();
      this._lastKnownEntryId = resolved;
      return resolved;
    }

    const routeQuery = this.route?.path?.split("?", 2)[1];
    if (routeQuery) {
      const fromRoute = new URLSearchParams(routeQuery).get("entry_id");
      if (fromRoute && fromRoute.trim()) {
        const resolved = fromRoute.trim();
        this._lastKnownEntryId = resolved;
        return resolved;
      }
    }

    const fromWindow = new URLSearchParams(window.location.search).get("entry_id");
    if (fromWindow && fromWindow.trim()) {
      const resolved = fromWindow.trim();
      this._lastKnownEntryId = resolved;
      return resolved;
    }

    return this._lastKnownEntryId;
  }

  private _withEntryId<T extends Record<string, any>>(payload: T): T {
    const entryId = this._activeEntryId();
    if (!entryId) {
      return payload;
    }
    return {
      ...payload,
      entry_id: entryId,
    };
  }

  private _serviceDataWithEntryId<T extends Record<string, any>>(serviceData: T): T {
    const entryId = this._activeEntryId();
    if (!entryId) {
      return serviceData;
    }
    return {
      ...serviceData,
      entry_id: entryId,
    };
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
  }

  private async _seedDemoData(): Promise<void> {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }

  private _isManagedShadowLocation(location: Location | undefined): boolean {
    if (!location) return false;
    return isSystemShadowLocation(location, this._managedShadowLocationIds());
  }

  private _managedShadowLocationIds(): Set<string> {
    return managedShadowLocationIdSet(this._locations);
  }

  private _parentSelectableLocations(): Location[] {
    return this._locations.filter((location) => !this._isManagedShadowLocation(location));
  }

  private _preferredSelectedLocationId(): string | undefined {
    return this._locations.find((location) => !this._isManagedShadowLocation(location))?.id;
  }
}

if (!customElements.get("topomation-panel")) {
  try {
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
