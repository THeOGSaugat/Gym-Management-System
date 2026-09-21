import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getAdminDashboard, getTrainerDashboard, getMemberDashboard } from "./dashboard.service";
import { ForbiddenError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

describe("getAdminDashboard", () => {
  it("throws ForbiddenError for a trainer", async () => {
    await expect(getAdminDashboard(trainer)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError for a member", async () => {
    await expect(getAdminDashboard(member)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns all-zero, empty-array metrics with no data at all", async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amountMinor: null } } as never);
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await getAdminDashboard(admin);

    expect(result.totalMembers).toBe(0);
    expect(result.activeMembers).toBe(0);
    expect(result.expiredMemberships).toBe(0);
    expect(result.membersWithoutMembership).toBe(0);
    expect(result.totalRevenueMinor).toBe(0);
    expect(result.monthRevenueMinor).toBe(0);
    expect(result.recentPayments).toEqual([]);
    expect(result.recentMembers).toEqual([]);
  });

  it("buckets each member by their single latest membership's effective status, not every historical row", async () => {
    prismaMock.user.count.mockResolvedValue(3);
    // Member "m1" renewed once: an old row that's now expired, and a
    // newer row that's currently active. Only the latest (by startDate)
    // should count. Member "m2" has one membership that has lapsed.
    prismaMock.membership.findMany.mockResolvedValue([
      {
        memberId: "m1",
        status: "ACTIVE",
        startDate: daysFromNow(-5),
        endDate: daysFromNow(25),
      },
      {
        memberId: "m1",
        status: "EXPIRED",
        startDate: daysFromNow(-40),
        endDate: daysFromNow(-10),
      },
      {
        memberId: "m2",
        status: "ACTIVE",
        startDate: daysFromNow(-60),
        endDate: daysFromNow(-30),
      },
    ] as never);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amountMinor: null } } as never);
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await getAdminDashboard(admin);

    // m1's latest row is the ACTIVE one that's still within its date
    // range; m2's only row has an endDate in the past, so its *effective*
    // status is EXPIRED even though the stored column still says ACTIVE.
    expect(result.activeMembers).toBe(1);
    expect(result.expiredMemberships).toBe(1);
    // m3 (from totalMembers: 3) has never had a membership at all.
    expect(result.membersWithoutMembership).toBe(1);
  });

  it("sums only SUCCEEDED payments for revenue", async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amountMinor: 15000 } } as never);
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await getAdminDashboard(admin);

    expect(result.totalRevenueMinor).toBe(15000);
    expect(prismaMock.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "SUCCEEDED" }) }),
    );
  });
});

describe("getTrainerDashboard", () => {
  it("throws ForbiddenError for an admin", async () => {
    await expect(getTrainerDashboard(admin)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError for a member", async () => {
    await expect(getTrainerDashboard(member)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns zeroed-out data for a trainer with no assigned members", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([]);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.workoutPlan.count.mockResolvedValue(0);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getTrainerDashboard(trainer);

    expect(result.assignedMemberCount).toBe(0);
    expect(result.todayCheckInCount).toBe(0);
    expect(result.currentlyCheckedIn).toEqual([]);
    expect(result.recentProgress).toEqual([]);
  });

  it("scopes attendance/progress queries to only this trainer's assigned members", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([
      { memberId: "m1" },
      { memberId: "m2" },
    ] as never);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.workoutPlan.count.mockResolvedValue(0);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getTrainerDashboard(trainer);

    expect(result.assignedMemberCount).toBe(2);
    expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ memberId: { in: ["m1", "m2"] } }),
      }),
    );
    expect(prismaMock.progressLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ memberId: { in: ["m1", "m2"] } }),
      }),
    );
    expect(prismaMock.workoutPlan.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ trainerId: "trainer-1" }) }),
    );
  });

  it("splits today's attendance into checked-in vs. checked-out", async () => {
    prismaMock.trainerAssignment.findMany.mockResolvedValue([{ memberId: "m1" }] as never);
    prismaMock.attendance.findMany.mockResolvedValue([
      { id: "a1", memberId: "m1", checkInAt: new Date(), checkOutAt: null },
      { id: "a2", memberId: "m1", checkInAt: new Date(), checkOutAt: new Date() },
    ] as never);
    prismaMock.workoutPlan.count.mockResolvedValue(0);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getTrainerDashboard(trainer);

    expect(result.todayCheckInCount).toBe(2);
    expect(result.currentlyCheckedIn).toHaveLength(1);
    expect(result.currentlyCheckedIn[0]?.id).toBe("a1");
  });
});

describe("getMemberDashboard", () => {
  it("throws ForbiddenError for an admin", async () => {
    await expect(getMemberDashboard(admin)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError for a trainer", async () => {
    await expect(getMemberDashboard(trainer)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns nulls/empty lists for a brand-new member with no data yet", async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.workoutPlan.findMany.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "member-1", role: "MEMBER" } as never);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getMemberDashboard(member);

    expect(result.membershipStatus).toBeNull();
    expect(result.recentAttendance).toEqual([]);
    expect(result.currentWorkoutPlan).toBeNull();
    expect(result.recentProgress).toEqual([]);
  });

  it("prefers a currently-active membership over a more recent but lapsed one", async () => {
    prismaMock.membership.findMany.mockResolvedValue([
      {
        id: "old",
        memberId: "member-1",
        status: "EXPIRED",
        startDate: daysFromNow(-90),
        endDate: daysFromNow(-60),
        planNameSnapshot: "Old plan",
      },
      {
        id: "current",
        memberId: "member-1",
        status: "ACTIVE",
        startDate: daysFromNow(-5),
        endDate: daysFromNow(25),
        planNameSnapshot: "Monthly",
      },
    ] as never);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.workoutPlan.findMany.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "member-1", role: "MEMBER" } as never);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getMemberDashboard(member);

    expect(result.membershipStatus).not.toBeNull();
    expect(result.membershipStatus?.isCurrentlyActive).toBe(true);
    expect(result.membershipStatus?.planName).toBe("Monthly");
  });

  it("picks the ACTIVE workout plan over an older completed one", async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);
    prismaMock.workoutPlan.findMany.mockResolvedValue([
      { id: "plan-active", memberId: "member-1", status: "ACTIVE", startDate: daysFromNow(-1) },
      {
        id: "plan-completed",
        memberId: "member-1",
        status: "COMPLETED",
        startDate: daysFromNow(-30),
      },
    ] as never);
    prismaMock.user.findUnique.mockResolvedValue({ id: "member-1", role: "MEMBER" } as never);
    prismaMock.progressLog.findMany.mockResolvedValue([]);

    const result = await getMemberDashboard(member);

    expect(result.currentWorkoutPlan?.id).toBe("plan-active");
  });
});
