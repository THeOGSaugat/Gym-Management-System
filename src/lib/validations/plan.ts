import { z } from "zod";
import { parseMinorUnits } from "@/lib/money";

const priceField = z
  .string()
  .trim()
  .min(1, "Price is required")
  .transform((value, ctx) => {
    const minorUnits = parseMinorUnits(value);
    if (minorUnits === null) {
      ctx.addIssue({ code: "custom", message: "Enter a valid price, e.g. 49.99" });
      return z.NEVER;
    }
    return minorUnits;
  })
  .pipe(z.number().int().min(0, "Price can't be negative").max(100_000_00, "Price is too large"));

export const planSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(500).optional(),
  ),
  durationDays: z.coerce
    .number()
    .int("Duration must be a whole number of days")
    .min(1, "Duration must be at least 1 day")
    .max(3650, "Duration can't exceed 10 years"),
  priceMinor: priceField,
});

export type PlanInput = z.infer<typeof planSchema>;
