import { describe, expect, it } from "vitest";
import {
  applyModeDefaults,
  getSourceDefaultsForEntity,
  getTemplatesForEntity,
} from "../source-profile-utils";

describe("source-profile-utils media policy", () => {
  const media = {
    entity_id: "media_player.living_room_tv",
    attributes: {},
  };

  it("uses media interaction defaults", () => {
    const defaults = getSourceDefaultsForEntity(media);
    expect(defaults.mode).toBe("any_change");
    expect(defaults.on_timeout).toBe(1800);
    expect(defaults.off_event).toBe("none");
  });

  it("forces media to any_change even when specific mode is selected", () => {
    const next = applyModeDefaults(
      { entity_id: media.entity_id, mode: "specific_states", on_timeout: null },
      "specific_states",
      media,
    );

    expect(next.mode).toBe("any_change");
    expect(next.on_timeout).toBe(1800);
    expect(next.off_event).toBe("none");
  });

  it("returns interaction template for both modes", () => {
    const anyChangeTemplates = getTemplatesForEntity(media, "any_change");
    const specificTemplates = getTemplatesForEntity(media, "specific_states");

    expect(anyChangeTemplates[0]?.id).toBe("media_interaction");
    expect(specificTemplates[0]?.id).toBe("media_interaction");
  });
});
