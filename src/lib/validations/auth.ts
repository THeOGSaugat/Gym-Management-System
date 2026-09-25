import { z } from "zod";

/**
 * Validates login input before it ever reaches the database or bcrypt.
 * Kept intentionally loose on the password side — this is a login check,
 * not a "set a new password" check, so we don't enforce complexity rules
 * here (a correct existing password might be short/old).
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(254, "Enter a valid email address")
    .email("Enter a valid email address"),
  // Bounded so a multi-megabyte "password" never reaches bcrypt.
  password: z.string().min(1, "Password is required").max(1024, "Password is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
