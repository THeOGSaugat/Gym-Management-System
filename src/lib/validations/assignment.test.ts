import { describe, expect, it } from "vitest";
import { assignTrainerSchema } from "./assignment";

describe("assignTrainerSchema", () => {
  it("accepts a valid trainerId", () => {
    expect(assignTrainerSchema.safeParse({ trainerId: "trainer-1" }).success).toBe(true);
  });

  it("rejects an empty trainerId", () => {
    expect(assignTrainerSchema.safeParse({ trainerId: "" }).success).toBe(false);
  });

  it("rejects a missing trainerId", () => {
    expect(assignTrainerSchema.safeParse({}).success).toBe(false);
  });
});
