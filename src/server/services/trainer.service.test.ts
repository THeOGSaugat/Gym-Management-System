import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  listTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  setTrainerStatus,
} from "./trainer.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };

const baseTrainer = {
  id: "trainer-1",
  email: "trainer@example.com",
  passwordHash: "hashed",
  fullName: "Tara Trainer",
  phone: null,
  role: "TRAINER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validCreateInput = {
  fullName: "New Trainer",
  email: "newtrainer@example.com",
  password: "supersecret1",
  phone: undefined,
  bio: undefined,
  specialization: undefined,
  experienceYears: undefined,
};

describe("listTrainers", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(listTrainers(trainer, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listTrainers(member, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("queries only role: TRAINER for an admin", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    await listTrainers(admin, {});

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ role: "TRAINER" }) }),
    );
  });
});

describe("getTrainer", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(getTrainer(trainer, "trainer-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the id doesn't exist or isn't a trainer", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getTrainer(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createTrainer", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(createTrainer(trainer, validCreateInput)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a TRAINER user with a nested TrainerProfile, password hashed", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseTrainer, email: validCreateInput.email });

    await createTrainer(admin, validCreateInput);

    const call = prismaMock.user.create.mock.calls[0]?.[0];
    expect(call?.data).toMatchObject({ email: "newtrainer@example.com", role: "TRAINER", status: "ACTIVE" });
    expect(call?.data.passwordHash).not.toBe(validCreateInput.password);
    expect(call?.data.trainerProfile).toHaveProperty("create");
  });

  it("throws ConflictError when the email is already taken", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseTrainer);
    await expect(createTrainer(admin, validCreateInput)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("updateTrainer", () => {
  const updateInput = {
    fullName: "Updated Name",
    email: "trainer@example.com",
    phone: undefined,
    bio: undefined,
    specialization: undefined,
    experienceYears: undefined,
  };

  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(updateTrainer(trainer, "trainer-1", updateInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-trainer id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(updateTrainer(admin, "nope", updateInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates an existing trainer's fields", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseTrainer);
    prismaMock.user.update.mockResolvedValue({ ...baseTrainer, fullName: "Updated Name" });

    await updateTrainer(admin, "trainer-1", updateInput);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trainer-1" },
        data: expect.objectContaining({ fullName: "Updated Name" }),
      }),
    );
  });
});

describe("setTrainerStatus", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(setTrainerStatus(trainer, "trainer-1", "SUSPENDED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-trainer id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(setTrainerStatus(admin, "nope", "SUSPENDED")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("suspending a trainer also ends their active assignments, in one transaction", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseTrainer);
    prismaMock.$transaction.mockImplementation(async (callback) => {
      const tx = prismaMock;
      return typeof callback === "function" ? callback(tx as never) : callback;
    });
    prismaMock.user.update.mockResolvedValue({ ...baseTrainer, status: "SUSPENDED" });
    prismaMock.trainerAssignment.updateMany.mockResolvedValue({ count: 2 });

    await setTrainerStatus(admin, "trainer-1", "SUSPENDED");

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "trainer-1" }, data: { status: "SUSPENDED" } }),
    );
    expect(prismaMock.trainerAssignment.updateMany).toHaveBeenCalledWith({
      where: { trainerId: "trainer-1", status: "ACTIVE" },
      data: { status: "ENDED", endDate: expect.any(Date) },
    });
  });

  it("reactivating a trainer does not touch assignments", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseTrainer, status: "SUSPENDED" });
    prismaMock.$transaction.mockImplementation(async (callback) => {
      const tx = prismaMock;
      return typeof callback === "function" ? callback(tx as never) : callback;
    });
    prismaMock.user.update.mockResolvedValue({ ...baseTrainer, status: "ACTIVE" });

    await setTrainerStatus(admin, "trainer-1", "ACTIVE");

    expect(prismaMock.trainerAssignment.updateMany).not.toHaveBeenCalled();
  });
});
