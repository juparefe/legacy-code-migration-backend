import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { debugHttp } from "./logger";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.header("x-request-id") || randomUUID()).toString();
  (req as any).requestId = requestId;

  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  debugHttp("request.start", { requestId, method: req.method, path: req.originalUrl });

  res.on("finish", () => {
    debugHttp("request.end", {
      requestId,
      status: res.statusCode,
      durationMs: Date.now() - start
    });
  });

  next();
}