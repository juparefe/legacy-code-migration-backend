import { Rule, Warning, RuleEvidence } from "../../types";

type Block = { type: "IF"; startLine: number };

export const R1_ifElseEndIf: Rule = {
  id: "R1",
  name: "IF/ELSE/END-IF -> if/else { }",
  appliesTo: "COBOL",

  run(input) {
    const lines = input.split("\n");

    const warnings: Warning[] = [];
    const evidence: RuleEvidence[] = [];

    const stack: Block[] = [];

    let hits = 0;
    let indentLevel = 0;

    const out: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const original = lines[i];
      const lineNo = i + 1;

      // IF <cond>
      const ifMatch = original.match(/^\s*IF\s+(.+?)\s*$/i);
      if (ifMatch) {
        hits++;

        const condRaw = ifMatch[1];
        const cond = normalizeCobolCondition(condRaw, lineNo, warnings);

        const gen = `${indent(indentLevel)}if (${cond}) {`;
        out.push(gen);

        evidence.push({
          line: lineNo,
          original,
          generated: gen.trim()
        });

        stack.push({ type: "IF", startLine: lineNo });
        indentLevel++;
        continue;
      }

      // ELSE
      if (/^\s*ELSE\s*$/i.test(original)) {
        if (stack.length === 0 || stack[stack.length - 1].type !== "IF") {
          warnings.push({
            code: "W010",
            severity: "HIGH",
            line: lineNo,
            message: "ELSE sin IF previo; se dejó como comentario."
          });
          out.push(`${indent(indentLevel)}// TODO: ${original.trim()}`);
          continue;
        }

        hits++;

        // cerrar bloque actual y abrir else
        indentLevel = Math.max(0, indentLevel - 1);

        const genClose = `${indent(indentLevel)}} else {`;
        out.push(genClose);

        evidence.push({
          line: lineNo,
          original,
          generated: genClose.trim()
        });

        indentLevel++;
        continue;
      }

      // END-IF
      if (/^\s*END-IF\s*$/i.test(original)) {
        if (stack.length === 0 || stack[stack.length - 1].type !== "IF") {
          warnings.push({
            code: "W011",
            severity: "HIGH",
            line: lineNo,
            message: "END-IF sin IF previo; se dejó como comentario."
          });
          out.push(`${indent(indentLevel)}// TODO: ${original.trim()}`);
          continue;
        }

        hits++;

        stack.pop();
        indentLevel = Math.max(0, indentLevel - 1);

        const gen = `${indent(indentLevel)}}`;
        out.push(gen);

        evidence.push({
          line: lineNo,
          original,
          generated: gen.trim()
        });

        continue;
      }

      // Línea normal: solo la indento si estamos dentro de IF
      out.push(`${indent(indentLevel)}${original.trimEnd()}`);
    }

    // Si quedaron IF abiertos
    if (stack.length > 0) {
      warnings.push({
        code: "W012",
        severity: "HIGH",
        message: `Hay ${stack.length} bloque(s) IF sin cerrar (faltó END-IF).`
      });
    }

    return {
      output: out.join("\n"),
      report: {
        id: "R1",
        name: this.name,
        hits,
        evidence
      },
      warnings
    };
  }
};

function indent(level: number): string {
  return "  ".repeat(level);
}

/**
 * Convierte condiciones COBOL simples a JS-friendly:
 * - AMOUNT -> amount
 * - = -> ===
 * - <> -> !==
 * - AND/OR -> &&/||
 */
function normalizeCobolCondition(
  cond: string,
  lineNo: number,
  warnings: Warning[]
): string {
  let c = cond.trim();

  // reemplazos básicos de operadores (orden importa)
  c = c.replace(/<>/g, "!==");
  c = c.replace(/\s=\s/g, " === ");
  c = c.replace(/\sAND\s/gi, " && ");
  c = c.replace(/\sOR\s/gi, " || ");

  // mapea "palabras" COBOL a camel-ish simple: AMOUNT -> amount, WS-AMOUNT -> wsAmount
  c = c.replace(/\b[A-Z][A-Z0-9-]*\b/g, (tok) => toJsIdentifier(tok));

  // Si quedaron tokens raros (ej: ( ) o comillas están ok) no advertimos; advertimos si hay "NOT" sin soporte
  if (/\bNOT\b/i.test(cond)) {
    warnings.push({
      code: "W013",
      severity: "MEDIUM",
      line: lineNo,
      message: "Condición contiene NOT; normalización parcial (revisar output)."
    });
  }

  return c;
}

function toJsIdentifier(cobolName: string): string {
  // WS-AMOUNT -> wsAmount, AMOUNT -> amount
  const parts = cobolName.toLowerCase().split("-");
  return parts
    .map((p, idx) => (idx === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
}