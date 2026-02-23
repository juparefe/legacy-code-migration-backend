import { Router } from "express";
import { migrateService } from "../application/migrate.service";
import { parseMigrateRequest } from "../infrastructure/validation";
import { debugHttp } from "../infrastructure/logger";
import { BadRequestError } from "../infrastructure/errors";
import { MigrateRequest } from "../domain/types";

export const migrateRouter = Router();
debugHttp("Incoming request");

migrateRouter.post("/", (req, res, next) => {
  const requestId = (req as unknown as MigrateRequest).requestId;
  try {
    const parsed = parseMigrateRequest(req.body);
    if (!parsed.ok) {
      throw new BadRequestError("Invalid request", parsed.error);
    }
    debugHttp("Request validated", {
      requestId,
      sourceLanguage: parsed.data.sourceLanguage,
      targetLanguage: parsed.data.targetLanguage,
      rules: parsed.data.rules,
    });

    const result = migrateService.migrate(parsed.data);
    debugHttp("Migration completed", {
      requestId,
      linesIn: result.report.summary.linesIn,
      linesOut: result.report.summary.linesOut,
      rulesApplied: result.report.summary.rulesApplied,
      warningsDetected: result.report.summary.warnings
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

