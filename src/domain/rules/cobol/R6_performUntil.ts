import { Rule, RuleEvidence, Warning } from "../../types";

type PerformBlock =
  | { type: "PERFORM_UNTIL"; startLine: number; condition: string }
  | { type: "PERFORM_VARYING"; startLine: number };

export const R6_perform: Rule = {
  id: "R6",
  name: "PERFORM (UNTIL/VARYING) -> while/for (heurístico)",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");

    const warnings: Warning[] = [];
    const evidence: RuleEvidence[] = [];
    let hits = 0;

    const stack: PerformBlock[] = [];
    const out: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const original = lines[i];
      const lineNo = i + 1;

      // --- PERFORM VARYING i FROM a BY b UNTIL <cond>
      // Ejemplo COBOL:
      // PERFORM VARYING I FROM 1 BY 1 UNTIL I > 10
      //   DISPLAY "X"
      // END-PERFORM
      const varying = original.match(
        /^\s*PERFORM\s+VARYING\s+(\S+)\s+FROM\s+(\S+)\s+BY\s+(\S+)\s+UNTIL\s+(.+?)\s*$/i
      );
      if (varying) {
        hits++;

        const varName = toJsIdentifier(varying[1]);
        const from = normalizeValue(varying[2]);
        const by = normalizeValue(varying[3]);
        const untilRaw = varying[4].trim();
        const untilJs = normalizeCobolCondition(untilRaw);

        // Heurística:
        // COBOL "UNTIL I > 10" implica repetir hasta que sea true,
        // entonces el loop corre mientras !(I > 10).
        // En for usamos condición "!(until)" como guard.
        const gen = `for (let ${varName} = ${from}; !(${untilJs}); ${varName} += ${by}) {`;

        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });

        stack.push({ type: "PERFORM_VARYING", startLine: lineNo });

        warnings.push({
          code: "W033",
          severity: "LOW",
          line: lineNo,
          message:
            "PERFORM VARYING traducido a for-loop de forma heurística. Verificar condición y paso."
        });

        continue;
      }

      // --- PERFORM UNTIL <cond>
      const until = original.match(/^\s*PERFORM\s+UNTIL\s+(.+?)\s*$/i);
      if (until) {
        hits++;

        const rawCond = until[1].trim();
        const jsCond = normalizeCobolCondition(rawCond);

        const gen = `while (!(${jsCond})) {`;
        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });

        stack.push({ type: "PERFORM_UNTIL", startLine: lineNo, condition: jsCond });

        warnings.push({
          code: "W030",
          severity: "MEDIUM",
          line: lineNo,
          message: "PERFORM UNTIL traducido de forma heurística a while(!cond). Verificar semántica."
        });

        continue;
      }

      // --- END-PERFORM
      if (/^\s*END-PERFORM\s*$/i.test(original)) {
        if (stack.length === 0) {
          warnings.push({
            code: "W031",
            severity: "HIGH",
            line: lineNo,
            message: "END-PERFORM sin PERFORM previo; se dejó como comentario."
          });
          out.push(`// TODO: ${original.trim()}`);
          continue;
        }

        hits++;
        stack.pop();

        const gen = `}`;
        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });
        continue;
      }

      out.push(original);
    }

    if (stack.length > 0) {
      warnings.push({
        code: "W032",
        severity: "HIGH",
        message: `Hay ${stack.length} bloque(s) PERFORM sin cerrar (faltó END-PERFORM).`
      });
    }

    return {
      output: out.join("\n"),
      report: { id: "R6", name: this.name, hits, evidence },
      warnings
    };
  }
};

function normalizeCobolCondition(cond: string): string {
  let c = cond.trim();
  c = c.replace(/<>/g, "!==");
  c = c.replace(/\s=\s/g, " === ");
  c = c.replace(/\sAND\s/gi, " && ");
  c = c.replace(/\sOR\s/gi, " || ");
  c = c.replace(/\b[A-Z][A-Z0-9-]*\b/g, (tok) => toJsIdentifier(tok));
  return c;
}

function normalizeValue(token: string): string {
  const t = token.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return t;
  if (/^ZERO$/i.test(t)) return "0";
  if (/^SPACES$/i.test(t)) return `""`;
  // Identificadores COBOL
  if (/^[A-Z][A-Z0-9-]*$/i.test(t)) return toJsIdentifier(t);
  return t;
}

function toJsIdentifier(cobolName: string): string {
  const parts = cobolName.toLowerCase().split("-");
  return parts.map((p, idx) => (idx === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
}