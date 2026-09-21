"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createExercise } from "@/server/services/exercise.service";
import { exerciseSchema } from "@/lib/validations/exercise";
import { AppError } from "@/lib/errors";
import type { ExerciseFormState } from "@/components/exercises/exercise-form";

export async function createExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const actor = await requireRole("TRAINER");

  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    muscleGroup: formData.get("muscleGroup"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await createExercise(actor, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  redirect("/trainer/exercises/new?added=1");
}
