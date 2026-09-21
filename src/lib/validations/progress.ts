import { z } from "zod";
import { optionalDate, optionalTrimmedString } from "./shared";

export const progressMetricValues = [
  "WEIGHT_KG",
  "BODY_FAT_PERCENT",
  "CHEST_CM",
  "WAIST_CM",
  "HIPS_CM",
  "ARM_CM",
  "THIGH_CM",
  "CUSTOM",
] as const;

export const progressLogSchema = z
  .object({
    metric: z.enum(progressMetricValues, { message: "Choose a metric" }),
    // Required only for CUSTOM — enforced below via .refine(), since Zod's
    // object-level shape can't express "required if a sibling field has a
    // particular value."
    customLabel: optionalTrimmedString(60),
    value: z.coerce
      .number()
      .positive("Value must be greater than zero")
      .max(1000, "That value looks unrealistic — double-check it"),
    notes: optionalTrimmedString(300),
    // Defaults to now in the service if omitted.
    recordedAt: optionalDate(),
  })
  .refine((data) => data.metric !== "CUSTOM" || !!data.customLabel, {
    message: "Give this custom metric a short label",
    path: ["customLabel"],
  })
  .refine((data) => data.metric !== "BODY_FAT_PERCENT" || data.value <= 100, {
    message: "Body fat percentage can't exceed 100",
    path: ["value"],
  });

export type ProgressLogInput = z.infer<typeof progressLogSchema>;
