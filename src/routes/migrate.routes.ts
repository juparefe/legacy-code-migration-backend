import { Router } from "express";
import { migrateService } from "../application/migrate.service";
import { parseMigrateRequest } from "../infrastructure/validation";

export const migrateRouter = Router();

migrateRouter.post("/", (req, res) => {
  const parsed = parseMigrateRequest(req.body);
  if (!parsed.ok) return res.status(400).json(parsed.error);

  const result = migrateService.migrate(parsed.data);
  return res.json(result);
});