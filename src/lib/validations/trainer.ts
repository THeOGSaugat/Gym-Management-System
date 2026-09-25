import { z } from "zod";
import { emailSchema, isBlank, newPasswordSchema, optionalTrimmedString } from "./shared";

const optionalExperienceYears = z.preprocess(
  (value) => (isBlank(value) ? undefined : value),
  z.coerce
    .number()
    .int("Experience must be a whole number of years")
    .min(0, "Experience can't be negative")
    .max(80, "Enter a realistic number of years")
    .optional(),
);

const fullNameField = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(120, "Full name is too long");

const emailField = emailSchema;

const trainerProfileFields = {
  phone: optionalTrimmedString(20),
  bio: optionalTrimmedString(1000),
  specialization: optionalTrimmedString(200),
  experienceYears: optionalExperienceYears,
};

/** Admin creating a brand-new trainer account. */
export const createTrainerSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  // Same reasoning as createMemberSchema: no invite-by-email flow yet,
  // so the admin sets an initial password directly.
  password: newPasswordSchema,
  ...trainerProfileFields,
});

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;

/** Admin editing an existing trainer's record. */
export const updateTrainerSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  ...trainerProfileFields,
});

export type UpdateTrainerInput = z.infer<typeof updateTrainerSchema>;
