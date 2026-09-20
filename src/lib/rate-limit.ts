/**
 * Minimal in-memory sliding-window-ish rate limiter.
 *
 * Deliberately NOT Redis-backed: this app runs as a single process in dev
 * and on a single instance in production for now, so a Map is sufficient.
 * Known limitations (fine for a learning project, revisit if the app ever
 * runs on multiple server instances or serverless functions with no shared
 * state):
 *   - State resets on every server restart / redeploy.
 *   - State is NOT shared across multiple server instances — each instance
 *     enforces its own limit independently.
 * If this ever becomes a real problem, swap this module for a durable
 * store (e.g. Upstash Redis) without changing any caller.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * @param key unique identifier for what's being limited, e.g. `login:${email}`
 * @param limit max allowed attempts within the window
 * @param windowMs window length in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
