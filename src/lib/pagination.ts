/**
 * Upper bound for a `?page=` value. Far beyond any real list here, and it
 * keeps `(page - 1) * pageSize` a small safe integer for Prisma's `skip`.
 */
export const MAX_PAGE = 10_000;

/**
 * Turns an untrusted `?page=` query value into a whole page number from 1
 * to MAX_PAGE. `Number(value) || 1` alone lets "1.5", "1e308" or
 * "99999999999" through, which become a fractional or enormous `skip` and
 * crash the query instead of just showing a page.
 */
export function parsePageParam(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = typeof raw === "string" && /^\d{1,6}$/.test(raw.trim()) ? Number(raw) : 1;
  return Math.min(Math.max(parsed, 1), MAX_PAGE);
}

/** Service-side guard: any number → a whole page from 1 to MAX_PAGE. */
export function clampPage(page: number | undefined): number {
  const whole = Number.isFinite(page) ? Math.floor(page as number) : 1;
  return Math.min(Math.max(whole, 1), MAX_PAGE);
}
