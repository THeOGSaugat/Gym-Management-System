import { describe, expect, it } from "vitest";
import {
  isMembershipCurrentlyActive,
  computeEffectiveStatus,
  addDays,
  computeRenewalStartDate,
} from "./membership";

const day = (offsetDays: number, from = new Date("2026-06-15T00:00:00Z")) =>
  addDays(from, offsetDays);

const now = new Date("2026-06-15T00:00:00Z");

describe("addDays", () => {
  it("adds whole days without drifting across a month boundary", () => {
    const start = new Date("2026-01-31T00:00:00Z");
    expect(addDays(start, 1).toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("handles a leap day correctly", () => {
    const start = new Date("2028-02-28T00:00:00Z"); // 2028 is a leap year
    expect(addDays(start, 1).toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
});

describe("computeEffectiveStatus", () => {
  it("is PENDING before the start date", () => {
    const membership = { status: "PENDING" as const, startDate: day(5), endDate: day(35) };
    expect(computeEffectiveStatus(membership, now)).toBe("PENDING");
  });

  it("is ACTIVE within [startDate, endDate]", () => {
    const membership = { status: "PENDING" as const, startDate: day(-5), endDate: day(25) };
    expect(computeEffectiveStatus(membership, now)).toBe("ACTIVE");
  });

  it("is ACTIVE on the exact start date", () => {
    const membership = { status: "PENDING" as const, startDate: now, endDate: day(30) };
    expect(computeEffectiveStatus(membership, now)).toBe("ACTIVE");
  });

  it("is EXPIRED once past the end date, even if stored status still says ACTIVE", () => {
    const membership = { status: "ACTIVE" as const, startDate: day(-40), endDate: day(-1) };
    expect(computeEffectiveStatus(membership, now)).toBe("EXPIRED");
  });

  it("is EXPIRED on the day after the end date", () => {
    const membership = { status: "ACTIVE" as const, startDate: day(-31), endDate: day(-1) };
    expect(computeEffectiveStatus(membership, now)).toBe("EXPIRED");
  });

  it("is still ACTIVE on the exact end date (inclusive)", () => {
    const membership = { status: "ACTIVE" as const, startDate: day(-30), endDate: now };
    expect(computeEffectiveStatus(membership, now)).toBe("ACTIVE");
  });

  it("never un-cancels a CANCELLED membership, regardless of dates", () => {
    const membership = { status: "CANCELLED" as const, startDate: day(-10), endDate: day(20) };
    expect(computeEffectiveStatus(membership, now)).toBe("CANCELLED");
  });

  it("never un-expires an EXPIRED membership", () => {
    const membership = { status: "EXPIRED" as const, startDate: day(-10), endDate: day(20) };
    expect(computeEffectiveStatus(membership, now)).toBe("EXPIRED");
  });
});

describe("isMembershipCurrentlyActive", () => {
  it("is true only when dates and status both say active", () => {
    expect(
      isMembershipCurrentlyActive(
        { status: "ACTIVE", startDate: day(-5), endDate: day(5) },
        now,
      ),
    ).toBe(true);
  });

  it("is false for a CANCELLED membership even if dates would otherwise be active", () => {
    expect(
      isMembershipCurrentlyActive(
        { status: "CANCELLED", startDate: day(-5), endDate: day(5) },
        now,
      ),
    ).toBe(false);
  });

  it("is false before the start date", () => {
    expect(
      isMembershipCurrentlyActive({ status: "PENDING", startDate: day(1), endDate: day(30) }, now),
    ).toBe(false);
  });

  it("is false after the end date", () => {
    expect(
      isMembershipCurrentlyActive({ status: "ACTIVE", startDate: day(-40), endDate: day(-1) }, now),
    ).toBe(false);
  });
});

describe("computeRenewalStartDate", () => {
  it("starts the day after the current end date when renewing before expiry", () => {
    const currentEnd = day(10); // still 10 days left
    const result = computeRenewalStartDate(currentEnd, now);
    expect(result.toISOString()).toBe(addDays(currentEnd, 1).toISOString());
  });

  it("starts today when renewing an already-expired membership — no back-dated free coverage", () => {
    const currentEnd = day(-15); // expired 15 days ago
    const result = computeRenewalStartDate(currentEnd, now);
    expect(result.toISOString()).toBe(now.toISOString());
  });

  it("starts today when renewing exactly on the day after expiry", () => {
    const currentEnd = day(-1);
    const result = computeRenewalStartDate(currentEnd, now);
    expect(result.toISOString()).toBe(now.toISOString());
  });
});
