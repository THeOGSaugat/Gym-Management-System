import { describe, expect, it } from "vitest";
import { clampPage, MAX_PAGE, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it.each([
    [undefined, 1],
    ["", 1],
    ["3", 3],
    [["4", "9"], 4],
    ["0", 1],
    ["-2", 1],
    ["1.5", 1],
    ["1e308", 1],
    ["abc", 1],
    ["999999", MAX_PAGE],
    ["99999999999", 1],
  ])("%j → %d", (input, expected) => {
    expect(parsePageParam(input)).toBe(expected);
  });
});

describe("clampPage", () => {
  it("always yields a whole page within range, so Prisma's skip stays valid", () => {
    expect(clampPage(undefined)).toBe(1);
    expect(clampPage(2.7)).toBe(2);
    expect(clampPage(-5)).toBe(1);
    expect(clampPage(Number.NaN)).toBe(1);
    expect(clampPage(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampPage(1e12)).toBe(MAX_PAGE);
  });
});
