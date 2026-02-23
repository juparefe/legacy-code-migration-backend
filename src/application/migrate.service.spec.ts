import { migrateService } from "./migrate.service";
import {
  getRulesFor,
  resolveEnabledRuleIds,
} from "../domain/rules/ruleCatalog";
import { AppliedRuleReport, MigrateRequest, Rule, Warning } from "../domain/types";

jest.mock("../domain/rules/ruleCatalog", () => ({
  getRulesFor: jest.fn(),
  resolveEnabledRuleIds: jest.fn(),
}));

const w = (message: string): Warning => ({ message }) as unknown as Warning;

const appliedRuleReport: AppliedRuleReport = {
  id: "R1",
  hits: 2,
  name: "Rule 1",
  evidence: [],
};

const appliedRuleReportR2: AppliedRuleReport = {
  id: "R2",
  hits: 0,
  name: "Rule 2",
  evidence: [],
};

const appliedRuleReportR3: AppliedRuleReport = {
  id: "R3",
  hits: 10,
  name: "Rule 3",
  evidence: [],
};

const getRulesForMock = getRulesFor as jest.MockedFunction<typeof getRulesFor>;
const resolveEnabledRuleIdsMock = resolveEnabledRuleIds as jest.MockedFunction<
  typeof resolveEnabledRuleIds
>;

describe("migrateService.migrate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`GIVEN enabled and disabled rules
      WHEN migrate is executed
      THEN only enabled rules are applied and reports are aggregated correctly`, () => {
    const rule1: Rule = {
      id: "R1",
      name: "Rule 1",
      appliesTo: "COBOL",
      run: jest.fn((input: string) => ({
        output: input + "\n// R1",
        report: appliedRuleReport,
        warnings: [w("w1")],
      })),
    };

    const rule2: Rule = {
      id: "R2",
      name: "Rule 2",
      appliesTo: "COBOL",
      run: jest.fn((input: string) => ({
        output: input + "\n// R2",
        report: appliedRuleReportR2,
        warnings: [w("w2"), w("w3")],
      })),
    };

    const rule3Disabled: Rule = {
      id: "R3",
      name: "Rule 3",
      appliesTo: "COBOL",
      run: jest.fn((input: string) => ({
        output: input + "\n// R3",
        report: appliedRuleReportR3,
        warnings: [w("w999")],
      })),
    };

    getRulesForMock.mockReturnValue([
      rule1 as Rule,
      rule2 as Rule,
      rule3Disabled as Rule,
    ]);
    resolveEnabledRuleIdsMock.mockReturnValue(new Set(["R1", "R2"]));

    const req = {
      sourceLanguage: "legacy",
      targetLanguage: "modern",
      rules: ["R1", "R2"],
      code: "a\nb\nc",
    };

    const res = migrateService.migrate(req as MigrateRequest);

    expect(rule1.run).toHaveBeenCalledTimes(1);
    expect(rule2.run).toHaveBeenCalledTimes(1);
    expect(rule3Disabled.run).not.toHaveBeenCalled();
    expect(res.output).toBe("a\nb\nc\n// R1\n// R2");

    expect(res.report.summary.linesIn).toBe(3);
    expect(res.report.summary.linesOut).toBe(5);
    expect(res.report.summary.rulesApplied).toBe(1);
    expect(res.report.summary.warnings).toBe(3);

    expect(res.report.appliedRules).toEqual([{ id: "R1", hits: 2, name: "Rule 1", evidence: [] }]);

    expect(res.report.warningsDetected).toEqual([w("w1"), w("w2"), w("w3")]);

    expect(res.report.sourceLanguage).toBe("legacy");
    expect(res.report.targetLanguage).toBe("modern");
  });

  it(`GIVEN code with escaped newlines, CRLF, tabs and trailing spaces
      WHEN migrate runs
      THEN the code is normalized before rules execution`, () => {
    const rule1: Rule = {
      id: "R1",
      name: "Rule 1",
      appliesTo: "COBOL",
      run: jest.fn((input: string) => ({
        output: input,
        report: {...appliedRuleReport, hits: 0},
        warnings: [],
      })),
    };

    getRulesForMock.mockReturnValue([rule1 as Rule]);
    resolveEnabledRuleIdsMock.mockReturnValue(new Set(["R1"]));

    const rawCode = "line1\\nline2\r\n\tline3   \r\n";

    migrateService.migrate({
      sourceLanguage: "COBOL",
      targetLanguage: "NODE",
      rules: ["R1"],
      code: rawCode,
    } as MigrateRequest);

    const normalizedExpected = "line1\nline2\n  line3";

    expect(rule1.run).toHaveBeenCalledTimes(1);
    expect(rule1.run).toHaveBeenCalledWith(normalizedExpected);
  });

  it(`GIVEN no enabled rules
      WHEN migrate is executed
      THEN no rules run and normalized code is returned`, () => {
    const rule1: Rule = {
      id: "R1",
      name: "Rule 1",
      appliesTo: "COBOL",
      run: jest.fn(),
    };

    getRulesForMock.mockReturnValue([rule1 as Rule]);
    resolveEnabledRuleIdsMock.mockReturnValue(new Set());

    const req = {
      sourceLanguage: "COBOL",
      targetLanguage: "NODE",
      rules: [],
      code: "a\tb  \r\n",
    };

    const res = migrateService.migrate(req as MigrateRequest);

    expect(rule1.run).not.toHaveBeenCalled();
    expect(res.output).toBe("a  b");

    expect(res.report.summary.rulesApplied).toBe(0);
    expect(res.report.summary.warnings).toBe(0);
  });

  it(`GIVEN input code and rules that add lines
      WHEN migrate is executed
      THEN linesIn and linesOut are calculated correctly`, () => {
    const rule1: Rule = {
      id: "R1",
      name: "Rule 1",
      appliesTo: "COBOL",
      run: jest.fn((input: string) => ({
        output: input + "\nX\nY",
        report: {...appliedRuleReport, hits: 1},
        warnings: [],
      })),
    };

    getRulesForMock.mockReturnValue([rule1 as Rule]);
    resolveEnabledRuleIdsMock.mockReturnValue(new Set(["R1"]));

    const req = {
      sourceLanguage: "COBOL",
      targetLanguage: "NODE",
      rules: ["R1"],
      code: "l1\nl2",
    };

    const res = migrateService.migrate(req as MigrateRequest);

    expect(res.report.summary.linesIn).toBe(2);
    expect(res.report.summary.linesOut).toBe(4);
  });
});
