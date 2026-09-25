import { describe, expect, it } from "vitest";
import { parseBooleanArg, parseEnumArg, parseIdArg } from "./action-args";
import { ValidationError } from "@/lib/errors";

describe("parseIdArg", () => {
  it("accepts a real row id", () => {
    expect(parseIdArg("cmuaunhyk000195q8cc447xeh")).toBe("cmuaunhyk000195q8cc447xeh");
  });

  it.each([
    ["an object (would be a Prisma filter)", { not: "" }],
    ["an array", ["id"]],
    ["null", null],
    ["a number", 42],
    ["an empty string", ""],
    ["path traversal", "../admin"],
    ["whitespace inside", "abc def"],
    ["an oversized string", "a".repeat(65)],
  ])("rejects %s", (_label, value) => {
    expect(() => parseIdArg(value)).toThrow(ValidationError);
  });
});

describe("parseEnumArg / parseBooleanArg", () => {
  it("accepts only listed values", () => {
    expect(parseEnumArg("SUSPENDED", ["ACTIVE", "SUSPENDED"])).toBe("SUSPENDED");
    expect(() => parseEnumArg("ADMIN", ["ACTIVE", "SUSPENDED"])).toThrow(ValidationError);
    expect(() => parseEnumArg({ toString: () => "ACTIVE" }, ["ACTIVE"])).toThrow(ValidationError);
  });

  it("accepts only real booleans", () => {
    expect(parseBooleanArg(false)).toBe(false);
    expect(() => parseBooleanArg("false")).toThrow(ValidationError);
    expect(() => parseBooleanArg(0)).toThrow(ValidationError);
  });
});
