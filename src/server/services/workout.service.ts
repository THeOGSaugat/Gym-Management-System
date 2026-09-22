import { db } from "@/server/db";
import {
  canManageWorkoutPlanFor,
  canViewWorkoutPlanFor,
  type Actor,
} from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isMemberAssignedToTrainer } from "@/server/services/assignment.service";
import { createNotification } from "@/server/services/notification.service";
import type {
  WorkoutPlanInput,
  WorkoutDayInput,
  WorkoutExerciseInput,
} from "@/lib/validations/workout";
import type { WorkoutPlanStatus } from "@/generated/prisma/client";

const planInclude = {
  days: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      exercises: {
        orderBy: { orderIndex: "asc" as const },
        include: { exercise: true },
      },
    },
  },
};

async function isAssignedTrainerFor(actor: Actor, memberId: string): Promise<boolean> {
  return actor.role === "TRAINER" ? isMemberAssignedToTrainer(memberId, actor.id) : false;
}

async function requireViewAccess(actor: Actor, plan: { memberId: string }) {
  const isAssigned = await isAssignedTrainerFor(actor, plan.memberId);
  if (!canViewWorkoutPlanFor(actor, plan.memberId, isAssigned)) {
    throw new ForbiddenError("You don't have permission to view this workout plan.");
  }
}

async function requireManageAccess(actor: Actor, plan: { memberId: string }) {
  const isAssigned = await isAssignedTrainerFor(actor, plan.memberId);
  if (!canManageWorkoutPlanFor(actor, isAssigned)) {
    throw new ForbiddenError("You don't have permission to manage this workout plan.");
  }
}

async function getPlanOrThrow(planId: string) {
  const plan = await db.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Workout plan not found.");
  return plan;
}

async function getDayWithPlanOrThrow(workoutDayId: string) {
  const day = await db.workoutDay.findUnique({
    where: { id: workoutDayId },
    include: { plan: true },
  });
  if (!day) throw new NotFoundError("Workout day not found.");
  return day;
}

async function getWorkoutExerciseWithPlanOrThrow(workoutExerciseId: string) {
  const workoutExercise = await db.workoutExercise.findUnique({
    where: { id: workoutExerciseId },
    include: { workoutDay: { include: { plan: true } } },
  });
  if (!workoutExercise) throw new NotFoundError("Exercise entry not found.");
  return workoutExercise;
}

/**
 * Creates a workout plan for a member. Trainer-only, and always for the
 * *acting* trainer — there's no way to create a plan "as" a different
 * trainer, admin included, since a plan's trainerId must genuinely be a
 * TRAINER and an admin has no trainer identity of their own. Admin's
 * role here is oversight of existing plans (view, update, cancel — see
 * canManageWorkoutPlanFor), not authoring new ones; nothing in the
 * requirements asked for an admin-creates-a-plan-and-picks-a-trainer
 * flow, and building one would need UI this phase doesn't otherwise need.
 */
export async function createWorkoutPlan(actor: Actor, memberId: string, input: WorkoutPlanInput) {
  if (actor.role !== "TRAINER") {
    throw new ForbiddenError("Only a member's assigned trainer can create a workout plan.");
  }

  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }

  const isAssigned = await isMemberAssignedToTrainer(memberId, actor.id);
  if (!isAssigned) {
    throw new ForbiddenError("You can only create workout plans for members assigned to you.");
  }

  const plan = await db.workoutPlan.create({
    data: {
      memberId,
      trainerId: actor.id,
      name: input.name,
      description: input.description,
      startDate: input.startDate ?? new Date(),
      endDate: input.endDate,
    },
  });

  await createNotification({
    recipientUserId: memberId,
    type: "WORKOUT_PLAN_ASSIGNED",
    title: "New workout plan assigned",
    message: `Your trainer assigned you a new workout plan: "${plan.name}".`,
    linkUrl: `/member/workout-plans/${plan.id}`,
    relatedEntityId: plan.id,
  });

  return plan;
}

export async function getWorkoutPlan(actor: Actor, id: string) {
  const plan = await db.workoutPlan.findUnique({ where: { id }, include: planInclude });
  if (!plan) throw new NotFoundError("Workout plan not found.");
  await requireViewAccess(actor, plan);
  return plan;
}

export async function updateWorkoutPlan(actor: Actor, id: string, input: WorkoutPlanInput) {
  const plan = await getPlanOrThrow(id);
  await requireManageAccess(actor, plan);

  return db.workoutPlan.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      startDate: input.startDate ?? plan.startDate,
      endDate: input.endDate,
    },
  });
}

export async function setWorkoutPlanStatus(actor: Actor, id: string, status: WorkoutPlanStatus) {
  const plan = await getPlanOrThrow(id);
  await requireManageAccess(actor, plan);

  return db.workoutPlan.update({ where: { id }, data: { status } });
}

export async function listWorkoutPlansForMember(actor: Actor, memberId: string) {
  const isAssigned = await isAssignedTrainerFor(actor, memberId);
  if (!canViewWorkoutPlanFor(actor, memberId, isAssigned)) {
    throw new ForbiddenError("You don't have permission to view this member's workout plans.");
  }

  return db.workoutPlan.findMany({
    where: { memberId },
    orderBy: { startDate: "desc" },
  });
}

export async function addWorkoutDay(actor: Actor, planId: string, input: WorkoutDayInput) {
  const plan = await getPlanOrThrow(planId);
  await requireManageAccess(actor, plan);

  const lastDay = await db.workoutDay.findFirst({
    where: { planId },
    orderBy: { orderIndex: "desc" },
  });

  return db.workoutDay.create({
    data: {
      planId,
      label: input.label,
      notes: input.notes,
      orderIndex: (lastDay?.orderIndex ?? -1) + 1,
    },
  });
}

export async function updateWorkoutDay(actor: Actor, workoutDayId: string, input: WorkoutDayInput) {
  const day = await getDayWithPlanOrThrow(workoutDayId);
  await requireManageAccess(actor, day.plan);

  return db.workoutDay.update({
    where: { id: workoutDayId },
    data: { label: input.label, notes: input.notes },
  });
}

export async function removeWorkoutDay(actor: Actor, workoutDayId: string) {
  const day = await getDayWithPlanOrThrow(workoutDayId);
  await requireManageAccess(actor, day.plan);

  // Cascades to its WorkoutExercise rows at the database level (schema's
  // onDelete: Cascade on WorkoutExercise.workoutDayId).
  await db.workoutDay.delete({ where: { id: workoutDayId } });
}

export async function addWorkoutExercise(
  actor: Actor,
  workoutDayId: string,
  input: WorkoutExerciseInput,
) {
  const day = await getDayWithPlanOrThrow(workoutDayId);
  await requireManageAccess(actor, day.plan);

  const exercise = await db.exercise.findUnique({ where: { id: input.exerciseId } });
  if (!exercise) throw new NotFoundError("Exercise not found.");

  const lastExercise = await db.workoutExercise.findFirst({
    where: { workoutDayId },
    orderBy: { orderIndex: "desc" },
  });

  return db.workoutExercise.create({
    data: {
      workoutDayId,
      exerciseId: input.exerciseId,
      sets: input.sets,
      reps: input.reps,
      weightKg: input.weightKg,
      restSeconds: input.restSeconds,
      notes: input.notes,
      orderIndex: (lastExercise?.orderIndex ?? -1) + 1,
    },
    include: { exercise: true },
  });
}

export async function updateWorkoutExercise(
  actor: Actor,
  workoutExerciseId: string,
  input: WorkoutExerciseInput,
) {
  const workoutExercise = await getWorkoutExerciseWithPlanOrThrow(workoutExerciseId);
  await requireManageAccess(actor, workoutExercise.workoutDay.plan);

  if (input.exerciseId !== workoutExercise.exerciseId) {
    const exercise = await db.exercise.findUnique({ where: { id: input.exerciseId } });
    if (!exercise) throw new NotFoundError("Exercise not found.");
  }

  return db.workoutExercise.update({
    where: { id: workoutExerciseId },
    data: {
      exerciseId: input.exerciseId,
      sets: input.sets,
      reps: input.reps,
      weightKg: input.weightKg,
      restSeconds: input.restSeconds,
      notes: input.notes,
    },
    include: { exercise: true },
  });
}

export async function removeWorkoutExercise(actor: Actor, workoutExerciseId: string) {
  const workoutExercise = await getWorkoutExerciseWithPlanOrThrow(workoutExerciseId);
  await requireManageAccess(actor, workoutExercise.workoutDay.plan);

  await db.workoutExercise.delete({ where: { id: workoutExerciseId } });
}
