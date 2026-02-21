export type SourceLanguage = "COBOL" | "DELPHI";
export type TargetLanguage = "NODE";

export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8";

export type RuleToggle = RuleId[] | Partial<Record<RuleId, boolean>>;

export interface MigrateRequest {
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  code: string;
  rules?: RuleToggle;
}

export interface RuleEvidence {
  line: number;
  original: string;
  generated: string;
}

export interface Warning {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  line?: number;
  message: string;
}

export interface AppliedRuleReport {
  id: RuleId;
  name: string;
  hits: number;
  evidence: RuleEvidence[];
}

export interface MigrateResponse {
  output: string;
  report: {
    sourceLanguage: SourceLanguage;
    targetLanguage: TargetLanguage;
    summary: {
      linesIn: number;
      linesOut: number;
      rulesApplied: number;
      warnings: number;
    };
    appliedRules: AppliedRuleReport[];
    warningsDetected: Warning[];
  };
}

export interface RuleContext {
  // Puedes agregar cosas como mapping de variables, camelCase, etc.
}

export interface Rule {
  id: RuleId;
  name: string;
  appliesTo: SourceLanguage;
  run(input: string, ctx: RuleContext): {
    output: string;
    report: AppliedRuleReport;
    warnings: Warning[];
  };
}