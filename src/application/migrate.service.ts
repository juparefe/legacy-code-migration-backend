import { MigrateRequest, MigrateResponse } from "../domain/types";
import { getRulesFor, resolveEnabledRuleIds } from "../domain/rules/ruleCatalog";
import { debugService, debugRules } from "../infrastructure/logger";


export const migrateService = {
  migrate(req: MigrateRequest): MigrateResponse {
    debugService("Starting migration");
    const rules = getRulesFor(req.sourceLanguage);
    const enabledIds = resolveEnabledRuleIds(rules, req.rules);

    const linesIn = req.code.split("\n").length;

    let current = normalize(req.code);

    const appliedRules = [];
    const warningsDetected = [];

    for (const rule of rules) {
      debugRules("Applying rule %s", rule.id);
      if (!enabledIds.has(rule.id)) continue;

      const res = rule.run(current);
      current = res.output;

      if (res.report.hits > 0) appliedRules.push(res.report);
      warningsDetected.push(...res.warnings);
    }

    const output = current;
    const linesOut = output.split("\n").length;

    return {
      output,
      report: {
        sourceLanguage: req.sourceLanguage,
        targetLanguage: req.targetLanguage,
        summary: {
          linesIn,
          linesOut,
          rulesApplied: appliedRules.length,
          warnings: warningsDetected.length
        },
        appliedRules,
        warningsDetected
      }
    };
  }
};

function normalize(code: string): string {
  return code
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .trimEnd();
}