import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location, OccupancyConfig, AutomationConfig } from "./types";
import { sharedStyles } from "./styles";

console.log("[ht-location-inspector] module loaded");

/**
 * Location inspector panel
 * Shows details and configuration for selected location
 */
// @customElement("ht-location-inspector")
export class HtLocationInspector extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public location?: Location;

  @state() private _activeTab: "occupancy" | "actions" = "occupancy";

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
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .header-icon {
        font-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }

      .location-id {
        font-size: 12px;
        color: var(--text-secondary-color);
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
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
      }

      .toggle {
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: var(--disabled-color);
        position: relative;
        cursor: pointer;
        transition: background var(--transition-speed);
      }

      .toggle.on {
        background: var(--primary-color);
      }

      .toggle::after {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform var(--transition-speed);
      }

      .toggle.on::after {
        transform: translateX(20px);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 80px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
      }

      .source-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
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
    `,
  ];

  protected render() {
    if (!this.location) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">👈</div>
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

  private _renderHeader() {
    if (!this.location) return "";

    const meta = this.location.modules._meta as any;
    const icon = this._getLocationIcon(meta?.type || "room");

    return html`
      <div class="header">
        <div class="header-icon">${icon}</div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">${this.location.id}</div>
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

    const config = (this.location.modules.occupancy ||
      {}) as OccupancyConfig;
    const enabled = config.enabled ?? true;
    const timeout = config.default_timeout || 300;

    return html`
      <div>
        <div class="section-header">PRESENCE LOGIC</div>
        <div class="config-row">
          <div class="config-label">Enable Occupancy Tracking</div>
          <div class="config-value">
            <div class="toggle ${enabled ? "on" : ""}" @click=${this._toggleEnabled}>
            </div>
          </div>
        </div>

        ${enabled
          ? html`
              <div class="config-row">
                <div class="config-label">Default Timeout</div>
                <div class="config-value">
                  <input
                    type="number"
                    class="input"
                    .value=${Math.floor(timeout / 60)}
                    @change=${this._handleTimeoutChange}
                  />
                  <span class="text-muted">minutes</span>
                </div>
              </div>

              <div class="section-header">OCCUPANCY SOURCES</div>
              <div class="sources-list">
                ${this._renderOccupancySources(config)}
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _renderOccupancySources(config: OccupancyConfig) {
    const sources = config.occupancy_sources || [];

    if (!sources.length) {
      return html`
        <div class="empty-state">
          <div class="text-muted">
            No occupancy sources configured. Add sensors to track occupancy.
          </div>
          <button class="button button-primary" style="margin-top: 16px;">
            + Add Source
          </button>
        </div>
      `;
    }

    return sources.map(
      (source) => html`
        <div class="source-item">
          <div class="source-icon">⊙</div>
          <div class="source-info">
            <div class="source-name">${source.entity_id}</div>
            <div class="source-details">
              ${source.mode === "any_change" ? "Any Change" : "Specific States"}
              ${source.on_timeout
                ? ` • ${Math.floor(source.on_timeout / 60)}min`
                : ""}
            </div>
          </div>
          <button class="icon-button">⚙️</button>
        </div>
      `
    );
  }

  private _renderActionsTab() {
    if (!this.location) return "";

    const config = (this.location.modules.automation || {}) as AutomationConfig;
    const rules = config.rules || [];

    return html`
      <div>
        <div class="section-header">AUTOMATION RULES</div>

        <div class="actions">
          <button class="button button-primary" @click=${this._handleAddRule}>
            + Add Rule
          </button>
        </div>

        <div class="rules-list" style="margin-top: var(--spacing-md);">
          ${
            rules.length === 0
              ? html`
                  <div class="empty-state">
                    <div class="text-muted">No automation rules configured.</div>
                  </div>
                `
              : rules.map(
                  (rule) => html`
                    <div class="source-item">
                      <div class="source-icon">⚡</div>
                      <div class="source-info">
                        <div class="source-name">${rule.name}</div>
                        <div class="source-details">
                          When ${rule.trigger_type} → ${rule.action_service} (${rule.action_entity_id})
                        </div>
                      </div>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(rule.id)}>🗑️</button>
                    </div>
                  `
                )
          }
        </div>
      </div>
    `;
  }

  private _handleAddRule() {
    alert("Rule editor dialog coming in next iteration");
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

  private _getLocationIcon(type: string): string {
    const typeIcons: Record<string, string> = {
      floor: "≡",
      room: "◎",
      zone: "◇",
      suite: "❖",
      outdoor: "⌂",
      building: "▣",
    };
    return typeIcons[type] || "◎";
  }

  private _toggleEnabled(): void {
    if (!this.location) return;

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    const newEnabled = !(config.enabled ?? true);

    this._updateConfig({ ...config, enabled: newEnabled });
  }

  private _handleTimeoutChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const minutes = parseInt(input.value, 10);
    const seconds = minutes * 60;

    if (!this.location) return;

    const config = (this.location.modules.occupancy || {}) as OccupancyConfig;
    this._updateConfig({ ...config, default_timeout: seconds });
  }

  private async _updateConfig(config: OccupancyConfig): Promise<void> {
    await this._updateModuleConfig("occupancy", config);
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

