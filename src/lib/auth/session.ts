import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Returns the current session user, or null if not signed in.
 * Use this where "logged in or not" is a soft check (e.g. showing a
 * different header) rather than a hard access-control boundary.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Layer 2 authorization: the real access-control boundary, enforced
 * server-side on every request. Middleware (Layer 1) also checks this,
 * but middleware is a fast path that can be misconfigured or skipped by a
 * matcher change — this cannot be, since every area's layout.tsx calls it
 * directly and Next.js runs layouts on the server for every request.
 *
 * Redirects to /login if not authenticated at all.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Same as requireUser(), but also enforces that the user has one of the
 * given role(s). Redirects to /forbidden otherwise.
 *
 * This is deliberately simple for Phase 1 (role-based area access only).
 * Once real resources exist (a specific member, a specific workout plan),
 * Phase 2 adds resource-level ownership checks — e.g. "is this member
 * assigned to this trainer" — which don't fit this role-only shape and
 * will live in their own policy functions next to the relevant service.
 */
export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}
