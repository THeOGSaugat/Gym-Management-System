import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import * as auditService from "./audit.service";
import { listAuditLogs, withAudit } from "./audit.service";
import { setMemberStatus } from "./member.service";
import { recordPayment } from "./payment.service";
import { setTrainerStatus } from "./trainer.service";
import { ForbiddenError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };

const memberRow = {
  id: "member-1",
  email: "m@gym.test",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("withAudit", () => {
  it("writes the change and its log row in one transaction, attributed to the session actor", async () => {
    const result = await withAudit(
      admin,
      async () => ({ id: "row-1" }),
      (row) => ({ action: "PLAN_CREATED", entityType: "MembershipPlan", entityId: row.id, summary: "x" }),
    );

    expect(result).toEqual({ id: "row-1" });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorUserId: "admin-1", action: "PLAN_CREATED", entityId: "row-1" }),
    });
  });

  it("writes no log row when the change itself fails", async () => {
    await expect(
      withAudit(
        admin,
        async () => {
          throw new Error("constraint violated");
        },
        () => ({ action: "PLAN_CREATED", entityType: "MembershipPlan", entityId: "x", summary: "x" }),
      ),
    ).rejects.toThrow("constraint violated");
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("offers no way to change or delete an entry", () => {
    const exported = Object.keys(auditService);
    expect(exported.filter((name) => /update|delete|remove|edit|purge/i.test(name))).toEqual([]);
  });
});

describe("listAuditLogs", () => {
  it("is admin-only", async () => {
    await expect(listAuditLogs(trainer)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAuditLogs(member)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("lists newest first, clamping a crafted page number", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([]);
    prismaMock.auditLog.count.mockResolvedValue(0);
    const result = await listAuditLogs(admin, { page: 1e12, action: "PAYMENT_RECORDED" });
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { action: "PAYMENT_RECORDED", subjectUserId: undefined },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result.totalPages).toBe(1);
  });
});

describe("administrative actions are audited", () => {
  it("suspending a member records who did it, and the before/after status", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberRow as never);
    prismaMock.user.update.mockResolvedValue({ ...memberRow, status: "SUSPENDED" } as never);

    await setMemberStatus(admin, "member-1", "SUSPENDED");

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "MEMBER_STATUS_CHANGED",
        entityType: "User",
        entityId: "member-1",
        subjectUserId: "member-1",
        summary: "Suspended member Mo Member",
        metadata: { from: "ACTIVE", to: "SUSPENDED" },
      }),
    });
  });

  it("recording a payment logs the amount — never anything secret", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberRow as never);
    prismaMock.payment.create.mockResolvedValue({
      id: "pay-1",
      memberId: "member-1",
      amountMinor: 4999,
      currency: "USD",
      method: "CASH",
      status: "SUCCEEDED",
    } as never);

    await recordPayment(admin, "member-1", {
      amountMinor: 4999,
      method: "CASH",
      status: "SUCCEEDED",
      membershipId: undefined,
      reference: undefined,
      notes: undefined,
      paidAt: undefined,
    });

    const data = prismaMock.auditLog.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      action: "PAYMENT_RECORDED",
      entityId: "pay-1",
      subjectUserId: "member-1",
      metadata: { amountMinor: 4999, currency: "USD", method: "CASH", status: "SUCCEEDED" },
    });
    expect(JSON.stringify(data)).not.toMatch(/password|hash/i);
  });

  it("suspending a trainer logs how many assignments it ended, inside the same transaction", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...memberRow, id: "t-1", role: "TRAINER", fullName: "Tara" } as never);
    prismaMock.user.update.mockResolvedValue({ ...memberRow, id: "t-1", role: "TRAINER", fullName: "Tara" } as never);
    prismaMock.trainerAssignment.updateMany.mockResolvedValue({ count: 3 });

    await setTrainerStatus(admin, "t-1", "SUSPENDED");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "TRAINER_STATUS_CHANGED",
        metadata: { from: "ACTIVE", to: "SUSPENDED", assignmentsEnded: 3 },
      }),
    });
  });

  it("a rejected action leaves no audit trail of something that didn't happen", async () => {
    await expect(setMemberStatus(trainer, "member-1", "SUSPENDED")).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});
