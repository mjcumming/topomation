import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location } from "./types";
import { sharedStyles } from "./styles";
import { getLocationType } from "./hierarchy-rules";
import {
  applyModeDefaults,
  getSourceDefaultsForEntity,
  getTemplatesForEntity,
  type SourceTemplate,
} from "./source-profile-utils";

console.log("[ht-add-device-dialog] module loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

interface EntitySourceConfig {
  entity_id: string;
  mode: "any_change" | "specific_states";
  on_event?: "trigger" | "none";
  on_timeout?: number | null; // null = indefinite
  off_event?: "clear" | "none";
  off_trailing?: number;
}

/**
 * Dialog for adding occupancy source entities to a location
 * Multi-step wizard: Select Entity → Choose Mode → Configure Triggers
 * See: docs/frontend-patterns.md Section 4.2
 */
export class HtAddDeviceDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public open = false;
  @property({ attribute: false }) public location?: Location;
  @property() public prefillEntityId?: string;
  @property({ type: Boolean }) public restrictToArea = true;

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    open: { type: Boolean },
    location: { attribute: false },
    prefillEntityId: { type: String },
    restrictToArea: { type: Boolean },
  };

  @state() private _step: number = 0; // 0=entity, 1=mode, 2=configure
  @state() private _config: Partial<EntitySourceConfig> = {};
  @state() private _externalAreaId = "";
  @state() private _submitting = false;
  @state() private _error?: string;

  static styles = [
    sharedStyles,
    css`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
        min-height: 200px;
      }

      .step-indicator {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
      }

      .step-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--divider-color);
      }

      .step-dot.active {
        background: var(--primary-color);
      }

      .step-dot.completed {
        background: var(--success-color);
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .mode-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mode-option {
        padding: 16px;
        border: 2px solid var(--divider-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .mode-option:hover {
        border-color: var(--primary-color);
      }

      .mode-option.selected {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .mode-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .mode-description {
        font-size: 14px;
        color: var(--text-secondary-color);
      }

      .template-list {
        display: grid;
        gap: 8px;
        margin: 12px 0 16px;
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }

      .preset-chip {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .preset-chip.active {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
      }

      .template-button {
        text-align: left;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
      }

      .template-button:hover {
        border-color: var(--primary-color);
      }

      .template-title {
        font-weight: 600;
        font-size: 13px;
      }

      .template-description {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-top: 2px;
      }

      .preview-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: rgba(var(--rgb-primary-color), 0.06);
      }

      .warning-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        background: rgba(var(--rgb-warning-color), 0.08);
        color: var(--warning-color);
        font-size: 12px;
      }

      .field-group {
        margin-bottom: 12px;
      }

      .field-label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 500;
      }

      .field-select {
        width: 100%;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 14px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .quick-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .quick-entity {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .quick-entity:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
  ];

  protected willUpdate(changedProps: Map<string, any>): void {
    super.willUpdate(changedProps as any);
    if (changedProps.has('open') && this.open) {
      // Reset wizard when dialog opens
      const prefillEntityId = this.prefillEntityId?.trim();
      this._step = prefillEntityId ? 1 : 0;
      this._config = prefillEntityId ? { entity_id: prefillEntityId } : {};
      this._externalAreaId = this._defaultExternalAreaId(prefillEntityId);
      this._error = undefined;
    }
  }

  render() {
    if (!this.open) return html``;
    if (!this.location) {
      return this._renderUnavailableDialog("Select an area location before adding occupancy sources.");
    }
    if (this._isFloorLocation()) {
      return this._renderUnavailableDialog(
        "Floor locations cannot have occupancy sources. Assign sensors to an area location."
      );
    }

    const heading = this.restrictToArea ? "Add Occupancy Source" : "Add Source From Other Area";

    return html`
      <ha-dialog
        .open=${this.open}
        data-testid="add-device-dialog"
        @closed=${this._handleClosed}
        .heading=${heading}
      >
        <div class="dialog-content">
          ${this._renderStepIndicator()}
          ${this._error ? html`<div class="error-message">${this._error}</div>` : ''}
          ${this._renderStep()}
        </div>

        ${this._step > 0 ? html`
          <mwc-button
            slot="secondaryAction"
            @click=${this._handleBack}
            .disabled=${this._submitting}
          >
            Back
          </mwc-button>
        ` : html`
          <mwc-button
            slot="secondaryAction"
            @click=${this._handleCancel}
            .disabled=${this._submitting}
          >
            Cancel
          </mwc-button>
        `}

        <mwc-button
          slot="primaryAction"
          @click=${this._handleNext}
          .disabled=${!this._canProceed() || this._submitting}
        >
          ${this._submitting ? "Adding..." : (this._step === 2 ? "Add" : "Next")}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _renderUnavailableDialog(message: string) {
    return html`
      <ha-dialog
        .open=${this.open}
        data-testid="add-device-dialog"
        @closed=${this._handleClosed}
        .heading=${"Add Occupancy Source"}
      >
        <div class="dialog-content">
          <div class="mode-description">${message}</div>
        </div>
        <mwc-button slot="primaryAction" @click=${this._handleCancel}>Close</mwc-button>
      </ha-dialog>
    `;
  }

  private _renderStepIndicator() {
    return html`
      <div class="step-indicator">
        ${[0, 1, 2].map(step => html`
          <div class="step-dot ${step === this._step ? 'active' : ''} ${step < this._step ? 'completed' : ''}"></div>
        `)}
      </div>
    `;
  }

  private _renderStep() {
    switch (this._step) {
      case 0:
        return this._renderEntityStep();
      case 1:
        return this._renderModeStep();
      case 2:
        return this._renderConfigStep();
      default:
        return html``;
    }
  }

  private _renderEntityStep() {
    // Get entities from the location's area
    const areaId = this.location?.ha_area_id;
    if (this.restrictToArea) {
      const includeAreas = areaId ? [areaId] : undefined;
      return html`
        <h3>Select Entity</h3>
        <p class="mode-description">Showing entities assigned to this area.</p>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity_id}
          .includeAreas=${includeAreas}
          .label=${"Entity"}
          @value-changed=${(ev: CustomEvent) => {
            this._config = { ...this._config, entity_id: ev.detail.value };
            this.requestUpdate();
          }}
        ></ha-entity-picker>
      `;
    }

    const areas = this._availableAreas();
    const selectedAreaId = this._externalAreaId || "";
    const includeAreas = selectedAreaId ? [selectedAreaId] : undefined;
    const candidates = selectedAreaId ? this._entitiesByArea(selectedAreaId) : [];

    return html`
      <h3>Select Source Area and Entity</h3>
      <p class="mode-description">
        Choose an area first, then pick an entity from that area to use as an external occupancy source.
      </p>
      <div class="field-group">
        <label class="field-label" for="source-area-select">Source Area</label>
        <select
          id="source-area-select"
          data-testid="source-area-select"
          class="field-select"
          .value=${selectedAreaId}
          @change=${this._handleExternalAreaChange}
        >
          <option value="">Select area...</option>
          ${areas.map((area) => html`<option value=${area.area_id}>${area.name}</option>`)}
        </select>
      </div>

      ${selectedAreaId
        ? html`
            <ha-entity-picker
              .hass=${this.hass}
              .value=${this._config.entity_id}
              .includeAreas=${includeAreas}
              .label=${"Entity"}
              @value-changed=${(ev: CustomEvent) => {
                this._config = { ...this._config, entity_id: ev.detail.value };
                this.requestUpdate();
              }}
            ></ha-entity-picker>
            ${candidates.length
              ? html`
                  <div class="mode-description" style="margin-top: 8px;">Quick pick in selected area:</div>
                  <div class="quick-list">
                    ${candidates.map(
                      (entityId) => html`
                        <button
                          type="button"
                          class="quick-entity"
                          data-testid="quick-entity-button"
                          data-entity-id=${entityId}
                          @click=${() => {
                            this._config = { ...this._config, entity_id: entityId };
                          }}
                        >
                          ${this._entityName(entityId)}
                        </button>
                      `
                    )}
                  </div>
                `
              : html``}
          `
        : html`<div class="mode-description">Select a source area to continue.</div>`}
    `;

  }

  private _renderModeStep() {
    return html`
      <h3>Choose Trigger Mode</h3>
      <div class="mode-selector">
        <div
          class="mode-option ${this._config.mode === 'any_change' ? 'selected' : ''}"
          @click=${() => this._selectMode('any_change')}
        >
          <div class="mode-title">Any Change (Activity Detection)</div>
          <div class="mode-description">
            Triggers occupancy whenever the entity state changes.
            Best for: dimmers, media interactions, volume controls, thermostats.
          </div>
        </div>

        <div
          class="mode-option ${this._config.mode === 'specific_states' ? 'selected' : ''}"
          @click=${() => this._selectMode('specific_states')}
        >
          <div class="mode-title">Specific States (Binary Mapping)</div>
          <div class="mode-description">
            Configure separate behavior for ON and OFF states.
            Best for: motion sensors, presence sensors, door sensors.
          </div>
        </div>
      </div>
    `;
  }

  private _renderConfigStep() {
    const templates = this._getTemplatesForCurrentEntity();
    const warnings = this._getConfigWarnings();

    if (this._config.mode === 'any_change') {
      return html`
        ${this._renderTemplates(templates)}
        ${this._renderAnyChangeConfig()}
        ${this._renderPreview()}
        ${warnings.length ? this._renderWarnings(warnings) : ''}
      `;
    } else {
      return html`
        ${this._renderTemplates(templates)}
        ${this._renderSpecificStatesConfig()}
        ${this._renderPreview()}
        ${warnings.length ? this._renderWarnings(warnings) : ''}
      `;
    }
  }

  private _renderTemplates(templates: SourceTemplate[]) {
    if (!templates.length) return html``;

    return html`
      <h3>Quick Setup</h3>
      <div class="template-list">
        ${templates.map(
          (template) => html`
            <button
              class="template-button"
              @click=${() => this._applyTemplate(template)}
              type="button"
            >
              <div class="template-title">${template.label}</div>
              <div class="template-description">${template.description}</div>
            </button>
          `
        )}
      </div>
    `;
  }

  private _renderAnyChangeConfig() {
    const schema = [
      {
        name: "on_timeout",
        required: true,
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      }
    ];

    const data = {
      on_timeout: this._config.on_timeout !== undefined
        ? (this._config.on_timeout || 0) / 60
        : 5
    };

    return html`
      <h3>Configure Timeout</h3>
      <p class="mode-description">How long should occupancy remain active after any state change?</p>
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${() => "Timeout"}
        @value-changed=${(ev: CustomEvent) => {
          this._config = {
            ...this._config,
            on_event: "trigger",
            on_timeout: ev.detail.value.on_timeout * 60
          };
        }}
      ></ha-form>
    `;
  }

  private _renderSpecificStatesConfig() {
    const activePreset = this._getActiveEventPresetId();
    const schema = [
      {
        name: "on_event",
        required: true,
        selector: {
          select: {
            options: [
              { value: "trigger", label: "Trigger Occupancy" },
              { value: "none", label: "None (Ignore)" }
            ]
          }
        }
      },
      {
        name: "on_timeout",
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      },
      {
        name: "on_indefinite",
        selector: {
          boolean: {}
        }
      },
      {
        name: "off_event",
        required: true,
        selector: {
          select: {
            options: [
              { value: "clear", label: "Clear Occupancy" },
              { value: "none", label: "None (Ignore)" }
            ]
          }
        }
      },
      {
        name: "off_trailing",
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      }
    ];

    const entity = this.hass.states[this._config.entity_id || ""];
    const defaults = getSourceDefaultsForEntity(entity);

    const data = {
      on_event: this._config.on_event || defaults.on_event,
      on_timeout: this._config.on_timeout !== undefined && this._config.on_timeout !== null
        ? this._config.on_timeout / 60
        : (defaults.on_timeout || 0) / 60,
      on_indefinite: this._config.on_timeout === null,
      off_event: this._config.off_event || defaults.off_event,
      off_trailing: this._config.off_trailing !== undefined
        ? this._config.off_trailing / 60
        : (defaults.off_trailing || 0) / 60
    };

    return html`
      <h3>Configure Triggers</h3>
      <div class="mode-description">Event behavior preset</div>
      <div class="preset-row">
        ${this._renderEventPresetChip(
          "pulse",
          "Pulse",
          activePreset === "pulse",
          () => this._applyEventPreset("pulse")
        )}
        ${this._renderEventPresetChip(
          "state_mapped",
          "State-Mapped",
          activePreset === "state_mapped",
          () => this._applyEventPreset("state_mapped")
        )}
        ${this._renderEventPresetChip(
          "clear_only",
          "Clear-Only",
          activePreset === "clear_only",
          () => this._applyEventPreset("clear_only")
        )}
        ${this._renderEventPresetChip(
          "ignored",
          "Ignored",
          activePreset === "ignored",
          () => this._applyEventPreset("ignored")
        )}
      </div>
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeConfigLabel}
        @value-changed=${(ev: CustomEvent) => {
          const value = ev.detail.value;
          this._config = {
            ...this._config,
            on_event: value.on_event,
            on_timeout: value.on_indefinite ? null : value.on_timeout * 60,
            off_event: value.off_event,
            off_trailing: value.off_trailing * 60
          };
        }}
      ></ha-form>
    `;
  }

  private _renderEventPresetChip(
    _id: string,
    label: string,
    active: boolean,
    onClick: () => void
  ) {
    return html`
      <button class="preset-chip ${active ? "active" : ""}" type="button" @click=${onClick}>
        ${label}
      </button>
    `;
  }

  private _getActiveEventPresetId(): "pulse" | "state_mapped" | "clear_only" | "ignored" | "custom" {
    const onEvent = this._config.on_event || "trigger";
    const onTimeout = this._config.on_timeout;
    const offEvent = this._config.off_event || "none";
    const offTrailing = this._config.off_trailing || 0;

    if (onEvent === "trigger" && onTimeout !== null && offEvent === "none") return "pulse";
    if (onEvent === "trigger" && onTimeout === null && offEvent === "clear" && offTrailing === 0) {
      return "state_mapped";
    }
    if (onEvent === "none" && offEvent === "clear") return "clear_only";
    if (onEvent === "none" && offEvent === "none") return "ignored";
    return "custom";
  }

  private _applyEventPreset(preset: "pulse" | "state_mapped" | "clear_only" | "ignored"): void {
    if (preset === "pulse") {
      this._config = { ...this._config, on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 };
      return;
    }
    if (preset === "state_mapped") {
      this._config = { ...this._config, on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 };
      return;
    }
    if (preset === "clear_only") {
      this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "clear", off_trailing: 0 };
      return;
    }
    this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "none", off_trailing: 0 };
  }

  private _computeConfigLabel = (schema: any) => {
    const labels: Record<string, string> = {
      on_event: "ON State Event",
      on_timeout: "ON Timeout",
      on_indefinite: "Indefinite (until OFF)",
      off_event: "OFF State Event",
      off_trailing: "OFF Trailing Time"
    };
    return labels[schema.name] || schema.name;
  };

  private _selectMode(mode: "any_change" | "specific_states") {
    const entity = this.hass.states[this._config.entity_id || ""];
    this._config = applyModeDefaults(this._config, mode, entity);
    this.requestUpdate();
  }

  private _applyTemplate(template: SourceTemplate): void {
    this._config = {
      ...this._config,
      ...template.config,
      entity_id: this._config.entity_id,
    };
    this.requestUpdate();
  }

  private _getTemplatesForCurrentEntity(): SourceTemplate[] {
    const entity = this.hass.states[this._config.entity_id || ""];
    return getTemplatesForEntity(entity, this._config.mode || "any_change") as SourceTemplate[];
  }

  private _getConfigWarnings(): string[] {
    const warnings: string[] = [];
    if (this._config.mode === "specific_states") {
      if (this._config.on_event === "none" && this._config.off_event === "none") {
        warnings.push("Both ON and OFF are ignored. This source will never affect occupancy.");
      }
      if (this._config.on_event === "trigger" && this._config.on_timeout === null && this._config.off_event !== "clear") {
        warnings.push("Indefinite ON with no OFF clear can hold occupancy until manually cleared.");
      }
    }
    if (this._config.mode === "any_change" && (this._config.on_timeout ?? 0) <= 0) {
      warnings.push("Timeout is 0m, so occupancy will clear almost immediately.");
    }
    return warnings;
  }

  private _renderPreview() {
    const mode = this._config.mode === "any_change" ? "Any-change" : "Specific-states";
    const on = this._config.on_event === "trigger"
      ? `ON -> trigger (${this._formatDuration(this._config.on_timeout)})`
      : "ON -> ignored";
    const off = this._config.off_event === "clear"
      ? `OFF -> clear (${this._formatDuration(this._config.off_trailing)})`
      : "OFF -> ignored";
    const contribution = this._describeContribution();
    return html`
      <div class="preview-card">
        <strong>Effective behavior:</strong> ${mode} • ${on} • ${off}
        <div class="mode-description" style="margin-top: 6px;">Contribution: ${contribution}</div>
      </div>
    `;
  }

  private _describeContribution(): string {
    const canTrigger = this._config.on_event === "trigger";
    const canClear = this._config.off_event === "clear";
    if (!canTrigger && !canClear) return "no occupancy effect";
    if (canTrigger && canClear) return "can both create and clear occupancy";
    if (canTrigger) return "can create occupancy only";
    return "can clear occupancy only";
  }

  private _renderWarnings(warnings: string[]) {
    return html`<div class="warning-card">${warnings.map((w) => html`<div>• ${w}</div>`)}</div>`;
  }

  private _formatDuration(seconds?: number | null): string {
    if (seconds === null) return "indefinite";
    if (!seconds || seconds <= 0) return "0m";
    return `${Math.floor(seconds / 60)}m`;
  }

  private _canProceed(): boolean {
    if (!this.location || this._isFloorLocation()) return false;
    switch (this._step) {
      case 0:
        return this.restrictToArea
          ? !!this._config.entity_id
          : !!this._externalAreaId && !!this._config.entity_id;
      case 1:
        return !!this._config.mode;
      case 2:
        return true; // Config has defaults
      default:
        return false;
    }
  }

  private async _handleNext() {
    if (this._step < 2) {
      this._step++;
      this.requestUpdate();
    } else {
      await this._handleSubmit();
    }
  }

  private _handleBack() {
    if (this._step > 0) {
      this._step--;
      this.requestUpdate();
    }
  }

  private async _handleSubmit() {
    if (!this.location || this._submitting) return;
    if (this._isFloorLocation()) {
      this._error = "Floors cannot have occupancy sources. Assign sensors to an area.";
      return;
    }

    this._submitting = true;
    this._error = undefined;

    try {
      // Get current occupancy config
      const currentConfig = this.location.modules?.occupancy || {};
      const sources = currentConfig.occupancy_sources || [];

      // Add new source
      const newSource = {
        entity_id: this._config.entity_id!,
        mode: this._config.mode!,
        on_event: this._config.on_event || "trigger",
        on_timeout: this._config.on_timeout,
        off_event: this._config.off_event || "none",
        off_trailing: this._config.off_trailing
      };

      // Update module config
      await this.hass.callWS({
        type: "home_topology/locations/set_module_config",
        location_id: this.location.id,
        module_id: "occupancy",
        config: {
          ...currentConfig,
          occupancy_sources: [...sources, newSource]
        }
      });

      // Success
      this.dispatchEvent(new CustomEvent("device-added", {
        detail: { source: newSource },
        bubbles: true,
        composed: true
      }));

      this.open = false;
    } catch (error: any) {
      console.error("Failed to add device:", error);
      this._error = error.message || "Failed to add device";
    } finally {
      this._submitting = false;
    }
  }

  private _handleCancel() {
    this.open = false;
  }

  private _handleClosed() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: true,
      composed: true
    }));
  }

  private _isFloorLocation(): boolean {
    return !!this.location && getLocationType(this.location) === "floor";
  }

  private _defaultExternalAreaId(prefillEntityId?: string): string {
    if (this.restrictToArea) {
      return this.location?.ha_area_id || "";
    }

    if (prefillEntityId) {
      const prefillAreaId = this._areaIdForEntity(prefillEntityId);
      if (prefillAreaId) return prefillAreaId;
    }
    return "";
  }

  private _availableAreas(): Array<{ area_id: string; name: string }> {
    const areas = Object.values(this.hass?.areas || {}) as Array<{ area_id?: string; name?: string }>;
    return areas
      .filter((area) => !!area.area_id)
      .map((area) => ({
        area_id: area.area_id!,
        name: area.name || area.area_id!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private _entitiesByArea(areaId: string): string[] {
    const ids = Object.keys(this.hass?.states || {});
    return ids
      .filter((entityId) => this._areaIdForEntity(entityId) === areaId)
      .sort((left, right) => this._entityName(left).localeCompare(this._entityName(right)));
  }

  private _areaIdForEntity(entityId: string): string | undefined {
    return this.hass?.states?.[entityId]?.attributes?.area_id;
  }

  private _entityName(entityId: string): string {
    return this.hass?.states?.[entityId]?.attributes?.friendly_name || entityId;
  }

  private _handleExternalAreaChange = (ev: Event) => {
    const newAreaId = (ev.target as HTMLSelectElement).value;
    this._externalAreaId = newAreaId;
    // Reset entity when switching source area to avoid cross-area mismatch.
    this._config = { ...this._config, entity_id: "" };
  };
}

if (!customElements.get("ht-add-device-dialog")) {
  customElements.define("ht-add-device-dialog", HtAddDeviceDialog);
}
