import { db } from "@/server/db";

/**
 * Fixed-window rate limiter backed by Postgres (the `rate_limit_buckets`
 * table), so every server instance — or serverless function — shares the
 * same counters. An in-memory Map, which this replaced, only limited each
 * instance on its own and forgot everything on restart.
 *
 * No Redis or other new infrastructure: the app already has a database,
 * and login attempts are rare enough that one small upsert per attempt is
 * negligible.
 */

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

type BucketRow = { count: number; resetAt: Date };

/**
 * Counts one attempt against `key` and says whether it's within `limit`
 * for the current `windowMs` window.
 *
 * A single atomic statement does the whole read-modify-write: it inserts
 * a fresh bucket, or increments the existing one — restarting it at 1 if
 * its window has passed. Two simultaneous attempts can never both read
 * the same count, which a separate SELECT-then-UPDATE would allow.
 *
 * Timestamps are compared in UTC, matching how Prisma stores DateTime in
 * a `timestamp without time zone` column.
 *
 * @param key unique identifier for what's being limited, e.g. `login:${email}`
 * @param limit max allowed attempts within the window
 * @param windowMs window length in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<BucketRow[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt")
    VALUES (
      ${key},
      1,
      (now() AT TIME ZONE 'UTC') + make_interval(secs => ${windowMs / 1000}::double precision)
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limit_buckets"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt"
        ELSE "rate_limit_buckets"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  maybeSweepExpired();

  const bucket = rows[0];
  if (!bucket) throw new Error("Rate limit update returned no row.");

  if (bucket.count <= limit) return { allowed: true };
  return { allowed: false, retryAfterMs: Math.max(0, bucket.resetAt.getTime() - Date.now()) };
}

/**
 * Every distinct key (every email anyone ever typed at the login form)
 * leaves a row behind, so expired rows are deleted now and then — on
 * roughly one call in 50, in the background, never delaying the caller.
 * A failed sweep is harmless: the next one catches up.
 */
const SWEEP_PROBABILITY = 1 / 50;

function maybeSweepExpired() {
  if (Math.random() >= SWEEP_PROBABILITY) return;
  void sweepExpiredRateLimits().catch((error) => {
    console.error("Rate limit sweep failed:", error);
  });
}

export function sweepExpiredRateLimits() {
  return db.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
