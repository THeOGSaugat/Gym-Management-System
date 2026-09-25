import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Edge-safe Auth.js config: callbacks and session settings only, no
 * providers. The Credentials provider's `authorize()` touches Prisma and
 * bcrypt, neither of which can run on the Edge runtime that middleware
 * uses — so it lives in `auth.ts` instead, which extends this config.
 *
 * This file is imported by both `middleware.ts` (edge) and `auth.ts`
 * (Node), which is the split Auth.js itself recommends for
 * database-backed credentials + middleware. See:
 * https://authjs.dev/guides/edge-compatibility
 */

// Path prefix → role required to access it. Checked in `authorized` below,
// which runs on every request middleware matches (Layer 1: fast,
// no DB hit). The real enforcement — Layer 2 — happens server-side in each
// area's layout.tsx via requireRole(), which cannot be bypassed by a
// missed middleware matcher or a client-side navigation.
const AREA_ROLE: Record<string, Role> = {
  "/admin": "ADMIN",
  "/trainer": "TRAINER",
  "/member": "MEMBER",
};

/** The role an area requires, or undefined for public paths (landing page, /login, ...). */
export function requiredRoleForPath(path: string): Role | undefined {
  const matchedPrefix = Object.keys(AREA_ROLE).find(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return matchedPrefix ? AREA_ROLE[matchedPrefix] : undefined;
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // 8 hours: long enough for a work shift / gym visit, short enough that
    // a stale session doesn't linger for weeks. Rolls forward on activity
    // (updateAge) so an active user isn't logged out mid-session.
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const requiredRole = requiredRoleForPath(request.nextUrl.pathname);

      // Not a role-restricted area (landing page, /login, /api/health, ...).
      if (!requiredRole) return true;

      const user = auth?.user;
      // Not signed in: Auth.js redirects to `pages.signIn` automatically.
      if (!user) return false;

      // Signed in but wrong role for this area.
      if (user.role !== requiredRole) {
        return Response.redirect(new URL("/forbidden", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      // `user` is only present right after a successful sign-in.
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
