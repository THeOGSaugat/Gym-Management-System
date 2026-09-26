import { afterEach, describe, expect, it, vi } from "vitest";
import { appTimeZone, hourInAppTimeZone, zoned } from "./time-zone";

// 05:51 UTC is 11:36 in Kathmandu (UTC+5:45) and 01:51 in New York (EDT).
const instant = new Date("2026-09-25T05:51:00Z");
const original = process.env.APP_TIME_ZONE;

afterEach(() => {
  if (original === undefined) delete process.env.APP_TIME_ZONE;
  else process.env.APP_TIME_ZONE = original;
  vi.restoreAllMocks();
});

describe("APP_TIME_ZONE", () => {
  it("formats in the gym's zone regardless of the server's zone", () => {
    process.env.APP_TIME_ZONE = "Asia/Kathmandu";
    expect(instant.toLocaleTimeString("en-US", zoned({ hour: "numeric", minute: "2-digit" }))).toBe(
      "11:36 AM",
    );
    process.env.APP_TIME_ZONE = "America/New_York";
    expect(instant.toLocaleTimeString("en-US", zoned({ hour: "numeric", minute: "2-digit" }))).toBe(
      "1:51 AM",
    );
  });

  it("keeps the caller's own options", () => {
    process.env.APP_TIME_ZONE = "Asia/Kathmandu";
    expect(zoned({ month: "short" })).toEqual({ month: "short", timeZone: "Asia/Kathmandu" });
    expect(zoned()).toEqual({ timeZone: "Asia/Kathmandu" });
  });

  it("gives the hour on the gym's clock (used for the greeting)", () => {
    process.env.APP_TIME_ZONE = "Asia/Kathmandu";
    expect(hourInAppTimeZone(instant)).toBe(11);
    process.env.APP_TIME_ZONE = "UTC";
    expect(hourInAppTimeZone(instant)).toBe(5);
    expect(hourInAppTimeZone(new Date("2026-09-25T00:10:00Z"))).toBe(0);
  });

  it("falls back to the server's zone when unset", () => {
    delete process.env.APP_TIME_ZONE;
    expect(appTimeZone()).toBeUndefined();
    expect(zoned({ month: "short" })).toEqual({ month: "short" });
    expect(zoned()).toBeUndefined();
  });

  it("reports and ignores an invalid zone instead of crashing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.APP_TIME_ZONE = "Not/AZone";
    expect(appTimeZone()).toBeUndefined();
    expect(() => instant.toLocaleDateString("en-US", zoned())).not.toThrow();
    expect(error).toHaveBeenCalledTimes(1);
  });
});
