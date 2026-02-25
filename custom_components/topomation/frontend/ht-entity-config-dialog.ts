import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, OccupancySourceConfig } from "./types";
import { sharedStyles } from "./styles";
import { getLocationType } from "./hierarchy-rules";
import {
  applyModeDefaults,
  getTemplatesForEntity,
  type SourceTemplate,
} from "./source-profile-utils";

console.log("[ht-entity-config-dialog] module loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

/**
 * Dialog for editing existing occupancy source configuration
 * Two-column layout for ON/OFF configuration (desktop), stacked on mobile
 * See: docs/history/2026.02.24-frontend-patterns.md Section 4.2, docs/history/2026.02.24-ui-design.md Section 3.2.2
 */
export class HtEntityConfigDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean}) public open = false;
  @property({ attribute: false }) public location?: Location;
  @property({ attribute: false }) public source?: OccupancySourceConfig;
  @property() public sourceIndex?: number;

  @state() private _config?: OccupancySourceConfig;
  @state() private _submitting = false;
  @state() private _error?: string;

  static styles = [
    sharedStyles,
    css`
      ha-dialog {
        --mdc-dialog-min-width: 600px;
        --mdc-dialog-max-width: 800px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .entity-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--card-background-color);
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .entity-name {
        font-weight: 500;
      }

      .entity-id {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .mode-selector {
        margin-bottom: 24px;
      }

      .config-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .config-column {
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
      }

      .column-title {
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .state-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      .state-badge.on {
        background: var(--success-color);
        color: white;
      }

      .state-badge.off {
        background: var(--divider-color);
        color: var(--text-primary-color);
      }

      .door-pattern-selector {
        margin-top: 16px;
        padding: 16px;
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: 8px;
      }

      .pattern-option {
        margin: 8px 0;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
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

      @media (max-width: 768px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }

        .config-columns {
          grid-template-columns: 1fr;
        }
      }
    `
  ];

  protected willUpdate(changedProps: Map<string, any>): void {
    if (changedProps.has('open') && this.open && this.source) {
      // Copy source config for editing
      this._config = { ...this.source };
      this._error = undefined;
    }
  }

  render() {
    if (!this.open || !this._config) return html``;
    if (!this.location) {
      return this._renderUnavailableDialog("Select an area location before editing occupancy sources.");
    }
    if (this._isFloorLocation()) {
      return this._renderUnavailableDialog(
        "Floor locations cannot have occupancy sources. Move this sensor configuration to an area."
      );
    }

    const entity = this.hass.states[this._config.entity_id];
    const domain = entity?.entity_id.split(".")[0];
    const isDoorSensor = domain === "binary_sensor" &&
      (entity?.attributes.device_class === "door" ||
       entity?.attributes.device_class === "garage_door");

    return html`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${"Configure Occupancy Source"}
      >
        <div class="dialog-content">
          ${this._error ? html`<div class="error-message">${this._error}</div>` : ''}

          <div class="entity-header">
            <ha-icon .icon=${entity?.attributes.icon || "mdi:sensor"}></ha-icon>
            <div>
              <div class="entity-name">${entity?.attributes.friendly_name || this._config.entity_id}</div>
              <div class="entity-id">${this._config.entity_id}</div>
            </div>
          </div>

          ${this._renderModeSelector()}
          ${this._renderTemplates()}

          ${this._config.mode === "specific_states" ? html`
            ${isDoorSensor ? this._renderDoorPatternSelector() : ''}
            ${this._renderSpecificStatesConfig()}
          ` : html`
            ${this._renderAnyChangeConfig()}
          `}

          ${this._renderPreview()}
          ${this._renderWarnings()}
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleDelete}
          .disabled=${this._submitting}
          style="color: var(--error-color);"
        >
          Remove
        </mwc-button>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>

        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${this._submitting}
        >
          ${this._submitting ? "Saving..." : "Save"}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _renderUnavailableDialog(message: string) {
    return html`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${"Configure Occupancy Source"}
      >
        <div class="dialog-content">
          <div class="mode-description">${message}</div>
        </div>
        <mwc-button slot="primaryAction" @click=${this._handleCancel}>Close</mwc-button>
      </ha-dialog>
    `;
  }

  private _renderModeSelector() {
    return html`
      <div class="mode-selector">
        <ha-formfield label="Any Change (Activity Detection)">
          <ha-radio
            name="mode"
            value="any_change"
            .checked=${this._config!.mode === "any_change"}
            @change=${() => this._handleModeChange("any_change")}
          ></ha-radio>
        </ha-formfield>
        <ha-formfield label="Specific States (Binary Mapping)">
          <ha-radio
            name="mode"
            value="specific_states"
            .checked=${this._config!.mode === "specific_states"}
            @change=${() => this._handleModeChange("specific_states")}
          ></ha-radio>
        </ha-formfield>
      </div>
    `;
  }

  private _renderTemplates() {
    const templates = this._getTemplates();
    if (!templates.length) return html``;
    return html`
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

  private _renderDoorPatternSelector() {
    const isEntryDoor = this._config!.on_timeout !== null && this._config!.off_event === "none";
    const isStateDoor = this._config!.on_timeout === null && this._config!.off_event === "clear";

    return html`
      <div class="door-pattern-selector">
        <div class="section-title">Door Sensor Pattern</div>
        <div class="pattern-option">
          <ha-formfield label="Entry Door (opening indicates entry)">
            <ha-radio
              name="door-pattern"
              .checked=${isEntryDoor}
              @change=${() => this._applyDoorPattern("entry")}
            ></ha-radio>
          </ha-formfield>
          <div class="mode-description" style="margin-left: 32px; font-size: 13px;">
            ON → TRIGGER(30m), OFF → ignore
          </div>
        </div>
        <div class="pattern-option">
          <ha-formfield label="State Door (door state = occupancy state)">
            <ha-radio
              name="door-pattern"
              .checked=${isStateDoor}
              @change=${() => this._applyDoorPattern("state")}
            ></ha-radio>
          </ha-formfield>
          <div class="mode-description" style="margin-left: 32px; font-size: 13px;">
            ON → TRIGGER(∞), OFF → CLEAR(0)
          </div>
        </div>
      </div>
    `;
  }

  private _renderAnyChangeConfig() {
    const timeoutMinutes = (this._config!.on_timeout || 0) / 60;

    return html`
      <ha-textfield
        label="Timeout (minutes)"
        type="number"
        .value=${timeoutMinutes.toString()}
        min="0"
        max="1440"
        @input=${(e: Event) => {
          const value = parseInt((e.target as HTMLInputElement).value) || 0;
          this._config = { ...this._config!, on_timeout: value * 60 };
        }}
      ></ha-textfield>
    `;
  }

  private _renderSpecificStatesConfig() {
    const activePreset = this._getActiveEventPresetId();
    const onTimeoutMinutes = this._config!.on_timeout !== null
      ? (this._config!.on_timeout || 0) / 60
      : 0;
    const offTrailingMinutes = (this._config!.off_trailing || 0) / 60;
    const onIndefinite = this._config!.on_timeout === null;

    return html`
      <div class="config-columns">
        <div class="config-column">
          <div class="mode-description">Event behavior preset</div>
          <div class="preset-row">
            ${this._renderEventPresetChip("Pulse", activePreset === "pulse", () => this._applyEventPreset("pulse"))}
            ${this._renderEventPresetChip("State-Mapped", activePreset === "state_mapped", () => this._applyEventPreset("state_mapped"))}
            ${this._renderEventPresetChip("Clear-Only", activePreset === "clear_only", () => this._applyEventPreset("clear_only"))}
            ${this._renderEventPresetChip("Ignored", activePreset === "ignored", () => this._applyEventPreset("ignored"))}
          </div>

          <div class="column-title">
            <span class="state-badge on">ON</span>
            ON State
          </div>

          <ha-select
            label="Event Type"
            .value=${this._config!.on_event || "trigger"}
            @selected=${(e: Event) => {
              this._config = {
                ...this._config!,
                on_event: (e.target as any).value as "trigger" | "none"
              };
            }}
          >
            <mwc-list-item value="trigger">Trigger Occupancy</mwc-list-item>
            <mwc-list-item value="none">None (Ignore)</mwc-list-item>
          </ha-select>

          ${this._config!.on_event === "trigger" ? html`
            <ha-formfield label="Indefinite (until OFF state)">
              <ha-checkbox
                .checked=${onIndefinite}
                @change=${(e: Event) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  this._config = {
                    ...this._config!,
                    on_timeout: checked ? null : 300
                  };
                }}
              ></ha-checkbox>
            </ha-formfield>

            ${!onIndefinite ? html`
              <ha-textfield
                label="Timeout (minutes)"
                type="number"
                .value=${onTimeoutMinutes.toString()}
                min="0"
                max="1440"
                @input=${(e: Event) => {
                  const value = parseInt((e.target as HTMLInputElement).value) || 0;
                  this._config = { ...this._config!, on_timeout: value * 60 };
                }}
              ></ha-textfield>
            ` : ''}
          ` : ''}
        </div>

        <div class="config-column">
          <div class="column-title">
            <span class="state-badge off">OFF</span>
            OFF State
          </div>

          <ha-select
            label="Event Type"
            .value=${this._config!.off_event || "none"}
            @selected=${(e: Event) => {
              this._config = {
                ...this._config!,
                off_event: (e.target as any).value as "clear" | "none"
              };
            }}
          >
            <mwc-list-item value="clear">Clear Occupancy</mwc-list-item>
            <mwc-list-item value="none">None (Ignore)</mwc-list-item>
          </ha-select>

          ${this._config!.off_event === "clear" ? html`
            <ha-textfield
              label="Trailing Time (minutes)"
              type="number"
              .value=${offTrailingMinutes.toString()}
              min="0"
              max="1440"
              @input=${(e: Event) => {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                this._config = { ...this._config!, off_trailing: value * 60 };
              }}
            ></ha-textfield>
          ` : ''}
        </div>
      </div>
    `;
  }

  private _renderEventPresetChip(label: string, active: boolean, onClick: () => void) {
    return html`
      <button class="preset-chip ${active ? "active" : ""}" type="button" @click=${onClick}>
        ${label}
      </button>
    `;
  }

  private _getActiveEventPresetId(): "pulse" | "state_mapped" | "clear_only" | "ignored" | "custom" {
    const onEvent = this._config?.on_event || "trigger";
    const onTimeout = this._config?.on_timeout;
    const offEvent = this._config?.off_event || "none";
    const offTrailing = this._config?.off_trailing || 0;

    if (onEvent === "trigger" && onTimeout !== null && offEvent === "none") return "pulse";
    if (onEvent === "trigger" && onTimeout === null && offEvent === "clear" && offTrailing === 0) {
      return "state_mapped";
    }
    if (onEvent === "none" && offEvent === "clear") return "clear_only";
    if (onEvent === "none" && offEvent === "none") return "ignored";
    return "custom";
  }

  private _applyEventPreset(preset: "pulse" | "state_mapped" | "clear_only" | "ignored"): void {
    if (!this._config) return;
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

  private _handleModeChange(mode: "any_change" | "specific_states") {
    const entity = this.hass.states[this._config?.entity_id || ""];
    this._config = applyModeDefaults(this._config || {}, mode, entity) as OccupancySourceConfig;
  }

  private _applyTemplate(template: SourceTemplate): void {
    this._config = {
      ...this._config!,
      ...template.config,
      entity_id: this._config!.entity_id,
    };
  }

  private _getTemplates(): SourceTemplate[] {
    if (!this._config) return [];
    const entity = this.hass.states[this._config.entity_id || ""];
    return getTemplatesForEntity(entity, this._config.mode) as SourceTemplate[];
  }

  private _applyDoorPattern(pattern: "entry" | "state") {
    if (pattern === "entry") {
      this._config = {
        ...this._config!,
        on_event: "trigger",
        on_timeout: 1800, // 30 minutes
        off_event: "none"
      };
    } else {
      this._config = {
        ...this._config!,
        on_event: "trigger",
        on_timeout: null, // Indefinite
        off_event: "clear",
        off_trailing: 0
      };
    }
  }

  private _renderPreview() {
    if (!this._config) return html``;
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
    if (!this._config) return "";
    const canTrigger = this._config.on_event === "trigger";
    const canClear = this._config.off_event === "clear";
    if (!canTrigger && !canClear) return "no occupancy effect";
    if (canTrigger && canClear) return "can both create and clear occupancy";
    if (canTrigger) return "can create occupancy only";
    return "can clear occupancy only";
  }

  private _renderWarnings() {
    if (!this._config) return html``;
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
    if (!warnings.length) return html``;
    return html`<div class="warning-card">${warnings.map((w) => html`<div>• ${w}</div>`)}</div>`;
  }

  private _formatDuration(seconds?: number | null): string {
    if (seconds === null) return "indefinite";
    if (!seconds || seconds <= 0) return "0m";
    return `${Math.floor(seconds / 60)}m`;
  }

  private async _handleSubmit() {
    if (!this.location || !this._config || this._submitting) return;
    if (this._isFloorLocation()) {
      this._error = "Floors cannot have occupancy sources.";
      return;
    }

    this._submitting = true;
    this._error = undefined;

    try {
      const currentConfig = this.location.modules?.occupancy || {};
      const sources = [...(currentConfig.occupancy_sources || [])];

      // Update the source at the correct index
      if (this.sourceIndex !== undefined) {
        sources[this.sourceIndex] = this._config;
      }

      await this.hass.callWS({
        type: "topomation/locations/set_module_config",
        location_id: this.location.id,
        module_id: "occupancy",
        config: {
          ...currentConfig,
          occupancy_sources: sources
        }
      });

      this.dispatchEvent(new CustomEvent("config-saved", {
        detail: { source: this._config },
        bubbles: true,
        composed: true
      }));

      this.open = false;
    } catch (error: any) {
      console.error("Failed to save config:", error);
      this._error = error.message || "Failed to save configuration";
    } finally {
      this._submitting = false;
    }
  }

  private async _handleDelete() {
    if (!this.location || this.sourceIndex === undefined || this._submitting) return;
    if (this._isFloorLocation()) {
      this._error = "Floors cannot have occupancy sources.";
      return;
    }

    if (!confirm(`Remove ${this._config!.entity_id} from occupancy sources?`)) {
      return;
    }

    this._submitting = true;
    this._error = undefined;

    try {
      const currentConfig = this.location.modules?.occupancy || {};
      const sources = [...(currentConfig.occupancy_sources || [])];
      sources.splice(this.sourceIndex, 1);

      await this.hass.callWS({
        type: "topomation/locations/set_module_config",
        location_id: this.location.id,
        module_id: "occupancy",
        config: {
          ...currentConfig,
          occupancy_sources: sources
        }
      });

      this.dispatchEvent(new CustomEvent("source-deleted", {
        detail: { index: this.sourceIndex },
        bubbles: true,
        composed: true
      }));

      this.open = false;
    } catch (error: any) {
      console.error("Failed to delete source:", error);
      this._error = error.message || "Failed to remove source";
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
}

customElements.define("ht-entity-config-dialog", HtEntityConfigDialog);
