import cors from 'cors';
import express from "express";
import { migrateRouter } from "./routes/migrate.routes";

export const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/migrate", migrateRouter);