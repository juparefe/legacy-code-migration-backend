import { MigrateRequest, MigrateResponse, RuleContext } from "../domain/types";
import { getRulesFor, resolveEnabledRuleIds } from "../domain/rules/ruleCatalog";

export const migrateService = {
  migrate(req: MigrateRequest): MigrateResponse {
    const ctx: RuleContext = {};

    const rules = getRulesFor(req.sourceLanguage);
    const enabledIds = resolveEnabledRuleIds(rules, req.rules);

    const linesIn = req.code.split("\n").length;

    let current = normalize(req.code);

    const appliedRules = [];
    const warningsDetected = [];

    for (const rule of rules) {
      if (!enabledIds.has(rule.id)) continue;

      const res = rule.run(current, ctx);
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
    .replace(/\\n/g, "\n")   // arregla escapes dobles
    .replace(/\r\n/g, "\n")  // normaliza windows
    .replace(/\t/g, "  ")    // tabs → espacios
    .trimEnd();
}