import { getRulesFor, resolveEnabledRuleIds } from "./ruleCatalog";
import { Rule, RuleToggle } from "../types";

describe("ruleCatalog", () => {
  describe("getRulesFor", () => {
    it(`GIVEN a list of rules with appliesTo
        WHEN requesting rules for a source language
        THEN returns only rules that apply to that language`, () => {
      const cobol = getRulesFor("COBOL");
      const delphi = getRulesFor("DELPHI");

      expect(Array.isArray(cobol)).toBe(true);
      expect(cobol.every(r => r.appliesTo === "COBOL")).toBe(true);

      expect(Array.isArray(delphi)).toBe(true);
      expect(delphi.every(r => r.appliesTo === "DELPHI")).toBe(true);
    });
  });

  describe("resolveEnabledRuleIds", () => {
    const rules: Rule[] = [
      { name: "Rule 1", id: "R1", appliesTo: "COBOL", run: () => ({ output: "", report: { id: "R1", hits: 0, name: "", evidence: [] }, warnings: [] }) } as Rule,
      { name: "Rule 2", id: "R2", appliesTo: "COBOL", run: () => ({ output: "", report: { id: "R2", hits: 0, name: "", evidence: [] }, warnings: [] }) } as Rule,
      { name: "Rule 3", id: "R3", appliesTo: "COBOL", run: () => ({ output: "", report: { id: "R3", hits: 0, name: "", evidence: [] }, warnings: [] }) } as Rule,
    ];

    it(`GIVEN no toggle
        WHEN resolving enabled rule ids
        THEN all rule ids are enabled`, () => {
      const enabled = resolveEnabledRuleIds(rules);
      expect([...enabled].sort()).toEqual(["R1", "R2", "R3"]);
    });

    it(`GIVEN an array toggle whitelist
        WHEN resolving enabled rule ids
        THEN only ids in the whitelist and existing are enabled`, () => {
      const enabled = resolveEnabledRuleIds(rules, ["R1", "R9"] as RuleToggle);
      expect([...enabled].sort()).toEqual(["R1"]);
    });

    it(`GIVEN an object toggle
        WHEN resolving enabled rule ids
        THEN ids with true are enabled and false are disabled`, () => {
      const enabled = resolveEnabledRuleIds(rules, { R1: true, R2: false } as RuleToggle);
      expect([...enabled].sort()).toEqual(["R1", "R3"]);
    });

    it(`GIVEN an object toggle with no explicit values
        WHEN resolving enabled rule ids
        THEN missing ids default to enabled`, () => {
      const enabled = resolveEnabledRuleIds(rules, {} as RuleToggle);
      expect([...enabled].sort()).toEqual(["R1", "R2", "R3"]);
    });
  });
});