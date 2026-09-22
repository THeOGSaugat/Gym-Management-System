import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  createMembership,
  renewMembership,
  cancelMembership,
  getMembership,
  listMembershipsForMember,
  sweepMembershipStatuses,
} from "./membership.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };

const now = new Date("2026-06-15T00:00:00Z");

const memberUser = {
  id: "member-1",
  email: "m@example.com",
  passwordHash: "x",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: now,
  updatedAt: now,
};

const activePlan = {
  id: "plan-1",
  name: "Monthly",
  description: null,
  durationDays: 30,
  priceMinor: 4999,
  currency: "USD",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

function membershipRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "membership-1",
    memberId: "member-1",
    planId: "plan-1",
    startDate: new Date("2026-05-15T00:00:00Z"),
    endDate: new Date("2026-06-14T00:00:00Z"), // yesterday relative to `now`
    status: "ACTIVE" as const,
    planNameSnapshot: "Monthly",
    priceMinorSnapshot: 4999,
    currencySnapshot: "USD",
    cancelledAt: null,
    cancelReason: null,
    createdByUserId: "admin-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("createMembership", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(createMembership(member, "member-1", { planId: "plan-1" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(createMembership(admin, "nope", { planId: "plan-1" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue(null);
    await expect(createMembership(admin, "member-1", { planId: "nope" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws ConflictError for an inactive plan", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue({ ...activePlan, isActive: false });
    await expect(createMembership(admin, "member-1", { planId: "plan-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("throws ConflictError when the member already has an active/pending membership", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue(activePlan);
    prismaMock.membership.findMany.mockResolvedValue([
      membershipRow({
        status: "ACTIVE",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      }),
    ]);
    await expect(createMembership(admin, "member-1", { planId: "plan-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(prismaMock.membership.create).not.toHaveBeenCalled();
  });

  it("allows a new membership when the only existing one has actually expired (self-healing)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue(activePlan);
    const staleActive = membershipRow({
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-31"), // long expired
    });
    prismaMock.membership.findMany.mockResolvedValue([staleActive]);
    prismaMock.membership.update.mockResolvedValue({ ...staleActive, status: "EXPIRED" });
    prismaMock.membership.create.mockResolvedValue(membershipRow());

    await createMembership(admin, "member-1", { planId: "plan-1" });

    expect(prismaMock.membership.create).toHaveBeenCalled();
  });

  it("computes endDate as startDate + plan.durationDays and snapshots plan terms", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue(activePlan);
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.membership.create.mockResolvedValue(membershipRow());

    const startDate = new Date(); // "today"
    await createMembership(admin, "member-1", { planId: "plan-1", startDate });

    const call = prismaMock.membership.create.mock.calls[0]?.[0];
    const expectedEnd = new Date(startDate);
    expectedEnd.setUTCDate(expectedEnd.getUTCDate() + 30);
    expect(call?.data.startDate).toEqual(startDate);
    expect(call?.data.endDate).toEqual(expectedEnd); // +30 days
    expect(call?.data.planNameSnapshot).toBe("Monthly");
    expect(call?.data.priceMinorSnapshot).toBe(4999);
    expect(call?.data.status).toBe("ACTIVE"); // starts today
  });

  it("sets status PENDING for a future start date", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membershipPlan.findUnique.mockResolvedValue(activePlan);
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.membership.create.mockResolvedValue(membershipRow());

    const futureStart = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10); // 10 days from now
    await createMembership(admin, "member-1", { planId: "plan-1", startDate: futureStart });

    const call = prismaMock.membership.create.mock.calls[0]?.[0];
    expect(call?.data.status).toBe("PENDING");
  });
});

describe("renewMembership", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(renewMembership(member, "membership-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a missing membership", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    await expect(renewMembership(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when renewing a cancelled membership", async () => {
    const cancelled = membershipRow({ status: "CANCELLED" });
    prismaMock.membership.findUnique.mockResolvedValue(cancelled);
    await expect(renewMembership(admin, "membership-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when the plan is no longer active", async () => {
    const active = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
    });
    prismaMock.membership.findUnique.mockResolvedValue(active);
    prismaMock.membershipPlan.findUnique.mockResolvedValue({ ...activePlan, isActive: false });
    await expect(renewMembership(admin, "membership-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("starts the new membership the day after the old one's end date, using current plan price", async () => {
    const currentEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5); // 5 days from now
    const active = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
      endDate: currentEnd,
    });
    prismaMock.membership.findUnique.mockResolvedValue(active);
    prismaMock.membershipPlan.findUnique.mockResolvedValue({ ...activePlan, priceMinor: 5999 });
    prismaMock.membership.create.mockResolvedValue(membershipRow());

    await renewMembership(admin, "membership-1");

    const call = prismaMock.membership.create.mock.calls[0]?.[0];
    const expectedStart = new Date(currentEnd);
    expectedStart.setUTCDate(expectedStart.getUTCDate() + 1);
    expect(call?.data.startDate).toEqual(expectedStart);
    expect(call?.data.priceMinorSnapshot).toBe(5999); // today's price, not the old snapshot
    expect(call?.data.status).toBe("PENDING"); // starts in the future
  });

  it("renewing an already-expired membership starts today, not back-dated", async () => {
    const longExpired = membershipRow({
      status: "ACTIVE", // stale — hasn't been swept yet
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-31"),
    });
    prismaMock.membership.findUnique.mockResolvedValue(longExpired);
    prismaMock.membership.update.mockResolvedValue({ ...longExpired, status: "EXPIRED" });
    prismaMock.membershipPlan.findUnique.mockResolvedValue(activePlan);
    prismaMock.membership.create.mockResolvedValue(membershipRow());

    const before = new Date();
    await renewMembership(admin, "membership-1");
    const after = new Date();

    const call = prismaMock.membership.create.mock.calls[0]?.[0];
    const start = call?.data.startDate as Date;
    expect(start.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(start.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe("cancelMembership", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(cancelMembership(member, "membership-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a missing membership", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    await expect(cancelMembership(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError for an already-cancelled membership", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(membershipRow({ status: "CANCELLED" }));
    await expect(cancelMembership(admin, "membership-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError for an expired membership", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(
      membershipRow({ status: "EXPIRED", endDate: new Date("2020-01-01") }),
    );
    await expect(cancelMembership(admin, "membership-1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("cancels an active membership with a reason", async () => {
    const active = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
    });
    prismaMock.membership.findUnique.mockResolvedValue(active);
    prismaMock.membership.update.mockResolvedValue({ ...active, status: "CANCELLED" });

    await cancelMembership(admin, "membership-1", "Requested by member");

    expect(prismaMock.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "membership-1" },
        data: expect.objectContaining({ status: "CANCELLED", cancelReason: "Requested by member" }),
      }),
    );
  });
});

describe("getMembership — authorization and self-healing", () => {
  it("lets an admin view any membership", async () => {
    const row = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...row, plan: activePlan, payments: [] } as never);
    const result = await getMembership(admin, "membership-1");
    expect(result.id).toBe("membership-1");
  });

  it("lets a member view their own membership", async () => {
    const row = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...row, plan: activePlan, payments: [] } as never);
    await expect(getMembership(member, "membership-1")).resolves.toBeTruthy();
  });

  it("does not let a member view another member's membership", async () => {
    const row = membershipRow({ memberId: "member-2" });
    prismaMock.membership.findUnique.mockResolvedValue({ ...row, plan: activePlan, payments: [] } as never);
    await expect(getMembership(member, "membership-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("does not let a trainer view a membership", async () => {
    const row = membershipRow();
    prismaMock.membership.findUnique.mockResolvedValue({ ...row, plan: activePlan, payments: [] } as never);
    await expect(getMembership(trainer, "membership-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("self-heals a stale ACTIVE row to EXPIRED on read", async () => {
    const stale = membershipRow({
      status: "ACTIVE",
      startDate: new Date("2020-01-01"),
      endDate: new Date("2020-01-31"),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...stale, plan: activePlan, payments: [] } as never);
    prismaMock.membership.update.mockResolvedValue({ ...stale, status: "EXPIRED" });

    const result = await getMembership(admin, "membership-1");

    expect(result.status).toBe("EXPIRED");
    expect(prismaMock.membership.update).toHaveBeenCalledWith({
      where: { id: "membership-1" },
      data: { status: "EXPIRED" },
    });
  });
});

describe("membership-related notifications (via getMembership's self-heal)", () => {
  it("creates a MEMBERSHIP_EXPIRED notification when a stale ACTIVE row is self-healed to EXPIRED", async () => {
    const stale = membershipRow({
      status: "ACTIVE",
      startDate: new Date("2020-01-01"),
      endDate: new Date("2020-01-31"),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...stale, plan: activePlan, payments: [] } as never);
    prismaMock.membership.update.mockResolvedValue({ ...stale, status: "EXPIRED" });
    prismaMock.notification.findFirst.mockResolvedValue(null);

    await getMembership(admin, "membership-1");

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: "member-1",
          type: "MEMBERSHIP_EXPIRED",
          relatedEntityId: "membership-1",
        }),
      }),
    );
  });

  it("does not create a duplicate MEMBERSHIP_EXPIRED notification if one already exists", async () => {
    const stale = membershipRow({
      status: "ACTIVE",
      startDate: new Date("2020-01-01"),
      endDate: new Date("2020-01-31"),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...stale, plan: activePlan, payments: [] } as never);
    prismaMock.membership.update.mockResolvedValue({ ...stale, status: "EXPIRED" });
    prismaMock.notification.findFirst.mockResolvedValue({
      id: "existing-notif",
      recipientUserId: "member-1",
      type: "MEMBERSHIP_EXPIRED",
      title: "Membership expired",
      message: "already notified",
      linkUrl: "/member/membership",
      relatedEntityId: "membership-1",
      isRead: false,
      readAt: null,
      createdAt: now,
    });

    await getMembership(admin, "membership-1");

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  it("creates a MEMBERSHIP_EXPIRING notification for a still-ACTIVE row within the threshold", async () => {
    const soon = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 27),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now — within the 3-day threshold
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...soon, plan: activePlan, payments: [] } as never);
    prismaMock.notification.findFirst.mockResolvedValue(null);

    await getMembership(admin, "membership-1");

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: "member-1",
          type: "MEMBERSHIP_EXPIRING",
          relatedEntityId: "membership-1",
        }),
      }),
    );
    // A row that's merely "expiring soon" hasn't actually changed status,
    // so this shouldn't trigger an unnecessary write.
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it("does not create an expiring-soon notification for a row with plenty of time left", async () => {
    const notSoon = membershipRow({
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
    });
    prismaMock.membership.findUnique.mockResolvedValue({ ...notSoon, plan: activePlan, payments: [] } as never);

    await getMembership(admin, "membership-1");

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
});

describe("listMembershipsForMember", () => {
  it("throws ForbiddenError for a member requesting someone else's list", async () => {
    await expect(listMembershipsForMember(member, "member-2")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows self and admin", async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);
    await expect(listMembershipsForMember(member, "member-1")).resolves.toEqual([]);
    await expect(listMembershipsForMember(admin, "member-1")).resolves.toEqual([]);
  });
});

describe("sweepMembershipStatuses", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(sweepMembershipStatuses(member)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("flips a stale ACTIVE row past its endDate to EXPIRED and reports the count", async () => {
    const stale = membershipRow({
      status: "ACTIVE",
      startDate: new Date("2020-01-01"),
      endDate: new Date("2020-01-31"),
    });
    const stillGood = membershipRow({
      id: "membership-2",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    });
    prismaMock.membership.findMany.mockResolvedValue([stale, stillGood]);
    prismaMock.membership.update.mockResolvedValue({ ...stale, status: "EXPIRED" });

    const result = await sweepMembershipStatuses(admin);

    expect(result).toEqual({ checked: 2, changed: 1 });
    expect(prismaMock.membership.update).toHaveBeenCalledTimes(1);
  });
});
