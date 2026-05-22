// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, LocationType } from "./types";
import { sharedStyles } from "./styles";
import { getAllowedParentTypes, getLocationType } from "./hierarchy-rules";
import { isSystemShadowLocation, managedShadowLocationIdSet } from "./shadow-location-utils";

console.log("[ht-location-dialog] module loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

interface LocationDialogConfig {
  name: string;
  type: LocationType;
  parent_id?: string;
  icon?: string;
}

/**
 * Dialog for creating or editing locations
 * Uses ha-dialog wrapper with ha-form for schema-driven configuration
 * See: docs/history/2026.02.24-frontend-patterns.md Section 4.1
 */
export class HtLocationDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public open = false;
  @property({ attribute: false }) public location?: Location; // If editing existing
  @property({ attribute: false }) public locations: Location[] = []; // For parent selector
  @property({ attribute: false }) public entryId?: string;
  @property({ attribute: false }) public defaultParentId?: string;
  @property({ attribute: false }) public defaultType?: LocationType;

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    open: { type: Boolean },
    location: { attribute: false },
    locations: { attribute: false },
    entryId: { attribute: false },
    defaultParentId: { attribute: false },
    defaultType: { attribute: false },
    // Internal state - also needs explicit declaration for Vite
    _config: { state: true },
    _submitting: { state: true },
    _error: { state: true },
  };

  @state() private _config: LocationDialogConfig = {
    name: "",
    type: "area",
  };
  @state() private _submitting = false;
  @state() private _error?: string;

  static styles = [
    sharedStyles,
    css`
      ha-dialog {
        --mdc-dialog-min-width: 480px;
        --mdc-dialog-max-width: 560px;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 4px 24px 0;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field-label {
        color: var(--secondary-text-color);
        font-size: 12px;
        font-weight: 500;
      }

      .field-control {
        width: 100%;
        min-height: 44px;
        border: 0;
        border-bottom: 1px solid rgba(var(--rgb-primary-color), 0.22);
        border-radius: 4px 4px 0 0;
        background: rgba(var(--rgb-primary-color), 0.05);
        color: var(--primary-text-color);
        font: inherit;
        font-size: 14px;
        padding: 10px 12px 9px;
      }

      select.field-control {
        cursor: pointer;
      }

      .field-control:focus {
        border-bottom-color: var(--primary-color);
        box-shadow: inset 0 -1px 0 var(--primary-color);
        outline: none;
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
        padding: 16px 0 20px;
        border-top: 1px solid var(--divider-color);
      }

      .dialog-actions .button {
        min-width: 88px;
      }

      .dialog-actions .button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }

        .dialog-content {
          padding: 0 20px;
        }
      }
    `
  ];

  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  protected willUpdate(changedProps: Map<string, any>): void {
      if (changedProps.has('open')) {
      const wasOpen = changedProps.get('open');
      console.log("[LocationDialog] willUpdate - open changed:", wasOpen, "->", this.open);
      console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map(l => `${l.name}(${l.modules?._meta?.type})`));
      if (this.open && !wasOpen) {
        console.log("[LocationDialog] Dialog opening, location:", this.location);
        // Initialize form when dialog opens
        if (this.location) {
          // Editing existing location
          const meta = this.location.modules?._meta || {};
          const haIcon =
            this.location.ha_area_id && this.hass?.areas
              ? this.hass.areas[this.location.ha_area_id]?.icon
              : undefined;
          this._config = {
            name: this.location.name,
            type: (meta.type as LocationType) || "area",
            parent_id: this.location.parent_id || undefined,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: haIcon || undefined
          };
        } else {
          // Creating new location
          const defaultType = this.defaultType ?? "area";
          const defaultParentId = this.defaultParentId;
          this._config = {
            name: "",
            type: defaultType,
            parent_id: defaultParentId || undefined,
          };
        }
        this._error = undefined;
      }
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('open') && this.open) {
      // Auto-focus the first input field when dialog opens
      this.updateComplete.then(() => {
        setTimeout(() => {
          // Find the first text input in the form (MockHaForm renders inputs in its shadowRoot)
          const haForm = this.shadowRoot?.querySelector('ha-form');
          if (haForm?.shadowRoot) {
            const input = haForm.shadowRoot.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              console.log("[LocationDialog] Focusing input:", input);
              input.focus();
              input.select();
              return;
            }
          }
          // Fallback: try to find input anywhere in the dialog
          const anyInput = this.shadowRoot?.querySelector('input[type="text"]') as HTMLInputElement;
          if (anyInput) {
            console.log("[LocationDialog] Focusing fallback input:", anyInput);
            anyInput.focus();
            anyInput.select();
          }
        }, 150); // Small delay to ensure dialog is fully rendered
      });
    }
  }

  render() {
    console.log("[LocationDialog] render() called, open:", this.open);

    // Always render the dialog element (mock needs it to exist for open prop binding)
    const schema = this._getSchema();
    console.log("[LocationDialog] Rendering dialog with schema:", schema.length, "fields");
    const parentOptions = this._getValidParents();
    const includeRootOption = this._includeRootOption();
    const showParentField = includeRootOption || parentOptions.length > 1;

    return html`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Structure" : "Add Structure"}
      >
        <div class="dialog-content">
          ${this._error ? html`
            <div class="error-message">${this._error}</div>
          ` : ''}

          <div class="field">
            <label class="field-label" for="location-name">Name*</label>
            <input
              id="location-name"
              class="field-control"
              type="text"
              .value=${this._config.name || ""}
              @input=${this._handleNameInput}
            />
          </div>

          <div class="field">
            <label class="field-label" for="location-type">Type*</label>
            <select
              id="location-type"
              class="field-control"
              .value=${this._config.type}
              @change=${this._handleTypeChange}
            >
              ${this._typeOptions().map((option) => html`
                <option value=${option.value}>${option.label}</option>
              `)}
            </select>
          </div>

          ${showParentField ? html`
            <div class="field">
              <label class="field-label" for="location-parent">Parent Location</label>
              <select
                id="location-parent"
                class="field-control"
                .value=${this._config.parent_id || ""}
                @change=${this._handleParentChange}
              >
                ${includeRootOption ? html`<option value="">Root Level</option>` : ""}
                ${parentOptions.map((option) => html`
                  <option value=${option.value}>${option.label}</option>
                `)}
              </select>
            </div>
          ` : ""}

          <div class="field">
            <label class="field-label" for="location-icon">Location Icon (optional)</label>
            <input
              id="location-icon"
              class="field-control"
              type="text"
              placeholder="mdi:stairs"
              .value=${this._config.icon || ""}
              @input=${this._handleIconInput}
            />
          </div>

          <div class="dialog-actions">
            <button
              class="button button-secondary"
              type="button"
              @click=${this._handleCancel}
              ?disabled=${this._submitting}
            >
              Cancel
            </button>
            <button
              class="button button-primary"
              type="button"
              @click=${this._handleSubmit}
              ?disabled=${!this._isValid() || this._submitting}
            >
              ${this._submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  private _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const parentOptions = this._getValidParents();
    const includeRootOption = this._includeRootOption();
    const showParentField = includeRootOption || parentOptions.length > 1;
    console.log("[LocationDialog] parentOptions:", parentOptions);
    const isCreating = !this.location;

    // Base schema fields
    const schema: any[] = [
      {
        name: "name",
        required: true,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: true,
        selector: {
          select: {
            options: [
              { value: "property", label: "Property" },
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" },
              { value: "building", label: "Building" },
              { value: "grounds", label: "Grounds" },
              { value: "subarea", label: "Subarea" }
            ]
          }
        }
      },
    ];

    if (showParentField) {
      schema.push({
        name: "parent_id",
        selector: {
          select: {
            options: [
              ...(includeRootOption ? [{ value: "", label: "(Root Level)" }] : []),
              ...parentOptions
            ]
          }
        }
      });
    }

    // Icon selector (always last)
    schema.push({
      name: "icon",
      selector: { icon: {} }
    });

    return schema;
  }

  private _typeOptions() {
    return [
      { value: "property", label: "Property" },
      { value: "floor", label: "Floor" },
      { value: "area", label: "Area" },
      { value: "building", label: "Building" },
      { value: "grounds", label: "Grounds" },
      { value: "subarea", label: "Subarea" }
    ];
  }

  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/history/2026.02.24-ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Floors can be root-level or children of Building only
   * - Building/Grounds wrappers are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  private _getValidParents() {
    const type = this._config.type;
    const allowed = getAllowedParentTypes(type);
    const isRootOnlyType = allowed.length === 1 && allowed[0] === "root";

    // Root-only types are true root-level wrappers with no parent selection.
    if (isRootOnlyType) {
      return [];
    }

    // Root is represented by the explicit "(Root Level)" option in the schema.
    const allowedTypes = allowed.filter((t) => t !== "root");

    console.log("[LocationDialog] _getValidParents:", {
      currentType: type,
      allowedParentTypes: allowed,
      filteredTypes: allowedTypes,
      totalLocations: this.locations.length
    });

    if (allowedTypes.length === 0) return [];

    const managedShadowIds = this._managedShadowLocationIds();
    const validParents = this.locations
      .filter(loc => {
        if (loc.is_explicit_root) return false;
        if (this._isManagedShadowLocation(loc, managedShadowIds)) return false;
        const locType = getLocationType(loc);
        return allowedTypes.includes(locType);
      })
      .map(loc => ({
        value: loc.id,
        label: loc.name
      }));

    console.log("[LocationDialog] Valid parents:", validParents.length, validParents.map(p => p.label));
    return validParents;
  }

  private _isManagedShadowLocation(location: Location, managedShadowIds?: Set<string>): boolean {
    return isSystemShadowLocation(location, managedShadowIds);
  }

  private _managedShadowLocationIds(): Set<string> {
    return managedShadowLocationIdSet(this.locations);
  }

  private _includeRootOption(): boolean {
    // Single-root model: synthetic "(Root Level)" should never be user-selectable.
    return false;
  }

  private _submitParentId(): string | null {
    const allowed = getAllowedParentTypes(this._config.type);
    const isRootOnlyType = allowed.length === 1 && allowed[0] === "root";
    if (isRootOnlyType) return null;

    const configuredParent = String(this._config.parent_id || "").trim();
    if (configuredParent) return configuredParent;

    const validParents = this._getValidParents();
    if (validParents.length === 1) {
      return String(validParents[0].value);
    }

    // Keep fallback behavior deterministic: no implicit attachment to Home root.
    return null;
  }

  private _computeLabel = (schema: any) => {
    const labels: Record<string, string> = {
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Location Icon (optional)"
    };
    return labels[schema.name] || schema.name;
  };

  private _handleValueChanged(ev: CustomEvent) {
    console.log("[LocationDialog] value-changed received:", ev.detail);
    // Some form implementations (including mocks) may emit partial updates.
    // Merge to avoid dropping existing fields like `type`.
    this._config = { ...this._config, ...ev.detail.value };
    console.log("[LocationDialog] Updated config:", this._config);
    this._error = undefined;
    // Some dev toolchains can be finicky with decorator-based reactivity; force an update.
    this.requestUpdate();
  }

  private _handleNameInput(ev: Event) {
    this._config = {
      ...this._config,
      name: (ev.currentTarget as HTMLInputElement).value
    };
    this._error = undefined;
  }

  private _handleTypeChange(ev: Event) {
    this._config = {
      ...this._config,
      type: (ev.currentTarget as HTMLSelectElement).value as LocationType,
      parent_id: undefined
    };
    this._error = undefined;
  }

  private _handleParentChange(ev: Event) {
    const parentId = (ev.currentTarget as HTMLSelectElement).value;
    this._config = {
      ...this._config,
      parent_id: parentId || undefined
    };
    this._error = undefined;
  }

  private _handleIconInput(ev: Event) {
    const icon = (ev.currentTarget as HTMLInputElement).value.trim();
    this._config = {
      ...this._config,
      icon: icon || undefined
    };
    this._error = undefined;
  }

  private _isValid(): boolean {
    return !!this._config.name && !!this._config.type;
  }

  private _formatSaveError(error: any): string {
    const raw = String(error?.message || error || "Failed to save location");
    const normalized = raw.toLowerCase();

    if (
      normalized.includes("location lifecycle mutations are disabled in this adapter") ||
      normalized.includes("create/rename/delete floors and areas")
    ) {
      return "Legacy policy error detected. Restart Home Assistant and hard refresh the browser to load updated location create/update support.";
    }

    return raw;
  }

  private async _handleSubmit() {
    console.log("[LocationDialog] Submit clicked, config:", this._config);
    console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting);

    if (!this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }

    this._submitting = true;
    this._error = undefined;

    try {
      if (this.location) {
        // Update existing location
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/update",
            location_id: this.location.id,
            changes: {
              name: this._config.name,
              parent_id: this._submitParentId()
            }
          })
        );

        // Update _meta module for structural type metadata.
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/set_module_config",
            location_id: this.location.id,
            module_id: "_meta",
            config: {
              type: this._config.type
            }
          })
        );
      } else {
        // Create new location
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/create",
            name: this._config.name,
            parent_id: this._submitParentId(),
            meta: {
              type: this._config.type
            }
          })
        );
      }

      // Success - dispatch event and close
      this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: true,
        composed: true
      }));

      this.open = false;
    } catch (error: any) {
      console.error("Failed to save location:", error);
      this._error = this._formatSaveError(error);
    } finally {
      this._submitting = false;
    }
  }

  private _handleCancel() {
    console.log("[LocationDialog] Cancel clicked");
    this.open = false;
    // Fire closed event so parent can update state
    this._handleClosed();
  }

  private _handleClosed() {
    console.log("[LocationDialog] Closed event fired");
    this.open = false;
    this._error = undefined;
    this._submitting = false;
    // Reset form data when closing
    this._config = {
      name: "",
      type: "area"
    };
    this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: false,
      composed: false
    }));
  }

  private _withEntryId<T extends Record<string, any>>(payload: T): T {
    const entryId = typeof this.entryId === "string" ? this.entryId.trim() : "";
    if (!entryId) {
      return payload;
    }
    return {
      ...payload,
      entry_id: entryId,
    };
  }
}

// Manual registration (avoids decorator transpilation issues in mock harness)
if (!customElements.get("ht-location-dialog")) {
  customElements.define("ht-location-dialog", HtLocationDialog);
}
