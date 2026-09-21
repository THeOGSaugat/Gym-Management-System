import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  assignMemberToTrainer,
  removeAssignment,
  getAssignmentInfoForMember,
  listAssignedMembers,
} from "./assignment.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const otherTrainer: Actor = { id: "trainer-2", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };

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

const trainerUser = {
  id: "trainer-1",
  email: "t@example.com",
  passwordHash: "x",
  fullName: "Tara Trainer",
  phone: null,
  role: "TRAINER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function assignmentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "assignment-1",
    memberId: "member-1",
    trainerId: "trainer-1",
    status: "ACTIVE" as const,
    startDate: new Date(),
    endDate: null,
    notes: null,
    assignedByUserId: "admin-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockTransaction() {
  prismaMock.$transaction.mockImplementation(async (callback) => {
    if (typeof callback === "function") return callback(prismaMock as never);
    return callback;
  });
}

describe("assignMemberToTrainer", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(assignMemberToTrainer(trainer, "member-1", "trainer-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(assignMemberToTrainer(member, "member-1", "trainer-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(assignMemberToTrainer(admin, "nope", "trainer-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws NotFoundError for a non-existent or non-trainer id", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(memberUser) // member lookup
      .mockResolvedValueOnce(null); // trainer lookup
    await expect(assignMemberToTrainer(admin, "member-1", "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws ConflictError when the trainer is suspended", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(memberUser)
      .mockResolvedValueOnce({ ...trainerUser, status: "SUSPENDED" });
    await expect(assignMemberToTrainer(admin, "member-1", "trainer-1")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("assigns a member with no prior assignment", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(memberUser).mockResolvedValueOnce(trainerUser);
    mockTransaction();
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    prismaMock.trainerAssignment.create.mockResolvedValue(assignmentRow());

    await assignMemberToTrainer(admin, "member-1", "trainer-1");

    expect(prismaMock.trainerAssignment.update).not.toHaveBeenCalled();
    expect(prismaMock.trainerAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "member-1",
          trainerId: "trainer-1",
          assignedByUserId: "admin-1",
        }),
      }),
    );
  });

  it("throws ConflictError when already assigned to the same trainer", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(memberUser).mockResolvedValueOnce(trainerUser);
    mockTransaction();
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(assignmentRow());

    await expect(assignMemberToTrainer(admin, "member-1", "trainer-1")).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(prismaMock.trainerAssignment.create).not.toHaveBeenCalled();
  });

  it("changing trainer ends the old assignment and creates a new one", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(memberUser)
      .mockResolvedValueOnce({ ...trainerUser, id: "trainer-2" });
    mockTransaction();
    const oldAssignment = assignmentRow({ trainerId: "trainer-1" });
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(oldAssignment);
    prismaMock.trainerAssignment.update.mockResolvedValue({
      ...oldAssignment,
      status: "ENDED",
    });
    prismaMock.trainerAssignment.create.mockResolvedValue(
      assignmentRow({ trainerId: "trainer-2" }),
    );

    await assignMemberToTrainer(admin, "member-1", "trainer-2");

    expect(prismaMock.trainerAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "assignment-1" },
        data: expect.objectContaining({ status: "ENDED" }),
      }),
    );
    expect(prismaMock.trainerAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ trainerId: "trainer-2" }) }),
    );
  });
});

describe("removeAssignment", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(removeAssignment(trainer, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(removeAssignment(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when there is no active assignment", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(removeAssignment(admin, "member-1")).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.trainerAssignment.update).not.toHaveBeenCalled();
  });

  it("ends the active assignment with no replacement", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    const active = assignmentRow();
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(active);
    prismaMock.trainerAssignment.update.mockResolvedValue({ ...active, status: "ENDED" });

    await removeAssignment(admin, "member-1");

    expect(prismaMock.trainerAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "assignment-1" },
        data: expect.objectContaining({ status: "ENDED" }),
      }),
    );
  });
});

describe("getAssignmentInfoForMember", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(getAssignmentInfoForMember(trainer, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(getAssignmentInfoForMember(member, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("returns the current assignment and full history for an admin", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findMany.mockResolvedValue([
      assignmentRow({ id: "a2", status: "ACTIVE" }),
      assignmentRow({ id: "a1", status: "ENDED" }),
    ] as never);

    const result = await getAssignmentInfoForMember(admin, "member-1");

    expect(result.current?.id).toBe("a2");
    expect(result.history).toHaveLength(2);
  });

  it("current is null when there is no active assignment", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.trainerAssignment.findMany.mockResolvedValue([
      assignmentRow({ id: "a1", status: "ENDED" }),
    ] as never);

    const result = await getAssignmentInfoForMember(admin, "member-1");

    expect(result.current).toBeNull();
  });
});

describe("listAssignedMembers", () => {
  it("throws ForbiddenError for a member", async () => {
    await expect(listAssignedMembers(member, "trainer-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ForbiddenError for a different trainer requesting someone else's roster", async () => {
    await expect(listAssignedMembers(otherTrainer, "trainer-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows a trainer to view their own roster", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([]);
    await expect(listAssignedMembers(trainer, "trainer-1")).resolves.toEqual([]);
  });

  it("allows an admin to view any trainer's roster", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([]);
    await expect(listAssignedMembers(admin, "trainer-1")).resolves.toEqual([]);
  });

  it("only queries ACTIVE assignments for that trainer", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([]);
    await listAssignedMembers(trainer, "trainer-1");
    expect(prismaMock.trainerAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { trainerId: "trainer-1", status: "ACTIVE" } }),
    );
  });
});
