import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, TopomationActionRule } from "./types";
import { sharedStyles } from "./styles";
import { createTopomationActionRule } from "./ha-automation-rules";

console.log("[ht-rule-dialog] module loaded");

/**
 * Dialog for creating or editing automation rules
 * Uses ha-form for schema-driven configuration
 * See: docs/history/2026.02.24-frontend-patterns.md Section 4.2
 */
export class HtRuleDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public open = false;
  @property({ attribute: false }) public location?: Location;
  @property({ attribute: false }) public rule?: TopomationActionRule;
  @property({ type: String }) public defaultTriggerType?: "occupied" | "vacant";

  @state() private _config: Partial<TopomationActionRule> = {};
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
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .preview {
        padding: 16px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-top: 16px;
        font-size: 14px;
      }

      .preview-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preview-text {
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `,
  ];

  protected willUpdate(changedProps: Map<string, any>): void {
    if (changedProps.has("open") && this.open) {
      // Initialize form when dialog opens
      if (this.rule) {
        // Editing existing rule
        this._config = { ...this.rule };
      } else {
        // Creating new rule
        this._config = {
          id: `rule-${Date.now()}`,
          name: "",
          trigger_type: this.defaultTriggerType || "occupied",
          action_entity_id: "",
          action_service: "turn_on",
        };
      }
      this._error = undefined;
    }
  }

  render() {
    if (!this.open) return html``;

    const schema = this._getSchema();

    return html`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${this.rule ? "Edit Home Assistant Automation" : "New Home Assistant Automation"}
      >
        <div class="dialog-content">
          ${this._error
            ? html`<div class="error-message">${this._error}</div>`
            : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._getFormData()}
            .schema=${schema}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>

          ${this._renderPreview()}
        </div>

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
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.rule ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _getSchema() {
    return [
      {
        name: "name",
        required: true,
        selector: { text: {} },
      },
      {
        name: "trigger_type",
        required: true,
        selector: {
          select: {
            options: [
              { value: "occupied", label: "When Occupied" },
              { value: "vacant", label: "When Vacant" },
            ],
          },
        },
      },
      {
        name: "action_entity_id",
        required: true,
        selector: {
          entity: {},
        },
      },
      {
        name: "action_service",
        required: true,
        selector: {
          select: {
            options: [
              { value: "turn_on", label: "Turn On" },
              { value: "turn_off", label: "Turn Off" },
              { value: "toggle", label: "Toggle" },
            ],
          },
        },
      },
    ];
  }

  private _getFormData() {
    return {
      name: this._config.name || "",
      trigger_type: this._config.trigger_type || "occupied",
      action_entity_id: this._config.action_entity_id || "",
      action_service: this._config.action_service || "turn_on",
    };
  }

  private _computeLabel = (schema: any) => {
    const labels: Record<string, string> = {
      name: "Rule Name",
      trigger_type: "Trigger When",
      action_entity_id: "Target Entity",
      action_service: "Action",
    };
    return labels[schema.name] || schema.name;
  };

  private _handleValueChanged(e: CustomEvent) {
    const value = e.detail.value;
    this._config = {
      ...this._config,
      name: value.name,
      trigger_type: value.trigger_type,
      action_entity_id: value.action_entity_id,
      action_service: value.action_service,
    };
  }

  private _renderPreview() {
    if (!this._config.name || !this._config.action_entity_id) {
      return html``;
    }

    const entity = this.hass.states[this._config.action_entity_id];
    const entityName =
      entity?.attributes.friendly_name || this._config.action_entity_id;
    const triggerText =
      this._config.trigger_type === "occupied"
        ? "becomes occupied"
        : "becomes vacant";
    const actionText = this._config.action_service?.replace("_", " ");

    return html`
      <div class="preview">
        <div class="preview-label">Preview</div>
        <div class="preview-text">
          When <strong>${this.location?.name || "this location"}</strong>
          ${triggerText}, <strong>${actionText}</strong>
          <strong>${entityName}</strong>
        </div>
      </div>
    `;
  }

  private _isValid(): boolean {
    return !!(
      this._config.name &&
      this._config.trigger_type &&
      this._config.action_entity_id &&
      this._config.action_service
    );
  }

  private async _handleSubmit() {
    if (!this.location || !this._isValid() || this._submitting) return;
    if (this.rule) {
      this._error = "Editing existing rules is not supported here yet. Use the automation editor.";
      return;
    }

    this._submitting = true;
    this._error = undefined;

    try {
      const ruleData = await createTopomationActionRule(this.hass, {
        location: this.location,
        name: this._config.name!,
        trigger_type: this._config.trigger_type as "occupied" | "vacant",
        action_entity_id: this._config.action_entity_id!,
        action_service: this._config.action_service!,
      });

      this.dispatchEvent(
        new CustomEvent("rule-saved", {
          detail: { rule: ruleData },
          bubbles: true,
          composed: true,
        })
      );

      this.open = false;
    } catch (error: any) {
      console.error("Failed to save rule:", error);
      this._error = error.message || "Failed to save rule";
    } finally {
      this._submitting = false;
    }
  }

  private _handleCancel() {
    this.open = false;
  }

  private _handleClosed() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("dialog-closed", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

if (!customElements.get("ht-rule-dialog")) {
  customElements.define("ht-rule-dialog", HtRuleDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-rule-dialog": HtRuleDialog;
  }
}
