import { Rule, RuleId, RuleToggle, SourceLanguage } from "../types";
import { R1_ifElseEndIf } from "./cobol/R1_ifElseEndIf";
import { R2_displayLiteral } from "./cobol/R2_displayLiteral";
import { R3_move } from "./cobol/R3_move";
import { R4_add } from "./cobol/R4_add";
import { R5_subtract } from "./cobol/R5_subtract";
import { R6_perform } from "./cobol/R6_performUntil";
import { R7_evaluate } from "./cobol/R7_evaluate";
import { R8_comments } from "./cobol/R8_comments";

const ALL_RULES: Rule[] = [
  R8_comments,
  R1_ifElseEndIf,
  R2_displayLiteral,
  R3_move,
  R4_add,
  R5_subtract,
  R6_perform,
  R7_evaluate
];

export function getRulesFor(source: SourceLanguage): Rule[] {
  return ALL_RULES.filter(r => r.appliesTo === source);
}

export function resolveEnabledRuleIds(
  all: Rule[],
  toggle?: RuleToggle
): Set<RuleId> {
  const allIds = new Set(all.map(r => r.id));

  // default: todas
  if (!toggle) return allIds;

  // array: whitelist
  if (Array.isArray(toggle)) {
    return new Set(toggle.filter(id => allIds.has(id)));
  }

  // object: toggles
  const enabled = new Set<RuleId>();
  for (const id of allIds) {
    const v = toggle[id];
    if (v === undefined) {
      // si no viene, por defecto lo dejas ON (o OFF si prefieres)
      enabled.add(id);
    } else if (v === true) {
      enabled.add(id);
    }
  }
  return enabled;
}