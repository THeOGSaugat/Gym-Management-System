import { describe, expect, it } from "vitest";
import { exerciseSchema } from "./exercise";

const validInput = {
  name: "Bench Press",
  muscleGroup: "Chest",
  description: "A compound push exercise.",
  instructions: "Lower the bar to your chest, then press up.",
};

describe("exerciseSchema", () => {
  it("accepts valid input", () => {
    expect(exerciseSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(exerciseSchema.safeParse({ ...validInput, name: "" }).success).toBe(false);
  });

  it("treats null optional fields (as FormData.get() returns for an absent key) as unset, not invalid", () => {
    const result = exerciseSchema.safeParse({
      name: "Squat",
      muscleGroup: null,
      description: null,
      instructions: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.muscleGroup).toBeUndefined();
      expect(result.data.description).toBeUndefined();
      expect(result.data.instructions).toBeUndefined();
    }
  });

  it("rejects a name that's too long", () => {
    expect(exerciseSchema.safeParse({ ...validInput, name: "x".repeat(200) }).success).toBe(
      false,
    );
  });
});
