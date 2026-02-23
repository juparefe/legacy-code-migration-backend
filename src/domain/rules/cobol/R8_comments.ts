import { Rule, RuleEvidence, RuleId, Warning } from "../../types";

export const R8_comments: Rule = {
  id: "R8" as RuleId,
  name: "COBOL comments (*, *>) -> //",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");
    let hits = 0;

    const evidence: RuleEvidence[] = [];
    const warnings: Warning[] = [];

    const out = lines.map((line, idx) => {
      const lineNo = idx + 1;

      // Full line as a comment: "*" at the beginning (typical COBOL)
      if (/^\s*\*\s?.*$/.test(line)) {
        hits++;
        const content = line.replace(/^\s*\*\s?/, "");
        const gen = `// ${content}`.trimEnd();

        evidence.push({ line: lineNo, original: line, generated: gen });
        return gen;
      }

      // Inline comment with "*>" (COBOL)
      const inline = line.match(/^(.*?)(\*>)(.*)$/);
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
      report: { id: "R8" as RuleId, name: this.name, hits, evidence },
      warnings
    };
  }
};