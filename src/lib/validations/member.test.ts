import { describe, expect, it } from "vitest";
import {
  createMemberSchema,
  adminUpdateMemberSchema,
  selfUpdateMemberSchema,
} from "./member";

const validCreateInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  password: "supersecret1",
  phone: "555-1234",
  dateOfBirth: "1990-05-01",
  address: "123 Main St",
  emergencyContactName: "John Doe",
  emergencyContactPhone: "555-5678",
};

describe("createMemberSchema", () => {
  it("accepts valid input", () => {
    const result = createMemberSchema.safeParse(validCreateInput);
    expect(result.success).toBe(true);
  });

  it("normalizes empty optional strings to undefined", () => {
    const result = createMemberSchema.safeParse({
      ...validCreateInput,
      phone: "",
      address: "",
      dateOfBirth: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.address).toBeUndefined();
      expect(result.data.dateOfBirth).toBeUndefined();
    }
  });

  it("normalizes a missing optional field (null, as FormData.get() returns for an absent key) to undefined — not a validation error", () => {
    const result = createMemberSchema.safeParse({
      fullName: validCreateInput.fullName,
      email: validCreateInput.email,
      password: validCreateInput.password,
      phone: null,
      dateOfBirth: null,
      address: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.address).toBeUndefined();
      expect(result.data.dateOfBirth).toBeUndefined();
    }
  });

  it("lowercases and trims email", () => {
    const result = createMemberSchema.safeParse({
      ...validCreateInput,
      email: "  Jane@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects a missing full name", () => {
    const result = createMemberSchema.safeParse({ ...validCreateInput, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = createMemberSchema.safeParse({ ...validCreateInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = createMemberSchema.safeParse({ ...validCreateInput, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a date of birth in the future", () => {
    const futureYear = new Date().getFullYear() + 1;
    const result = createMemberSchema.safeParse({
      ...validCreateInput,
      dateOfBirth: `${futureYear}-01-01`,
    });
    expect(result.success).toBe(false);
  });
});

describe("adminUpdateMemberSchema", () => {
  it("accepts valid input without a password field", () => {
    const result = adminUpdateMemberSchema.safeParse({
      fullName: validCreateInput.fullName,
      email: validCreateInput.email,
      phone: validCreateInput.phone,
      dateOfBirth: validCreateInput.dateOfBirth,
      address: validCreateInput.address,
      emergencyContactName: validCreateInput.emergencyContactName,
      emergencyContactPhone: validCreateInput.emergencyContactPhone,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = adminUpdateMemberSchema.safeParse({
      fullName: validCreateInput.fullName,
      email: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("selfUpdateMemberSchema", () => {
  it("accepts the self-service subset of fields", () => {
    const result = selfUpdateMemberSchema.safeParse({
      fullName: "Jane Doe",
      phone: "555-1234",
      address: "123 Main St",
      emergencyContactName: "John Doe",
      emergencyContactPhone: "555-5678",
    });
    expect(result.success).toBe(true);
  });

  it("has no email or dateOfBirth field to accept in the first place", () => {
    // Not a rejection test — there's nothing to reject, because the
    // schema's shape simply doesn't define these keys. Even if a client
    // sent them, .parse() only reads the keys the schema declares.
    expect(Object.keys(selfUpdateMemberSchema.shape)).not.toContain("email");
    expect(Object.keys(selfUpdateMemberSchema.shape)).not.toContain("dateOfBirth");
  });

  it("rejects a missing full name", () => {
    const result = selfUpdateMemberSchema.safeParse({ fullName: "" });
    expect(result.success).toBe(false);
  });
});
