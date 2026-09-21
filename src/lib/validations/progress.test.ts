import { describe, expect, it } from "vitest";
import { progressLogSchema } from "./progress";

const validInput = {
  metric: "WEIGHT_KG",
  customLabel: undefined,
  value: "82.5",
  notes: undefined,
  recordedAt: undefined,
};

describe("progressLogSchema", () => {
  it("accepts valid input", () => {
    const result = progressLogSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(82.5);
    }
  });

  it("rejects an invalid metric", () => {
    expect(progressLogSchema.safeParse({ ...validInput, metric: "VIBES" }).success).toBe(false);
  });

  it("rejects a zero or negative value", () => {
    expect(progressLogSchema.safeParse({ ...validInput, value: "0" }).success).toBe(false);
    expect(progressLogSchema.safeParse({ ...validInput, value: "-5" }).success).toBe(false);
  });

  it("rejects an unrealistic value", () => {
    expect(progressLogSchema.safeParse({ ...validInput, value: "5000" }).success).toBe(false);
  });

  it("requires a customLabel when metric is CUSTOM", () => {
    const result = progressLogSchema.safeParse({
      ...validInput,
      metric: "CUSTOM",
      customLabel: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("accepts CUSTOM with a customLabel", () => {
    const result = progressLogSchema.safeParse({
      ...validInput,
      metric: "CUSTOM",
      customLabel: "Resting heart rate",
    });
    expect(result.success).toBe(true);
  });

  it("does not require a customLabel for a non-CUSTOM metric", () => {
    const result = progressLogSchema.safeParse({ ...validInput, metric: "WEIGHT_KG" });
    expect(result.success).toBe(true);
  });

  it("caps BODY_FAT_PERCENT at 100", () => {
    expect(
      progressLogSchema.safeParse({ ...validInput, metric: "BODY_FAT_PERCENT", value: "101" })
        .success,
    ).toBe(false);
    expect(
      progressLogSchema.safeParse({ ...validInput, metric: "BODY_FAT_PERCENT", value: "22" })
        .success,
    ).toBe(true);
  });

  it("treats null notes as unset", () => {
    const result = progressLogSchema.safeParse({ ...validInput, notes: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});
