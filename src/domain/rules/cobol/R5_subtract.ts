import { Rule, RuleEvidence, Warning } from "../../types";

export const R5_subtract: Rule = {
  id: "R5",
  name: "SUBTRACT A FROM B -> b -= a;",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");
    let hits = 0;

    const evidence: RuleEvidence[] = [];
    const warnings: Warning[] = [];

    const out = lines.map((line, idx) => {
      const m = line.match(/^\s*SUBTRACT\s+(\S+)\s+FROM\s+(\S+)\s*$/i);
      if (!m) return line;

      hits++;

      const a = toJsExpr(m[1]);
      const b = toJsExpr(m[2]);

      const gen = `${b} -= ${a};`;
      evidence.push({ line: idx + 1, original: line, generated: gen });
      return gen;
    });

    return {
      output: out.join("\n"),
      report: { id: "R5", name: this.name, hits, evidence },
      warnings
    };
  }
};

function toJsExpr(token: string): string {
  if (/^-?\d+(\.\d+)?$/.test(token)) return token;
  return toJsIdentifier(token);
}
function toJsIdentifier(cobolName: string): string {
  const parts = cobolName.toLowerCase().split("-");
  return parts
    .map((p, idx) => (idx === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
}