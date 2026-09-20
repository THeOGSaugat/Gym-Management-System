import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { authConfig } from "./config";
import { verifyPassword } from "./password";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Full Auth.js instance. Node-only — imports Prisma (via `db`) and
 * bcrypt (via `verifyPassword`), so this must never be imported from
 * `middleware.ts` / `proxy.ts`. Route handlers, server components, and
 * server actions import from here.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Enforced here, not just in the login form's server action:
        // Auth.js's /api/auth/callback/credentials route is reachable
        // directly, bypassing any UI-layer check. This is the one place
        // every credentials sign-in attempt actually passes through.
        const rateLimit = checkRateLimit(`login:${email}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS);
        if (!rateLimit.allowed) return null;

        const user = await db.user.findUnique({ where: { email } });

        // Same generic failure for "no such user", "wrong password", and
        // "rate limited" — never let a caller distinguish between them
        // (user enumeration, and revealing that rate limiting exists).
        if (!user || user.status !== "ACTIVE") return null;

        const passwordMatches = await verifyPassword(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
});
