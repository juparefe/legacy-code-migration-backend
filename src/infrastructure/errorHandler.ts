import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errors";
import { debugError } from "./logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  if (err instanceof AppError) {
    debugError("request.error", {
      requestId,
      code: err.code,
      status: err.status,
      message: err.message,
      details: err.details
    });

    return res.status(err.status).json({
      requestId,
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  // Unknown error
  debugError("request.error", {
    requestId,
    code: "INTERNAL_ERROR",
    status: 500,
    message: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined
  });

  return res.status(500).json({
    requestId,
    error: { code: "INTERNAL_ERROR", message: "Unexpected error" }
  });
}