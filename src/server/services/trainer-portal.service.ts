import { db } from "@/server/db";
import { canTrainerAccessMember, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { computeEffectiveStatus, isMembershipCurrentlyActive } from "@/lib/membership";
import { isMemberAssignedToTrainer } from "@/server/services/assignment.service";

/**
 * The trainer-facing read surface for an *assigned* member: reduced
 * profile, attendance, and membership status — deliberately a new,
 * separate service rather than changes to member.service.ts /
 * attendance.service.ts / membership.service.ts, which stay exactly as
 * Phases 2–4 built them. Every function here re-derives its own
 * authorization (is this actor an admin, or a trainer with an ACTIVE
 * assignment to this specific member) rather than calling into those
 * other services' admin/self-only checks, which would simply reject a
 * trainer actor.
 *
 * Notably absent: anything about payments. Phase 5's requirements are
 * explicit that a trainer must not manage payments, and this codebase
 * treats a member's financial history as private to that member and
 * admins only (see canViewFinancialRecordsFor's comment) — there is no
 * function here, or anywhere, that lets a TRAINER actor read a
 * Payment row for any member, assigned or not.
 */

async function requireAccess(actor: Actor, memberId: string) {
  if (actor.role === "ADMIN") return;

  const isAssigned =
    actor.role === "TRAINER" ? await isMemberAssignedToTrainer(memberId, actor.id) : false;

  if (!canTrainerAccessMember(actor, isAssigned)) {
    throw new ForbiddenError("You can only view members currently assigned to you.");
  }
}

/**
 * A reduced view of an assigned member's profile: name, contact info,
 * membership number and join date. Deliberately excludes date of birth,
 * address and emergency contact — sensitive personal fields with no
 * clear coaching purpose, kept to admin-and-the-member-themself (see
 * member.service.ts), not extended to trainers even for their own
 * assigned members.
 */
export async function getAssignedMember(actor: Actor, memberId: string) {
  await requireAccess(actor, memberId);

  const member = await db.user.findUnique({
    where: { id: memberId },
    include: { memberProfile: true },
  });

  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }

  return {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    status: member.status,
    memberNumber: member.memberProfile?.memberNumber ?? null,
    joinDate: member.memberProfile?.joinDate ?? member.createdAt,
  };
}

export async function getAssignedMemberAttendance(actor: Actor, memberId: string) {
  await requireAccess(actor, memberId);

  return db.attendance.findMany({
    where: { memberId },
    orderBy: { checkInAt: "desc" },
    take: 50,
  });
}

export type AssignedMemberMembershipStatus = {
  isCurrentlyActive: boolean;
  current: {
    planName: string;
    startDate: Date;
    endDate: Date;
    status: ReturnType<typeof computeEffectiveStatus>;
  } | null;
};

/**
 * Status only — plan name and dates, never price or payment history.
 * Reuses the same pure computeEffectiveStatus/isMembershipCurrentlyActive
 * helpers membership.service.ts uses, so "what counts as active" can
 * never quietly drift between the admin view and this one.
 */
export async function getAssignedMemberMembershipStatus(
  actor: Actor,
  memberId: string,
): Promise<AssignedMemberMembershipStatus> {
  await requireAccess(actor, memberId);

  const memberships = await db.membership.findMany({
    where: { memberId },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();
  const active = memberships.find((m) => isMembershipCurrentlyActive(m, now));
  const mostRecent = active ?? memberships[0];

  if (!mostRecent) {
    return { isCurrentlyActive: false, current: null };
  }

  return {
    isCurrentlyActive: !!active,
    current: {
      planName: mostRecent.planNameSnapshot,
      startDate: mostRecent.startDate,
      endDate: mostRecent.endDate,
      status: computeEffectiveStatus(mostRecent, now),
    },
  };
}
