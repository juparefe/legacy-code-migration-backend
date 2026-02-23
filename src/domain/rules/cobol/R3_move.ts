import { Rule, Warning, RuleEvidence } from "../../types";

export const R3_move: Rule = {
  id: "R3",
  name: "MOVE A TO B -> b = a;",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");
    let hits = 0;

    const evidence: RuleEvidence[] = [];
    const warnings: Warning[] = [];

    const out = lines.map((line, idx) => {
      const m = line.match(/^\s*MOVE\s+(\S+)\s+TO\s+(\S+)\s*$/i);
      if (!m) return line;

      hits++;

      const from = toJsExpr(m[1], idx + 1, warnings);
      const to = toJsExpr(m[2], idx + 1, warnings);

      const gen = `${to} = ${from};`;
      evidence.push({ line: idx + 1, original: line, generated: gen });
      return gen;
    });

    return {
      output: out.join("\n"),
      report: { id: "R3", name: this.name, hits, evidence },
      warnings
    };
  }
};

function toJsExpr(token: string, lineNo: number, warnings: Warning[]): string {
  const t = token.trim();

  if (/^ZERO$/i.test(t)) return "0";
  if (/^SPACES$/i.test(t)) return `""`;

  if (/^-?\d+(\.\d+)?$/.test(t)) return t;

  if (/^[A-Z][A-Z0-9-]*$/i.test(t)) return toJsIdentifier(t);

  warnings.push({
    code: "W020",
    severity: "LOW",
    line: lineNo,
    message: `MOVE token no reconocido "${t}" (se dejó tal cual).`
  });
  return t;
}

function toJsIdentifier(cobolName: string): string {
  const parts = cobolName.toLowerCase().split("-");
  return parts
    .map((p, idx) => (idx === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
}