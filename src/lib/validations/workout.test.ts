import { describe, expect, it } from "vitest";
import { workoutPlanSchema, workoutDaySchema, workoutExerciseSchema } from "./workout";

describe("workoutPlanSchema", () => {
  const validInput = { name: "Strength Block 1", description: "12-week block", startDate: undefined, endDate: undefined };

  it("accepts valid input", () => {
    expect(workoutPlanSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(workoutPlanSchema.safeParse({ ...validInput, name: "" }).success).toBe(false);
  });

  it("treats a null description/dates as unset, not invalid", () => {
    const result = workoutPlanSchema.safeParse({
      name: "Plan",
      description: null,
      startDate: null,
      endDate: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("workoutDaySchema", () => {
  it("accepts a valid label", () => {
    expect(workoutDaySchema.safeParse({ label: "Monday", notes: undefined }).success).toBe(true);
  });

  it("rejects a missing label", () => {
    expect(workoutDaySchema.safeParse({ label: "" }).success).toBe(false);
  });

  it("treats a null notes field as unset", () => {
    const result = workoutDaySchema.safeParse({ label: "Push Day", notes: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});

describe("workoutExerciseSchema", () => {
  const validInput = {
    exerciseId: "exercise-1",
    sets: "3",
    reps: "10",
    weightKg: "60",
    restSeconds: "90",
    notes: undefined,
  };

  it("accepts valid input and coerces numeric strings", () => {
    const result = workoutExerciseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sets).toBe(3);
      expect(result.data.reps).toBe(10);
      expect(result.data.weightKg).toBe(60);
      expect(result.data.restSeconds).toBe(90);
    }
  });

  it("rejects a missing exerciseId", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, exerciseId: "" }).success).toBe(
      false,
    );
  });

  it("rejects zero or negative sets", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, sets: "0" }).success).toBe(false);
    expect(workoutExerciseSchema.safeParse({ ...validInput, sets: "-1" }).success).toBe(false);
  });

  it("rejects zero or negative reps", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, reps: "0" }).success).toBe(false);
  });

  it("rejects a non-integer sets value", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, sets: "3.5" }).success).toBe(false);
  });

  it("rejects an unrealistic number of sets", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, sets: "1000" }).success).toBe(false);
  });

  it("rejects a negative weight", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, weightKg: "-5" }).success).toBe(
      false,
    );
  });

  it("treats null/empty weight and rest as unset, not invalid — both are optional fields", () => {
    const result = workoutExerciseSchema.safeParse({
      ...validInput,
      weightKg: null,
      restSeconds: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBeUndefined();
      expect(result.data.restSeconds).toBeUndefined();
    }
  });

  it("rejects a negative rest time", () => {
    expect(workoutExerciseSchema.safeParse({ ...validInput, restSeconds: "-10" }).success).toBe(
      false,
    );
  });
});
