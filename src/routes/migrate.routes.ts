import { Router } from "express";
import { migrateService } from "../application/migrate.service";
import { parseMigrateRequest } from "../infrastructure/validation";
import { debugHttp } from "../infrastructure/logger";
import { BadRequestError } from "../infrastructure/errors";
import { MigrateRequest } from "../domain/types";

export const migrateRouter = Router();

migrateRouter.post("/", (req, res, next) => {
  const requestId = (req as unknown as MigrateRequest).requestId;
  debugHttp("Incoming request", { method: req.method, path: req.originalUrl, body: req.body, requestId });
  try {
    const parsed = parseMigrateRequest(req.body);
    if (!parsed.ok) {
      throw new BadRequestError("Invalid request", parsed.error);
    }
    debugHttp(
      "Request validated requestId=%s source=%s target=%s rules=%o",
      requestId,
      parsed.data.sourceLanguage,
      parsed.data.targetLanguage,
      parsed.data.rules
    );

    const result = migrateService.migrate(parsed.data);
    debugHttp("Migration completed requestId=%s linesIn=%d linesOut=%d rulesApplied=%d warningsDetected=%d", 
      requestId,
      result.report.summary.linesIn,
      result.report.summary.linesOut,
      result.report.summary.rulesApplied,
      result.report.summary.warnings
    );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

