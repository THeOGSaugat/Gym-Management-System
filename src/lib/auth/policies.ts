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

/**
 * Only admins manage the plan catalog, create/renew/cancel memberships,
 * and record payments. There is no financial-editing role short of
 * ADMIN — a trainer does not get this, and a member's own "financial
 * record" access is strictly read-only (see canViewFinancialRecordsFor).
 */
export function canManageFinancialRecords(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/**
 * Who can *view* a given member's memberships/payments: an admin (any
 * member), or that member viewing their own. Deliberately the same shape
 * as canViewMember — a member's financial history is exactly as private
 * as their profile, never visible to another member.
 *
 * Never relaxed for a trainer, even an assigned one, and never will be —
 * this governs *payments*, which Phase 5's requirements explicitly keep
 * out of a trainer's reach ("TRAINER must NOT: Manage payments"). A
 * trainer's narrow, read-only visibility into an assigned member's
 * *membership status* (not payments) is a deliberately separate check —
 * see src/server/services/trainer-portal.service.ts — rather than a
 * change to this function, precisely so relaxing one can never
 * accidentally relax the other.
 */
export function canViewFinancialRecordsFor(actor: Actor, targetUserId: string): boolean {
  return canViewMember(actor, targetUserId);
}

/**
 * Who can check a given member in/out: only that member, themselves.
 * Phase 4's requirements are explicit that admin's attendance role is
 * view-only — there is no front-desk/admin-assisted check-in feature
 * yet. Kept as its own function (rather than reusing canViewMember's
 * shape) because relaxing *this* rule later — e.g. to let an admin check
 * a member in at the front desk — should never accidentally also change
 * who can *view* attendance, which is a separate, broader permission.
 */
export function canRecordAttendanceFor(actor: Actor, targetUserId: string): boolean {
  return actor.role === "MEMBER" && actor.id === targetUserId;
}

/**
 * Who can view a given member's attendance *through attendance.service.ts*
 * (the admin/self-only surface built in Phase 4): an admin (any member),
 * or that member viewing their own — never another member. This function
 * is left exactly as Phase 4 built it. A trainer's read-only visibility
 * into an *assigned* member's attendance is a separate, additive check
 * in src/server/services/trainer-portal.service.ts, not a relaxation of
 * this one — Phase 4's attendance module is untouched by Phase 5.
 */
export function canViewAttendanceFor(actor: Actor, targetUserId: string): boolean {
  return canViewMember(actor, targetUserId);
}

/** Only admins see the gym-wide attendance views (today's list, full history). */
export function canViewAllAttendance(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/**
 * Only admins manage the trainer roster (list, create, edit, activate/
 * deactivate) and assign/reassign/remove trainer <-> member
 * relationships. Mirrors canManageMembers exactly.
 */
export function canManageTrainers(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/** Same permission as canManageTrainers today; kept separate in case
 * assignment management and trainer-roster management ever diverge
 * (e.g. a senior trainer allowed to reassign within their own team but
 * not create new trainer accounts). */
export function canManageAssignments(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/**
 * Who can view a trainer's own assigned-members roster: an admin (any
 * trainer's roster), or that trainer viewing their own — never another
 * trainer's. Same shape as canViewMember, applied to a trainer's client
 * list instead of a member's profile.
 */
export function canViewTrainerRoster(actor: Actor, targetTrainerId: string): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "TRAINER" && actor.id === targetTrainerId;
}

/**
 * Whether a trainer may access one specific assigned member's (reduced)
 * profile, attendance, and membership status — the trainer-portal
 * surface in trainer-portal.service.ts, not member.service.ts /
 * attendance.service.ts / membership.service.ts, which are untouched.
 *
 * This is the one policy function in this file that isn't self-contained
 * pure logic on IDs alone — "is this member currently assigned to this
 * trainer" requires a database lookup, which would break every other
 * function here being a framework-free pure function. So the *lookup*
 * lives in the service layer (trainer-portal.service.ts fetches the
 * assignment), and only the already-known *answer* is passed in here as
 * `isAssigned`. An admin bypasses the assignment check entirely, same as
 * every other canView*For function in this file.
 */
export function canTrainerAccessMember(actor: Actor, isAssigned: boolean): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "TRAINER" && isAssigned;
}

/**
 * Only admins manage the *whole* exercise catalog (edit/deactivate any
 * entry, regardless of who created it). See canCreateExercise and
 * canEditExercise for the narrower trainer permissions.
 */
export function canManageExerciseLibrary(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/**
 * Both admins and trainers can add a new exercise to the shared catalog
 * — the library needs to grow as trainers build programs, so this isn't
 * gated behind admin-only the way canManageExerciseLibrary is.
 */
export function canCreateExercise(actor: Actor): boolean {
  return actor.role === "ADMIN" || actor.role === "TRAINER";
}

/**
 * Editing or deactivating an *existing* entry: an admin (any entry), or
 * the trainer who created it (their own entries only) — never another
 * trainer's. This is what keeps a shared, ever-growing catalog from
 * becoming an ungoverned free-for-all: anyone can add to it, but only
 * its creator (or an admin) can change it afterward.
 */
export function canEditExercise(actor: Actor, createdByUserId: string): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "TRAINER" && actor.id === createdByUserId;
}

/** Both admins and trainers can browse the catalog — they're the only roles that build workout plans. */
export function canViewExerciseLibrary(actor: Actor): boolean {
  return actor.role === "ADMIN" || actor.role === "TRAINER";
}

/**
 * Who can create/edit a workout plan, add or remove its days/exercises,
 * or change its status: an admin, or the *assigned* trainer for that
 * specific member — never an unassigned trainer, and never the member
 * themself (a member views their own plan; only their trainer or an
 * admin builds it). Same "pass in the already-known assignment fact"
 * shape as canTrainerAccessMember, for the same reason: the assignment
 * lookup belongs in the service layer, not here.
 */
export function canManageWorkoutPlanFor(actor: Actor, isAssignedTrainer: boolean): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "TRAINER" && isAssignedTrainer;
}

/**
 * Who can *view* a member's workout plan(s): an admin, that member
 * viewing their own, or their assigned trainer. Broader than
 * canManageWorkoutPlanFor by exactly one case (the member themself),
 * mirroring how canViewFinancialRecordsFor is broader than
 * canManageFinancialRecords.
 */
export function canViewWorkoutPlanFor(
  actor: Actor,
  targetMemberId: string,
  isAssignedTrainer: boolean,
): boolean {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "MEMBER") return actor.id === targetMemberId;
  return actor.role === "TRAINER" && isAssignedTrainer;
}

/**
 * Who can record a new progress log entry for a member: only that
 * member, themselves. Mirrors canRecordAttendanceFor's shape and
 * reasoning exactly — there is no trainer-assisted or admin-assisted
 * recording yet, matching Phase 5's precedent that a trainer's access to
 * an assigned member's data is read-only unless a requirement explicitly
 * says otherwise (this one doesn't).
 */
export function canRecordProgressFor(actor: Actor, targetMemberId: string): boolean {
  return actor.role === "MEMBER" && actor.id === targetMemberId;
}

/**
 * Who can *view* a member's progress history: an admin, that member
 * viewing their own, or their assigned trainer. Same shape as
 * canViewWorkoutPlanFor — progress data sits at the same privacy level
 * as workout plans, not the stricter payments-never-for-trainers level.
 */
export function canViewProgressFor(
  actor: Actor,
  targetMemberId: string,
  isAssignedTrainer: boolean,
): boolean {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "MEMBER") return actor.id === targetMemberId;
  return actor.role === "TRAINER" && isAssignedTrainer;
}
