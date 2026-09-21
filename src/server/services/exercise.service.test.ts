import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  setExerciseActive,
} from "./exercise.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const otherTrainer: Actor = { id: "trainer-2", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };

const baseExercise = {
  id: "exercise-1",
  name: "Bench Press",
  muscleGroup: "Chest",
  description: null,
  instructions: null,
  isActive: true,
  createdByUserId: "trainer-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  name: "Bench Press",
  muscleGroup: undefined,
  description: undefined,
  instructions: undefined,
};

describe("listExercises", () => {
  it("throws ForbiddenError for a member", async () => {
    await expect(listExercises(member, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows ADMIN and TRAINER", async () => {
    prismaMock.exercise.findMany.mockResolvedValue([]);
    await expect(listExercises(admin, {})).resolves.toEqual([]);
    await expect(listExercises(trainer, {})).resolves.toEqual([]);
  });

  it("filters to active-only by default", async () => {
    prismaMock.exercise.findMany.mockResolvedValue([]);
    await listExercises(admin, {});
    expect(prismaMock.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});

describe("getExercise", () => {
  it("throws ForbiddenError for a member", async () => {
    await expect(getExercise(member, "exercise-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a missing id", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(null);
    await expect(getExercise(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createExercise", () => {
  it("throws ForbiddenError for a member", async () => {
    await expect(createExercise(member, validInput)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.exercise.create).not.toHaveBeenCalled();
  });

  it("allows ADMIN and TRAINER, attributing createdByUserId to the actor", async () => {
    prismaMock.exercise.create.mockResolvedValue(baseExercise);
    await createExercise(trainer, validInput);
    expect(prismaMock.exercise.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdByUserId: "trainer-1" }) }),
    );
  });
});

describe("updateExercise", () => {
  it("throws NotFoundError for a missing exercise", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(null);
    await expect(updateExercise(admin, "nope", validInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("allows the trainer who created it", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    prismaMock.exercise.update.mockResolvedValue(baseExercise);
    await expect(updateExercise(trainer, "exercise-1", validInput)).resolves.toBeTruthy();
  });

  it("allows ADMIN regardless of who created it", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    prismaMock.exercise.update.mockResolvedValue(baseExercise);
    await expect(updateExercise(admin, "exercise-1", validInput)).resolves.toBeTruthy();
  });

  it("denies a different trainer than the one who created it", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    await expect(updateExercise(otherTrainer, "exercise-1", validInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(prismaMock.exercise.update).not.toHaveBeenCalled();
  });

  it("denies MEMBER", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    await expect(updateExercise(member, "exercise-1", validInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("setExerciseActive", () => {
  it("throws NotFoundError for a missing exercise", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(null);
    await expect(setExerciseActive(admin, "nope", false)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows the creator to deactivate their own exercise", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    prismaMock.exercise.update.mockResolvedValue({ ...baseExercise, isActive: false });
    await setExerciseActive(trainer, "exercise-1", false);
    expect(prismaMock.exercise.update).toHaveBeenCalledWith({
      where: { id: "exercise-1" },
      data: { isActive: false },
    });
  });

  it("denies a different trainer deactivating someone else's exercise", async () => {
    prismaMock.exercise.findUnique.mockResolvedValue(baseExercise);
    await expect(setExerciseActive(otherTrainer, "exercise-1", false)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
