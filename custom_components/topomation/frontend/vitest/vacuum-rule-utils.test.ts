import { describe, expect, it } from "vitest";
import {
  automationEntityIdForRule,
  effectiveDailyGatingEnabled,
  vacuumDailyRunStatusLabel,
  vacuumRuleUsesStartAction,
} from "../vacuum-rule-utils";

describe("vacuum-rule-utils", () => {
  it("detects vacuum.start as the only start-cleaning action", () => {
    expect(
      vacuumRuleUsesStartAction([{ entity_id: "vacuum.main", service: "start" }])
    ).toBe(true);
    expect(
      vacuumRuleUsesStartAction([{ entity_id: "vacuum.main", service: "pause" }])
    ).toBe(false);
    expect(
      vacuumRuleUsesStartAction([{ entity_id: "switch.kitchen", service: "turn_on" }])
    ).toBe(false);
  });

  it("enables daily gating only for vacuum.start", () => {
    expect(
      effectiveDailyGatingEnabled(true, [{ entity_id: "vacuum.main", service: "start" }])
    ).toBe(true);
    expect(
      effectiveDailyGatingEnabled(true, [{ entity_id: "vacuum.main", service: "pause" }])
    ).toBe(false);
    expect(effectiveDailyGatingEnabled(false, [{ entity_id: "vacuum.main", service: "start" }])).toBe(
      false
    );
  });

  it("resolves automation entity ids for saved rules", () => {
    expect(
      automationEntityIdForRule({
        id: "topomation_kitchen_vacant_vacuum_main",
        entity_id: "automation.topomation_kitchen_vacant_vacuum_main",
      })
    ).toBe("automation.topomation_kitchen_vacant_vacuum_main");
    expect(automationEntityIdForRule({ id: "action_rule_123", entity_id: "" })).toBe("");
  });

  it("reports daily run status from automation last_triggered", () => {
    const now = new Date();
    const hass = {
      states: {
        "automation.vacuum_rule": {
          attributes: {
            last_triggered: now.toISOString(),
          },
        },
      },
    } as any;
    expect(vacuumDailyRunStatusLabel(hass, "automation.vacuum_rule")).toContain(
      "Already ran today"
    );
    expect(vacuumDailyRunStatusLabel(undefined, "action_rule_1")).toContain("Save the rule");
  });
});
