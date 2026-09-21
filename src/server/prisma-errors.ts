import { Prisma } from "@/generated/prisma/client";

/**
 * True if `error` is Prisma's "unique constraint violated" error for the
 * given field. Used as defense-in-depth alongside an explicit pre-check
 * query — the pre-check handles the common case with a clean error
 * message, this catches the rare race where two requests pass the
 * pre-check at the same time and only one insert can win.
 */
export function isUniqueConstraintError(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes(field)
  );
}
