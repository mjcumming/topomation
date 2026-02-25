// @ts-nocheck
// TypeScript checking disabled for mock file - decorators work at runtime but TS complains.
// This file is only used in the development harness, not in production.

/**
 * Mock Home Assistant Components for Development
 *
 * These are FUNCTIONAL MOCKS that maintain the input/output contract of real HA components
 * but remove heavy dependencies (hass object, MDC, translations, etc.).
 *
 * WHY MOCKING IS REQUIRED:
 * - Real ha-form/ha-dialog require full hass object with localize(), states, etc.
 * - Real components use portal rendering (ha-dialog) and deep Shadow DOM nesting
 * - Real components fail silently or crash without HA runtime
 *
 * KEY CONTRACTS:
 * - MockHaDialog: fires `opened`/`closed` events, provides slots for buttons
 * - MockHaForm: fires `value-changed` with { detail: { value: newData } }, bubbles + composed
 *
 * See docs/history/2026.02.24-mock-component-strategy.md for full documentation.
 */

import { LitElement, html, css, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";

// ============================================================================
// MockHaDialog
// ============================================================================

/**
 * Mock implementation of ha-dialog.
 *
 * Key differences from real ha-dialog:
 * - Renders inline (no portal to <body>)
 * - Simple focus trap (just Escape key)
 * - No theme integration
 *
 * Events:
 * - `opened`: fired when open changes false→true
 * - `closed`: fired when open changes true→false, or backdrop/Escape
 *
 * Slots:
 * - (default): main content
 * - heading: alternative to heading prop
 * - primaryAction: Save/Submit button
 * - secondaryAction: Cancel button
 */
export class MockHaDialog extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) heading = "";

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    open: { type: Boolean, reflect: true },
    heading: { type: String },
  };

  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    }

    :host([open]) {
      display: flex;
    }

    .dialog-surface {
      background: var(--card-background-color, #fff);
      border-radius: 8px;
      min-width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .content {
      padding: 16px 24px;
      flex: 1;
      overflow-y: auto;
    }

    .actions {
      padding: 16px 24px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `;

  private _escapeHandler?: (e: KeyboardEvent) => void;

  connectedCallback(): void {
    super.connectedCallback();
    // Ensure initial visibility is consistent even if `open` is set before first update.
    if (this.open) {
      this.setAttribute("open", "");
      this.style.display = "flex";
    } else {
      this.removeAttribute("open");
      this.style.display = "none";
    }
  }

  render() {
    return html`
      <div
        class="dialog-surface"
        @click=${(e: Event) => e.stopPropagation()}
      >
        <div class="header">
          ${this.heading
            ? html`${this.heading}`
            : html`<slot name="heading"></slot>`}
        </div>
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <slot name="secondaryAction"></slot>
          <slot name="primaryAction"></slot>
        </div>
      </div>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has("open")) {
      // Ensure the boolean `open` state is reflected for CSS + selectors,
      // even if the element was upgraded after the property was first set.
      if (this.open) {
        this.setAttribute("open", "");
      } else {
        this.removeAttribute("open");
      }
      // Ensure visibility even if CSS attribute reflection is delayed in some environments.
      this.style.display = this.open ? "flex" : "none";

      const wasOpen = changedProps.get("open") as boolean | undefined;

      if (this.open && !wasOpen) {
        // Opening
        console.log("[MockHaDialog] opened");
        this.dispatchEvent(new CustomEvent("opened"));

        // Setup escape handler
        this._escapeHandler = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            console.log("[MockHaDialog] Escape pressed, closing");
            this._close();
          }
        };
        document.addEventListener("keydown", this._escapeHandler);

        // Setup backdrop click (on host element)
        this.addEventListener("click", this._handleBackdropClick);
      } else if (!this.open && wasOpen) {
        // Closing
        console.log("[MockHaDialog] closed");
        this.dispatchEvent(new CustomEvent("closed"));

        // Cleanup
        if (this._escapeHandler) {
          document.removeEventListener("keydown", this._escapeHandler);
          this._escapeHandler = undefined;
        }
        this.removeEventListener("click", this._handleBackdropClick);
      }
    }
  }

  private _handleBackdropClick = (e: Event) => {
    // Don't close on backdrop click - require explicit cancel/save action
    // This prevents accidental data loss
    if (e.target === this) {
      console.log("[MockHaDialog] Backdrop clicked, ignoring (use Cancel button)");
      e.stopPropagation();
    }
  };

  private _close() {
    // Fire closed event - parent should handle setting open=false
    this.dispatchEvent(new CustomEvent("closed"));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._escapeHandler) {
      document.removeEventListener("keydown", this._escapeHandler);
    }
  }
}

// ============================================================================
// MockHaForm
// ============================================================================

interface SchemaItem {
  name: string;
  required?: boolean;
  type?: "string" | "integer" | "boolean";
  selector?: {
    text?: { multiline?: boolean };
    select?: { options: Array<{ value: string; label: string } | string> };
    boolean?: Record<string, never>;
    number?: { min?: number; max?: number; step?: number; unit_of_measurement?: string };
    entity?: { domain?: string };
    area?: Record<string, never>;
    icon?: Record<string, never>;
  };
}

/**
 * Mock implementation of ha-form (schema-driven form).
 *
 * This is a "Schema Reflector" - it accepts a schema and renders native HTML inputs.
 * It doesn't provide entity pickers, icon selectors, etc. - just basic inputs.
 *
 * Properties:
 * - hass: ignored (just satisfies interface)
 * - data: current form values { fieldName: value }
 * - schema: array of SchemaItem objects
 * - error: field-level errors { fieldName: "Error message" }
 * - computeLabel: optional function (schemaItem, data) => string
 *
 * Events:
 * - value-changed: { detail: { value: newData } } - bubbles, composed
 *
 * CRITICAL: Never mutates `data` prop. Always dispatches new object via event.
 */
export class MockHaForm extends LitElement {
  @property({ attribute: false }) hass: unknown;
  @property({ attribute: false }) data: Record<string, unknown> = {};
  @property({ attribute: false }) schema: SchemaItem[] = [];
  @property({ attribute: false }) error: Record<string, string> = {};
  @property({ attribute: false }) computeLabel?: (
    schema: SchemaItem,
    data: Record<string, unknown>
  ) => string;

  // Explicit static properties for Vite compatibility
  static properties = {
    hass: { attribute: false },
    data: { attribute: false },
    schema: { attribute: false },
    error: { attribute: false },
    computeLabel: { attribute: false },
  };

  static styles = css`
    :host {
      display: block;
    }

    .form-field {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    input[type="text"],
    input[type="number"],
    select,
    textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 14px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      box-sizing: border-box;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: 1px;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checkbox-container input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .checkbox-container label {
      margin-bottom: 0;
      cursor: pointer;
    }

    .required {
      color: var(--error-color, #db4437);
    }

    .error {
      color: var(--error-color, #db4437);
      font-size: 12px;
      margin-top: 4px;
    }

    .unit {
      color: var(--secondary-text-color, #757575);
      font-size: 12px;
      margin-left: 4px;
    }
  `;

  render() {
    if (!this.schema || this.schema.length === 0) {
      return html`<div class="empty">No schema defined</div>`;
    }

    return html`
      <div class="mock-form">
        ${this.schema.map((field) => this._renderField(field))}
      </div>
    `;
  }

  private _getLabel(field: SchemaItem): string {
    if (this.computeLabel) {
      return this.computeLabel(field, this.data);
    }
    // Default: capitalize and replace underscores
    return (
      field.name.charAt(0).toUpperCase() +
      field.name.slice(1).replace(/_/g, " ")
    );
  }

  private _renderField(field: SchemaItem) {
    const error = this.error?.[field.name];

    return html`
      <div class="form-field" data-field="${field.name}">
        ${this._renderInput(field)}
        ${error ? html`<div class="error">${error}</div>` : ""}
      </div>
    `;
  }

  private _renderInput(field: SchemaItem) {
    const value = this.data?.[field.name];
    const label = this._getLabel(field);
    const selector = field.selector;

    // Boolean / Checkbox
    if (field.type === "boolean" || selector?.boolean) {
      return html`
        <div class="checkbox-container">
          <input
            type="checkbox"
            id="field-${field.name}"
            aria-label="${field.name}"
            .checked=${!!value}
            @change=${(e: Event) =>
              this._handleChange(field.name, (e.target as HTMLInputElement).checked)}
          />
          <label for="field-${field.name}">${label}</label>
        </div>
      `;
    }

    // Select dropdown
    if (selector?.select) {
      const options = selector.select.options || [];
      return html`
        <label>${label}${field.required ? html`<span class="required">*</span>` : ""}</label>
        <select
          aria-label="${field.name}"
          .value=${String(value || "")}
          @change=${(e: Event) => {
            console.log(`[MockHaForm] select changed: ${field.name} =`, (e.target as HTMLSelectElement).value);
            this._handleChange(field.name, (e.target as HTMLSelectElement).value);
          }}
        >
          ${options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return html`
              <option value="${optValue}" ?selected=${value === optValue}>
                ${optLabel}
              </option>
            `;
          })}
        </select>
      `;
    }

    // Number input
    if (field.type === "integer" || selector?.number) {
      const numConfig = selector?.number || {};
      return html`
        <label>${label}${field.required ? html`<span class="required">*</span>` : ""}</label>
        <input
          type="number"
          aria-label="${field.name}"
          .value=${String(value ?? "")}
          min=${numConfig.min ?? ""}
          max=${numConfig.max ?? ""}
          step=${numConfig.step ?? 1}
          @input=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            this._handleChange(field.name, v === "" ? undefined : Number(v));
          }}
          ?required=${field.required}
        />
        ${numConfig.unit_of_measurement
          ? html`<span class="unit">${numConfig.unit_of_measurement}</span>`
          : ""}
      `;
    }

    // Multiline text
    if (selector?.text?.multiline) {
      return html`
        <label>${label}${field.required ? html`<span class="required">*</span>` : ""}</label>
        <textarea
          aria-label="${field.name}"
          .value=${String(value || "")}
          @input=${(e: Event) =>
            this._handleChange(field.name, (e.target as HTMLTextAreaElement).value)}
          ?required=${field.required}
        ></textarea>
      `;
    }

    // Default: text input (also handles entity, area, icon selectors as plain text)
    // Add data-first-field for auto-focus
    const isFirstField = this.schema.indexOf(field) === 0;
    return html`
      <label>${label}${field.required ? html`<span class="required">*</span>` : ""}</label>
      <input
        type="text"
        aria-label="${field.name}"
        .value=${String(value || "")}
        @input=${(e: Event) =>
          this._handleChange(field.name, (e.target as HTMLInputElement).value)}
        ?required=${field.required}
        ?data-first-field=${isFirstField}
        class="${isFirstField ? 'first-field' : ''}"
      />
    `;
  }

  private _handleChange(name: string, value: unknown) {
    // CRITICAL: Create new object (immutability pattern)
    const newData = { ...this.data, [name]: value };

    console.log(`[MockHaForm] value-changed: ${name} =`, value);

    // Dispatch with bubbles + composed to cross Shadow DOM
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: newData },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// ============================================================================
// MockHaIcon
// ============================================================================

/**
 * Simple mock for ha-icon - just renders the icon name for debugging.
 */
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";

  // Explicit static properties for Vite compatibility
  static properties = {
    icon: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-size: 10px;
      color: var(--secondary-text-color, #757575);
    }
  `;

  render() {
    // In real HA, this would render an SVG.
    // In the harness, render a friendly glyph for common MDI icons to keep the UI readable.
    const icon = this.icon || "";
    const emojiByMdi: Record<string, string> = {
      // Structural
      "mdi:layers": "≡",
      "mdi:map-marker": "◎",
      "mdi:home-outline": "⌂",
      "mdi:warehouse": "▣",
      "mdi:vector-square": "◇",
      "mdi:home-group": "❖",
      // Controls
      "mdi:chevron-right": "▶",
      "mdi:chevron-down": "▼",
      "mdi:drag-vertical": "⋮⋮",
      "mdi:delete-outline": "🗑️",
      "mdi:map-marker-plus": "➕",
      "mdi:arrow-left": "←",
      "mdi:information-outline": "ⓘ",
      // Occupancy/automation inspector
      "mdi:tune-variant": "⚙",
      "mdi:target": "◎",
      "mdi:cog": "⚙",
      "mdi:flash": "⚡",
      "mdi:robot": "🤖",
      "mdi:brain": "🧠",
      // Categories (semantic)
      "mdi:silverware-fork-knife": "🍴",
      "mdi:bed": "🛏️",
      "mdi:shower": "🛁",
      "mdi:sofa": "🛋️",
      "mdi:table-furniture": "🍽️",
      "mdi:desk": "💼",
      "mdi:garage": "🚗",
      "mdi:flower": "🌿",
      "mdi:washing-machine": "⚙️",
      "mdi:package-variant": "📦",
      "mdi:dumbbell": "🏋️",
      "mdi:theater": "🎬",
    };

    const display = emojiByMdi[icon] ?? (icon.replace("mdi:", "") || "?");
    return html`<span title="${icon}">${display}</span>`;
  }
}

// ============================================================================
// MockHaIconButton
// ============================================================================

/**
 * Mock for ha-icon-button - renders a native button.
 */
export class MockHaIconButton extends LitElement {
  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: Boolean }) disabled = false;

  // Explicit static properties for Vite compatibility
  static properties = {
    icon: { type: String },
    label: { type: String },
    disabled: { type: Boolean },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-text-color, #212121);
    }

    button:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.1));
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  render() {
    const icon = this.icon || "";
    const emojiByMdi: Record<string, string> = {
      "mdi:delete-outline": "🗑️",
      "mdi:dots-vertical": "⋮",
      "mdi:pencil": "✎",
      "mdi:plus": "➕",
    };
    const shortName = emojiByMdi[icon] ?? (icon.replace("mdi:", "") || "?");
    return html`
      <button
        title="${this.label || this.icon}"
        aria-label="${this.label || this.icon}"
        ?disabled=${this.disabled}
      >
        ${shortName}
      </button>
    `;
  }
}

// ============================================================================
// MockMwcButton
// ============================================================================

/**
 * Mock for mwc-button (Material Web Components button).
 * Renders a native button with similar styling.
 */
export class MockMwcButton extends LitElement {
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) label = "";
  @property({ type: String }) icon = "";

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    icon: { type: String },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: background 0.2s, opacity 0.2s;
    }

    button:hover:not(:disabled) {
      background: var(--primary-color, #03a9f4);
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host([slot="secondaryAction"]) button {
      background: transparent;
      color: var(--primary-color, #03a9f4);
      border: 1px solid var(--primary-color, #03a9f4);
    }

    :host([slot="secondaryAction"]) button:hover:not(:disabled) {
      background: rgba(3, 169, 244, 0.1);
    }
  `;

  render() {
    return html`
      <button ?disabled=${this.disabled} @click=${this._handleClick}>
        <slot></slot>
      </button>
    `;
  }

  private _handleClick(e: Event) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

// ============================================================================
// MockHaButton
// ============================================================================

/**
 * Mock for ha-button.
 * Mirrors the same behavior as MockMwcButton for dialog action testing.
 */
export class MockHaButton extends MockMwcButton {}

// ============================================================================
// MockHaTextfield
// ============================================================================

/**
 * Minimal mock for ha-textfield.
 * - Exposes `.value` and reflects it into an internal <input>
 * - Re-dispatches `input` events (bubbles + composed)
 */
export class MockHaTextfield extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) type: "text" | "number" = "text";
  @property({ type: String }) value = "";
  @property({ type: String }) min?: string;
  @property({ type: String }) max?: string;

  // Explicit static properties for Vite compatibility
  static properties = {
    label: { type: String },
    type: { type: String },
    value: { type: String },
    min: { type: String },
    max: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }
    label {
      display: block;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      margin-bottom: 4px;
    }
    input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      box-sizing: border-box;
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ""}
      <input
        .value=${this.value ?? ""}
        type=${this.type}
        min=${this.min ?? ""}
        max=${this.max ?? ""}
        @input=${this._onInput}
      />
    `;
  }

  private _onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }
}

// ============================================================================
// MockHaCheckbox / MockHaRadio / MockHaFormfield
// ============================================================================

export class MockHaCheckbox extends LitElement {
  @property({ type: Boolean }) checked = false;

  static properties = { checked: { type: Boolean } };

  render() {
    return html`
      <input
        type="checkbox"
        .checked=${this.checked}
        @change=${(e: Event) => {
          this.checked = (e.target as HTMLInputElement).checked;
          this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        }}
      />
    `;
  }
}

export class MockHaRadio extends LitElement {
  @property({ type: String }) name = "";
  @property({ type: String }) value = "";
  @property({ type: Boolean }) checked = false;

  static properties = { name: { type: String }, value: { type: String }, checked: { type: Boolean } };

  render() {
    return html`
      <input
        type="radio"
        name=${this.name}
        value=${this.value}
        .checked=${this.checked}
        @change=${(e: Event) => {
          this.checked = (e.target as HTMLInputElement).checked;
          this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        }}
      />
    `;
  }
}

export class MockHaFormfield extends LitElement {
  @property({ type: String }) label = "";

  static properties = { label: { type: String } };

  static styles = css`
    :host {
      display: block;
    }
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--primary-text-color, #212121);
      cursor: pointer;
    }
  `;

  render() {
    return html`<label><slot></slot>${this.label}</label>`;
  }
}

// ============================================================================
// MockMwcListItem + MockHaSelect
// ============================================================================

export class MockMwcListItem extends LitElement {
  @property({ type: String }) value = "";
  @property({ type: Boolean }) selected = false;

  static properties = { value: { type: String }, selected: { type: Boolean } };

  render() {
    return html`<slot></slot>`;
  }
}

export class MockHaSelect extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) value = "";

  // Explicit static properties for Vite compatibility
  static properties = {
    label: { type: String },
    value: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }
    label {
      display: block;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      margin-bottom: 4px;
    }
    select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      box-sizing: border-box;
    }
  `;

  render() {
    // Build options from light DOM <mwc-list-item> children.
    const items = Array.from(this.querySelectorAll("mwc-list-item")) as Array<any>;
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ""}
      <select
        .value=${this.value ?? ""}
        @change=${(e: Event) => {
          this.value = (e.target as HTMLSelectElement).value;
          this.dispatchEvent(new Event("selected", { bubbles: true, composed: true }));
        }}
      >
        ${items.map((item) => {
          const v = item.getAttribute("value") ?? item.value ?? "";
          const text = item.textContent?.trim() ?? v;
          return html`<option value=${v}>${text}</option>`;
        })}
      </select>
    `;
  }
}

// ============================================================================
// MockHaEntityPicker
// ============================================================================

export class MockHaEntityPicker extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: String }) value = "";
  @property({ type: String }) label = "";
  @property({ attribute: false }) includeAreas?: string[];

  static properties = {
    hass: { attribute: false },
    value: { type: String },
    label: { type: String },
    includeAreas: { attribute: false },
  };

  static styles = css`
    :host {
      display: block;
    }
    label {
      display: block;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      margin-bottom: 4px;
    }
    input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      box-sizing: border-box;
    }
    .hint {
      margin-top: 6px;
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ""}
      <input
        type="text"
        .value=${this.value ?? ""}
        placeholder="entity_id (mock)"
        @input=${(e: Event) => {
          this.value = (e.target as HTMLInputElement).value;
          this.dispatchEvent(
            new CustomEvent("value-changed", {
              detail: { value: this.value },
              bubbles: true,
              composed: true,
            })
          );
        }}
      />
      <div class="hint">
        Mock picker: type an entity_id. ${this.includeAreas?.length ? `Areas: ${this.includeAreas.join(", ")}` : ""}
      </div>
    `;
  }
}

// ============================================================================
// Component Registration
// ============================================================================

const MOCK_COMPONENTS: Array<{ name: string; cls: CustomElementConstructor }> = [
  { name: "ha-dialog", cls: MockHaDialog },
  { name: "ha-form", cls: MockHaForm },
  { name: "ha-icon", cls: MockHaIcon },
  { name: "ha-icon-button", cls: MockHaIconButton },
  { name: "ha-textfield", cls: MockHaTextfield },
  { name: "ha-checkbox", cls: MockHaCheckbox },
  { name: "ha-radio", cls: MockHaRadio },
  { name: "ha-formfield", cls: MockHaFormfield },
  { name: "ha-select", cls: MockHaSelect },
  { name: "ha-entity-picker", cls: MockHaEntityPicker },
  { name: "ha-button", cls: MockHaButton },
  { name: "mwc-button", cls: MockMwcButton },
  { name: "mwc-list-item", cls: MockMwcListItem },
];

for (const { name, cls } of MOCK_COMPONENTS) {
  if (!customElements.get(name)) {
    try {
      customElements.define(name, cls);
      console.log(`[MockHA] Registered ${name}`);
    } catch (e) {
      console.warn(`[MockHA] Failed to register ${name}:`, e);
    }
  }
}

console.log("[MockHA] Mock HA components loaded");

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}
