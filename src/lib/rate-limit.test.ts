import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { checkRateLimit, sweepExpiredRateLimits } from "./rate-limit";

// The SQL itself (atomic upsert, window reset, concurrency) was verified
// against Postgres directly; these pin down how its result is interpreted.
describe("checkRateLimit (database-backed)", () => {
  it("allows attempts up to and including the limit", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 5, resetAt: new Date(Date.now() + 60_000) }]);
    expect(await checkRateLimit("login:a@gym.test", 5, 60_000)).toEqual({ allowed: true });
  });

  it("denies past the limit and says how long until the window resets", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 6, resetAt: new Date(Date.now() + 30_000) }]);
    const result = await checkRateLimit("login:a@gym.test", 5, 60_000);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(25_000);
      expect(result.retryAfterMs).toBeLessThanOrEqual(30_000);
    }
  });

  it("passes the key as a bound parameter, never spliced into the SQL", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 1, resetAt: new Date() }]);
    const hostile = `login:x'); DROP TABLE users; --`;
    await checkRateLimit(hostile, 5, 60_000);
    const [strings, ...values] = prismaMock.$queryRaw.mock.calls[0] as unknown as [TemplateStringsArray, ...unknown[]];
    expect(strings.join("")).not.toContain("DROP TABLE");
    expect(values).toContain(hostile);
  });

  it("fails closed if the database returns nothing", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);
    await expect(checkRateLimit("k", 5, 60_000)).rejects.toThrow();
  });

  it("sweeps only expired buckets", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
    try {
      await sweepExpiredRateLimits();
      expect(prismaMock.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
        where: { resetAt: { lt: new Date("2026-09-25T12:00:00Z") } },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
