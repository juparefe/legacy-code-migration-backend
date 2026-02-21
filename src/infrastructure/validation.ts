import { z } from "zod";
import { MigrateRequest } from "../domain/types";

const ruleId = z.enum(["R1", "R2", "R3", "R4", "R5"]);

const migrateSchema = z.object({
  sourceLanguage: z.enum(["COBOL", "DELPHI"]),
  targetLanguage: z.literal("NODE"),
  code: z.string().min(1),
  rules: z
    .union([
      z.array(ruleId).min(1),
      z.record(ruleId, z.boolean())
    ])
    .optional()
});

export function parseMigrateRequest(body: unknown):
  | { ok: true; data: MigrateRequest }
  | { ok: false; error: any } {
  const parsed = migrateSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: { message: "Invalid request", issues: parsed.error.issues } };
  }
  return { ok: true, data: parsed.data };
}