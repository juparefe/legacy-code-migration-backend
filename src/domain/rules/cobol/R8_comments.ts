import { Rule, RuleEvidence, Warning } from "../../types";

export const R8_comments: Rule = {
  id: "R8" as any, // agrega R8 en RuleId
  name: "COBOL comments (*, *>) -> //",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");
    let hits = 0;

    const evidence: RuleEvidence[] = [];
    const warnings: Warning[] = [];

    const out = lines.map((line, idx) => {
      const lineNo = idx + 1;

      // Línea completa como comentario: "*" al inicio (típico COBOL)
      if (/^\s*\*\s?.*$/.test(line)) {
        hits++;
        const content = line.replace(/^\s*\*\s?/, "");
        const gen = `// ${content}`.trimEnd();

        evidence.push({ line: lineNo, original: line, generated: gen });
        return gen;
      }

      // Comentario inline con "*>" (COBOL)
      const inline = line.match(/^(.*?)(\*\>)(.*)$/);
      if (inline) {
        hits++;
        const before = inline[1].trimEnd();
        const comment = inline[3].trim();
        const gen = `${before} // ${comment}`.trimEnd();

        evidence.push({ line: lineNo, original: line, generated: gen });
        return gen;
      }

      return line;
    });

    return {
      output: out.join("\n"),
      report: { id: "R8" as any, name: this.name, hits, evidence },
      warnings
    };
  }
};