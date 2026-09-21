import { describe, expect, it } from "vitest";
import { planSchema } from "./plan";

const validInput = {
  name: "Monthly",
  description: undefined,
  durationDays: 30,
  priceMinor: "49.99",
};

describe("planSchema", () => {
  it("accepts valid input and converts the decimal price to integer minor units", () => {
    const result = planSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceMinor).toBe(4999);
    }
  });

  it("accepts a free (zero-price) plan", () => {
    const result = planSchema.safeParse({ ...validInput, priceMinor: "0" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = planSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer duration", () => {
    const result = planSchema.safeParse({ ...validInput, durationDays: 30.5 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative duration", () => {
    expect(planSchema.safeParse({ ...validInput, durationDays: 0 }).success).toBe(false);
    expect(planSchema.safeParse({ ...validInput, durationDays: -5 }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = planSchema.safeParse({ ...validInput, priceMinor: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid price string", () => {
    const result = planSchema.safeParse({ ...validInput, priceMinor: "free" });
    expect(result.success).toBe(false);
  });
});
