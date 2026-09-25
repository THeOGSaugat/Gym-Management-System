"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { parseIdArg } from "@/lib/validations/action-args";
import { assignMemberToTrainer, removeAssignment } from "@/server/services/assignment.service";
import { assignTrainerSchema } from "@/lib/validations/assignment";
import { AppError } from "@/lib/errors";

export type AssignTrainerState = { error: string } | undefined;

export async function assignTrainerAction(
  memberId: string,
  _prevState: AssignTrainerState,
  formData: FormData,
): Promise<AssignTrainerState> {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);

  const parsed = assignTrainerSchema.safeParse({ trainerId: formData.get("trainerId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a trainer." };
  }

  try {
    await assignMemberToTrainer(actor, memberId, parsed.data.trainerId);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/members/${memberId}`);
  return undefined;
}

export async function removeAssignmentAction(memberId: string) {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);
  await removeAssignment(actor, memberId);
  revalidatePath(`/admin/members/${memberId}`);
}
