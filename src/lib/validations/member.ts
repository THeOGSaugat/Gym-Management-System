import { z } from "zod";

/**
 * A rendered HTML form's empty text input still submits as "" for that
 * field name. But FormData.get() returns `null` for a key that isn't
 * present at all — which happens for any caller that isn't a full render
 * of our own form (a hand-built request, a future API client, a field
 * removed by a future edit to the form). Treating only "" as "empty" and
 * leaving `null` to fail validation would make the schema's behavior
 * depend on how the request was constructed, not on the data. This
 * normalizes both to undefined before the rest of the schema runs.
 */
function isBlank(value: unknown): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function optionalTrimmedString(maxLength: number) {
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );
}

const optionalDateOfBirth = z.preprocess(
  (value) => (isBlank(value) ? undefined : value),
  z.coerce
    .date()
    .max(new Date(), "Date of birth can't be in the future")
    .min(new Date("1900-01-01"), "Enter a valid date of birth")
    .optional(),
);

const memberContactFields = {
  phone: optionalTrimmedString(20),
  address: optionalTrimmedString(300),
  emergencyContactName: optionalTrimmedString(120),
  emergencyContactPhone: optionalTrimmedString(20),
};

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const fullNameField = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(120, "Full name is too long");

/** Admin creating a brand-new member account. */
export const createMemberSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  // No invite-by-email flow yet (needs the notifications infra from a
  // later phase), so the admin sets an initial password directly. The
  // member is expected to be told to change it — there's no forced
  // password-change-on-first-login yet either. See README for the note.
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: optionalDateOfBirth,
  ...memberContactFields,
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

/** Admin editing an existing member's full record. */
export const adminUpdateMemberSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  dateOfBirth: optionalDateOfBirth,
  ...memberContactFields,
});

export type AdminUpdateMemberInput = z.infer<typeof adminUpdateMemberSchema>;

/**
 * A member editing their own profile. Deliberately narrower than the
 * admin schema: no email (it's the login identifier — changing it is an
 * admin action, not self-service, to avoid account-takeover-by-typo
 * scenarios), no date of birth (identity-verification-sensitive, kept
 * admin-controlled), no status. This isn't just enforced by which fields
 * the form shows — the server action only ever reads these specific keys
 * out of the submitted FormData, so extra fields in a crafted request
 * are simply never looked at.
 */
export const selfUpdateMemberSchema = z.object({
  fullName: fullNameField,
  ...memberContactFields,
});

export type SelfUpdateMemberInput = z.infer<typeof selfUpdateMemberSchema>;
