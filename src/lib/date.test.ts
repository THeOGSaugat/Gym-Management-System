import { describe, expect, it } from "vitest";
import { startOfDay } from "./date";

describe("startOfDay", () => {
  it("returns midnight UTC of the same calendar day", () => {
    const input = new Date("2026-06-15T14:37:22.123Z");
    expect(startOfDay(input).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("is idempotent — startOfDay of a start-of-day is itself", () => {
    const input = new Date("2026-06-15T00:00:00.000Z");
    expect(startOfDay(input).toISOString()).toBe(input.toISOString());
  });

  it("handles the last moment of a day correctly", () => {
    const input = new Date("2026-06-15T23:59:59.999Z");
    expect(startOfDay(input).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("two different times on the same day produce equal results", () => {
    const morning = startOfDay(new Date("2026-06-15T01:00:00Z"));
    const night = startOfDay(new Date("2026-06-15T23:00:00Z"));
    expect(morning.getTime()).toBe(night.getTime());
  });

  it("two different days produce different results", () => {
    const day1 = startOfDay(new Date("2026-06-15T23:59:00Z"));
    const day2 = startOfDay(new Date("2026-06-16T00:01:00Z"));
    expect(day1.getTime()).not.toBe(day2.getTime());
  });
});
