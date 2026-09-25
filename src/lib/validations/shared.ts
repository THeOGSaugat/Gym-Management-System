import { z } from "zod";

/**
 * A rendered HTML form's empty text input still submits as "" for that
 * field name. But FormData.get() returns `null` for a key that isn't
 * present at all — which happens for any caller that isn't a full render
 * of our own form (a hand-built request, a future API client, a field
 * removed by a future edit to the form). Treating only "" as "empty" and
 * leaving `null` to fail validation would make the schema's behavior
 * depend on how the request was constructed, not on the data.
 *
 * This one function is the single place that rule lives — every
 * `optional*` helper below (and any future one) builds on it, precisely
 * so it's defined once and reused, not re-typed slightly differently
 * per schema file. (An earlier version of this fix was duplicated by
 * hand into a second schema file and only handled "", not `null` —
 * found by a failing test, not by inspection. Don't repeat that: import
 * from here instead of writing a new local `isBlank`/`optionalX`.)
 */
export function isBlank(value: unknown): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

export function optionalTrimmedString(maxLength: number) {
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );
}

/**
 * Every date the app stores is a real-world gym date (a payment, a plan
 * start, a measurement), so anything outside this window is a typo or a
 * crafted request — `z.coerce.date()` alone happily accepts year 0001 or
 * 9999, which then sorts and displays nonsensically everywhere.
 */
const EARLIEST_DATE = new Date("1990-01-01T00:00:00.000Z");
const LATEST_DATE = new Date("2100-12-31T23:59:59.999Z");
const DATE_RANGE_MESSAGE = "Enter a date between 1990 and 2100";

function boundedDate() {
  return z.coerce
    .date({ message: "Enter a valid date" })
    .min(EARLIEST_DATE, DATE_RANGE_MESSAGE)
    .max(LATEST_DATE, DATE_RANGE_MESSAGE);
}

export function optionalDate() {
  return z.preprocess((value) => (isBlank(value) ? undefined : value), boundedDate().optional());
}

/**
 * For things that have already happened (a payment received, a
 * measurement taken). One day of slack covers a date-only input parsed
 * as UTC midnight for someone ahead of UTC, without letting anyone
 * back-fill records "from next month".
 */
export function optionalPastOrPresentDate() {
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    boundedDate()
      .refine((date) => date.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
        message: "This date can't be in the future",
      })
      .optional(),
  );
}

/**
 * A database row id (Prisma `cuid()`): a short, plain token. Anything
 * else — an object like `{ not: "" }` that Prisma would read as a filter,
 * a 10 KB string, path characters — is rejected before it reaches a
 * query. Used for ids in form fields and, via action-args.ts, for ids
 * passed as bound Server Action arguments, which are just as
 * client-controllable as form fields.
 */
export const idSchema = z
  .string({ message: "Invalid id" })
  .trim()
  .min(1, "Invalid id")
  .max(64, "Invalid id")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid id");

/** A required id chosen in a form (a plan, trainer, exercise ...). */
export function requiredIdField(message: string) {
  return z.preprocess((value) => (isBlank(value) ? "" : value), z.string().trim().min(1, message).pipe(idSchema));
}

/** An optional id chosen in a form ("no membership" is a valid choice). */
export function optionalIdField() {
  return z.preprocess((value) => (isBlank(value) ? undefined : value), idSchema.optional());
}

/**
 * bcrypt only reads the first 72 bytes of a password, so a longer one
 * would be silently truncated — two different long passwords sharing a
 * 72-byte prefix would both work. Refuse them instead. Measured in UTF-8
 * bytes, not characters, since that's what bcrypt counts.
 */
export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    message: "Password is too long (72 bytes maximum)",
  });

/** RFC 5321 caps an address at 254 characters. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");
