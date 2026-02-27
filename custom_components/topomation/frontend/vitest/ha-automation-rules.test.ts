import { describe, expect, it, vi } from "vitest";
import {
  createTopomationActionRule,
  deleteTopomationActionRule,
  listTopomationActionRules,
  setTopomationActionRuleEnabled,
  type TopomationActionRule,
} from "../ha-automation-rules";

describe("ha-automation-rules websocket path", () => {
  it("lists managed rules from backend websocket contract", async () => {
    const rules: TopomationActionRule[] = [
      {
        id: "rule_a",
        entity_id: "automation.rule_a",
        name: "A Rule",
        trigger_type: "occupied",
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        require_dark: false,
        enabled: true,
      },
    ];

    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/list") {
        return { rules };
      }
      return {};
    });
    const callApi = vi.fn();
    const hass = {
      callWS,
      callApi,
      states: {},
    } as any;

    const listed = await listTopomationActionRules(hass, "kitchen");

    expect(listed).toEqual(rules);
    expect(callWS).toHaveBeenCalledWith({
      type: "topomation/actions/rules/list",
      location_id: "kitchen",
    });
    expect(callApi).not.toHaveBeenCalled();
  });

  it("creates managed rules through backend websocket contract", async () => {
    const createdRule: TopomationActionRule = {
      id: "rule_created",
      entity_id: "automation.rule_created",
      name: "Kitchen Occupied: Kitchen Light (turn on)",
      trigger_type: "occupied",
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      require_dark: true,
      enabled: true,
    };

    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/create") {
        return { rule: createdRule };
      }
      return {};
    });
    const callApi = vi.fn();
    const hass = {
      callWS,
      callApi,
      states: {},
    } as any;

    const rule = await createTopomationActionRule(hass, {
      location: {
        id: "kitchen",
        name: "Kitchen",
      } as any,
      name: createdRule.name,
      trigger_type: "occupied",
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      require_dark: true,
    });

    expect(rule).toEqual(createdRule);
    expect(callWS).toHaveBeenCalledWith({
      type: "topomation/actions/rules/create",
      location_id: "kitchen",
      name: createdRule.name,
      trigger_type: "occupied",
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      require_dark: true,
    });
    expect(callApi).not.toHaveBeenCalled();
  });

  it("fails fast when set_enabled ws command is unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/set_enabled") {
        throw new Error("unknown_command: unsupported");
      }
      return {};
    });
    const hass = {
      callWS,
      states: {},
    } as any;

    await expect(
      setTopomationActionRuleEnabled(
        hass,
        {
          id: "rule_1",
          entity_id: "automation.rule_1",
          name: "Rule 1",
          trigger_type: "vacant",
          require_dark: false,
          enabled: true,
        },
        false
      )
    ).rejects.toThrow("managed-action backend is unavailable");

    expect(callWS).toHaveBeenCalledWith({
      type: "topomation/actions/rules/set_enabled",
      entity_id: "automation.rule_1",
      enabled: false,
    });
  });

  it("fails fast when create ws command is unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/create") {
        throw new Error("unknown_command: unsupported");
      }
      return {};
    });
    const callApi = vi.fn();
    const hass = {
      callWS,
      callApi,
      states: {},
    } as any;

    await expect(
      createTopomationActionRule(hass, {
        location: {
          id: "kitchen",
          name: "Kitchen",
        } as any,
        name: "Kitchen Occupied: Kitchen Light (turn on)",
        trigger_type: "occupied",
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        require_dark: true,
      })
    ).rejects.toThrow("managed-action backend is unavailable");
    expect(callApi).not.toHaveBeenCalled();
  });

  it("fails fast when delete ws command is unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/delete") {
        throw new Error("unknown_command: unsupported");
      }
      return {};
    });
    const callApi = vi.fn();
    const hass = {
      callWS,
      callApi,
      states: {},
    } as any;

    await expect(
      deleteTopomationActionRule(hass, {
        id: "rule_1",
        entity_id: "automation.rule_1",
      })
    ).rejects.toThrow("managed-action backend is unavailable");
    expect(callApi).not.toHaveBeenCalled();
  });
});
