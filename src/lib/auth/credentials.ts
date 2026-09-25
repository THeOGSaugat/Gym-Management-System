import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/generated/prisma/client";

/** Per account: slows guessing one person's password. */
export const LOGIN_ATTEMPTS_PER_EMAIL = 5;
/** Per client: slows trying one common password against many accounts. */
export const LOGIN_ATTEMPTS_PER_CLIENT = 30;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

// A real bcrypt hash of a throwaway value, computed once. When there's no
// usable account we still run one bcrypt comparison against it, so "no
// such email" / "suspended" take as long as "wrong password" and response
// timing doesn't reveal which emails have accounts.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashPassword("infinity-fitness-timing-equalizer");
  return dummyHash;
}

/**
 * The whole credentials check behind Auth.js's `authorize()`. Lives here
 * rather than inline in auth.ts so it can be unit-tested without Auth.js.
 *
 * Returns the user to sign in, or null. Every failure — malformed input,
 * rate limited, unknown email, inactive account, wrong password — returns
 * the same null, so a caller can never tell them apart.
 *
 * Rate limiting is enforced here, not in the login form's action, because
 * Auth.js's /api/auth/callback/credentials route is reachable directly.
 */
export async function verifyCredentials(
  rawCredentials: unknown,
  clientKey?: string | null,
): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(rawCredentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  if (clientKey) {
    const perClient = await checkRateLimit(
      `login-client:${clientKey}`,
      LOGIN_ATTEMPTS_PER_CLIENT,
      LOGIN_WINDOW_MS,
    );
    if (!perClient.allowed) return null;
  }
  const perEmail = await checkRateLimit(`login:${email}`, LOGIN_ATTEMPTS_PER_EMAIL, LOGIN_WINDOW_MS);
  if (!perEmail.allowed) return null;

  const user = await db.user.findUnique({
    where: { email },
    // The one place in the app that reads a password hash — see db.ts,
    // which leaves it out of every other User query by default.
    select: { id: true, email: true, fullName: true, role: true, status: true, passwordHash: true },
  });

  if (!user || user.status !== "ACTIVE") {
    await verifyPassword(password, await getDummyHash());
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return null;

  return { id: user.id, email: user.email, name: user.fullName, role: user.role };
}

/**
 * How many reverse proxies you control sit in front of the app (default 1:
 * Vercel, or one nginx / load balancer). Each proxy *appends* the address
 * it received the request from to `x-forwarded-for`, so the last N entries
 * were written by infrastructure you trust, and the entry the outermost
 * trusted proxy recorded — `parts[length - N]` — is the real client.
 * Anything to the left of it was supplied by the client and is ignored,
 * so prepending fake addresses can't dodge the per-client limit.
 *
 * Set TRUSTED_PROXY_HOPS=0 when the app is exposed directly with no proxy:
 * then every forwarding header is client-controlled, so none is trusted
 * and only the per-email limit applies.
 */
export function trustedProxyHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw.trim() === "") return 1;
  const hops = Number(raw);
  return Number.isInteger(hops) && hops >= 0 && hops <= 10 ? hops : 1;
}

export function clientKeyFromRequest(
  request: Request | undefined,
  hops: number = trustedProxyHops(),
): string | null {
  if (!request || hops === 0) return null;

  const parts = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const fromForwardedFor = parts.length >= hops ? parts[parts.length - hops] : undefined;
  if (fromForwardedFor) return fromForwardedFor.slice(0, 64);

  // nginx-style single-value header, set by the proxy itself.
  return request.headers.get("x-real-ip")?.trim().slice(0, 64) || null;
}
