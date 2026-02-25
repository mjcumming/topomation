/// <reference types="mocha" />
import { fixture, html, expect } from "@open-wc/testing";
import "./mock-ha-components";
import "./ht-location-dialog";
import type { HomeAssistant, Location } from "./types";

function createHass(): HomeAssistant {
  return {
    callWS: async <T>() => ({ success: true } as T),
    connection: {},
    states: {},
    areas: {},
    floors: {},
    config: { location_name: "Test Home" },
    localize: (key: string) => key,
  };
}

describe("HtLocationDialog", () => {
  it("hides synthetic root option when explicit home root exists", async () => {
    const locations: Location[] = [
      {
        id: "home",
        name: "Home",
        parent_id: null,
        is_explicit_root: true,
        entity_ids: [],
        modules: { _meta: { type: "building" } },
      },
      {
        id: "building_main",
        name: "Main Building",
        parent_id: "home",
        is_explicit_root: false,
        entity_ids: [],
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<any>(html`
      <ht-location-dialog
        .hass=${createHass()}
        .open=${true}
        .locations=${locations}
      ></ht-location-dialog>
    `);
    await element.updateComplete;

    const schema = element._getSchema();
    const parentField = schema.find((field: any) => field.name === "parent_id");
    const hasRootOption = (parentField?.selector?.select?.options || []).some(
      (opt: any) => opt?.label === "(Root Level)"
    );

    expect(hasRootOption).to.equal(false);
  });

  it("closes when cancel is clicked", async () => {
    const element = await fixture<any>(html`
      <ht-location-dialog
        .hass=${createHass()}
        .open=${true}
        .locations=${[]}
      ></ht-location-dialog>
    `);
    await element.updateComplete;

    const cancelButton = element.shadowRoot?.querySelector(
      'ha-button[slot="secondaryAction"]'
    ) as HTMLElement | null;
    expect(cancelButton).to.exist;

    cancelButton?.click();
    await element.updateComplete;

    expect(element.open).to.equal(false);
  });

  it("hides parent selector for root-only wrappers and submits null parent", async () => {
    const locations: Location[] = [
      {
        id: "home",
        name: "Home",
        parent_id: null,
        is_explicit_root: true,
        entity_ids: [],
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<any>(html`
      <ht-location-dialog
        .hass=${createHass()}
        .open=${true}
        .locations=${locations}
      ></ht-location-dialog>
    `);
    await element.updateComplete;

    element._config = {
      name: "New Building",
      type: "building",
    };

    const schema = element._getSchema();
    const parentField = schema.find((field: any) => field.name === "parent_id");
    expect(parentField).to.equal(undefined);
    expect(element._submitParentId()).to.equal(null);
  });
});
