import { describe, expect, it } from "vitest";
import { emailSchema, idSchema, newPasswordSchema, optionalDate, optionalPastOrPresentDate } from "./shared";
import { createMemberSchema } from "./member";
import { createTrainerSchema } from "./trainer";
import { recordPaymentSchema } from "./payment";
import { progressLogSchema } from "./progress";
import { assignMembershipSchema } from "./membership";

describe("dates", () => {
  it("rejects impossible and absurd dates", () => {
    const schema = optionalDate();
    expect(schema.safeParse("2026-02-30T99:00").success).toBe(false);
    expect(schema.safeParse("not a date").success).toBe(false);
    expect(schema.safeParse("0001-01-01").success).toBe(false);
    expect(schema.safeParse("9999-12-31").success).toBe(false);
    expect(schema.safeParse("2026-06-01").success).toBe(true);
    expect(schema.safeParse("").data).toBeUndefined();
  });

  it("rejects future dates for things that already happened", () => {
    const schema = optionalPastOrPresentDate();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(schema.safeParse(nextMonth).success).toBe(false);
    expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
  });

  it("applies to payments, progress logs and membership start dates", () => {
    const future = "2099-01-01";
    expect(recordPaymentSchema.safeParse({ amountMinor: "10", method: "CASH", paidAt: future }).success).toBe(false);
    expect(progressLogSchema.safeParse({ metric: "WEIGHT_KG", value: "80", recordedAt: future }).success).toBe(false);
    // A membership may start in the future, but not in a different millennium.
    expect(assignMembershipSchema.safeParse({ planId: "plan1", startDate: future }).success).toBe(true);
    expect(assignMembershipSchema.safeParse({ planId: "plan1", startDate: "3026-01-01" }).success).toBe(false);
  });
});

describe("ids chosen in forms", () => {
  it("rejects malformed ids in form fields", () => {
    expect(idSchema.safeParse("x; DROP TABLE users").success).toBe(false);
    expect(assignMembershipSchema.safeParse({ planId: "../plans" }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ amountMinor: "10", method: "CASH", membershipId: "a b" }).success).toBe(false);
    // "No membership" is still a valid choice.
    expect(recordPaymentSchema.safeParse({ amountMinor: "10", method: "CASH", membershipId: "" }).success).toBe(true);
  });
});

describe("passwords and emails", () => {
  it("rejects passwords bcrypt would silently truncate (over 72 bytes)", () => {
    expect(newPasswordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(newPasswordSchema.safeParse("a".repeat(73)).success).toBe(false);
    // 25 × 3-byte characters = 75 bytes, though only 25 characters.
    expect(newPasswordSchema.safeParse("€".repeat(25)).success).toBe(false);
  });

  it("uses the same rules when creating members and trainers", () => {
    const base = { fullName: "Jane Doe", email: "jane@gym.test" };
    expect(createMemberSchema.safeParse({ ...base, password: "a".repeat(80) }).success).toBe(false);
    expect(createTrainerSchema.safeParse({ ...base, password: "a".repeat(80) }).success).toBe(false);
    expect(createMemberSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });

  it("caps email length", () => {
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.io`).success).toBe(false);
    expect(emailSchema.safeParse(" Jane@Gym.TEST ").data).toBe("jane@gym.test");
  });
});
