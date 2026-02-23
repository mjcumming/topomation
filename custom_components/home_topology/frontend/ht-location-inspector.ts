import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, OccupancyConfig, AutomationConfig, OccupancySource } from "./types";
import { sharedStyles } from "./styles";
import { getLocationIcon } from "./icon-utils";
import { getLocationType } from "./hierarchy-rules";
import { applyModeDefaults, getSourceDefaultsForEntity } from "./source-profile-utils";

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

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    location: { attribute: false },
  };

  @state() private _activeTab: "occupancy" | "actions" = "occupancy";
  @state() private _editingSourceIndex?: number;
  @state() private _sourceDraft?: OccupancySource;
  @state() private _savingSource = false;
  @state() private _externalAreaId = "";
  @state() private _externalEntityId = "";

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

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        cursor: pointer;
      }

      .candidate-item:hover {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.03);
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

      .candidate-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
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
        margin-top: 10px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px;
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(180px, 1fr));
        gap: 10px 12px;
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
    if (changedProps.has("location")) {
      this._cancelEditSource();
      this._externalAreaId = "";
      this._externalEntityId = "";
    }
  }

  private _renderHeader() {
    if (!this.location) return "";

    return html`
      <div class="header">
        <div class="header-icon">
          <ha-icon .icon=${getLocationIcon(this.location)}></ha-icon>
        </div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">
            <span class="id-label">Identifier:</span>${this.location.id}
          </div>
        </div>
      </div>
    `;
  }

  private _renderTabs() {
    return html`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "occupancy" ? "active" : ""}"
          @click=${() => (this._activeTab = "occupancy")}
        >
          Occupancy
        </button>
        <button
          class="tab ${this._activeTab === "actions" ? "active" : ""}"
          @click=${() => (this._activeTab = "actions")}
        >
          Actions
        </button>
      </div>
    `;
  }

  private _renderContent() {
    return html`
      <div class="tab-content">
        ${this._activeTab === "occupancy"
          ? this._renderOccupancyTab()
          : this._renderActionsTab()}
      </div>
    `;
  }

  private _renderOccupancyTab() {
    if (!this.location) return "";

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    const isFloor = this._isFloorLocation();
    const enabled = config.enabled ?? true;
    const timeout = config.default_timeout || 300;
    const floorSourceCount = (config.occupancy_sources || []).length;

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
        <!-- Occupancy settings -->
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:tune-variant"}></ha-icon>
            Occupancy Controls
          </div>
          <div class="settings-grid">
            <div class="config-row">
              <div class="config-label">Occupancy Tracking Enabled</div>
              <div class="config-value">
                <input
                  class="switch-input"
                  type="checkbox"
                  .checked=${enabled}
                  @change=${this._toggleEnabled}
                />
                <span class="text-muted">${enabled ? "On" : "Off"}</span>
              </div>
            </div>

            ${enabled ? html`
              <div class="config-row">
                <div class="config-label">Default Timeout</div>
                <div class="config-value">
                  <input
                    class="timeout-slider"
                    type="range"
                    min="1"
                    max="120"
                    step="1"
                    .value=${String(Math.max(1, Math.floor(timeout / 60)))}
                    @input=${this._handleTimeoutSliderInput}
                    @change=${this._handleTimeoutChange}
                  />
                  <input
                    type="number"
                    class="input"
                    min="1"
                    max="120"
                    .value=${Math.max(1, Math.floor(timeout / 60))}
                    @change=${this._handleTimeoutChange}
                  />
                  <span class="text-muted">min</span>
                </div>
              </div>
            ` : ""}
          </div>
        </div>

        <!-- Occupancy sources -->
        ${enabled ? html`
          <div class="card-section">
            <div class="section-title">
              Occupancy Sources
            </div>
            <div class="subsection-header">
              <div class="subsection-title">Area Sensors</div>
            </div>
            <div class="subsection-help">
              Use sensors assigned to this area first. For cross-area behavior, add a sensor from another area below.
            </div>
            ${this._renderExternalSourceComposer(config)}
            ${this._renderAreaSensorList(config)}
            <div class="subsection-header">
              <div class="subsection-title">Configured Sensors</div>
            </div>
            <div class="sources-list">
              ${this._renderOccupancySources(config)}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  private _renderAreaSensorList(config: OccupancyConfig) {
    if (!this.location) return "";
    const sources = config.occupancy_sources || [];
    const sourceIndexByEntity = new Map<string, number>();
    sources.forEach((source, index) => sourceIndexByEntity.set(source.entity_id, index));

    const entityIds = [...(this.location.entity_ids || [])].sort((a, b) =>
      this._entityName(a).localeCompare(this._entityName(b))
    );

    if (!entityIds.length) {
      return html`
        <div class="empty-state">
          <div class="text-muted">
            No entities are assigned to this area in Home Assistant yet.
            Add entities to this area, or add one from another area.
          </div>
        </div>
      `;
    }

    return html`
      <div class="candidate-list">
        ${entityIds.map((entityId) => {
          const sourceIndex = sourceIndexByEntity.get(entityId);
          const configured = sourceIndex !== undefined;
          const source = configured ? sources[sourceIndex] : undefined;
          return html`
            <div
              class="candidate-item"
            >
              <div>
                <div class="candidate-title">${this._entityName(entityId)}</div>
                <div class="candidate-meta">${entityId} • ${this._entityState(entityId)}</div>
              </div>
              <div class="candidate-actions">
                <span class="status-pill ${configured ? "active" : ""}">
                  ${configured ? "Configured" : "Available"}
                </span>
                ${configured && source
                  ? html`
                      <button
                        class="mini-button"
                        title="Configure this source"
                        @click=${(ev: Event) => {
                          ev.stopPropagation();
                          this._beginEditSource(source, sourceIndex);
                        }}
                      >
                        Configure
                      </button>
                    `
                  : html`
                      <button
                        class="mini-button"
                        data-testid="use-area-source-button"
                        data-entity-id=${entityId}
                        ?disabled=${this._savingSource}
                        title="Use default occupancy behavior for this sensor"
                        @click=${async (ev: Event) => {
                          ev.stopPropagation();
                          await this._addSourceWithDefaults(entityId, {
                            successMessage: `Added ${this._entityName(entityId)}`,
                          });
                        }}
                      >
                        Use Default
                      </button>
                    `}
              </div>
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
    const existing = new Set((config.occupancy_sources || []).map((source) => source.entity_id));

    return html`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">Other Area</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${selectedAreaId}
            @change=${(ev: Event) => {
              const nextAreaId = (ev.target as HTMLSelectElement).value;
              this._externalAreaId = nextAreaId;
              this._externalEntityId = "";
            }}
          >
            <option value="">Select area...</option>
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
            }}
            ?disabled=${!selectedAreaId}
          >
            <option value="">Select sensor...</option>
            ${entityOptions.map((id) => html`
              <option value=${id} ?disabled=${existing.has(id)}>
                ${this._entityName(id)}${existing.has(id) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !entityId || existing.has(entityId)}
          @click=${async () => {
            await this._addSourceWithDefaults(entityId, {
              resetExternalPicker: true,
              successMessage: `Added ${this._entityName(entityId)} from another area`,
            });
          }}
        >
          + Add
        </button>
      </div>
    `;
  }

  private _renderOccupancySources(config: OccupancyConfig) {
    const sources = config.occupancy_sources || [];

    if (!sources.length) {
      return html`
        <div class="empty-state">
          <div class="text-muted">
            No sensors configured yet. Use “Use Default” above or add one from another area.
          </div>
        </div>
      `;
    }

    return html`
      ${sources.map(
        (source, index) => html`
          <div class="source-item">
            <div class="source-icon">
              <ha-icon .icon=${"mdi:target"}></ha-icon>
            </div>
            <div class="source-info">
              <div class="source-name">${this._entityName(source.entity_id)}</div>
              <div class="source-details">
                ${source.entity_id} • ${this._describeSource(source, config.default_timeout || 300)}
              </div>
              <div class="source-events">
                ${this._renderSourceEventChips(source, config.default_timeout || 300)}
              </div>
            </div>
            <div class="source-actions">
              <button
                class="mini-button"
                title="Edit source behavior"
                @click=${() => this._beginEditSource(source, index)}
              >
                ${this._editingSourceIndex === index ? "Editing" : "Configure"}
              </button>
              <button
                class="mini-button"
                title="Send test trigger for this source"
                ?disabled=${source.on_event !== "trigger"}
                @click=${() => this._handleTestSource(source, "trigger")}
              >
                Test ON
              </button>
              <button
                class="mini-button"
                title="Send test clear for this source"
                ?disabled=${source.off_event !== "clear"}
                @click=${() => this._handleTestSource(source, "clear")}
              >
                Test OFF
              </button>
              <button
                class="mini-button"
                title="Remove this source"
                ?disabled=${this._savingSource}
                @click=${() => this._removeSource(index)}
              >
                Remove
              </button>
            </div>
            ${this._editingSourceIndex === index && this._sourceDraft
              ? this._renderSourceEditor(config, source, index)
              : ""}
          </div>
        `
      )}
    `;
  }

  private _renderSourceEditor(config: OccupancyConfig, source: OccupancySource, sourceIndex: number) {
    const draft = this._sourceDraft!;
    const entity = this.hass.states[source.entity_id];
    const defaultTimeoutSeconds = config.default_timeout || 300;
    const onTimeoutSeconds = draft.on_timeout === null ? defaultTimeoutSeconds : (draft.on_timeout ?? defaultTimeoutSeconds);
    const onTimeoutMinutes = Math.max(1, Math.min(120, Math.round(onTimeoutSeconds / 60)));
    const offTrailingSeconds = draft.off_trailing ?? 0;
    const offTrailingMinutes = Math.max(0, Math.min(120, Math.round(offTrailingSeconds / 60)));

    return html`
      <div class="source-editor">
        <div class="editor-grid">
          <div class="editor-field">
            <label for="source-mode-${sourceIndex}">Mode</label>
            <select
              id="source-mode-${sourceIndex}"
              .value=${draft.mode}
              @change=${(ev: Event) => {
                const mode = (ev.target as HTMLSelectElement).value as "any_change" | "specific_states";
                const next = applyModeDefaults(draft, mode, entity) as OccupancySource;
                this._sourceDraft = { ...next, entity_id: draft.entity_id };
              }}
            >
              <option value="any_change">Any change</option>
              <option value="specific_states">Specific states</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-event-${sourceIndex}">ON behavior</label>
            <select
              id="source-on-event-${sourceIndex}"
              .value=${draft.on_event || "trigger"}
              @change=${(ev: Event) => {
                this._sourceDraft = {
                  ...draft,
                  on_event: (ev.target as HTMLSelectElement).value as "trigger" | "none",
                };
              }}
            >
              <option value="trigger">Trigger occupancy</option>
              <option value="none">Ignore</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${sourceIndex}">ON timeout</label>
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
                  this._sourceDraft = { ...draft, on_timeout: minutes * 60 };
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
                  this._sourceDraft = { ...draft, on_timeout: minutes * 60 };
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
                  this._sourceDraft = { ...draft, on_timeout: checked ? null : onTimeoutMinutes * 60 };
                }}
              />
              Indefinite (until OFF)
            </label>
          </div>

          <div class="editor-field">
            <label for="source-off-event-${sourceIndex}">OFF behavior</label>
            <select
              id="source-off-event-${sourceIndex}"
              .value=${draft.off_event || "none"}
              @change=${(ev: Event) => {
                this._sourceDraft = {
                  ...draft,
                  off_event: (ev.target as HTMLSelectElement).value as "clear" | "none",
                };
              }}
            >
              <option value="none">Ignore</option>
              <option value="clear">Clear occupancy</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-off-trailing-${sourceIndex}">OFF delay</label>
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
                  this._sourceDraft = { ...draft, off_trailing: minutes * 60 };
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
                  this._sourceDraft = { ...draft, off_trailing: minutes * 60 };
                }}
              />
              <span class="text-muted">min</span>
            </div>
          </div>
        </div>

        <div class="editor-actions">
          <button
            class="mini-button"
            ?disabled=${this._savingSource}
            @click=${async () => {
              await this._saveEditedSource(sourceIndex);
            }}
          >
            Save
          </button>
          <button
            class="mini-button"
            ?disabled=${this._savingSource}
            @click=${() => this._cancelEditSource()}
          >
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  private _renderActionsTab() {
    if (!this.location) return "";

    const config = (this.location.modules.automation || {}) as AutomationConfig;
    const rules = config.rules || [];

    return html`
      <div>
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            Automation Rules
          </div>

          <div class="rules-list">
            ${rules.length === 0
              ? html`
                  <div class="empty-state">
                    <div class="text-muted">No rules configured. Behavior is strictly manual.</div>
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
                          When ${rule.trigger_type} → ${rule.action_service}
                        </div>
                      </div>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(rule.id)}>
                        <ha-icon .icon=${"mdi:delete-outline"}></ha-icon>
                      </button>
                    </div>
                  `
                )}
          </div>

          <button
            class="button button-primary"
            style="margin-top: 16px;"
            @click=${this._handleAddRule}
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
            Rules trigger actions based on the occupancy state of this location.
            For example, you can automatically turn on lights when someone enters.
          </div>
        </div>
      </div>
    `;
  }

  private _beginEditSource(source: OccupancySource, sourceIndex: number): void {
    if (this._isFloorLocation()) {
      this._showToast("Floor source editing is disabled. Configure sources on areas.", "error");
      return;
    }
    this._editingSourceIndex = sourceIndex;
    this._sourceDraft = this._normalizeSource(source.entity_id, source);
  }

  private _cancelEditSource(): void {
    this._editingSourceIndex = undefined;
    this._sourceDraft = undefined;
  }

  private async _saveEditedSource(sourceIndex: number): Promise<void> {
    if (!this.location || !this._sourceDraft) return;
    const config = this._getOccupancyConfig();
    const sources = [...(config.occupancy_sources || [])];
    if (!sources[sourceIndex]) return;

    sources[sourceIndex] = this._normalizeSource(sources[sourceIndex].entity_id, this._sourceDraft);
    await this._persistOccupancySources(sources);
    this._cancelEditSource();
    this._showToast(`Updated ${this._entityName(sources[sourceIndex].entity_id)}`, "success");
  }

  private async _removeSource(sourceIndex: number): Promise<void> {
    if (!this.location) return;
    const config = this._getOccupancyConfig();
    const sources = [...(config.occupancy_sources || [])];
    const removed = sources[sourceIndex];
    if (!removed) return;
    sources.splice(sourceIndex, 1);
    await this._persistOccupancySources(sources);
    this._cancelEditSource();
    this._showToast(`Removed ${this._entityName(removed.entity_id)}`, "success");
  }

  private async _addSourceWithDefaults(
    entityId: string,
    options?: { resetExternalPicker?: boolean; successMessage?: string }
  ): Promise<void> {
    if (!this.location || this._isFloorLocation()) return;
    const config = this._getOccupancyConfig();
    const existing = config.occupancy_sources || [];
    if (existing.some((source) => source.entity_id === entityId)) {
      this._showToast(`${this._entityName(entityId)} is already configured`, "error");
      return;
    }

    const entity = this.hass.states[entityId];
    if (!entity) {
      this._showToast(`Entity not found: ${entityId}`, "error");
      return;
    }

    const defaults = getSourceDefaultsForEntity(entity);
    const source = this._normalizeSource(entityId, defaults);
    await this._persistOccupancySources([...existing, source]);

    if (options?.resetExternalPicker) {
      this._externalAreaId = "";
      this._externalEntityId = "";
    }
    this._showToast(options?.successMessage || `Added ${this._entityName(entityId)}`, "success");
  }

  private async _persistOccupancySources(sources: OccupancySource[]): Promise<void> {
    if (!this.location) return;
    const config = this._getOccupancyConfig();
    this._savingSource = true;
    try {
      await this._updateConfig({
        ...config,
        occupancy_sources: sources,
      });
    } finally {
      this._savingSource = false;
    }
  }

  private _normalizeSource(entityId: string, partial: Partial<OccupancySource>): OccupancySource {
    return {
      entity_id: entityId,
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
    return Object.keys(states)
      .filter((entityId) => states[entityId]?.attributes?.area_id === areaId)
      .filter((entityId) => this._isCandidateEntity(entityId))
      .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _isCandidateEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const attrs = stateObj.attributes || {};
    if (attrs.device_class === "occupancy" && attrs.location_id) return false;
    return true;
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
        await this.hass.callWS({
          type: "call_service",
          domain: "home_topology",
          service: "trigger",
          service_data: {
            location_id: this.location.id,
            source_id: source.entity_id,
            timeout,
          },
        });
        this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "trigger",
              locationId: this.location.id,
              sourceId: source.entity_id,
              timeout,
            },
            bubbles: true,
            composed: true,
          })
        );
        this._showToast(`Triggered ${source.entity_id}`, "success");
        return;
      }

      const trailing_timeout = source.off_trailing ?? 0;
      await this.hass.callWS({
        type: "call_service",
        domain: "home_topology",
        service: "clear",
        service_data: {
          location_id: this.location.id,
          source_id: source.entity_id,
          trailing_timeout,
        },
      });
      this.dispatchEvent(
        new CustomEvent("source-test", {
          detail: {
            action: "clear",
            locationId: this.location.id,
            sourceId: source.entity_id,
            trailing_timeout,
          },
          bubbles: true,
          composed: true,
        })
      );
      this._showToast(`Cleared ${source.entity_id}`, "success");
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

  private _handleAddRule(): void {
    this.dispatchEvent(new CustomEvent("add-rule", {
      bubbles: true,
      composed: true,
    }));
  }

  private async _handleDeleteRule(ruleId: string) {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    // Logic to remove rule from config and save
    if (!this.location) return;
    const config = (this.location.modules.automation || {}) as AutomationConfig;
    const rules = config.rules || [];
    const newRules = rules.filter(r => r.id !== ruleId);

    await this._updateModuleConfig("automation", { ...config, rules: newRules });
  }

  private async _updateModuleConfig(moduleId: string, config: any): Promise<void> {
    if (!this.location) return;

    try {
      await this.hass.callWS({
        type: "home_topology/locations/set_module_config",
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
