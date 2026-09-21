import { z } from "zod";
import { parseMinorUnits } from "@/lib/money";

function optionalTrimmed(maxLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );
}

const amountField = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .transform((value, ctx) => {
    const minorUnits = parseMinorUnits(value);
    if (minorUnits === null) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount, e.g. 49.99" });
      return z.NEVER;
    }
    return minorUnits;
  })
  // Zero is rejected — a payment record is for money that actually
  // changed hands. A free/comped membership is a business decision that
  // belongs on the membership itself (or a discounted plan), not a
  // zero-amount "payment".
  .pipe(z.number().int().min(1, "Amount must be greater than zero").max(100_000_00, "Amount is too large"));

export const paymentMethodValues = ["CASH", "BANK_TRANSFER", "OTHER"] as const;
export const paymentStatusValues = ["SUCCEEDED", "PENDING", "FAILED", "REFUNDED"] as const;

export const recordPaymentSchema = z.object({
  membershipId: optionalTrimmed(100),
  amountMinor: amountField,
  method: z.enum(paymentMethodValues, { message: "Choose a payment method" }),
  status: z.enum(paymentStatusValues).default("SUCCEEDED"),
  reference: optionalTrimmed(120),
  notes: optionalTrimmed(500),
  paidAt: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
