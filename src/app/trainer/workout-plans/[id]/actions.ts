"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  updateWorkoutPlan,
  setWorkoutPlanStatus,
  addWorkoutDay,
  removeWorkoutDay,
  addWorkoutExercise,
  removeWorkoutExercise,
} from "@/server/services/workout.service";
import { workoutPlanSchema, workoutDaySchema, workoutExerciseSchema } from "@/lib/validations/workout";
import { AppError } from "@/lib/errors";
import type { WorkoutPlanFormState } from "@/components/workouts/workout-plan-form";
import type { WorkoutDayFormState } from "@/components/workouts/add-workout-day-form";
import type { WorkoutExerciseFormState } from "@/components/workouts/add-workout-exercise-form";
import type { WorkoutPlanStatus } from "@/generated/prisma/client";

export async function updateWorkoutPlanAction(
  planId: string,
  _prevState: WorkoutPlanFormState,
  formData: FormData,
): Promise<WorkoutPlanFormState> {
  const actor = await requireRole("TRAINER");

  const parsed = workoutPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updateWorkoutPlan(actor, planId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/trainer/workout-plans/${planId}`);
  return undefined;
}

export async function setWorkoutPlanStatusAction(planId: string, status: WorkoutPlanStatus) {
  const actor = await requireRole("TRAINER");
  await setWorkoutPlanStatus(actor, planId, status);
  revalidatePath(`/trainer/workout-plans/${planId}`);
}

export async function addWorkoutDayAction(
  planId: string,
  _prevState: WorkoutDayFormState,
  formData: FormData,
): Promise<WorkoutDayFormState> {
  const actor = await requireRole("TRAINER");

  const parsed = workoutDaySchema.safeParse({
    label: formData.get("label"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await addWorkoutDay(actor, planId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/trainer/workout-plans/${planId}`);
  return undefined;
}

export async function removeWorkoutDayAction(planId: string, workoutDayId: string) {
  const actor = await requireRole("TRAINER");
  await removeWorkoutDay(actor, workoutDayId);
  revalidatePath(`/trainer/workout-plans/${planId}`);
}

export async function addWorkoutExerciseAction(
  planId: string,
  workoutDayId: string,
  _prevState: WorkoutExerciseFormState,
  formData: FormData,
): Promise<WorkoutExerciseFormState> {
  const actor = await requireRole("TRAINER");

  const parsed = workoutExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weightKg: formData.get("weightKg"),
    restSeconds: formData.get("restSeconds"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await addWorkoutExercise(actor, workoutDayId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/trainer/workout-plans/${planId}`);
  return undefined;
}

export async function removeWorkoutExerciseAction(planId: string, workoutExerciseId: string) {
  const actor = await requireRole("TRAINER");
  await removeWorkoutExercise(actor, workoutExerciseId);
  revalidatePath(`/trainer/workout-plans/${planId}`);
}
