"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { parseIdArg } from "@/lib/validations/action-args";
import { createWorkoutPlan } from "@/server/services/workout.service";
import { workoutPlanSchema } from "@/lib/validations/workout";
import { AppError } from "@/lib/errors";
import type { WorkoutPlanFormState } from "@/components/workouts/workout-plan-form";

export async function createWorkoutPlanAction(
  memberId: string,
  _prevState: WorkoutPlanFormState,
  formData: FormData,
): Promise<WorkoutPlanFormState> {
  const actor = await requireRole("TRAINER");
  memberId = parseIdArg(memberId);

  const parsed = workoutPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createWorkoutPlan(actor, memberId, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  redirect(`/trainer/workout-plans/${createdId}`);
}
