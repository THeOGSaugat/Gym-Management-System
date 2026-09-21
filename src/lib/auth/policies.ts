import type { Role } from "@/generated/prisma/client";

/**
 * Central authorization rules, as plain functions with no framework
 * dependencies (no Prisma, no Next.js) — that's what keeps them unit
 * testable without a database or a request context. The service layer
 * calls these and throws ForbiddenError when they return false; pages
 * call requireRole() for navigation-level gating. Both matter: hiding a
 * button is not access control, and neither is a role check alone once
 * a resource has an *owner* rather than just a role.
 */

export type Actor = {
  id: string;
  role: Role;
};

/**
 * Only admins manage the member roster (list, create, edit others,
 * activate/deactivate). Trainers do not get this automatically — trainer
 * ↔ member assignment is a separate, later feature, and even once it
 * exists, "assigned to me" is a narrower permission than "can manage
 * members" and will get its own policy function.
 */
export function canManageMembers(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/**
 * Admins can view any member. A member can view their own profile only —
 * never another member's, regardless of role check passing.
 */
export function canViewMember(actor: Actor, targetUserId: string): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "MEMBER" && actor.id === targetUserId;
}

/**
 * Same shape as canViewMember today. Kept as a separate function because
 * "who can see it" and "who can change it" commonly diverge as an app
 * grows (e.g. a trainer might later be able to view but not edit) — this
 * makes that a one-line change instead of a new call site everywhere.
 */
export function canEditMemberProfile(actor: Actor, targetUserId: string): boolean {
  return canViewMember(actor, targetUserId);
}
