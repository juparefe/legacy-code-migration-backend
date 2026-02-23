import { parseMigrateRequest } from "./validation";

describe("parseMigrateRequest", () => {
  it(`GIVEN a valid migrate request
      WHEN parsing
      THEN returns ok true with parsed data`, () => {
    const body = {
      sourceLanguage: "COBOL",
      targetLanguage: "NODE",
      code: "DISPLAY 'HI'.",
      rules: ["R1", "R2"],
    };

    const res = parseMigrateRequest(body);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.sourceLanguage).toBe("COBOL");
      expect(res.data.targetLanguage).toBe("NODE");
      expect(res.data.code).toBe("DISPLAY 'HI'.");
      expect(res.data.rules).toEqual(["R1", "R2"]);
    }
  });

  it(`GIVEN an invalid migrate request
      WHEN parsing
      THEN returns ok false with validation issues`, () => {
    const body = {
      sourceLanguage: "COBOL",
      targetLanguage: "JAVA",
      code: ""
    };

    const res = parseMigrateRequest(body);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toBe("Invalid request");
      expect(res.error.issues.length).toBeGreaterThan(0);
    }
  });

  it(`GIVEN rules as toggle object
      WHEN parsing
      THEN accepts record of ruleId => boolean`, () => {
    const body = {
      sourceLanguage: "DELPHI",
      targetLanguage: "NODE",
      code: "writeln('hi');",
      rules: { R1: true, R2: false },
    };

    const res = parseMigrateRequest(body);

    expect(res.ok).toBe(true);
  });
});