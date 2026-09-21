import { Prisma } from "@/generated/prisma/client";

/**
 * True if `error` is Prisma's "unique constraint violated" error and, as
 * best as can be determined, for the given field. Used as defense-in-
 * depth alongside an explicit pre-check query — the pre-check handles
 * the common case with a clean error message, this catches the rare
 * race where two requests pass the pre-check at the same time and only
 * one insert can win.
 *
 * Where the violated constraint's identity actually shows up in `meta`
 * has turned out to vary, confirmed by testing against a real
 * duplicate-check-in race on Neon (not just the mocked unit tests):
 *   - For a `@@unique` Prisma knows about, historically `meta.target`:
 *     an array of field names.
 *   - Sometimes `meta.target` is a plain string (the raw constraint
 *     name) instead — e.g. for a constraint that only exists as
 *     hand-written SQL in a migration, which Prisma can't map back to
 *     field names (a partial unique index, which the schema DSL can't
 *     express declaratively — see Attendance's migration).
 *   - With the `@prisma/adapter-pg` driver adapter (which this project
 *     uses throughout), the constraint name instead shows up nested at
 *     `meta.driverAdapterError.cause.constraint.index`, and `meta.target`
 *     may be absent entirely.
 * Rather than chase the exact shape for a given Prisma/adapter version,
 * this checks every location above and, if none match, falls back to a
 * substring search over the whole `meta` object's JSON — loose, but this
 * function only ever feeds a decision about which *already-generic*
 * error message to show, never an authorization or data decision, so a
 * false positive here is harmless.
 */
export function isUniqueConstraintError(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const needle = field.toLowerCase();
  const meta = error.meta;

  if (Array.isArray(meta?.target) && (meta.target as unknown[]).some((t) => String(t).toLowerCase().includes(needle))) {
    return true;
  }
  if (typeof meta?.target === "string" && meta.target.toLowerCase().includes(needle)) {
    return true;
  }

  try {
    return JSON.stringify(meta ?? {}).toLowerCase().includes(needle);
  } catch {
    return false;
  }
}
