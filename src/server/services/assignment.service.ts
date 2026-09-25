import { db } from "@/server/db";
import { canManageAssignments, canViewTrainerRoster, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { createNotification } from "@/server/services/notification.service";
import { recordAudit, withAudit } from "@/server/services/audit.service";

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

  const member = await requireActiveMember(memberId);
  const trainer = await requireActiveTrainer(trainerId);

  const assignment = await db.$transaction(async (tx) => {
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

    const created = await tx.trainerAssignment.create({
      data: {
        memberId,
        trainerId,
        notes,
        assignedByUserId: actor.id,
      },
    });

    await recordAudit(tx, actor, {
      action: "TRAINER_ASSIGNED",
      entityType: "TrainerAssignment",
      entityId: created.id,
      subjectUserId: memberId,
      summary: current
        ? `Reassigned ${member.fullName} to ${trainer.fullName}`
        : `Assigned ${member.fullName} to ${trainer.fullName}`,
      metadata: { trainerId, previousTrainerId: current?.trainerId ?? null },
    });

    return created;
  });

  // Two notifications, one per side of the relationship — each recipient
  // gets exactly one, told the one thing relevant to them. Not gated by
  // createNotificationOnce: a new assignment row is already a genuinely
  // new event (a repeat assignment to the same trainer is rejected above
  // as a conflict before this point is ever reached), so there's no
  // duplicate to guard against.
  await Promise.all([
    createNotification({
      recipientUserId: memberId,
      type: "TRAINER_ASSIGNED",
      title: "Trainer assigned",
      message: `You've been assigned a new trainer: ${trainer.fullName}.`,
      relatedEntityId: assignment.id,
    }),
    createNotification({
      recipientUserId: trainerId,
      type: "TRAINER_ASSIGNED",
      title: "New member assigned",
      message: `You've been assigned a new member: ${member.fullName}.`,
      linkUrl: `/trainer/members/${memberId}`,
      relatedEntityId: assignment.id,
    }),
  ]);

  return assignment;
}

/** Ends a member's current assignment with no replacement — the member becomes unassigned. */
export async function removeAssignment(actor: Actor, memberId: string) {
  if (!canManageAssignments(actor)) {
    throw new ForbiddenError("Only admins can remove a trainer assignment.");
  }

  const member = await requireActiveMember(memberId);

  const current = await db.trainerAssignment.findFirst({
    where: { memberId, status: "ACTIVE" },
  });
  if (!current) {
    throw new ConflictError("This member doesn't have an active trainer assignment.");
  }

  return withAudit(
    actor,
    (tx) =>
      tx.trainerAssignment.update({
        where: { id: current.id },
        data: { status: "ENDED", endDate: new Date() },
      }),
    (ended) => ({
      action: "TRAINER_ASSIGNMENT_REMOVED",
      entityType: "TrainerAssignment",
      entityId: ended.id,
      subjectUserId: memberId,
      summary: `Removed ${member.fullName}'s trainer assignment`,
      metadata: { trainerId: ended.trainerId },
    }),
  );
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
