import { Rule, RuleEvidence, Warning } from "../../types";

export const R2_displayLiteral: Rule = {
  id: "R2",
  name: 'DISPLAY "..." -> logger.info("...");',
  appliesTo: "COBOL",
  run(input) {
    const lines = input.split("\n");
    let hits = 0;
    const evidence: RuleEvidence[] = [];
    const warnings: Warning[] = [];

    const out = lines.map((line, idx) => {
      const m = line.match(/^\s*DISPLAY\s+"([^"]*)"\s*$/i);
      if (m) {
        hits++;
        const gen = `logger.info(${JSON.stringify(m[1])});`;
        evidence.push({ line: idx + 1, original: line, generated: gen.trim() });
        return gen;
      }

      // warning si es DISPLAY sin literal
      if (/^\s*DISPLAY\s+/i.test(line)) {
        warnings.push({
          code: "W001",
          severity: "MEDIUM",
          line: idx + 1,
          message: "DISPLAY no literal aún no soportado; se dejó como comentario."
        });
        return `  // TODO: ${line.trim()}`;
      }

      return line;
    });

    return {
      output: out.join("\n"),
      report: { id: "R2", name: this.name, hits, evidence },
      warnings
    };
  }
};