import type { ProgressMetric } from "@/generated/prisma/client";

/**
 * How a progress metric is written for a human.
 *
 * This used to be re-declared (slightly differently) on the member progress
 * page, the member dashboard, the trainer dashboard and the admin member
 * detail page — so the same entry read "WEIGHT_KG" in one place and "Body
 * weight" in another. One definition, imported everywhere.
 */
export const METRIC_LABEL: Record<ProgressMetric, string> = {
  WEIGHT_KG: "Body weight",
  BODY_FAT_PERCENT: "Body fat",
  CHEST_CM: "Chest",
  WAIST_CM: "Waist",
  HIPS_CM: "Hips",
  ARM_CM: "Arm",
  THIGH_CM: "Thigh",
  CUSTOM: "Custom",
};

export const METRIC_UNIT: Record<ProgressMetric, string> = {
  WEIGHT_KG: "kg",
  BODY_FAT_PERCENT: "%",
  CHEST_CM: "cm",
  WAIST_CM: "cm",
  HIPS_CM: "cm",
  ARM_CM: "cm",
  THIGH_CM: "cm",
  CUSTOM: "",
};

/** A CUSTOM entry is named by whatever the member typed; everything else is self-describing. */
export function metricLabel(metric: ProgressMetric, customLabel?: string | null): string {
  if (metric === "CUSTOM") return customLabel?.trim() || "Custom";
  return METRIC_LABEL[metric];
}

/** e.g. "82.5 kg" — the unit is omitted for CUSTOM metrics, which have no known unit. */
export function formatMetricValue(
  metric: ProgressMetric,
  value: number,
): string {
  const unit = METRIC_UNIT[metric];
  return unit ? `${value} ${unit}` : String(value);
}
