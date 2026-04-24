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
        trigger_type: "on_occupied",
        trigger_types: ["on_occupied"],
        actions: [{ entity_id: "light.kitchen", service: "turn_on" }],
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        action_data: undefined,
        ambient_condition: "any",
        must_be_occupied: false,
        time_condition_enabled: false,
        start_time: undefined,
        end_time: undefined,
        run_on_startup: undefined,
        user_named: false,
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

  it("fails fast when list ws command is unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/list") {
        throw new Error("unknown_command: unsupported");
      }
      return {};
    });
    const hass = {
      callWS,
      callApi: vi.fn(),
      states: {},
    } as any;

    await expect(listTopomationActionRules(hass, "kitchen")).rejects.toThrow(
      "managed-action backend is unavailable"
    );
  });

  it("normalizes legacy trigger values from backend list payloads", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/list") {
        return {
          rules: [
            {
              id: "rule_occ",
              entity_id: "automation.rule_occ",
              name: "Occupied Rule",
              trigger_type: "occupied",
              action_entity_id: "light.kitchen",
              action_service: "turn_on",
              ambient_condition: "any",
              must_be_occupied: true,
              enabled: true,
            },
            {
              id: "rule_bright",
              entity_id: "automation.rule_bright",
              name: "Bright Rule",
              trigger_type: "bright",
              action_entity_id: "light.kitchen",
              action_service: "turn_off",
              ambient_condition: "bright",
              enabled: true,
            },
          ],
        };
      }
      return {};
    });
    const hass = {
      callWS,
      callApi: vi.fn(),
      states: {},
    } as any;

    const listed = await listTopomationActionRules(hass, "kitchen");

    expect(listed.map((rule) => rule.trigger_type)).toEqual(["on_bright", "on_occupied"]);
  });

  it("creates managed rules through backend websocket contract", async () => {
    const createdRule: TopomationActionRule = {
      id: "rule_created",
      entity_id: "automation.rule_created",
      name: "Kitchen Occupied: Kitchen Light (turn on)",
      trigger_type: "on_occupied",
      trigger_types: ["on_occupied"],
      actions: [{ entity_id: "light.kitchen", service: "turn_on" }],
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      action_data: undefined,
      ambient_condition: "dark",
      must_be_occupied: true,
      time_condition_enabled: false,
      start_time: undefined,
      end_time: undefined,
      run_on_startup: undefined,
      user_named: false,
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
      trigger_type: "on_occupied",
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      ambient_condition: "dark",
      must_be_occupied: true,
    });

    expect(rule).toEqual(createdRule);
    expect(callWS).toHaveBeenCalledWith({
      type: "topomation/actions/rules/create",
      location_id: "kitchen",
      name: createdRule.name,
      trigger_type: "on_occupied",
      trigger_types: ["on_occupied"],
      action_entity_id: "light.kitchen",
      action_service: "turn_on",
      actions: [{ entity_id: "light.kitchen", service: "turn_on" }],
      action_data: undefined,
      ambient_condition: "dark",
      must_be_occupied: true,
      time_condition_enabled: false,
      start_time: undefined,
      end_time: undefined,
      require_dark: false,
    });
    expect(callApi).not.toHaveBeenCalled();
  });

  it("forwards automation identity fields for in-place rule updates", async () => {
    const createdRule: TopomationActionRule = {
      id: "topomation_kitchen_on_dark_fan_kitchen_hood_rule_abc123",
      entity_id: "automation.topomation_kitchen_on_dark_fan_kitchen_hood_rule_abc123",
      name: "Kitchen dark safety",
      rule_uuid: "rule_abc123",
      trigger_type: "on_dark",
      trigger_types: ["on_dark"],
      action_entity_id: "fan.kitchen_hood",
      action_service: "turn_on",
      actions: [{ entity_id: "fan.kitchen_hood", service: "turn_on" }],
      action_data: undefined,
      ambient_condition: "dark",
      must_be_occupied: true,
      time_condition_enabled: true,
      start_time: "22:00",
      end_time: "05:30",
      require_dark: true,
      enabled: true,
    };

    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/create") {
        return { rule: createdRule };
      }
      return {};
    });
    const hass = {
      callWS,
      callApi: vi.fn(),
      states: {},
    } as any;

    await createTopomationActionRule(hass, {
      location: {
        id: "kitchen",
        name: "Kitchen",
      } as any,
      name: createdRule.name,
      trigger_type: "on_dark",
      action_entity_id: "fan.kitchen_hood",
      action_service: "turn_on",
      actions: [{ entity_id: "fan.kitchen_hood", service: "turn_on" }],
      ambient_condition: "dark",
      must_be_occupied: true,
      time_condition_enabled: true,
      start_time: "22:00",
      end_time: "05:30",
      automation_id: "topomation_kitchen_on_dark_fan_kitchen_hood_rule_abc123",
      rule_uuid: "rule_abc123",
    });

    expect(callWS).toHaveBeenCalledWith({
      type: "topomation/actions/rules/create",
      location_id: "kitchen",
      name: createdRule.name,
      trigger_type: "on_dark",
      trigger_types: ["on_dark"],
      action_entity_id: "fan.kitchen_hood",
      action_service: "turn_on",
      actions: [{ entity_id: "fan.kitchen_hood", service: "turn_on" }],
      action_data: undefined,
      ambient_condition: "dark",
      must_be_occupied: true,
      time_condition_enabled: true,
      start_time: "22:00",
      end_time: "05:30",
      require_dark: false,
      automation_id: "topomation_kitchen_on_dark_fan_kitchen_hood_rule_abc123",
      rule_uuid: "rule_abc123",
    });
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
          trigger_type: "on_vacant",
          ambient_condition: "any",
          must_be_occupied: false,
          time_condition_enabled: false,
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
        trigger_type: "on_occupied",
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        ambient_condition: "dark",
        must_be_occupied: true,
      })
    ).rejects.toThrow("managed-action backend is unavailable");
    expect(callApi).not.toHaveBeenCalled();
  });

  it("preserves create_failed backend errors instead of masking them as unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/create") {
        throw {
          code: "create_failed",
          message: 'No occupancy binary sensor found for location "Kitchen" (kitchen)',
        };
      }
      return {};
    });
    const hass = {
      callWS,
      callApi: vi.fn(),
      states: {},
    } as any;

    await expect(
      createTopomationActionRule(hass, {
        location: {
          id: "kitchen",
          name: "Kitchen",
        } as any,
        name: "Kitchen Occupied: Kitchen Light (turn on)",
        trigger_type: "on_occupied",
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        ambient_condition: "dark",
        must_be_occupied: true,
      })
    ).rejects.toThrow('No occupancy binary sensor found for location "Kitchen" (kitchen)');
  });

  it("preserves unknown_error create responses instead of masking them as unavailable", async () => {
    const callWS = vi.fn(async (request: Record<string, unknown>) => {
      if (request.type === "topomation/actions/rules/create") {
        throw {
          code: "unknown_error",
          message: "Automation API POST 500: duplicate key value violates unique constraint",
        };
      }
      return {};
    });
    const hass = {
      callWS,
      callApi: vi.fn(),
      states: {},
    } as any;

    await expect(
      createTopomationActionRule(hass, {
        location: {
          id: "kitchen",
          name: "Kitchen",
        } as any,
        name: "Kitchen Occupied: Kitchen Light (turn on)",
        trigger_type: "on_occupied",
        action_entity_id: "light.kitchen",
        action_service: "turn_on",
        ambient_condition: "dark",
        must_be_occupied: true,
      })
    ).rejects.toThrow("Automation API POST 500");
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
