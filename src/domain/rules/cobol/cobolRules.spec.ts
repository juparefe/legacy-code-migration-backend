import { getRulesFor } from "../ruleCatalog";
import { RuleId, RuleRunResult, Warning } from "../../types";

type Case = {
  id: RuleId;
  name: string;
  input: string;
  assert?: (res: RuleRunResult) => void;
};

const cases: Case[] = [
  // ---------------- R8_comments ----------------
  {
    id: "R8",
    name: "comment line",
    input: "      * This is a COBOL comment\n       DISPLAY 'HI'.\n",
  },
  {
    id: "R8",
    name: "non comment line",
    input: "       DISPLAY 'HI'.\n",
  },

  // ---------------- R2_displayLiteral ----------------
  {
    id: "R2",
    name: "single quotes literal",
    input: "       DISPLAY 'HELLO'.\n",
  },
  {
    id: "R2",
    name: "double quotes literal",
    input: '       DISPLAY "HELLO".\n',
  },
  {
    id: "R2",
    name: "no literal",
    input: "       DISPLAY WS-VAR.\n",
  },

  // ---------------- R3_move ----------------
  {
    id: "R3",
    name: "move literal to var",
    input: "       MOVE 1 TO WS-A.\n",
  },
  {
    id: "R3",
    name: "move var to var",
    input: "       MOVE WS-A TO WS-B.\n",
  },
  {
    id: "R3",
    name: "not a move",
    input: "       DISPLAY 'X'.\n",
  },

  // ---------------- R4_add ----------------
  {
    id: "R4",
    name: "add literal to var",
    input: "       ADD 1 TO WS-A.\n",
  },
  {
    id: "R4",
    name: "not an add",
    input: "       MOVE 1 TO WS-A.\n",
  },

  // ---------------- R5_subtract ----------------
  {
    id: "R5",
    name: "subtract literal from var",
    input: "       SUBTRACT 1 FROM WS-A.\n",
  },
  {
    id: "R5",
    name: "not a subtract",
    input: "       ADD 1 TO WS-A.\n",
  },

  // ---------------- R6_perform ----------------
  {
    id: "R6",
    name: "perform until with end-perform (W030 + close)",
    input: [
      "       PERFORM UNTIL WS-A = 10",
      "           ADD 1 TO WS-A",
      "       END-PERFORM",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("while (!(wsA === 10)) {");
      expect(res.output).toContain("}");
      expect(res.warnings.some((w: Warning) => w.code === "W030")).toBe(true);
      expect(res.warnings.some((w: Warning) => w.code === "W032")).toBe(false);
    },
  },
  {
    id: "R6",
    name: "perform varying with end-perform (W033 + close)",
    input: [
      "       PERFORM VARYING I FROM 1 BY 2 UNTIL I > 10",
      "           DISPLAY 'X'",
      "       END-PERFORM",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("for (let i = 1; !(i > 10); i += 2) {");
      expect(res.output).toContain("}");
      expect(res.warnings.some((w: Warning) => w.code === "W033")).toBe(true);
    },
  },
  {
    id: "R6",
    name: "end-perform without perform (W031 + TODO)",
    input: ["       END-PERFORM", "       DISPLAY 'X'", ""].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("// TODO: END-PERFORM");
      expect(res.warnings.some((w: Warning) => w.code === "W031")).toBe(true);
      expect(res.report.hits).toBe(0);
    },
  },
  {
    id: "R6",
    name: "perform until missing end-perform (W032 unclosed)",
    input: [
      "       PERFORM UNTIL WS-A = 10",
      "           ADD 1 TO WS-A",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.warnings.some((w: Warning) => w.code === "W032")).toBe(true);
    },
  },
  {
    id: "R6",
    name: "condition normalization (<> AND OR, ZERO, hyphens)",
    input: [
      "       PERFORM UNTIL WS-TOTAL <> ZERO AND WS-A = 1 OR WS-B = 2",
      "       END-PERFORM",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toMatch(
        /while\s*\(!\(wsTotal\s*!==\s*(0|zero)\s*&&\s*wsA\s*===\s*1\s*\|\|\s*wsB\s*===\s*2\)\)\s*\{/,
      );
    },
  },
  {
    id: "R6",
    name: "varying with non-standard token triggers normalizeValue fallback",
    input: [
      "       PERFORM VARYING I FROM 1 BY +1 UNTIL I = 3",
      "       END-PERFORM",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("i += +1");
    },
  },

  // ---------------- R7_evaluate (basic coverage, ajustar si falla) ----------------
  {
    id: "R7",
    name: "evaluate when other",
    input: [
      "       EVALUATE TRUE",
      "           WHEN OTHER",
      "               DISPLAY 'X'",
      "       END-EVALUATE.",
      "",
    ].join("\n"),
  },
  {
    id: "R7",
    name: "evaluate missing end-evaluate",
    input: [
      "       EVALUATE TRUE",
      "           WHEN OTHER",
      "               DISPLAY 'X'",
      "",
    ].join("\n"),
  },
  {
    id: "R7",
    name: "not an evaluate",
    input: "       MOVE 1 TO WS-A.\n",
  },
  {
    id: "R7",
    name: "basic evaluate with simple cases inserts break before next case and before end (W043)",
    input: [
      "       EVALUATE WS-A",
      "           WHEN 1",
      "               DISPLAY 'ONE'",
      "           WHEN 2",
      "               DISPLAY 'TWO'",
      "       END-EVALUATE",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("switch (wsA) {");
      expect(res.output).toContain("case 1:");
      expect(res.output).toContain("case 2:");
      expect(res.output).toContain("}");

      expect(res.output).toContain("  DISPLAY 'ONE'");
      expect(res.output).toContain("  DISPLAY 'TWO'");

      const breakCount = (res.output.match(/^\s*break;/gm) || []).length;
      expect(breakCount).toBeGreaterThanOrEqual(2);

      expect(res.warnings.some((w: Warning) => w.code === "W043")).toBe(true);
      expect(res.warnings.some((w: Warning) => w.code === "W040")).toBe(true);
    },
  },
  {
    id: "R7",
    name: "when OTHER becomes default and triggers break insertion (W043)",
    input: [
      "       EVALUATE WS-STATUS",
      "           WHEN 1",
      "               DISPLAY 'OK'",
      "           WHEN OTHER",
      "               DISPLAY 'OTHER'",
      "       END-EVALUATE",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("switch (wsStatus) {");
      expect(res.output).toContain("case 1:");
      expect(res.output).toContain("default:");
      expect(res.warnings.some((w: Warning) => w.code === "W043")).toBe(true);
    },
  },
  {
    id: "R7",
    name: "complex WHEN triggers W044 (operators/AND/OR/THRU)",
    input: [
      "       EVALUATE WS-A",
      "           WHEN 1 THRU 3",
      "               DISPLAY 'RANGE'",
      "           WHEN WS-A = 10 AND WS-B = 20",
      "               DISPLAY 'COMPLEX'",
      "       END-EVALUATE",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.warnings.some((w: Warning) => w.code === "W044")).toBe(true);
      expect(res.warnings.some((w: Warning) => w.code === "W043")).toBe(true);
    },
  },
  {
    id: "R7",
    name: "end-evaluate without evaluate becomes TODO comment (W041)",
    input: ["       END-EVALUATE", "       DISPLAY 'X'", ""].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("// TODO: END-EVALUATE");
      expect(res.warnings.some((w: Warning) => w.code === "W041")).toBe(true);
      expect(res.report.hits).toBe(0);
    },
  },
  {
    id: "R7",
    name: "evaluate without closing end-evaluate triggers W042",
    input: [
      "       EVALUATE WS-A",
      "           WHEN 1",
      "               DISPLAY 'ONE'",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.warnings.some((w: Warning) => w.code === "W042")).toBe(true);
      expect(res.output).toContain("switch (wsA) {");
    },
  },
  {
    id: "R7",
    name: "normalizeCobolValue: quoted string stays quoted, identifier becomes camelCase, fallback stringified",
    input: [
      "       EVALUATE WS-A",
      "           WHEN 'HELLO'",
      "               DISPLAY 'A'",
      "           WHEN WS-VAL",
      "               DISPLAY 'B'",
      "           WHEN HELLO-WORLD!",
      "               DISPLAY 'C'",
      "       END-EVALUATE",
      "",
    ].join("\n"),
    assert: (res) => {
      expect(res.output).toContain("case 'HELLO':");
      expect(res.output).toContain("case wsVal:");
      expect(res.output).toContain(`case "HELLO-WORLD!":`);
    },
  },

  // ---------------- R1_ifElseEndIf ----------------
  {
    id: "R1",
    name: "if end-if without else",
    input: [
      "       IF WS-A = 1",
      "           DISPLAY 'A'",
      "       END-IF.",
      "",
    ].join("\n"),
  },
  {
    id: "R1",
    name: "if else end-if",
    input: [
      "       IF WS-A = 1",
      "           DISPLAY 'A'",
      "       ELSE",
      "           DISPLAY 'B'",
      "       END-IF.",
      "",
    ].join("\n"),
  },
  {
    id: "R1",
    name: "if missing end-if",
    input: ["       IF WS-A = 1", "           DISPLAY 'A'", ""].join("\n"),
  },
];

describe("COBOL rules coverage (table-driven)", () => {
  const rules = getRulesFor("COBOL");

  test.each(cases)(
    `GIVEN $id ($name) WHEN rule runs THEN returns a valid structure`,
    ({ id, input, assert }) => {
      const rule = rules.find((r) => r.id === id);
      expect(rule).toBeDefined();

      const res = rule!.run(input);

      expect(typeof res.output).toBe("string");
      expect(res.report).toBeDefined();
      expect(res.report.id).toBe(id);
      expect(typeof res.report.hits).toBe("number");
      expect(Array.isArray(res.warnings)).toBe(true);

      if (assert) assert(res);
    },
  );
});
