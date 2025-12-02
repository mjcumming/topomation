/**
 * Home Topology Panel - Main Entry Point
 * 
 * This is a minimal scaffold. The full implementation will be in TypeScript
 * and compiled to this location.
 * 
 * For now, this renders a placeholder to verify panel registration works.
 */

import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@3.3.3/lit-element.js?module";

class HomeTopologyPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      panel: { type: Object },
      route: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
      }

      .container {
        display: flex;
        height: 100%;
      }

      .tree-panel {
        width: 40%;
        min-width: 300px;
        border-right: 1px solid var(--divider-color);
        padding: 16px;
        overflow-y: auto;
      }

      .details-panel {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }

      h1 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 400;
      }

      .subtitle {
        color: var(--secondary-text-color);
        margin-bottom: 24px;
      }

      .placeholder {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        color: var(--secondary-text-color);
      }

      .placeholder ha-icon {
        --mdc-icon-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      @media (max-width: 768px) {
        .container {
          flex-direction: column;
        }
        .tree-panel {
          width: 100%;
          min-width: unset;
          border-right: none;
          border-bottom: 1px solid var(--divider-color);
        }
      }
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="tree-panel">
          <h1>Home Topology</h1>
          <p class="subtitle">Model your space and attach behavior modules.</p>
          
          <div class="placeholder">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>Location tree will render here</p>
            <p><strong>ht-location-tree</strong> component</p>
          </div>
        </div>
        
        <div class="details-panel">
          <div class="placeholder">
            <ha-icon icon="mdi:cog"></ha-icon>
            <p>Select a location to configure</p>
            <p><strong>ht-location-inspector</strong> component</p>
          </div>
        </div>
      </div>
    `;
  }

  async firstUpdated() {
    // Test WebSocket API connection
    try {
      const result = await this.hass.callWS({
        type: "home_topology/locations/list",
      });
      console.log("Home Topology locations:", result.locations);
    } catch (err) {
      console.error("Failed to load locations:", err);
    }
  }
}

customElements.define("home-topology-panel", HomeTopologyPanel);

