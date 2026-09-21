import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  getAssignedMember,
  getAssignedMemberAttendance,
  getAssignedMemberMembershipStatus,
} from "./trainer-portal.service";
import { listPaymentsForMember } from "./payment.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
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
  phone: "555-1234",
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  memberProfile: {
    id: "profile-1",
    userId: "member-1",
    memberNumber: 42,
    dateOfBirth: new Date("1990-01-01"),
    address: "123 Secret St",
    emergencyContactName: "Emergency Person",
    emergencyContactPhone: "555-9999",
    joinDate: new Date("2024-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const activeAssignment = {
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
};

describe("getAssignedMember", () => {
  it("throws ForbiddenError for a trainer with no active assignment to this member", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(getAssignedMember(trainer, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError for a different trainer than the one assigned", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null); // otherTrainer has no assignment
    await expect(getAssignedMember(otherTrainer, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ForbiddenError for a MEMBER actor — this surface is trainer/admin only", async () => {
    await expect(getAssignedMember(member, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows an assigned trainer and returns a reduced profile", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.user.findUnique.mockResolvedValue(memberUser as never);

    const result = await getAssignedMember(trainer, "member-1");

    expect(result).toEqual({
      id: "member-1",
      fullName: "Mo Member",
      email: "m@example.com",
      phone: "555-1234",
      status: "ACTIVE",
      memberNumber: 42,
      joinDate: memberUser.memberProfile.joinDate,
    });
    // Sensitive fields never leave this function.
    expect(result).not.toHaveProperty("dateOfBirth");
    expect(result).not.toHaveProperty("address");
    expect(result).not.toHaveProperty("emergencyContactName");
  });

  it("allows an admin regardless of assignment", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser as never);
    const result = await getAssignedMember(admin, "member-1");
    expect(result.id).toBe("member-1");
    // Admin path never even queries the assignment table.
    expect(prismaMock.trainerAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the id doesn't exist or isn't a member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getAssignedMember(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("getAssignedMemberAttendance", () => {
  it("throws ForbiddenError for an unassigned trainer", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(getAssignedMemberAttendance(trainer, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("returns attendance for an assigned trainer", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    await expect(getAssignedMemberAttendance(trainer, "member-1")).resolves.toEqual([]);
  });
});

describe("getAssignedMemberMembershipStatus", () => {
  it("throws ForbiddenError for an unassigned trainer", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);
    await expect(
      getAssignedMemberMembershipStatus(trainer, "member-1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns isCurrentlyActive: false and current: null with no memberships", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.membership.findMany.mockResolvedValue([]);

    const result = await getAssignedMemberMembershipStatus(trainer, "member-1");

    expect(result).toEqual({ isCurrentlyActive: false, current: null });
  });

  it("returns the currently-active membership's status, never price", async () => {
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(activeAssignment);
    prismaMock.membership.findMany.mockResolvedValue([
      {
        id: "membership-1",
        memberId: "member-1",
        planId: "plan-1",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
        status: "ACTIVE",
        planNameSnapshot: "Monthly",
        priceMinorSnapshot: 4999,
        currencySnapshot: "USD",
        cancelledAt: null,
        cancelReason: null,
        createdByUserId: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const result = await getAssignedMemberMembershipStatus(trainer, "member-1");

    expect(result.isCurrentlyActive).toBe(true);
    expect(result.current?.planName).toBe("Monthly");
    expect(result.current?.status).toBe("ACTIVE");
    // No amount/price field anywhere on the returned shape.
    expect(result.current).not.toHaveProperty("priceMinorSnapshot");
    expect(JSON.stringify(result)).not.toMatch(/price/i);
  });
});

describe("trainer cannot access payments (regression check against payment.service.ts)", () => {
  it("listPaymentsForMember rejects a TRAINER actor — no path in this codebase grants a trainer payment access", async () => {
    await expect(listPaymentsForMember(trainer, "member-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
