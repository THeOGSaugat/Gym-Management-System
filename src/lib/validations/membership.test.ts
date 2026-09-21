import { describe, expect, it } from "vitest";
import { assignMembershipSchema, cancelMembershipSchema } from "./membership";

describe("assignMembershipSchema", () => {
  it("accepts a planId with no startDate (defaults to today in the service)", () => {
    const result = assignMembershipSchema.safeParse({ planId: "plan-1", startDate: undefined });
    expect(result.success).toBe(true);
  });

  it("rejects a missing planId", () => {
    expect(assignMembershipSchema.safeParse({ planId: "" }).success).toBe(false);
  });

  it("treats a null startDate (as FormData.get() returns for an absent key) as omitted, not invalid", () => {
    const result = assignMembershipSchema.safeParse({ planId: "plan-1", startDate: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeUndefined();
    }
  });

  it("accepts an explicit future start date", () => {
    const result = assignMembershipSchema.safeParse({
      planId: "plan-1",
      startDate: "2030-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it("has no price/amount field to accept in the first place", () => {
    expect(Object.keys(assignMembershipSchema.shape)).not.toContain("priceMinor");
    expect(Object.keys(assignMembershipSchema.shape)).not.toContain("amount");
  });
});

describe("cancelMembershipSchema", () => {
  it("accepts an omitted reason", () => {
    expect(cancelMembershipSchema.safeParse({ reason: undefined }).success).toBe(true);
  });

  it("treats a null reason the same as an empty one", () => {
    const result = cancelMembershipSchema.safeParse({ reason: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBeUndefined();
    }
  });

  it("accepts a provided reason", () => {
    const result = cancelMembershipSchema.safeParse({ reason: "Member requested" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Member requested");
    }
  });
});
