import { describe, expect, it } from "vitest";
import { createTrainerSchema, updateTrainerSchema } from "./trainer";

const validCreateInput = {
  fullName: "Tara Trainer",
  email: "tara@example.com",
  password: "supersecret1",
  phone: "555-1234",
  bio: "Certified strength coach.",
  specialization: "Strength & conditioning",
  experienceYears: "5",
};

describe("createTrainerSchema", () => {
  it("accepts valid input", () => {
    expect(createTrainerSchema.safeParse(validCreateInput).success).toBe(true);
  });

  it("normalizes empty optional fields (including null, as FormData.get() returns for an absent key) to undefined", () => {
    const result = createTrainerSchema.safeParse({
      ...validCreateInput,
      phone: null,
      bio: "",
      specialization: null,
      experienceYears: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.bio).toBeUndefined();
      expect(result.data.specialization).toBeUndefined();
      expect(result.data.experienceYears).toBeUndefined();
    }
  });

  it("rejects a missing full name", () => {
    expect(createTrainerSchema.safeParse({ ...validCreateInput, fullName: "" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid email", () => {
    expect(
      createTrainerSchema.safeParse({ ...validCreateInput, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(createTrainerSchema.safeParse({ ...validCreateInput, password: "short" }).success).toBe(
      false,
    );
  });

  it("rejects a negative years of experience", () => {
    expect(
      createTrainerSchema.safeParse({ ...validCreateInput, experienceYears: "-1" }).success,
    ).toBe(false);
  });

  it("rejects an unrealistic years of experience", () => {
    expect(
      createTrainerSchema.safeParse({ ...validCreateInput, experienceYears: "200" }).success,
    ).toBe(false);
  });
});

describe("updateTrainerSchema", () => {
  it("accepts valid input without a password field", () => {
    const result = updateTrainerSchema.safeParse({
      fullName: validCreateInput.fullName,
      email: validCreateInput.email,
      phone: validCreateInput.phone,
      bio: validCreateInput.bio,
      specialization: validCreateInput.specialization,
      experienceYears: validCreateInput.experienceYears,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = updateTrainerSchema.safeParse({
      fullName: validCreateInput.fullName,
      email: "",
    });
    expect(result.success).toBe(false);
  });
});
