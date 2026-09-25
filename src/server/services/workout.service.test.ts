import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  createWorkoutPlan,
  getWorkoutPlan,
  updateWorkoutPlan,
  setWorkoutPlanStatus,
  listWorkoutPlansForMember,
  listWorkoutPlansForTrainer,
  addWorkoutDay,
  updateWorkoutDay,
  removeWorkoutDay,
  addWorkoutExercise,
  updateWorkoutExercise,
  removeWorkoutExercise,
} from "./workout.service";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const otherTrainer: Actor = { id: "trainer-2", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const otherMember: Actor = { id: "member-2", role: "MEMBER" };

const memberUser = {
  id: "member-1",
  email: "m@example.com",
  passwordHash: "x",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function planRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "plan-1",
    name: "Strength Block",
    description: null,
    memberId: "member-1",
    trainerId: "trainer-1",
    startDate: new Date(),
    endDate: null,
    status: "ACTIVE" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function dayRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "day-1",
    planId: "plan-1",
    label: "Monday",
    orderIndex: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function workoutExerciseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "we-1",
    workoutDayId: "day-1",
    exerciseId: "exercise-1",
    orderIndex: 0,
    sets: 3,
    reps: 10,
    weightKg: 60,
    restSeconds: 90,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const validPlanInput = { name: "Strength Block", description: undefined, startDate: undefined, endDate: undefined };
const validDayInput = { label: "Monday", notes: undefined };
const validExerciseInput = {
  exerciseId: "exercise-1",
  sets: 3,
  reps: 10,
  weightKg: 60,
  restSeconds: 90,
  notes: undefined,
};

describe("createWorkoutPlan (trainer creating a workout)", () => {
  it("throws ForbiddenError for an admin — only a trainer creates plans", async () => {
    await expect(createWorkoutPlan(admin, "member-1", validPlanInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ForbiddenError for a member", async () => {
    await expect(createWorkoutPlan(member, "member-1", validPlanInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(createWorkoutPlan(trainer, "nope", validPlanInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws ForbiddenError when the trainer isn't assigned to this member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(
      createWorkoutPlan(trainer, "member-1", validPlanInput),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.workoutPlan.create).not.toHaveBeenCalled();
  });

  it("creates a plan for an assigned trainer, trainerId always the acting trainer", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "assignment-1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutPlan.create.mockResolvedValue(planRow());

    await createWorkoutPlan(trainer, "member-1", validPlanInput);

    expect(prismaMock.workoutPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: "member-1", trainerId: "trainer-1" }),
      }),
    );
  });

  it("creates a WORKOUT_PLAN_ASSIGNED notification for the member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "assignment-1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutPlan.create.mockResolvedValue(planRow());

    await createWorkoutPlan(trainer, "member-1", validPlanInput);

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: "member-1",
          type: "WORKOUT_PLAN_ASSIGNED",
          relatedEntityId: "plan-1",
          linkUrl: "/member/workout-plans/plan-1",
        }),
      }),
    );
  });
});

describe("listWorkoutPlansForTrainer", () => {
  it("throws ForbiddenError for an admin or a member", async () => {
    await expect(listWorkoutPlansForTrainer(admin)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listWorkoutPlansForTrainer(member)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("scopes the query to the acting trainer's own plans", async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([planRow()]);

    await listWorkoutPlansForTrainer(trainer);

    expect(prismaMock.workoutPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { trainerId: "trainer-1" } }),
    );
  });
});

describe("getWorkoutPlan / listWorkoutPlansForMember (viewing)", () => {
  it("lets the member view their own plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow() as never);
    await expect(getWorkoutPlan(member, "plan-1")).resolves.toBeTruthy();
  });

  it("does not let a member view another member's plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(
      planRow({ memberId: "member-2" }) as never,
    );
    await expect(getWorkoutPlan(member, "plan-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets the assigned trainer view it", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow() as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(getWorkoutPlan(trainer, "plan-1")).resolves.toBeTruthy();
  });

  it("does not let an unassigned trainer view it — the core 'trainer only accesses assigned members' rule", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow() as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(getWorkoutPlan(otherTrainer, "plan-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets an admin view any plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow() as never);
    await expect(getWorkoutPlan(admin, "plan-1")).resolves.toBeTruthy();
    expect(prismaMock.trainerAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);
    await expect(getWorkoutPlan(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("listWorkoutPlansForMember: denies a different member", async () => {
    await expect(listWorkoutPlansForMember(otherMember, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("updateWorkoutPlan / setWorkoutPlanStatus (managing)", () => {
  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);
    await expect(updateWorkoutPlan(trainer, "nope", validPlanInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("denies the member from managing their own plan — view only, not manage", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    await expect(updateWorkoutPlan(member, "plan-1", validPlanInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("denies an unassigned trainer", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(updateWorkoutPlan(otherTrainer, "plan-1", validPlanInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows an admin to change a plan's status", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    prismaMock.workoutPlan.update.mockResolvedValue(planRow({ status: "CANCELLED" }));
    await setWorkoutPlanStatus(admin, "plan-1", "CANCELLED");
    expect(prismaMock.workoutPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { status: "CANCELLED" },
    });
  });
});

describe("addWorkoutDay (workout day creation)", () => {
  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);
    await expect(addWorkoutDay(trainer, "nope", validDayInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("denies an unassigned trainer", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(addWorkoutDay(otherTrainer, "plan-1", validDayInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(prismaMock.workoutDay.create).not.toHaveBeenCalled();
  });

  it("creates the first day at orderIndex 0", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutDay.findFirst.mockResolvedValue(null);
    prismaMock.workoutDay.create.mockResolvedValue(dayRow());

    await addWorkoutDay(trainer, "plan-1", validDayInput);

    expect(prismaMock.workoutDay.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderIndex: 0, label: "Monday" }) }),
    );
  });

  it("appends subsequent days after the last orderIndex", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutDay.findFirst.mockResolvedValue(dayRow({ orderIndex: 2 }));
    prismaMock.workoutDay.create.mockResolvedValue(dayRow({ orderIndex: 3 }));

    await addWorkoutDay(trainer, "plan-1", { label: "Wednesday", notes: undefined });

    expect(prismaMock.workoutDay.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderIndex: 3 }) }),
    );
  });
});

describe("updateWorkoutDay / removeWorkoutDay", () => {
  it("throws NotFoundError for a missing day", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue(null);
    await expect(updateWorkoutDay(trainer, "nope", validDayInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("denies an unassigned trainer removing a day", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(removeWorkoutDay(otherTrainer, "day-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.workoutDay.delete).not.toHaveBeenCalled();
  });

  it("allows the assigned trainer to remove a day", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutDay.delete.mockResolvedValue(dayRow());

    await removeWorkoutDay(trainer, "day-1");

    expect(prismaMock.workoutDay.delete).toHaveBeenCalledWith({ where: { id: "day-1" } });
  });
});

describe("addWorkoutExercise (exercise assignment)", () => {
  it("throws NotFoundError for a missing day", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue(null);
    await expect(addWorkoutExercise(trainer, "nope", validExerciseInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("denies an unassigned trainer", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(
      addWorkoutExercise(otherTrainer, "day-1", validExerciseInput),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.workoutExercise.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the exerciseId doesn't exist — invalid data", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.exercise.findUnique.mockResolvedValue(null);

    await expect(
      addWorkoutExercise(trainer, "day-1", validExerciseInput),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(prismaMock.workoutExercise.create).not.toHaveBeenCalled();
  });

  it("assigns an exercise to a workout day for the assigned trainer", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.exercise.findUnique.mockResolvedValue({
      id: "exercise-1",
      name: "Bench Press",
      muscleGroup: null,
      description: null,
      instructions: null,
      isActive: true,
      createdByUserId: "trainer-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutExercise.findFirst.mockResolvedValue(null);
    prismaMock.workoutExercise.create.mockResolvedValue(workoutExerciseRow() as never);

    await addWorkoutExercise(trainer, "day-1", validExerciseInput);

    expect(prismaMock.workoutExercise.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ exerciseId: "exercise-1", sets: 3, reps: 10, orderIndex: 0 }),
      }),
    );
  });
});

describe("updateWorkoutExercise / removeWorkoutExercise", () => {
  it("throws NotFoundError for a missing entry", async () => {
    prismaMock.workoutExercise.findUnique.mockResolvedValue(null);
    await expect(
      updateWorkoutExercise(trainer, "nope", validExerciseInput),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("denies an unassigned trainer removing an exercise entry", async () => {
    prismaMock.workoutExercise.findUnique.mockResolvedValue({
      ...workoutExerciseRow(),
      workoutDay: { ...dayRow(), plan: planRow() },
    } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(removeWorkoutExercise(otherTrainer, "we-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(prismaMock.workoutExercise.delete).not.toHaveBeenCalled();
  });

  it("allows the assigned trainer to update sets/reps/weight", async () => {
    prismaMock.workoutExercise.findUnique.mockResolvedValue({
      ...workoutExerciseRow(),
      workoutDay: { ...dayRow(), plan: planRow() },
    } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue({
      id: "a1",
      memberId: "member-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      notes: null,
      assignedByUserId: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.workoutExercise.update.mockResolvedValue(workoutExerciseRow({ sets: 4 }) as never);

    await updateWorkoutExercise(trainer, "we-1", { ...validExerciseInput, sets: 4 });

    expect(prismaMock.workoutExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sets: 4 }) }),
    );
  });
});

describe("Phase 10 business rules", () => {
  const activeAssignment = {
    id: "a1",
    memberId: "member-1",
    trainerId: "trainer-1",
    status: "ACTIVE" as const,
    startDate: new Date(),
    endDate: null,
    notes: null,
    assignedByUserId: "admin-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const exerciseRow = (isActive: boolean) => ({
    id: "exercise-1",
    name: "Bench Press",
    muscleGroup: null,
    description: null,
    instructions: null,
    isActive,
    createdByUserId: "trainer-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it("refuses to program an exercise that has been retired from the library", async () => {
    prismaMock.workoutDay.findUnique.mockResolvedValue({ ...dayRow(), plan: planRow() } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.exercise.findUnique.mockResolvedValue(exerciseRow(false));

    await expect(addWorkoutExercise(trainer, "day-1", validExerciseInput)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(prismaMock.workoutExercise.create).not.toHaveBeenCalled();
  });

  it("refuses to swap an entry over to a retired exercise, but keeps existing entries editable", async () => {
    const entry = { ...workoutExerciseRow(), workoutDay: { ...dayRow(), plan: planRow() } };
    prismaMock.workoutExercise.findUnique.mockResolvedValue(entry as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.exercise.findUnique.mockResolvedValue(exerciseRow(false));

    await expect(
      updateWorkoutExercise(trainer, "we-1", { ...validExerciseInput, exerciseId: "exercise-2" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.workoutExercise.update).not.toHaveBeenCalled();

    // Same exercise, new sets: allowed even though it's retired now.
    prismaMock.workoutExercise.update.mockResolvedValue(workoutExerciseRow() as never);
    await updateWorkoutExercise(trainer, "we-1", { ...validExerciseInput, sets: 5 });
    expect(prismaMock.workoutExercise.update).toHaveBeenCalled();
  });

  it("rejects a plan whose end date is before its start date, on create and on update", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    const backwards = {
      ...validPlanInput,
      startDate: new Date("2026-06-10"),
      endDate: new Date("2026-06-01"),
    };

    await expect(createWorkoutPlan(trainer, "member-1", backwards)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(prismaMock.workoutPlan.create).not.toHaveBeenCalled();

    // Update with the start left blank is checked against the *stored* start.
    prismaMock.workoutPlan.findUnique.mockResolvedValue(
      planRow({ startDate: new Date("2026-06-10") }),
    );
    await expect(
      updateWorkoutPlan(trainer, "plan-1", { ...validPlanInput, endDate: new Date("2026-06-01") }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(prismaMock.workoutPlan.update).not.toHaveBeenCalled();
  });

  it("never re-activates a cancelled or completed plan, even for its assigned trainer", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    for (const finalStatus of ["CANCELLED", "COMPLETED"] as const) {
      prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow({ status: finalStatus }));
      await expect(setWorkoutPlanStatus(trainer, "plan-1", "ACTIVE")).rejects.toBeInstanceOf(
        ConflictError,
      );
    }
    expect(prismaMock.workoutPlan.update).not.toHaveBeenCalled();
  });

  it("allows only ACTIVE → COMPLETED / CANCELLED", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.workoutPlan.findUnique.mockResolvedValue(planRow());
    await expect(setWorkoutPlanStatus(trainer, "plan-1", "ACTIVE")).rejects.toBeInstanceOf(
      ConflictError,
    );

    prismaMock.workoutPlan.update.mockResolvedValue(planRow({ status: "COMPLETED" }));
    await setWorkoutPlanStatus(trainer, "plan-1", "COMPLETED");
    expect(prismaMock.workoutPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { status: "COMPLETED" },
    });
  });
});
