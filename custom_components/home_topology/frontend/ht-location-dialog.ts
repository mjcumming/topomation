// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, LocationType } from "./types";
import { sharedStyles } from "./styles";
import { getAllowedParentTypes, getLocationType } from "./hierarchy-rules";

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
 * See: docs/frontend-patterns.md Section 4.1
 */
export class HtLocationDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public open = false;
  @property({ attribute: false }) public location?: Location; // If editing existing
  @property({ attribute: false }) public locations: Location[] = []; // For parent selector
  @property({ attribute: false }) public defaultParentId?: string;
  @property({ attribute: false }) public defaultType?: LocationType;

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    open: { type: Boolean },
    location: { attribute: false },
    locations: { attribute: false },
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

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
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

    return html`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? html`
            <div class="error-message">${this._error}</div>
          ` : ''}

          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${schema}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
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
          ${this._submitting ? "Saving..." : (this.location ? "Save" : "Create")}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const parentOptions = this._getValidParents();
    const includeRootOption = this._includeRootOption();
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
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" }
            ]
          }
        }
      },
      {
        name: "parent_id",
        selector: {
          select: {
            options: [
              ...(includeRootOption ? [{ value: "", label: "(Root Level)" }] : []),
              ...parentOptions
            ]
          }
        }
      }
    ];

    // Icon selector (always last)
    schema.push({
      name: "icon",
      selector: { icon: {} }
    });

    return schema;
  }

  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Rooms are terminal (room → room blocked)
   * - Buildings/Outdoor are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  private _getValidParents() {
    const type = this._config.type;

    // Floor parents are special:
    // if explicit root exists (House), floor must be under it.
    if (type === "floor") {
      const explicitRoot = this.locations.find((l) => l.is_explicit_root);
      if (!explicitRoot) return [];
      return [{ value: explicitRoot.id, label: explicitRoot.name }];
    }

    const allowed = getAllowedParentTypes(type);
    // Root is represented by the explicit "(Root Level)" option in the schema.
    const allowedTypes = allowed.filter((t) => t !== "root");

    console.log("[LocationDialog] _getValidParents:", {
      currentType: type,
      allowedParentTypes: allowed,
      filteredTypes: allowedTypes,
      totalLocations: this.locations.length
    });

    if (allowedTypes.length === 0) return [];

    const validParents = this.locations
      .filter(loc => {
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

  private _includeRootOption(): boolean {
    if (this._config.type !== "floor") return true;
    // If an explicit root exists (House), floors should be under it.
    return !this.locations.some((l) => l.is_explicit_root);
  }

  private _computeLabel = (schema: any) => {
    const labels: Record<string, string> = {
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Area Icon (optional)",
      create_ha_area: "Create Home Assistant Area"
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

  private _isValid(): boolean {
    return !!this._config.name && !!this._config.type;
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
        // If this is an HA Area-backed location, persist icon into HA Area Registry.
        if (this._config.type === "area" && this.location.ha_area_id) {
          await this.hass.callWS({
            type: "config/area_registry/update",
            area_id: this.location.ha_area_id,
            icon: this._config.icon || null,
          });
        }

        // Update existing location
        await this.hass.callWS({
          type: "home_topology/locations/update",
          location_id: this.location.id,
          changes: {
            name: this._config.name,
            parent_id: this._config.parent_id || null
          }
        });

        // Update _meta module for structural type only (floor|area)
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "_meta",
          config: {
            type: this._config.type
          }
        });
      } else {
        let haAreaId: string | null = null;
        if (this._config.type === "area") {
          // Create an HA Area so the icon persists in HA's registry.
          const created = await this.hass.callWS<{ area_id: string }>({
            type: "config/area_registry/create",
            name: this._config.name,
            icon: this._config.icon || undefined,
          });
          haAreaId = created.area_id;
        }

        // Create new location
        await this.hass.callWS({
          type: "home_topology/locations/create",
          name: this._config.name,
          parent_id: this._config.parent_id || null,
          ha_area_id: haAreaId,
          meta: {
            type: this._config.type
          }
        });
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
      this._error = error.message || "Failed to save location";
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
      bubbles: true,
      composed: true
    }));
  }
}

// Manual registration (avoids decorator transpilation issues in mock harness)
if (!customElements.get("ht-location-dialog")) {
  customElements.define("ht-location-dialog", HtLocationDialog);
}
