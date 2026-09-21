import { db } from "@/server/db";
import { canRecordProgressFor, canViewProgressFor, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isMemberAssignedToTrainer } from "@/server/services/assignment.service";
import type { ProgressLogInput } from "@/lib/validations/progress";

/**
 * Records a new progress entry. Member-self-only, like checkIn() in
 * attendance.service.ts — no target-member parameter beyond actor.id
 * would even make sense here, since there's no trainer/admin-assisted
 * recording (see canRecordProgressFor's comment). `recordedAt` defaults
 * to the server's own clock if omitted, same convention as every other
 * timestamped record in this codebase.
 */
export async function recordProgress(actor: Actor, input: ProgressLogInput) {
  if (!canRecordProgressFor(actor, actor.id)) {
    throw new ForbiddenError("Only a member can record their own progress.");
  }

  return db.progressLog.create({
    data: {
      memberId: actor.id,
      metric: input.metric,
      customLabel: input.metric === "CUSTOM" ? input.customLabel : undefined,
      value: input.value,
      notes: input.notes,
      recordedAt: input.recordedAt ?? new Date(),
      recordedByUserId: actor.id,
    },
  });
}

export async function listProgressForMember(actor: Actor, memberId: string) {
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }

  const isAssigned =
    actor.role === "TRAINER" ? await isMemberAssignedToTrainer(memberId, actor.id) : false;

  if (!canViewProgressFor(actor, memberId, isAssigned)) {
    throw new ForbiddenError("You don't have permission to view this member's progress.");
  }

  return db.progressLog.findMany({
    where: { memberId },
    orderBy: { recordedAt: "desc" },
  });
}
