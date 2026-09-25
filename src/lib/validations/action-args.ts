import { ValidationError } from "@/lib/errors";
import { idSchema } from "./shared";

/**
 * Runtime checks for a Server Action's *positional* arguments.
 *
 * Arguments bound in a page — `setMemberStatusAction.bind(null, member.id,
 * "SUSPENDED")` — look like trusted server values, but they are serialized
 * to the browser and posted back, so a caller can replace them with
 * anything, including values TypeScript says are impossible: a status
 * that isn't in the enum, `"false"` for a boolean, or an object such as
 * `{ not: "" }` that Prisma would treat as a *filter* rather than an id.
 *
 * Authorization never depended on these values being honest — every
 * service re-derives ownership from the session actor and the database —
 * but each action still validates its arguments first, so a tampered
 * request fails fast with a clean 400-style error instead of reaching a
 * query or surfacing as a 500.
 *
 * A failure throws ValidationError. Only a hand-crafted request can hit it
 * (the UI never sends these values), so it's deliberately not turned into
 * friendly form feedback — it lands on the area's error boundary, which
 * shows a generic message and never the error's details.
 */

const INVALID_REQUEST = "Invalid request.";

export function parseIdArg(value: unknown): string {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) throw new ValidationError(INVALID_REQUEST);
  return parsed.data;
}

export function parseEnumArg<const T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new ValidationError(INVALID_REQUEST);
  }
  return value as T;
}

export function parseBooleanArg(value: unknown): boolean {
  if (typeof value !== "boolean") throw new ValidationError(INVALID_REQUEST);
  return value;
}
