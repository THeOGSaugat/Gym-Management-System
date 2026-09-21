import { db } from "@/server/db";
import { canManageAssignments, canViewTrainerRoster, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";

async function requireActiveMember(memberId: string) {
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") throw new NotFoundError("Member not found.");
  return member;
}

async function requireActiveTrainer(trainerId: string) {
  const trainer = await db.user.findUnique({ where: { id: trainerId } });
  if (!trainer || trainer.role !== "TRAINER") throw new NotFoundError("Trainer not found.");
  if (trainer.status !== "ACTIVE") {
    throw new ConflictError("This trainer is not active and can't take on new assignments.");
  }
  return trainer;
}

/**
 * Assigns a member to a trainer. This is also how "change trainer"
 * works — there's no separate function for it: if the member already
 * has an active assignment (to this trainer or a different one), that
 * row is closed (status: ENDED, endDate: now) and a new one opened, in
 * one transaction. "Assign" and "change trainer" are the same operation
 * from the data model's point of view; only "remove" (close with no
 * replacement) is genuinely different — see removeAssignment.
 */
export async function assignMemberToTrainer(
  actor: Actor,
  memberId: string,
  trainerId: string,
  notes?: string,
) {
  if (!canManageAssignments(actor)) {
    throw new ForbiddenError("Only admins can assign members to trainers.");
  }

  await requireActiveMember(memberId);
  await requireActiveTrainer(trainerId);

  return db.$transaction(async (tx) => {
    const current = await tx.trainerAssignment.findFirst({
      where: { memberId, status: "ACTIVE" },
    });

    if (current) {
      if (current.trainerId === trainerId) {
        throw new ConflictError("This member is already assigned to this trainer.");
      }
      await tx.trainerAssignment.update({
        where: { id: current.id },
        data: { status: "ENDED", endDate: new Date() },
      });
    }

    return tx.trainerAssignment.create({
      data: {
        memberId,
        trainerId,
        notes,
        assignedByUserId: actor.id,
      },
    });
  });
}

/** Ends a member's current assignment with no replacement — the member becomes unassigned. */
export async function removeAssignment(actor: Actor, memberId: string) {
  if (!canManageAssignments(actor)) {
    throw new ForbiddenError("Only admins can remove a trainer assignment.");
  }

  await requireActiveMember(memberId);

  const current = await db.trainerAssignment.findFirst({
    where: { memberId, status: "ACTIVE" },
  });
  if (!current) {
    throw new ConflictError("This member doesn't have an active trainer assignment.");
  }

  return db.trainerAssignment.update({
    where: { id: current.id },
    data: { status: "ENDED", endDate: new Date() },
  });
}

/** Admin-only: a member's current assignment (if any) and full history, most recent first. */
export async function getAssignmentInfoForMember(actor: Actor, memberId: string) {
  if (!canManageAssignments(actor)) {
    throw new ForbiddenError("Only admins can view assignment details.");
  }

  await requireActiveMember(memberId);

  const history = await db.trainerAssignment.findMany({
    where: { memberId },
    include: { trainer: true },
    orderBy: { startDate: "desc" },
  });

  return {
    current: history.find((a) => a.status === "ACTIVE") ?? null,
    history,
  };
}

/** A trainer's own assigned-members roster (or, for an admin, any trainer's). */
export async function listAssignedMembers(actor: Actor, trainerId: string) {
  if (!canViewTrainerRoster(actor, trainerId)) {
    throw new ForbiddenError("You don't have permission to view this trainer's assigned members.");
  }

  const assignments = await db.trainerAssignment.findMany({
    where: { trainerId, status: "ACTIVE" },
    include: { member: { include: { memberProfile: true } } },
    orderBy: { startDate: "desc" },
  });

  return assignments;
}

/**
 * The one query every "is this trainer allowed to touch this member's
 * data" check ultimately depends on — no authorization decision here,
 * just the underlying fact. Used by trainer-portal.service.ts (Phase 5)
 * and workout.service.ts / progress.service.ts (Phase 6) so this lookup
 * has exactly one implementation instead of being re-written per file.
 */
export async function isMemberAssignedToTrainer(
  memberId: string,
  trainerId: string,
): Promise<boolean> {
  const assignment = await db.trainerAssignment.findFirst({
    where: { memberId, trainerId, status: "ACTIVE" },
  });
  return !!assignment;
}
