import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/server/db";
import type { Role } from "@/generated/prisma/client";

export type CurrentUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

/**
 * Returns the current signed-in user, or null — confirmed against the
 * database, not just the session token.
 *
 * Sessions are stateless JWTs (8h, see config.ts). On its own, a JWT
 * keeps working until it expires even after an admin suspends that
 * account, and it would keep carrying the role it was issued with. So
 * this looks the account up on every request and treats the session as
 * signed out when the account is gone, no longer ACTIVE, or no longer has
 * the role the token claims. Deactivating someone therefore takes effect
 * on their very next request, not up to eight hours later.
 *
 * `cache()` makes this one query per request, however many layouts,
 * pages and actions call it. Every authorization path — requireUser(),
 * requireRole(), and each Server Action's actor — runs through here,
 * which is what makes it the right place for the check.
 *
 * Use this directly where "logged in or not" is a soft check (e.g. the
 * public navbar); use requireRole() for access control.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const account = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, status: true, fullName: true, email: true },
  });

  if (!account || account.status !== "ACTIVE" || account.role !== sessionUser.role) {
    return null;
  }

  // Name/email come from the database too, so a rename shows up at once
  // instead of waiting for a fresh sign-in.
  return { id: account.id, role: account.role, name: account.fullName, email: account.email };
});

/**
 * Layer 2 authorization: the real access-control boundary, enforced
 * server-side on every request. Middleware (Layer 1) also checks the
 * role, but middleware is a fast path that can be misconfigured or
 * skipped by a matcher change — this cannot be, since every area's
 * layout.tsx and every Server Action calls it directly.
 *
 * Redirects to /login if not authenticated (or the account has been
 * deactivated since signing in).
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Same as requireUser(), but also enforces that the user has one of the
 * given role(s). Redirects to /forbidden otherwise.
 *
 * Role gating only answers "may this kind of user be here at all".
 * Ownership — "is this *their* membership", "is this member assigned to
 * this trainer" — is enforced in the service layer via lib/auth/policies.
 */
export async function requireRole(role: Role | Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}
