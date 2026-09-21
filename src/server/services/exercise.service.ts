import { db } from "@/server/db";
import {
  canCreateExercise,
  canEditExercise,
  canViewExerciseLibrary,
  type Actor,
} from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ExerciseInput } from "@/lib/validations/exercise";

export type ListExercisesParams = {
  search?: string;
  includeInactive?: boolean;
};

export async function listExercises(actor: Actor, params: ListExercisesParams = {}) {
  if (!canViewExerciseLibrary(actor)) {
    throw new ForbiddenError("Only admins and trainers can browse the exercise library.");
  }

  const search = params.search?.trim();

  return db.exercise.findMany({
    where: {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getExercise(actor: Actor, id: string) {
  if (!canViewExerciseLibrary(actor)) {
    throw new ForbiddenError("Only admins and trainers can view exercises.");
  }

  const exercise = await db.exercise.findUnique({ where: { id } });
  if (!exercise) throw new NotFoundError("Exercise not found.");
  return exercise;
}

export async function createExercise(actor: Actor, input: ExerciseInput) {
  if (!canCreateExercise(actor)) {
    throw new ForbiddenError("Only admins and trainers can add exercises.");
  }

  return db.exercise.create({
    data: {
      name: input.name,
      muscleGroup: input.muscleGroup,
      description: input.description,
      instructions: input.instructions,
      createdByUserId: actor.id,
    },
  });
}

export async function updateExercise(actor: Actor, id: string, input: ExerciseInput) {
  const existing = await db.exercise.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Exercise not found.");

  if (!canEditExercise(actor, existing.createdByUserId)) {
    throw new ForbiddenError("You can only edit exercises you created.");
  }

  return db.exercise.update({
    where: { id },
    data: {
      name: input.name,
      muscleGroup: input.muscleGroup,
      description: input.description,
      instructions: input.instructions,
    },
  });
}

export async function setExerciseActive(actor: Actor, id: string, isActive: boolean) {
  const existing = await db.exercise.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Exercise not found.");

  if (!canEditExercise(actor, existing.createdByUserId)) {
    throw new ForbiddenError("You can only deactivate exercises you created.");
  }

  return db.exercise.update({ where: { id }, data: { isActive } });
}
