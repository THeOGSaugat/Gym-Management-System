import { describe, expect, it } from "vitest";
import { recordPaymentSchema } from "./payment";

const validInput = {
  membershipId: undefined,
  amountMinor: "49.99",
  method: "CASH",
  status: "SUCCEEDED",
  reference: undefined,
  notes: undefined,
  paidAt: undefined,
};

describe("recordPaymentSchema", () => {
  it("accepts a valid decimal amount and converts it to integer minor units", () => {
    const result = recordPaymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountMinor).toBe(4999);
    }
  });

  it("rejects a zero amount", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "-10" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric amount", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "not a number" });
    expect(result.success).toBe(false);
  });

  it("rejects an amount with more than two decimal places", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "49.999" });
    expect(result.success).toBe(false);
  });

  it("rejects an unreasonably large amount", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "99999999" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/invalid payment method", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, method: "BITCOIN" });
    expect(result.success).toBe(false);
  });

  it("defaults status to SUCCEEDED when omitted", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: undefined,
      amountMinor: "49.99",
      method: "CASH",
      reference: undefined,
      notes: undefined,
      paidAt: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("SUCCEEDED");
    }
  });

  it("accepts a whole-dollar amount with no decimal point", () => {
    const result = recordPaymentSchema.safeParse({ ...validInput, amountMinor: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountMinor).toBe(5000);
    }
  });
});
