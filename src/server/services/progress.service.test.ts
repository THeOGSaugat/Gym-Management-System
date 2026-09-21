import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { recordProgress, listProgressForMember } from "./progress.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
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

const validInput = {
  metric: "WEIGHT_KG" as const,
  customLabel: undefined,
  value: 82.5,
  notes: undefined,
  recordedAt: undefined,
};

describe("recordProgress (progress recording)", () => {
  it("throws ForbiddenError for ADMIN and TRAINER — member-self-only", async () => {
    await expect(recordProgress(admin, validInput)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(recordProgress(trainer, validInput)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.progressLog.create).not.toHaveBeenCalled();
  });

  it("records a log for the acting member, always targeting their own id", async () => {
    prismaMock.progressLog.create.mockResolvedValue({} as never);

    await recordProgress(member, validInput);

    expect(prismaMock.progressLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "member-1",
          recordedByUserId: "member-1",
          metric: "WEIGHT_KG",
          value: 82.5,
        }),
      }),
    );
  });

  it("drops customLabel for a non-CUSTOM metric even if one was somehow submitted", async () => {
    prismaMock.progressLog.create.mockResolvedValue({} as never);

    await recordProgress(member, { ...validInput, customLabel: "Ignored" });

    const call = prismaMock.progressLog.create.mock.calls[0]?.[0];
    expect(call?.data.customLabel).toBeUndefined();
  });

  it("keeps customLabel for a CUSTOM metric", async () => {
    prismaMock.progressLog.create.mockResolvedValue({} as never);

    await recordProgress(member, { ...validInput, metric: "CUSTOM", customLabel: "Resting HR" });

    const call = prismaMock.progressLog.create.mock.calls[0]?.[0];
    expect(call?.data.customLabel).toBe("Resting HR");
  });
});

describe("listProgressForMember", () => {
  it("throws NotFoundError for a non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(listProgressForMember(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows the member viewing their own history", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.progressLog.findMany.mockResolvedValue([]);
    await expect(listProgressForMember(member, "member-1")).resolves.toEqual([]);
  });

  it("denies a member viewing another member's history", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    await expect(listProgressForMember(otherMember, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows the assigned trainer, denies an unassigned one", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.progressLog.findMany.mockResolvedValue([]);
    prismaMock.trainerAssignment.findFirst.mockResolvedValueOnce({
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
    await expect(listProgressForMember(trainer, "member-1")).resolves.toEqual([]);

    prismaMock.trainerAssignment.findFirst.mockResolvedValueOnce(null);
    await expect(listProgressForMember(otherTrainer, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows an admin regardless of assignment", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.progressLog.findMany.mockResolvedValue([]);
    await expect(listProgressForMember(admin, "member-1")).resolves.toEqual([]);
  });
});
