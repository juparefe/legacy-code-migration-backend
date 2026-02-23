import request from "supertest";
import express from "express";
import { migrateRouter } from "./migrate.routes";
import * as validation from "../infrastructure/validation";
import { migrateService } from "../application/migrate.service";
import { MigrateRequest, SourceLanguage, TargetLanguage, ValidationError } from "../domain/types";

describe("migrateRouter", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/migrate", migrateRouter);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`GIVEN a valid request
      WHEN POST /api/migrate
      THEN returns 200 with migration result`, async () => {
    const mockResult = {
      output: "translated code",
      report: {
        sourceLanguage: "COBOL" as SourceLanguage,
        targetLanguage: "NODE" as TargetLanguage,
        summary: {
          linesIn: 1,
          linesOut: 1,
          rulesApplied: 0,
          warnings: 0,
        },
        appliedRules: [],
        warningsDetected: [],
      },
    };

    jest.spyOn(validation, "parseMigrateRequest").mockReturnValue({
      ok: true,
      data: {
        sourceLanguage: "COBOL",
        targetLanguage: "NODE",
        code: 'DISPLAY "HELLO"',
        rules: ["R2"],
      },
    });

    jest.spyOn(migrateService, "migrate").mockReturnValue(mockResult);

    const res = await request(app).post("/api/migrate").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
  });

  it(`GIVEN an invalid request
      WHEN POST /api/migrate
      THEN returns 400 with validation error`, async () => {
    const mockError: ValidationError = {
      message: "Invalid request",
      issues: [
        {
          code: "invalid_type" as const,
          path: ["sourceLanguage"],
          message: "Invalid source language",
          expected: "string" as const,
          received: "undefined" as const,
        },
      ] as const,
    };

    jest.spyOn(validation, "parseMigrateRequest").mockReturnValue({
      ok: false,
      error: mockError,
    });

    const res = await request(app).post("/api/migrate").send({});

    expect(res.status).toBe(400);
  });

  it(`GIVEN a valid request
      WHEN migration service is executed
      THEN migrateService.migrate is called with parsed data`, async () => {
    const parsedData: MigrateRequest = {
      sourceLanguage: "COBOL",
      targetLanguage: "NODE",
      code: 'DISPLAY "HELLO"',
      rules: ["R2"],
    };

    jest.spyOn(validation, "parseMigrateRequest").mockReturnValue({
      ok: true,
      data: parsedData,
    });

    const migrateSpy = jest.spyOn(migrateService, "migrate").mockReturnValue({
      output: "",
      report: {
          appliedRules: [], warningsDetected: [],
          sourceLanguage: "COBOL",
          targetLanguage: "NODE",
          summary: {
              linesIn: 0,
              linesOut: 0,
              rulesApplied: 0,
              warnings: 0
          }
      },
    });

    await request(app).post("/api/migrate").send({});

    expect(migrateSpy).toHaveBeenCalledWith(parsedData);
  });
});
