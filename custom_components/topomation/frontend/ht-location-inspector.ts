import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AutomationConfig,
  HomeAssistant,
  Location,
  OccupancyConfig,
  OccupancySource,
  TopomationActionRule,
} from "./types";
import { sharedStyles } from "./styles";
import { getLocationIcon } from "./icon-utils";
import { getLocationType } from "./hierarchy-rules";
import { applyModeDefaults, getSourceDefaultsForEntity } from "./source-profile-utils";
import {
  deleteTopomationActionRule,
  listTopomationActionRules,
  ruleEditPath,
  setTopomationActionRuleEnabled,
} from "./ha-automation-rules";

type SourceSignalKey = OccupancySource["signal_key"];
type InspectorTab = "detection" | "occupied_actions" | "vacant_actions";
type InspectorTabRequest = InspectorTab | "occupancy" | "actions";
type OccupancyLockDirective = {
  sourceId: string;
  mode: string;
  scope: string;
};
type InspectorLockState = {
  isLocked: boolean;
  lockedBy: string[];
  lockModes: string[];
  directLocks: OccupancyLockDirective[];
};

console.log("[ht-location-inspector] module loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

/**
 * Location inspector panel
 * Shows details and configuration for selected location
 */
// @customElement("ht-location-inspector")
export class HtLocationInspector extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public location?: Location;
  @property({ type: String }) public forcedTab?: InspectorTabRequest;

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    location: { attribute: false },
    forcedTab: { type: String },
  };

  @state() private _activeTab: InspectorTab = "detection";
  @state() private _stagedSources?: OccupancySource[];
  @state() private _sourcesDirty = false;
  @state() private _savingSource = false;
  @state() private _externalAreaId = "";
  @state() private _externalEntityId = "";
  @state() private _entityAreaById: Record<string, string | null> = {};
  @state() private _actionRules: TopomationActionRule[] = [];
  @state() private _loadingActionRules = false;
  @state() private _actionRulesError?: string;
  @state() private _nowEpochMs = Date.now();
  private _onTimeoutMemory: Record<string, number> = {};
  private _entityAreaLoadPromise?: Promise<void>;
  private _actionRulesLoadSeq = 0;
  private _clockTimer?: number;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .location-id {
        font-size: 13px;
        font-family: var(--code-font-family, monospace);
        color: var(--secondary-text-color);
        margin-top: 4px;
        opacity: 0.8;
      }

      .id-label {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 10px;
        margin-right: 4px;
        letter-spacing: 0.5px;
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-submeta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .candidate-headline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 10px 12px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  protected render() {
    if (!this.location) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
    }

    return html`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()} ${this._renderContent()}
      </div>
    `;
  }

  protected willUpdate(changedProps: Map<string, unknown>): void {
    if (changedProps.has("hass")) {
      this._entityAreaById = {};
      this._entityAreaLoadPromise = undefined;
      if (this.hass) {
        void this._loadEntityAreaAssignments();
        void this._loadActionRules();
      }
    }

    if (changedProps.has("forcedTab")) {
      const mapped = this._mapRequestedTab(this.forcedTab);
      if (mapped) {
        this._activeTab = mapped;
      } else if (changedProps.get("forcedTab")) {
        this._activeTab = "detection";
      }
    }

    if (changedProps.has("location")) {
      const prev = changedProps.get("location") as Location | undefined;
      const prevId = prev?.id || "";
      const nextId = this.location?.id || "";
      if (prevId !== nextId) {
        this._stagedSources = undefined;
        this._sourcesDirty = false;
        this._externalAreaId = "";
        this._externalEntityId = "";
        this._onTimeoutMemory = {};
        if (this.hass) {
          void this._loadEntityAreaAssignments();
        }
      }
      void this._loadActionRules();
    }
  }

  private async _loadActionRules(): Promise<void> {
    const loadSeq = ++this._actionRulesLoadSeq;
    const locationId = this.location?.id;
    if (!locationId || !this.hass) {
      this._actionRules = [];
      this._loadingActionRules = false;
      this._actionRulesError = undefined;
      return;
    }

    this._loadingActionRules = true;
    this._actionRulesError = undefined;
    this.requestUpdate();

    try {
      const rules = await listTopomationActionRules(this.hass, locationId);
      if (loadSeq !== this._actionRulesLoadSeq) return;
      this._actionRules = rules;
    } catch (err: any) {
      if (loadSeq !== this._actionRulesLoadSeq) return;
      this._actionRules = [];
      this._actionRulesError = err?.message || "Failed to load automation rules";
    } finally {
      if (loadSeq === this._actionRulesLoadSeq) {
        this._loadingActionRules = false;
        this.requestUpdate();
      }
    }
  }

  private async _loadEntityAreaAssignments(): Promise<void> {
    if (this._entityAreaLoadPromise || !this.hass?.callWS) return;

    this._entityAreaLoadPromise = (async () => {
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

        const assignments: Record<string, string | null> = {};
        if (Array.isArray(entityRegistry)) {
          for (const entity of entityRegistry) {
            const entityId = typeof entity?.entity_id === "string" ? entity.entity_id : undefined;
            if (!entityId) continue;

            const explicitAreaId =
              typeof entity?.area_id === "string" ? entity.area_id : undefined;
            const deviceAreaId =
              typeof entity?.device_id === "string"
                ? deviceAreaById.get(entity.device_id)
                : undefined;

            assignments[entityId] = explicitAreaId || deviceAreaId || null;
          }
        }

        this._entityAreaById = assignments;
      } catch (err) {
        console.debug("[ht-location-inspector] failed to load entity/device registry area mapping", err);
        this._entityAreaById = {};
      } finally {
        this._entityAreaLoadPromise = undefined;
        this.requestUpdate();
      }
    })();

    await this._entityAreaLoadPromise;
  }

  private _renderHeader() {
    if (!this.location) return "";
    const areaId = this.location.ha_area_id;
    const subtitleLabel = areaId ? "HA Area ID:" : "Location ID:";
    const subtitleValue = areaId || this.location.id;

    return html`
      <div class="header">
        <div class="header-icon">
          <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
        </div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">
            <span class="id-label">${subtitleLabel}</span>${subtitleValue}
          </div>
        </div>
      </div>
    `;
  }

  private _headerIcon(location: Location): string {
    const areaId = location.ha_area_id;
    if (areaId && this.hass?.areas?.[areaId]?.icon) {
      return this.hass.areas[areaId].icon;
    }
    return getLocationIcon(location);
  }

  private _renderTabs() {
    return html`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => {
            this._activeTab = "detection";
            this.requestUpdate();
          }}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "occupied_actions" ? "active" : ""}"
          @click=${() => {
            this._activeTab = "occupied_actions";
            this.requestUpdate();
          }}
        >
          On Occupied
        </button>
        <button
          class="tab ${this._activeTab === "vacant_actions" ? "active" : ""}"
          @click=${() => {
            this._activeTab = "vacant_actions";
            this.requestUpdate();
          }}
        >
          On Vacant
        </button>
      </div>
    `;
  }

  private _renderContent() {
    const activeTab = this._effectiveTab();
    return html`
      <div class="tab-content">
        ${activeTab === "detection"
          ? this._renderOccupancyTab()
          : this._renderActionsTab(activeTab === "occupied_actions" ? "occupied" : "vacant")}
      </div>
    `;
  }

  private _effectiveTab(): InspectorTab {
    return this._activeTab;
  }

  private _mapRequestedTab(requested?: InspectorTabRequest): InspectorTab | undefined {
    if (requested === "detection") return "detection";
    if (requested === "occupied_actions") return "occupied_actions";
    if (requested === "vacant_actions") return "vacant_actions";
    if (requested === "occupancy") return "detection";
    if (requested === "actions") return "occupied_actions";
    return undefined;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._startClockTicker();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopClockTicker();
  }

  private _renderOccupancyTab() {
    if (!this.location) return "";

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    const isFloor = this._isFloorLocation();
    const hasHaAreaLink = !!this.location.ha_area_id;
    const floorSourceCount = (config.occupancy_sources || []).length;
    const lockState = this._getLockState();

    if (isFloor) {
      return html`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${floorSourceCount > 0
            ? html`
                <div class="policy-warning">
                  This floor still has ${floorSourceCount} legacy source${floorSourceCount === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              `
            : ""}
        </div>
      `;
    }

    return html`
      <div>
        <div class="card-section">
          ${this._renderRuntimeStatus(lockState)}
          ${lockState.isLocked ? html`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${lockState.lockedBy.length
                  ? html`Held by ${lockState.lockedBy.join(", ")}.`
                  : html`Occupancy is currently held by a lock.`}
              </div>
              ${lockState.lockModes.length
                ? html`
                    <div class="runtime-note">
                      Modes: ${lockState.lockModes.map((mode) => this._lockModeLabel(mode)).join(", ")}
                    </div>
                  `
                : ""}
              ${lockState.directLocks.length
                ? html`
                    <div class="lock-directive-list">
                      ${lockState.directLocks.map((directive) => html`
                        <div class="lock-directive">
                          <span class="lock-pill">${directive.sourceId}</span>
                          <span>${this._lockModeLabel(directive.mode)}</span>
                          <span>${this._lockScopeLabel(directive.scope)}</span>
                        </div>
                      `)}
                    </div>
                  `
                : html`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="section-title">
            Sources
          </div>
          <div class="subsection-help">
            ${hasHaAreaLink
              ? "Use the left control to include a source from this area. Included sources show editable behavior below."
              : "This location is integration-owned (no direct HA area mapping). Add sources explicitly from Home Assistant entities below."}
          </div>
          ${hasHaAreaLink
            ? ""
            : html`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(config)}
          <div class="subsection-help">
            ${hasHaAreaLink
              ? "Need cross-area behavior? Add a source from another area."
              : "Add sources from any HA area (or unassigned entities)."}
          </div>
          ${this._renderExternalSourceComposer(config)}
          ${this._sourcesDirty ? html`
            <div class="editor-actions sources-actions">
              <button
                class="button button-secondary"
                ?disabled=${this._savingSource}
                @click=${this._discardSourceChanges}
              >
                Discard
              </button>
              <button
                class="button button-primary"
                ?disabled=${this._savingSource}
                @click=${this._saveSourceChanges}
              >
                Save
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  private _renderRuntimeStatus(lockState: InspectorLockState) {
    const occupancyState = this._getOccupancyState();
    if (!occupancyState) {
      return html`
        <div class="runtime-grid">
          <div class="runtime-row">
            <div class="runtime-key">Occupancy</div>
            <div class="runtime-value">Sensor unavailable</div>
          </div>
        </div>
      `;
    }

    const attrs = occupancyState.attributes || {};
    const occupied = occupancyState.state === "on";
    const vacantAt = this._resolveVacantAt(attrs, occupied);

    let timeUntilVacant = "Unknown";
    let vacantAtLabel = "Unknown";
    if (!occupied) {
      timeUntilVacant = "Already vacant";
      vacantAtLabel = "-";
    } else if (vacantAt === null) {
      const hasBlockVacant = lockState.lockModes.includes("block_vacant");
      const hasFreeze = lockState.lockModes.includes("freeze");
      timeUntilVacant = hasBlockVacant
        ? "Indefinite (block vacant)"
        : hasFreeze
          ? "Paused while freeze lock is active"
          : "Indefinite";
      vacantAtLabel = "Not scheduled";
    } else if (vacantAt instanceof Date) {
      timeUntilVacant = this._formatRelativeDuration(vacantAt);
      vacantAtLabel = this._formatDateTime(vacantAt);
    } else if (lockState.lockModes.includes("freeze")) {
      timeUntilVacant = "Paused while freeze lock is active";
      vacantAtLabel = "Not scheduled";
    }

    const occupancyLabel = occupied ? "Occupied" : occupancyState.state === "off" ? "Vacant" : "Unknown";
    const lockModeLabel = lockState.lockModes.length
      ? lockState.lockModes.map((mode) => this._lockModeLabel(mode)).join(", ")
      : "None";
    const lockSourceLabel = lockState.lockedBy.length ? lockState.lockedBy.join(", ") : "None";

    return html`
      <div class="runtime-grid">
        <div class="runtime-row">
          <div class="runtime-key">Occupancy</div>
          <div class="runtime-value">${occupancyLabel}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Time Until Vacant</div>
          <div class="runtime-value" data-testid="runtime-time-until-vacant">${timeUntilVacant}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Vacant At</div>
          <div class="runtime-value" data-testid="runtime-vacant-at">${vacantAtLabel}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Lock Modes</div>
          <div class="runtime-value">${lockModeLabel}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Lock Sources</div>
          <div class="runtime-value">${lockSourceLabel}</div>
        </div>
      </div>
    `;
  }

  private _isMediaEntity(entityId: string): boolean {
    return entityId.startsWith("media_player.");
  }

  private _mediaSignalLabel(signalKey?: SourceSignalKey): string {
    if (signalKey === "color") return "Color change";
    if (signalKey === "power") return "Power";
    if (signalKey === "level") return "Level change";
    if (signalKey === "volume") return "Volume";
    if (signalKey === "mute") return "Mute";
    return "Playback";
  }

  private _signalDescription(signalKey?: SourceSignalKey): string {
    if (signalKey === "color") return "RGB/color changes";
    if (signalKey === "power") return "on/off";
    if (signalKey === "level") return "brightness changes";
    if (signalKey === "volume") return "volume changes";
    if (signalKey === "mute") return "mute/unmute";
    return "playback start/stop";
  }

  private _sourceKey(entityId: string, signalKey?: SourceSignalKey): string {
    return signalKey ? `${entityId}::${signalKey}` : entityId;
  }

  private _sourceKeyFromSource(source: OccupancySource): string {
    if (source.signal_key) return this._sourceKey(source.entity_id, source.signal_key);
    return this._sourceKey(source.entity_id);
  }

  private _defaultSignalKeyForEntity(entityId: string): SourceSignalKey | undefined {
    if (this._isMediaEntity(entityId)) return "playback";
    if (this._isDimmableEntity(entityId) || this._isColorCapableEntity(entityId)) return "power";
    return undefined;
  }

  private _candidateItemsForEntity(
    entityId: string
  ): Array<{ key: string; entityId: string; signalKey?: SourceSignalKey }> {
    if (!this._isMediaEntity(entityId)) {
      const isDimmable = this._isDimmableEntity(entityId);
      const isColorCapable = this._isColorCapableEntity(entityId);
      if (!isDimmable && !isColorCapable) {
        return [{ key: this._sourceKey(entityId), entityId }];
      }
      const signalKeys: SourceSignalKey[] = ["power"];
      if (isDimmable) signalKeys.push("level");
      if (isColorCapable) signalKeys.push("color");
      return signalKeys.map((signalKey) => ({
        key: this._sourceKey(entityId, signalKey),
        entityId,
        signalKey,
      }));
    }

    return (["playback", "volume", "mute"] as const).map((signalKey) => ({
      key: this._sourceKey(entityId, signalKey),
      entityId,
      signalKey,
    }));
  }

  private _candidateTitle(entityId: string, signalKey?: SourceSignalKey): string {
    const baseName = this._entityName(entityId);
    if (signalKey && (entityId.startsWith("media_player.") || entityId.startsWith("light."))) {
      return `${baseName} — ${this._mediaSignalLabel(signalKey)}`;
    }
    if (!this._isMediaEntity(entityId) && !this._isDimmableEntity(entityId) && !this._isColorCapableEntity(entityId)) {
      return baseName;
    }
    return `${baseName} — ${this._mediaSignalLabel(signalKey)}`;
  }

  private _mediaSignalDefaults(
    entityId: string,
    signalKey: "playback" | "volume" | "mute"
  ): Partial<OccupancySource> {
    if (signalKey === "playback") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "playback"),
        signal_key: "playback",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }
    return {
      entity_id: entityId,
      source_id: this._sourceKey(entityId, signalKey),
      signal_key: signalKey,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0,
    };
  }

  private _lightSignalDefaults(
    entityId: string,
    signalKey: "power" | "level" | "color"
  ): Partial<OccupancySource> {
    if (signalKey === "power") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "power"),
        signal_key: "power",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }

    if (signalKey === "color") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "color"),
        signal_key: "color",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }

    return {
      entity_id: entityId,
      source_id: this._sourceKey(entityId, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0,
    };
  }

  private _isDimmableEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const domain = entityId.split(".", 1)[0];
    if (domain !== "light") return false;
    const attrs = stateObj.attributes || {};
    if (typeof attrs.brightness === "number") return true;
    const colorModes = attrs.supported_color_modes;
    if (Array.isArray(colorModes)) {
      return colorModes.some((mode: string) => mode && mode !== "onoff");
    }
    return false;
  }

  private _isColorCapableEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const domain = entityId.split(".", 1)[0];
    if (domain !== "light") return false;
    const attrs = stateObj.attributes || {};
    if (attrs.rgb_color || attrs.hs_color || attrs.xy_color) return true;
    const colorModes = attrs.supported_color_modes;
    if (Array.isArray(colorModes)) {
      return colorModes.some((mode: string) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(mode));
    }
    return false;
  }

  private _renderAreaSensorList(config: OccupancyConfig) {
    if (!this.location) return "";
    const sources = this._workingSources(config);
    const sourceIndexByKey = new Map<string, number>();
    sources.forEach((source, index) => sourceIndexByKey.set(this._sourceKeyFromSource(source), index));

    const areaEntityIds = [...(this.location.entity_ids || [])].sort((a, b) =>
      this._entityName(a).localeCompare(this._entityName(b))
    );
    const areaEntitySet = new Set(areaEntityIds);
    const candidateAreaEntityIds = areaEntityIds.filter((entityId) => this._isCandidateEntity(entityId));
    const candidateItems = candidateAreaEntityIds.flatMap((entityId) => this._candidateItemsForEntity(entityId));
    const candidateItemKeys = new Set(candidateItems.map((item) => item.key));
    const configuredExtraItems = sources
      .filter((source) => !candidateItemKeys.has(this._sourceKeyFromSource(source)))
      .map((source) => ({
        key: this._sourceKeyFromSource(source),
        entityId: source.entity_id,
        signalKey: source.signal_key,
      }));
    const items = [...candidateItems, ...configuredExtraItems];

    if (!items.length) {
      return html`
        <div class="empty-state">
          <div class="text-muted">
            No occupancy-relevant entities found yet.
            Add one from another area to get started.
          </div>
        </div>
      `;
    }

    return html`
      <div class="candidate-list">
        ${items.map((item) => {
          const sourceIndex = sourceIndexByKey.get(item.key);
          const configured = sourceIndex !== undefined;
          const source = configured ? sources[sourceIndex] : undefined;
          const draft = configured && source ? source : undefined;
          const modeOptions = this._modeOptionsForEntity(item.entityId);
          return html`
            <div class="source-card ${configured ? "enabled" : ""}">
              <div class="candidate-item">
                <div class="source-enable-control">
                  <input
                    type="checkbox"
                    class="source-enable-input"
                    aria-label="Include source"
                    .checked=${configured}
                    @change=${(ev: Event) => {
                      const checked = (ev.target as HTMLInputElement).checked;
                      if (checked && !configured) {
                        this._addSourceWithDefaults(item.entityId, config, {
                          resetExternalPicker: false,
                          signalKey: item.signalKey,
                        });
                      } else if (!checked && configured) {
                        this._removeSource(sourceIndex, config);
                      }
                    }}
                  />
                </div>
                <div>
                  <div class="candidate-headline">
                    <div class="candidate-title">${this._candidateTitle(item.entityId, item.signalKey)}</div>
                    ${configured && draft && modeOptions.length > 1
                      ? html`
                          <div class="inline-mode-group">
                            <span class="inline-mode-label">Mode</span>
                            <select
                              class="inline-mode-select"
                              .value=${modeOptions.some((opt) => opt.value === draft.mode)
                                ? draft.mode
                                : modeOptions[0].value}
                              @change=${(ev: Event) => {
                                const mode = (ev.target as HTMLSelectElement).value as "any_change" | "specific_states";
                                const entity = this.hass.states[item.entityId];
                                const next = applyModeDefaults(draft, mode, entity) as OccupancySource;
                                this._updateSourceDraft(config, sourceIndex, { ...next, entity_id: draft.entity_id });
                              }}
                            >
                              ${modeOptions.map((opt) => html`<option value=${opt.value}>${opt.label}</option>`)}
                            </select>
                          </div>
                        `
                      : ""}
                  </div>
                  <div class="candidate-meta">${item.entityId} • ${this._entityState(item.entityId)}</div>
                  ${(this._isMediaEntity(item.entityId) || item.entityId.startsWith("light.")) && item.signalKey
                    ? html`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(item.signalKey)}</div>`
                    : ""}
                </div>
              </div>
              ${configured && source
                ? this._renderSourceEditor(config, source, sourceIndex)
                : ""}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderExternalSourceComposer(config: OccupancyConfig) {
    const areas = this._availableSourceAreas();
    const selectedAreaId = this._externalAreaId || "";
    const entityOptions = selectedAreaId ? this._entitiesForArea(selectedAreaId) : [];
    const entityId = this._externalEntityId || "";
    const existing = new Set(this._workingSources(config).map((source) => this._sourceKeyFromSource(source)));
    const defaultSignalKey = entityId ? this._defaultSignalKeyForEntity(entityId) : undefined;
    const selectedKey = entityId
      ? this._sourceKey(entityId, defaultSignalKey)
      : "";
    const areaLabel = this.location?.ha_area_id ? "Other Area" : "Source Area";

    return html`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">${areaLabel}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${selectedAreaId}
            @change=${(ev: Event) => {
              const nextAreaId = (ev.target as HTMLSelectElement).value;
              this._externalAreaId = nextAreaId;
              this._externalEntityId = "";
              this.requestUpdate();
            }}
          >
            <option value="">Select area...</option>
            <option value="__all__">Any area / unassigned</option>
            ${areas.map((area) => html`<option value=${area.area_id}>${area.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${entityId}
            @change=${(ev: Event) => {
              this._externalEntityId = (ev.target as HTMLSelectElement).value;
              this.requestUpdate();
            }}
            ?disabled=${!selectedAreaId}
          >
            <option value="">Select sensor...</option>
            ${entityOptions.map((id) => html`
              <option
                value=${id}
                ?disabled=${existing.has(this._sourceKey(id, this._defaultSignalKeyForEntity(id)))}
              >
                ${this._entityName(id)}${existing.has(this._sourceKey(id, this._defaultSignalKeyForEntity(id))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !entityId || (selectedKey ? existing.has(selectedKey) : false)}
          @click=${() => {
            this._addSourceWithDefaults(entityId, config, {
              resetExternalPicker: true,
              signalKey: this._defaultSignalKeyForEntity(entityId),
            });
          }}
        >
          + Add Source
        </button>
      </div>
    `;
  }

  private _renderSourceEditor(config: OccupancyConfig, source: OccupancySource, sourceIndex: number) {
    const draft = source;
    const labels = this._eventLabelsForSource(source);
    const sourceKey = this._sourceKeyFromSource(source);
    const supportsOffBehavior = this._supportsOffBehavior(source);
    const defaultTimeoutSeconds = config.default_timeout || 300;
    const rememberedOnTimeout = this._onTimeoutMemory[sourceKey];
    const onTimeoutSeconds = draft.on_timeout === null
      ? (rememberedOnTimeout ?? defaultTimeoutSeconds)
      : (draft.on_timeout ?? rememberedOnTimeout ?? defaultTimeoutSeconds);
    const onTimeoutMinutes = Math.max(1, Math.min(120, Math.round(onTimeoutSeconds / 60)));
    const offTrailingSeconds = draft.off_trailing ?? 0;
    const offTrailingMinutes = Math.max(0, Math.min(120, Math.round(offTrailingSeconds / 60)));

    return html`
      <div class="source-editor">
        ${(this._isMediaEntity(source.entity_id) || source.entity_id.startsWith("light.")) && source.signal_key
          ? html`<div class="media-signals">Signal: ${this._mediaSignalLabel(source.signal_key)} (${this._signalDescription(source.signal_key)}).</div>`
          : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${sourceIndex}">${labels.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(draft.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(draft, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${sourceIndex}"
              .value=${draft.on_event || "trigger"}
              @change=${(ev: Event) => {
                this._updateSourceDraft(config, sourceIndex, {
                  ...draft,
                  on_event: (ev.target as HTMLSelectElement).value as "trigger" | "none",
                });
              }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${sourceIndex}">${labels.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${sourceIndex}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(onTimeoutMinutes)}
                ?disabled=${draft.on_timeout === null}
                @input=${(ev: Event) => {
                  const minutes = Number((ev.target as HTMLInputElement).value) || 1;
                  this._onTimeoutMemory = {
                    ...this._onTimeoutMemory,
                    [sourceKey]: minutes * 60,
                  };
                  this._updateSourceDraft(config, sourceIndex, { ...draft, on_timeout: minutes * 60 });
                }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(onTimeoutMinutes)}
                ?disabled=${draft.on_timeout === null}
                @change=${(ev: Event) => {
                  const minutes = Math.max(1, Math.min(120, Number((ev.target as HTMLInputElement).value) || 1));
                  this._onTimeoutMemory = {
                    ...this._onTimeoutMemory,
                    [sourceKey]: minutes * 60,
                  };
                  this._updateSourceDraft(config, sourceIndex, { ...draft, on_timeout: minutes * 60 });
                }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${draft.on_timeout === null}
                @change=${(ev: Event) => {
                  const checked = (ev.target as HTMLInputElement).checked;
                  const remembered = this._onTimeoutMemory[sourceKey];
                  const fallbackSeconds = onTimeoutMinutes * 60;
                  const restoreSeconds = remembered ?? fallbackSeconds;
                  if (checked) {
                    this._onTimeoutMemory = {
                      ...this._onTimeoutMemory,
                      [sourceKey]: draft.on_timeout ?? restoreSeconds,
                    };
                  }
                  this._updateSourceDraft(config, sourceIndex, {
                    ...draft,
                    on_timeout: checked ? null : restoreSeconds,
                  });
                }}
              />
              Indefinite (until ${labels.offState})
            </label>
          </div>

          ${supportsOffBehavior
            ? html`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${sourceIndex}">${labels.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(draft, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${sourceIndex}"
                    .value=${draft.off_event || "none"}
                    @change=${(ev: Event) => {
                      this._updateSourceDraft(config, sourceIndex, {
                        ...draft,
                        off_event: (ev.target as HTMLSelectElement).value as "clear" | "none",
                      });
                    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${sourceIndex}">${labels.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${sourceIndex}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(offTrailingMinutes)}
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @input=${(ev: Event) => {
                        const minutes = Math.max(0, Math.min(120, Number((ev.target as HTMLInputElement).value) || 0));
                        this._updateSourceDraft(config, sourceIndex, { ...draft, off_trailing: minutes * 60 });
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(offTrailingMinutes)}
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @change=${(ev: Event) => {
                        const minutes = Math.max(0, Math.min(120, Number((ev.target as HTMLInputElement).value) || 0));
                        this._updateSourceDraft(config, sourceIndex, { ...draft, off_trailing: minutes * 60 });
                      }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  private _renderActionsTab(triggerType: "occupied" | "vacant") {
    if (!this.location) return "";

    const rules = this._actionRules.filter((rule) => rule.trigger_type === triggerType);
    const sectionTitle = triggerType === "occupied" ? "Occupied Actions" : "Vacant Actions";
    const emptyText =
      triggerType === "occupied"
        ? "No Topomation occupied automations configured."
        : "No Topomation vacant automations configured.";
    const infoText =
      triggerType === "occupied"
        ? "Rules in this tab run when occupancy changes to occupied."
        : "Rules in this tab run when occupancy changes to vacant.";

    return html`
      <div>
        ${triggerType === "occupied" ? this._renderActionStartupConfig() : ""}
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            ${sectionTitle}
          </div>

          <div class="rules-list">
            ${this._loadingActionRules
              ? html`
                  <div class="empty-state">
                    <div class="text-muted">Loading Home Assistant automations...</div>
                  </div>
                `
              : this._actionRulesError
                ? html`
                    <div class="empty-state">
                      <div class="text-muted">${this._actionRulesError}</div>
                    </div>
                  `
                : rules.length === 0
              ? html`
                  <div class="empty-state">
                    <div class="text-muted">${emptyText}</div>
                  </div>
                `
              : rules.map(
                  (rule) => html`
                    <div class="source-item">
                      <div class="source-icon">
                        <ha-icon .icon=${"mdi:robot"}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${rule.name}</div>
                        <div class="source-details">
                          ${this._describeActionRule(rule)}
                        </div>
                        <div class="source-details">
                          ${rule.enabled ? "Enabled" : "Disabled"} • ${rule.entity_id}
                        </div>
                      </div>
                      <button
                        class="icon-button"
                        title=${rule.enabled ? "Disable automation" : "Enable automation"}
                        @click=${() => this._handleToggleRule(rule)}
                      >
                        <ha-icon .icon=${rule.enabled ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"}></ha-icon>
                      </button>
                      <button
                        class="icon-button"
                        title="Open in Home Assistant"
                        @click=${() => window.open(ruleEditPath(rule), "_blank", "noopener")}
                      >
                        <ha-icon .icon=${"mdi:open-in-new"}></ha-icon>
                      </button>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(rule)}>
                        <ha-icon .icon=${"mdi:delete-outline"}></ha-icon>
                      </button>
                    </div>
                  `
                )}
          </div>

          <button
            class="button button-primary"
            style="margin-top: 16px;"
            @click=${() => this._handleAddRule(triggerType)}
          >
            + Add Rule
          </button>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            ${infoText} Rules are created as native Home Assistant automations and tagged for this location.
          </div>
        </div>
      </div>
    `;
  }

  private _renderActionStartupConfig() {
    const config = this._getAutomationConfig();
    const reapplyOnStartup = Boolean(config.reapply_last_state_on_startup);

    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:power-cycle"}></ha-icon>
          Startup behavior
        </div>

        <div class="config-row startup-config-row">
          <div class="startup-config-header">
            <div class="config-label">Reapply current occupancy actions on startup</div>
            <div class="config-value">
              <input
                type="checkbox"
                class="switch-input"
                .checked=${reapplyOnStartup}
                @change=${(ev: Event) => {
                  const checked = (ev.target as HTMLInputElement).checked;
                  this._updateAutomationConfig({
                    ...config,
                    reapply_last_state_on_startup: checked,
                  });
                }}
              />
            </div>
          </div>
          <div class="config-help">
            After Home Assistant is fully started, Topomation waits briefly then reruns
            this location's occupied or vacant automations based on current
            occupancy state.
          </div>
        </div>
      </div>
    `;
  }

  private _describeActionRule(rule: TopomationActionRule): string {
    const triggerLabel = rule.trigger_type === "occupied" ? "occupied" : "vacant";
    const actionService = rule.action_service || "run";
    const actionEntity = rule.action_entity_id || "target";
    return `When ${triggerLabel} -> ${actionService} ${actionEntity}`;
  }

  private _workingSources(config: OccupancyConfig): OccupancySource[] {
    return this._stagedSources ? [...this._stagedSources] : [...(config.occupancy_sources || [])];
  }

  private _setWorkingSources(config: OccupancyConfig, sources: OccupancySource[]): void {
    const normalized = sources.map((source) => this._normalizeSource(source.entity_id, source));
    const nextMemory = { ...this._onTimeoutMemory };
    for (const source of normalized) {
      if (typeof source.on_timeout === "number" && source.on_timeout > 0) {
        nextMemory[this._sourceKeyFromSource(source)] = source.on_timeout;
      }
    }
    this._onTimeoutMemory = nextMemory;
    this._stagedSources = normalized;
    this._sourcesDirty = true;
    this.requestUpdate();
  }

  private _updateSourceDraft(config: OccupancyConfig, sourceIndex: number, draft: OccupancySource): void {
    const sources = this._workingSources(config);
    const current = sources[sourceIndex];
    if (!current) return;
    const supportedModes = this._modeOptionsForEntity(current.entity_id).map((opt) => opt.value);
    const normalizedDraft = this._normalizeSource(
      current.entity_id,
      {
        ...draft,
        mode: supportedModes.includes(draft.mode) ? draft.mode : supportedModes[0],
      }
    );
    sources[sourceIndex] = normalizedDraft;
    this._setWorkingSources(config, sources);
  }

  private _removeSource(sourceIndex: number, config: OccupancyConfig): void {
    const sources = this._workingSources(config);
    const removed = sources[sourceIndex];
    if (!removed) return;
    sources.splice(sourceIndex, 1);
    const nextMemory = { ...this._onTimeoutMemory };
    delete nextMemory[this._sourceKeyFromSource(removed)];
    this._onTimeoutMemory = nextMemory;
    this._setWorkingSources(config, sources);
  }

  private _addSourceWithDefaults(
    entityId: string,
    config: OccupancyConfig,
    options?: { resetExternalPicker?: boolean; signalKey?: SourceSignalKey }
  ): void {
    if (!this.location || this._isFloorLocation()) return;
    const existing = this._workingSources(config);
    const targetKey = this._sourceKey(entityId, options?.signalKey);
    if (existing.some((source) => this._sourceKeyFromSource(source) === targetKey)) {
      return;
    }

    const entity = this.hass.states[entityId];
    if (!entity) {
      this._showToast(`Entity not found: ${entityId}`, "error");
      return;
    }

    const defaults = getSourceDefaultsForEntity(entity);
    let signalDefaults: Partial<OccupancySource> = defaults;
    if (options?.signalKey === "playback" || options?.signalKey === "volume" || options?.signalKey === "mute") {
      signalDefaults = this._mediaSignalDefaults(entityId, options.signalKey);
    } else if (options?.signalKey === "power" || options?.signalKey === "level" || options?.signalKey === "color") {
      signalDefaults = this._lightSignalDefaults(entityId, options.signalKey);
    }
    const source = this._normalizeSource(entityId, signalDefaults);
    this._setWorkingSources(config, [...existing, source]);

    if (options?.resetExternalPicker) {
      this._externalAreaId = "";
      this._externalEntityId = "";
      this.requestUpdate();
    }
  }

  private _discardSourceChanges = (): void => {
    this._stagedSources = undefined;
    this._sourcesDirty = false;
    this.requestUpdate();
  };

  private _saveSourceChanges = async (): Promise<void> => {
    if (!this.location || !this._stagedSources || !this._sourcesDirty) return;
    await this._persistOccupancySources(this._stagedSources);
    this._stagedSources = undefined;
    this._sourcesDirty = false;
    this.requestUpdate();
    this._showToast("Saved source changes", "success");
  }

  private async _persistOccupancySources(sources: OccupancySource[]): Promise<void> {
    if (!this.location) return;
    const config = this._getOccupancyConfig();
    this._savingSource = true;
    this.requestUpdate();
    try {
      await this._updateConfig({
        ...config,
        occupancy_sources: sources,
      });
    } finally {
      this._savingSource = false;
      this.requestUpdate();
    }
  }

  private _normalizeSource(entityId: string, partial: Partial<OccupancySource>): OccupancySource {
    const isMedia = this._isMediaEntity(entityId);
    const isDimmable = this._isDimmableEntity(entityId);
    const isColorCapable = this._isColorCapableEntity(entityId);
    const signalFromSourceId = partial.source_id?.includes("::")
      ? (partial.source_id.split("::")[1] as SourceSignalKey)
      : undefined;
    const defaultSignalKey = this._defaultSignalKeyForEntity(entityId);
    const requestedSignalKey = partial.signal_key || signalFromSourceId || defaultSignalKey;
    let signalKey: SourceSignalKey | undefined;

    if (isMedia && (requestedSignalKey === "playback" || requestedSignalKey === "volume" || requestedSignalKey === "mute")) {
      signalKey = requestedSignalKey;
    } else if ((isDimmable || isColorCapable) && (requestedSignalKey === "power" || requestedSignalKey === "level" || requestedSignalKey === "color")) {
      signalKey = requestedSignalKey;
    }

    const sourceId = partial.source_id || this._sourceKey(entityId, signalKey);

    return {
      entity_id: entityId,
      source_id: sourceId,
      signal_key: signalKey,
      mode: (partial.mode || "any_change") as "any_change" | "specific_states",
      on_event: (partial.on_event || "trigger") as "trigger" | "none",
      on_timeout: partial.on_timeout,
      off_event: (partial.off_event || "none") as "clear" | "none",
      off_trailing: partial.off_trailing ?? 0,
    };
  }

  private _getOccupancyConfig(): OccupancyConfig {
    return ((this.location?.modules?.occupancy || {}) as OccupancyConfig) || {};
  }

  private _getAutomationConfig(): AutomationConfig {
    return ((this.location?.modules?.automation || {}) as AutomationConfig) || {};
  }

  private async _updateAutomationConfig(config: AutomationConfig): Promise<void> {
    await this._updateModuleConfig("automation", config);
  }

  private _availableSourceAreas(): Array<{ area_id: string; name: string }> {
    const currentAreaId = this.location?.ha_area_id;
    const areaMap = this.hass?.areas || {};
    const areas = Object.values(areaMap) as Array<{ area_id?: string; name?: string }>;
    return areas
      .filter((area) => !!area.area_id)
      .filter((area) => area.area_id !== currentAreaId)
      .map((area) => ({
        area_id: area.area_id!,
        name: area.name || area.area_id!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private _entitiesForArea(areaId: string): string[] {
    const states = this.hass?.states || {};
    if (areaId === "__all__") {
      return Object.keys(states)
        .filter((entityId) => this._isCandidateEntity(entityId))
        .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
    }
    return Object.keys(states)
      .filter((entityId) => {
        const registryAreaId = this._entityAreaById[entityId];
        if (registryAreaId !== undefined) {
          return registryAreaId === areaId;
        }
        return states[entityId]?.attributes?.area_id === areaId;
      })
      .filter((entityId) => this._isCandidateEntity(entityId))
      .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _isCandidateEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const attrs = stateObj.attributes || {};
    if (attrs.device_class === "occupancy" && attrs.location_id) return false;
    const domain = entityId.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(domain)) {
      return true;
    }
    if (domain === "binary_sensor") {
      const deviceClass = String(attrs.device_class || "");
      if (!deviceClass) return true;
      return [
        "motion",
        "occupancy",
        "presence",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
      ].includes(deviceClass);
    }
    return false;
  }

  private _getOccupancyState() {
    if (!this.location) return undefined;
    const states = this.hass?.states || {};
    for (const stateObj of Object.values(states)) {
      const attrs = stateObj?.attributes || {};
      if (attrs.device_class !== "occupancy") continue;
      if (attrs.location_id !== this.location.id) continue;
      return stateObj as Record<string, any>;
    }
    return undefined;
  }

  private _getLockState(): InspectorLockState {
    const occupancyState = this._getOccupancyState();
    const attrs = occupancyState?.attributes || {};
    const lockedByRaw = attrs.locked_by;
    const lockModesRaw = attrs.lock_modes;
    const directLocksRaw = attrs.direct_locks;

    const lockedBy = Array.isArray(lockedByRaw) ? lockedByRaw.map((item: unknown) => String(item)) : [];
    const lockModes = Array.isArray(lockModesRaw) ? lockModesRaw.map((item: unknown) => String(item)) : [];
    const directLocks = Array.isArray(directLocksRaw)
      ? directLocksRaw
          .map((item: any) => ({
            sourceId: String(item?.source_id || "unknown"),
            mode: String(item?.mode || "freeze"),
            scope: String(item?.scope || "self"),
          }))
          .sort((a: OccupancyLockDirective, b: OccupancyLockDirective) =>
            `${a.sourceId}:${a.mode}:${a.scope}`.localeCompare(`${b.sourceId}:${b.mode}:${b.scope}`)
          )
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

    const explicitVacantAt = this._parseDateValue(attrs.vacant_at) || this._parseDateValue(attrs.effective_timeout_at);
    if (explicitVacantAt) {
      return explicitVacantAt;
    }

    const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
    if (!contributions.length) {
      return undefined;
    }

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

    if (hasIndefiniteContribution) {
      return null;
    }
    return latestExpiry;
  }

  private _parseDateValue(value: unknown): Date | undefined {
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

  private _formatRelativeDuration(target: Date): string {
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - this._nowEpochMs) / 1000));
    if (totalSeconds <= 0) return "now";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`);
    if (parts.length === 0 || (days === 0 && hours === 0 && minutes === 0)) parts.push(`${seconds}s`);

    return parts.slice(0, 2).join(" ");
  }

  private _lockModeLabel(mode: string): string {
    if (mode === "block_occupied") return "Block occupied";
    if (mode === "block_vacant") return "Block vacant";
    return "Freeze";
  }

  private _lockScopeLabel(scope: string): string {
    if (scope === "subtree") return "Subtree";
    return "Self";
  }

  private _startClockTicker(): void {
    if (this._clockTimer !== undefined) return;
    this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1000);
  }

  private _stopClockTicker(): void {
    if (this._clockTimer === undefined) return;
    window.clearInterval(this._clockTimer);
    this._clockTimer = undefined;
  }

  private _describeSource(source: any, defaultTimeout: number): string {
    const mode = source.mode === "any_change" ? "Any change" : "Specific states";
    const onTimeout = source.on_timeout === null ? null : (source.on_timeout ?? defaultTimeout);
    const offTrailing = source.off_trailing ?? 0;
    const onBehavior =
      source.on_event === "trigger"
        ? `ON: trigger (${this._formatDuration(onTimeout)})`
        : "ON: ignore";
    const offBehavior =
      source.off_event === "clear"
        ? `OFF: clear (${this._formatDuration(offTrailing)})`
        : "OFF: ignore";
    return `${mode} • ${onBehavior} • ${offBehavior}`;
  }

  private _renderSourceEventChips(source: any, defaultTimeout: number) {
    const chips = [];
    const onTimeout = source.on_timeout === null ? null : (source.on_timeout ?? defaultTimeout);
    const offTrailing = source.off_trailing ?? 0;
    if (source.on_event === "trigger") {
      chips.push(html`<span class="event-chip">ON -> trigger (${this._formatDuration(onTimeout)})</span>`);
    } else {
      chips.push(html`<span class="event-chip ignore">ON ignored</span>`);
    }

    if (source.off_event === "clear") {
      chips.push(
        html`<span class="event-chip off">OFF -> clear (${this._formatDuration(offTrailing)})</span>`
      );
    } else {
      chips.push(html`<span class="event-chip ignore">OFF ignored</span>`);
    }
    return chips;
  }

  private _modeOptionsForEntity(entityId: string): Array<{ value: "any_change" | "specific_states"; label: string }> {
    const stateObj = this.hass?.states?.[entityId];
    const attrs = stateObj?.attributes || {};
    const domain = entityId.split(".", 1)[0];
    const deviceClass = String(attrs.device_class || "");

    if (domain === "person" || domain === "device_tracker") {
      return [{ value: "specific_states", label: "Specific states" }];
    }

    if (domain === "binary_sensor") {
      if (["door", "garage_door", "opening", "window", "motion", "presence", "occupancy"].includes(deviceClass)) {
        return [{ value: "specific_states", label: "Specific states" }];
      }
      return [
        { value: "specific_states", label: "Specific states" },
        { value: "any_change", label: "Any change" },
      ];
    }

    if (["light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(domain)) {
      return [{ value: "any_change", label: "Any change" }];
    }

    return [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" },
    ];
  }

  private _supportsOffBehavior(source: OccupancySource): boolean {
    const domain = source.entity_id.split(".", 1)[0];
    if (domain === "media_player" && (source.signal_key === "volume" || source.signal_key === "mute")) {
      return false;
    }
    if (domain === "light" && (source.signal_key === "level" || source.signal_key === "color")) {
      return false;
    }
    return true;
  }

  private _eventLabelsForSource(source: OccupancySource): {
    onState: string;
    offState: string;
    onBehavior: string;
    onTimeout: string;
    offBehavior: string;
    offDelay: string;
  } {
    const entityId = source.entity_id;
    const stateObj = this.hass?.states?.[entityId];
    const attrs = stateObj?.attributes || {};
    const domain = entityId.split(".", 1)[0];
    const deviceClass = String(attrs.device_class || "");

    let onState = "ON";
    let offState = "OFF";

    if (domain === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(deviceClass)) {
      onState = "Open";
      offState = "Closed";
    } else if (domain === "binary_sensor" && deviceClass === "motion") {
      onState = "Motion";
      offState = "No motion";
    } else if (domain === "binary_sensor" && ["presence", "occupancy"].includes(deviceClass)) {
      onState = "Detected";
      offState = "Not detected";
    } else if (domain === "person" || domain === "device_tracker") {
      onState = "Home";
      offState = "Away";
    } else if (domain === "media_player") {
      if (source.signal_key === "volume") {
        return {
          onState: "Volume change",
          offState: "No volume change",
          onBehavior: "Volume change behavior",
          onTimeout: "Volume timeout",
          offBehavior: "No-volume behavior",
          offDelay: "No-volume delay",
        };
      }
      if (source.signal_key === "mute") {
        return {
          onState: "Mute change",
          offState: "No mute change",
          onBehavior: "Mute change behavior",
          onTimeout: "Mute timeout",
          offBehavior: "No-mute behavior",
          offDelay: "No-mute delay",
        };
      }
      return {
        onState: "Playing",
        offState: "Paused/idle",
        onBehavior: "Playing behavior",
        onTimeout: "Playing timeout",
        offBehavior: "Paused/idle behavior",
        offDelay: "Paused/idle delay",
      };
    } else if (domain === "light" && source.signal_key === "level") {
      return {
        onState: "Level change",
        offState: "No level change",
        onBehavior: "Level change behavior",
        onTimeout: "Level timeout",
        offBehavior: "No-level behavior",
        offDelay: "No-level delay",
      };
    } else if (domain === "light" && source.signal_key === "color") {
      return {
        onState: "Color change",
        offState: "No color change",
        onBehavior: "Color change behavior",
        onTimeout: "Color timeout",
        offBehavior: "No-color behavior",
        offDelay: "No-color delay",
      };
    } else if (domain === "light" && source.signal_key === "power") {
      onState = "On";
      offState = "Off";
    } else if (domain === "light" || domain === "switch" || domain === "fan") {
      onState = "On";
      offState = "Off";
    }

    return {
      onState,
      offState,
      onBehavior: `${onState} behavior`,
      onTimeout: `${onState} timeout`,
      offBehavior: `${offState} behavior`,
      offDelay: `${offState} delay`,
    };
  }

  private _formatDuration(seconds?: number | null): string {
    if (seconds === null) return "indefinite";
    if (!seconds || seconds <= 0) return "0m";
    return `${Math.floor(seconds / 60)}m`;
  }

  private _entityName(entityId: string): string {
    return this.hass.states[entityId]?.attributes?.friendly_name || entityId;
  }

  private _entityState(entityId: string): string {
    const state = this.hass.states[entityId]?.state;
    if (!state) return "unknown";
    return state;
  }

  private async _handleTestSource(source: any, action: "trigger" | "clear"): Promise<void> {
    if (!this.location || this._isFloorLocation()) return;

    try {
      if (action === "trigger") {
        const fallback = ((this.location.modules.occupancy || {}) as OccupancyConfig).default_timeout || 300;
        const timeout = source.on_timeout === null ? fallback : (source.on_timeout ?? fallback);
        const sourceId = source.source_id || source.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: "trigger",
          service_data: {
            location_id: this.location.id,
            source_id: sourceId,
            timeout,
          },
        });
        this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "trigger",
              locationId: this.location.id,
              sourceId,
              timeout,
            },
            bubbles: true,
            composed: true,
          })
        );
        this._showToast(`Triggered ${sourceId}`, "success");
        return;
      }

      const trailing_timeout = source.off_trailing ?? 0;
      const sourceId = source.source_id || source.entity_id;
      await this.hass.callWS({
        type: "call_service",
        domain: "topomation",
        service: "clear",
        service_data: {
          location_id: this.location.id,
          source_id: sourceId,
          trailing_timeout,
        },
      });
      this.dispatchEvent(
        new CustomEvent("source-test", {
          detail: {
            action: "clear",
            locationId: this.location.id,
            sourceId,
            trailing_timeout,
          },
          bubbles: true,
          composed: true,
        })
      );
      this._showToast(`Cleared ${sourceId}`, "success");
    } catch (err: any) {
      console.error("Failed to test source event:", err);
      this._showToast(err?.message || "Failed to run source test", "error");
    }
  }

  private _showToast(message: string, type: "success" | "error" = "success"): void {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message,
          type: type === "error" ? "error" : undefined,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleAddRule(triggerType: "occupied" | "vacant" = "occupied"): void {
    this.dispatchEvent(
      new CustomEvent("add-rule", {
        detail: { trigger_type: triggerType },
        bubbles: true,
        composed: true,
      })
    );
  }

  private async _handleDeleteRule(rule: TopomationActionRule): Promise<void> {
    if (!confirm(`Delete automation \"${rule.name}\"?`)) return;
    try {
      await deleteTopomationActionRule(this.hass, rule.id);
      this._showToast(`Deleted automation \"${rule.name}\"`, "success");
      await this._loadActionRules();
    } catch (err: any) {
      console.error("Failed to delete automation rule:", err);
      this._showToast(err?.message || "Failed to delete automation", "error");
    }
  }

  private async _handleToggleRule(rule: TopomationActionRule): Promise<void> {
    const nextEnabled = !rule.enabled;
    try {
      await setTopomationActionRuleEnabled(this.hass, rule, nextEnabled);
      this._showToast(
        `${nextEnabled ? "Enabled" : "Disabled"} automation \"${rule.name}\"`,
        "success"
      );
      await this._loadActionRules();
    } catch (err: any) {
      console.error("Failed to toggle automation rule:", err);
      this._showToast(err?.message || "Failed to update automation state", "error");
    }
  }

  private async _updateModuleConfig(moduleId: string, config: any): Promise<void> {
    if (!this.location) return;

    try {
      await this.hass.callWS({
        type: "topomation/locations/set_module_config",
        location_id: this.location.id,
        module_id: moduleId,
        config,
      });

      // Update local state
      this.location.modules[moduleId] = config;
      this.requestUpdate();
    } catch (err) {
      console.error("Failed to update config:", err);
      alert("Failed to update configuration");
    }
  }

  private _toggleEnabled(_e?: Event): void {
    if (!this.location || this._isFloorLocation()) return;

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    const newEnabled = !(config.enabled ?? true);

    this._updateConfig({ ...config, enabled: newEnabled });
  }

  private _handleTimeoutSliderInput(e: Event): void {
    const slider = e.target as HTMLInputElement;
    const container = slider.closest(".config-value");
    if (!container) return;
    const numberInput = container.querySelector("input.input") as HTMLInputElement | null;
    if (numberInput) {
      numberInput.value = slider.value;
    }
  }

  private _handleTimeoutChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const parsed = parseInt(input.value, 10);
    if (Number.isNaN(parsed)) return;
    const minutes = Math.max(1, Math.min(120, parsed));
    input.value = String(minutes);
    const seconds = minutes * 60;

    const container = input.closest(".config-value");
    if (container) {
      const slider = container.querySelector("input.timeout-slider") as HTMLInputElement | null;
      if (slider) slider.value = String(minutes);
      const numberInput = container.querySelector("input.input") as HTMLInputElement | null;
      if (numberInput) numberInput.value = String(minutes);
    }

    if (!this.location || this._isFloorLocation()) return;

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    this._updateConfig({ ...config, default_timeout: seconds });
  }

  private async _updateConfig(config: OccupancyConfig): Promise<void> {
    await this._updateModuleConfig("occupancy", config);
  }

  private _isFloorLocation(): boolean {
    return !!this.location && getLocationType(this.location) === "floor";
  }
}

if (!customElements.get("ht-location-inspector")) {
  try {
    console.log("[ht-location-inspector] registering custom element");
    customElements.define("ht-location-inspector", HtLocationInspector);
  } catch (err) {
    console.error("[ht-location-inspector] failed to define element", err);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-location-inspector": HtLocationInspector;
  }
}
