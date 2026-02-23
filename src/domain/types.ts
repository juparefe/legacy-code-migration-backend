import type { ZodIssue } from "zod";

/* ----------------------------- Primitives ----------------------------- */

export type SourceLanguage = "COBOL" | "DELPHI";
export type TargetLanguage = "NODE";

export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8";
export type RuleToggle = RuleId[] | Partial<Record<RuleId, boolean>>;

export type Severity = "LOW" | "MEDIUM" | "HIGH";

/* ------------------------------ Requests ------------------------------ */

export interface MigrateRequest {
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  code: string;
  rules?: RuleToggle;
  requestId?: string;
}

export type ValidationError = {
  message: string;
  issues: ZodIssue[];
};

/* ------------------------------- Reports ------------------------------ */

export interface RuleEvidence {
  line: number;
  original: string;
  generated: string;
}

export interface Warning {
  code: string;
  severity: Severity;
  line?: number;
  message: string;
}

export interface AppliedRuleReport {
  id: RuleId;
  name: string;
  hits: number;
  evidence: RuleEvidence[];
}

/* ------------------------------ Responses ----------------------------- */

export interface MigrateReportSummary {
  linesIn: number;
  linesOut: number;
  rulesApplied: number;
  warnings: number;
}

export interface MigrateReport {
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  summary: MigrateReportSummary;
  appliedRules: AppliedRuleReport[];
  warningsDetected: Warning[];
}

export interface MigrateResponse {
  output: string;
  report: MigrateReport;
}

/* ------------------------------- Rules -------------------------------- */

export type RuleRunResult = {
  output: string;
  report: AppliedRuleReport;
  warnings: Warning[];
};

export interface Rule {
  id: RuleId;
  name: string;
  appliesTo: SourceLanguage;
  run(input: string): RuleRunResult;
}