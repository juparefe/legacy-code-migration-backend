import { Rule, RuleEvidence, Warning } from "../../types";

type EvalBlock = {
  type: "EVALUATE";
  startLine: number;
  expr: string;
  hasOpenCase: boolean;
};

export const R7_evaluate: Rule = {
  id: "R7",
  name: "EVALUATE/WHEN/END-EVALUATE -> switch/case (con break)",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");
    const out: string[] = [];

    const warnings: Warning[] = [];
    const evidence: RuleEvidence[] = [];
    let hits = 0;

    const stack: EvalBlock[] = [];

    const pushBreakIfNeeded = (lineNo: number) => {
      const block = stack[stack.length - 1];
      if (!block?.hasOpenCase) return;

      // Insertamos break antes de un nuevo case/default o al cerrar el switch
      const gen = `  break;`;
      out.push(gen);

      evidence.push({
        line: lineNo,
        original: "(implicit)",
        generated: "break; // inserted"
      });

      warnings.push({
        code: "W043",
        severity: "LOW",
        line: lineNo,
        message: "Se insertó break; para evitar fall-through en switch."
      });

      block.hasOpenCase = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const original = lines[i];
      const lineNo = i + 1;

      // EVALUATE <expr>
      const evalMatch = original.match(/^\s*EVALUATE\s+(.+?)\s*$/i);
      if (evalMatch) {
        hits++;

        const expr = normalizeCobolExpr(evalMatch[1]);
        const gen = `switch (${expr}) {`;

        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });

        stack.push({ type: "EVALUATE", startLine: lineNo, expr, hasOpenCase: false });

        warnings.push({
          code: "W040",
          severity: "LOW",
          line: lineNo,
          message:
            "EVALUATE traducido a switch/case. Para condiciones complejas puede requerir if/else."
        });

        continue;
      }

      // WHEN ...
      const whenMatch = original.match(/^\s*WHEN\s+(.+?)\s*$/i);
      if (whenMatch && stack.length > 0 && stack[stack.length - 1].type === "EVALUATE") {
        hits++;

        // Cerramos case anterior con break
        pushBreakIfNeeded(lineNo);

        const raw = whenMatch[1].trim();

        // Detectar WHEN complejo
        if (/\bTHRU\b/i.test(raw) || /[<>=]/.test(raw) || /\bAND\b|\bOR\b/i.test(raw)) {
          warnings.push({
            code: "W044",
            severity: "MEDIUM",
            line: lineNo,
            message:
              "WHEN complejo detectado (THRU/operadores). Se intentó traducir como case; podría requerir if/else."
          });
        }

        let gen: string;

        if (/^OTHER$/i.test(raw)) {
          gen = `default:`;
        } else {
          // caso simple (valor)
          const value = normalizeCobolValue(raw);
          gen = `case ${value}:`;
        }

        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });

        stack[stack.length - 1].hasOpenCase = true;
        continue;
      }

      // END-EVALUATE
      if (/^\s*END-EVALUATE\s*$/i.test(original)) {
        if (stack.length === 0) {
          warnings.push({
            code: "W041",
            severity: "HIGH",
            line: lineNo,
            message: "END-EVALUATE sin EVALUATE previo; se dejó como comentario."
          });
          out.push(`// TODO: ${original.trim()}`);
          continue;
        }

        hits++;

        // break final si había case abierto
        pushBreakIfNeeded(lineNo);

        stack.pop();

        const gen = `}`;
        out.push(gen);
        evidence.push({ line: lineNo, original, generated: gen });

        continue;
      }

      // Dentro de switch, indentamos el cuerpo de case
      if (stack.length > 0 && stack[stack.length - 1].type === "EVALUATE") {
        const trimmed = original.trimEnd();
        out.push(trimmed.length ? `  ${trimmed}` : trimmed);
      } else {
        out.push(original);
      }
    }

    if (stack.length > 0) {
      warnings.push({
        code: "W042",
        severity: "HIGH",
        message: `Hay ${stack.length} bloque(s) EVALUATE sin cerrar (faltó END-EVALUATE).`
      });
    }

    return {
      output: out.join("\n"),
      report: { id: "R7", name: this.name, hits, evidence },
      warnings
    };
  }
};

function normalizeCobolExpr(expr: string): string {
  let e = expr.trim();
  e = e.replace(/\b[A-Z][A-Z0-9-]*\b/g, (tok) => toJsIdentifier(tok));
  return e;
}

function normalizeCobolValue(v: string): string {
  const t = v.trim();

  // num
  if (/^-?\d+(\.\d+)?$/.test(t)) return t;

  // literal string
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t;
  }

  // identificador
  if (/^[A-Z][A-Z0-9-]*$/i.test(t)) return toJsIdentifier(t);

  // fallback
  return JSON.stringify(t);
}

function toJsIdentifier(cobolName: string): string {
  const parts = cobolName.toLowerCase().split("-");
  return parts.map((p, idx) => (idx === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
}