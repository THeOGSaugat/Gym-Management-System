"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createExercise, updateExercise, setExerciseActive } from "@/server/services/exercise.service";
import { exerciseSchema } from "@/lib/validations/exercise";
import { AppError } from "@/lib/errors";
import type { ExerciseFormState } from "@/components/exercises/exercise-form";

function readExerciseFormFields(formData: FormData) {
  return {
    name: formData.get("name"),
    muscleGroup: formData.get("muscleGroup"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
  };
}

export async function createExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = exerciseSchema.safeParse(readExerciseFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createExercise(actor, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/exercises");
  redirect(`/admin/exercises/${createdId}`);
}

export async function updateExerciseAction(
  exerciseId: string,
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = exerciseSchema.safeParse(readExerciseFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updateExercise(actor, exerciseId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${exerciseId}`);
  redirect(`/admin/exercises/${exerciseId}`);
}

export async function setExerciseActiveAction(exerciseId: string, isActive: boolean) {
  const actor = await requireRole("ADMIN");
  await setExerciseActive(actor, exerciseId, isActive);
  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${exerciseId}`);
}
