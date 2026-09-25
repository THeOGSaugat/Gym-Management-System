import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";

// bcrypt itself is exercised elsewhere; here it only matters *whether* and
// *against what* a comparison runs, and the tests shouldn't pay bcrypt's
// deliberate slowness on every case.
const verifyPassword = vi.fn();
vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async () => "$2b$12$dummy-hash-for-timing"),
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

// The real limiter is a Postgres upsert (tested in rate-limit.test.ts and
// against the live database). Here, an in-memory stand-in with the same
// semantics lets these tests exercise *how verifyCredentials uses it*.
const buckets = new Map<string, number>();
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async (key: string, limit: number) => {
    const count = (buckets.get(key) ?? 0) + 1;
    buckets.set(key, count);
    return count <= limit ? { allowed: true } : { allowed: false, retryAfterMs: 1000 };
  },
}));

const {
  verifyCredentials,
  clientKeyFromRequest,
  trustedProxyHops,
  LOGIN_ATTEMPTS_PER_EMAIL,
  LOGIN_ATTEMPTS_PER_CLIENT,
} = await import("./credentials");

// The rate limiter is process-global state, so each test uses its own
// email / client key rather than depending on test order.
let seq = 0;
const uniqueEmail = () => `user${++seq}@gym.test`;

function account(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "member@gym.test",
    fullName: "Mo Member",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    passwordHash: "$2b$12$real-hash",
    ...overrides,
  };
}

beforeEach(() => {
  verifyPassword.mockReset();
});

describe("verifyCredentials — login", () => {
  it("signs in an active account with the right password, returning only safe fields", async () => {
    const email = uniqueEmail();
    prismaMock.user.findUnique.mockResolvedValue(account({ email }) as never);
    verifyPassword.mockResolvedValue(true);

    const user = await verifyCredentials({ email, password: "Member123!" });

    expect(user).toEqual({ id: "user-1", email, name: "Mo Member", role: "MEMBER" });
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("status");
  });

  it("normalizes the email before looking it up", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    verifyPassword.mockResolvedValue(false);
    await verifyCredentials({ email: "  Mixed.Case@Gym.TEST ", password: "x" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "mixed.case@gym.test" } }),
    );
  });

  it("rejects a wrong password", async () => {
    const email = uniqueEmail();
    prismaMock.user.findUnique.mockResolvedValue(account({ email }) as never);
    verifyPassword.mockResolvedValue(false);
    expect(await verifyCredentials({ email, password: "wrong" })).toBeNull();
  });

  it("rejects an unknown email — after still running a bcrypt comparison (no timing tell)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    verifyPassword.mockResolvedValue(true);

    expect(await verifyCredentials({ email: uniqueEmail(), password: "anything" })).toBeNull();
    expect(verifyPassword).toHaveBeenCalledTimes(1);
    expect(verifyPassword).toHaveBeenCalledWith("anything", "$2b$12$dummy-hash-for-timing");
  });

  it("rejects a suspended account even with the correct password", async () => {
    const email = uniqueEmail();
    prismaMock.user.findUnique.mockResolvedValue(account({ email, status: "SUSPENDED" }) as never);
    verifyPassword.mockResolvedValue(true);

    expect(await verifyCredentials({ email, password: "Member123!" })).toBeNull();
    // Compared against the dummy hash, never the real one.
    expect(verifyPassword).not.toHaveBeenCalledWith("Member123!", "$2b$12$real-hash");
  });

  it.each([
    ["missing fields", {}],
    ["not an email", { email: "not-an-email", password: "x" }],
    ["empty password", { email: "a@gym.test", password: "" }],
    ["oversized password", { email: "a@gym.test", password: "x".repeat(2000) }],
    ["non-string values", { email: { not: "" }, password: ["x"] }],
  ])("rejects malformed input (%s) without touching the database", async (_label, input) => {
    expect(await verifyCredentials(input)).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("locks an email out after too many attempts, even when the password is then correct", async () => {
    const email = uniqueEmail();
    prismaMock.user.findUnique.mockResolvedValue(account({ email }) as never);
    verifyPassword.mockResolvedValue(false);
    for (let i = 0; i < LOGIN_ATTEMPTS_PER_EMAIL; i++) {
      await verifyCredentials({ email, password: "guess" });
    }

    verifyPassword.mockResolvedValue(true);
    expect(await verifyCredentials({ email, password: "Member123!" })).toBeNull();
  });

  it("limits one client spraying a password across many different accounts", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    verifyPassword.mockResolvedValue(false);
    const client = `203.0.113.${++seq}`;
    for (let i = 0; i < LOGIN_ATTEMPTS_PER_CLIENT; i++) {
      await verifyCredentials({ email: uniqueEmail(), password: "Summer2026!" }, client);
    }
    prismaMock.user.findUnique.mockClear();

    await verifyCredentials({ email: uniqueEmail(), password: "Summer2026!" }, client);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("clientKeyFromRequest — only the address our own proxy wrote is trusted", () => {
  const req = (headers: Record<string, string>) => new Request("http://x", { headers });

  it("with one trusted proxy, takes the entry that proxy appended (the rightmost)", () => {
    expect(clientKeyFromRequest(req({ "x-forwarded-for": "198.51.100.7" }), 1)).toBe("198.51.100.7");
  });

  it("ignores addresses the client prepended to dodge the per-client limit", () => {
    // The attacker sent "X-Forwarded-For: 1.2.3.4"; the proxy appended the real address.
    expect(clientKeyFromRequest(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" }), 1)).toBe(
      "198.51.100.7",
    );
    // Two trusted hops (e.g. CDN → load balancer): the client is second from the right.
    expect(
      clientKeyFromRequest(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.7, 10.0.0.2" }), 2),
    ).toBe("198.51.100.7");
  });

  it("trusts no header at all when the app has no proxy in front (hops = 0)", () => {
    expect(clientKeyFromRequest(req({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" }), 0)).toBeNull();
  });

  it("falls back to x-real-ip, and returns null with nothing to go on", () => {
    expect(clientKeyFromRequest(req({ "x-real-ip": "198.51.100.9" }), 1)).toBe("198.51.100.9");
    expect(clientKeyFromRequest(req({}), 1)).toBeNull();
    expect(clientKeyFromRequest(undefined, 1)).toBeNull();
  });

  it("reads TRUSTED_PROXY_HOPS, defaulting to 1 and ignoring nonsense", () => {
    const original = process.env.TRUSTED_PROXY_HOPS;
    try {
      delete process.env.TRUSTED_PROXY_HOPS;
      expect(trustedProxyHops()).toBe(1);
      process.env.TRUSTED_PROXY_HOPS = "0";
      expect(trustedProxyHops()).toBe(0);
      process.env.TRUSTED_PROXY_HOPS = "2";
      expect(trustedProxyHops()).toBe(2);
      process.env.TRUSTED_PROXY_HOPS = "lots";
      expect(trustedProxyHops()).toBe(1);
    } finally {
      if (original === undefined) delete process.env.TRUSTED_PROXY_HOPS;
      else process.env.TRUSTED_PROXY_HOPS = original;
    }
  });
});
