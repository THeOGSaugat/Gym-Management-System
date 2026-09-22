import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { recordPayment, getPayment, listPaymentsForMember, listPayments } from "./payment.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const otherMember: Actor = { id: "member-2", role: "MEMBER" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };

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

const membershipRow = {
  id: "membership-1",
  memberId: "member-1",
  planId: "plan-1",
  startDate: new Date(),
  endDate: new Date(),
  status: "ACTIVE" as const,
  planNameSnapshot: "Monthly",
  priceMinorSnapshot: 4999,
  currencySnapshot: "EUR",
  cancelledAt: null,
  cancelReason: null,
  createdByUserId: "admin-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  membershipId: undefined,
  amountMinor: 4999,
  method: "CASH" as const,
  status: "SUCCEEDED" as const,
  reference: undefined,
  notes: undefined,
  paidAt: undefined,
};

const createdPayment = {
  id: "payment-1",
  memberId: "member-1",
  membershipId: null,
  amountMinor: 4999,
  currency: "USD",
  method: "CASH" as const,
  status: "SUCCEEDED" as const,
  reference: null,
  notes: null,
  paidAt: new Date(),
  recordedByUserId: "admin-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("recordPayment", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(recordPayment(member, "member-1", validInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(recordPayment(trainer, "member-1", validInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(recordPayment(admin, "nope", validInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records a payment for an admin, attributed to the acting admin", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.payment.create.mockResolvedValue(createdPayment);

    await recordPayment(admin, "member-1", validInput);

    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "member-1",
          amountMinor: 4999,
          method: "CASH",
          recordedByUserId: "admin-1",
        }),
      }),
    );
  });

  it("creates a PAYMENT_RECORDED notification for the member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.payment.create.mockResolvedValue(createdPayment);

    await recordPayment(admin, "member-1", validInput);

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: "member-1",
          type: "PAYMENT_RECORDED",
          relatedEntityId: "payment-1",
        }),
      }),
    );
  });

  it("throws NotFoundError when the given membership doesn't exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membership.findUnique.mockResolvedValue(null);
    await expect(
      recordPayment(admin, "member-1", { ...validInput, membershipId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when the membership belongs to a different member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membership.findUnique.mockResolvedValue({ ...membershipRow, memberId: "member-2" });
    await expect(
      recordPayment(admin, "member-1", { ...validInput, membershipId: "membership-1" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it("uses the membership's currency snapshot when a membership is given", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.membership.findUnique.mockResolvedValue(membershipRow);
    prismaMock.payment.create.mockResolvedValue(createdPayment);

    await recordPayment(admin, "member-1", { ...validInput, membershipId: "membership-1" });

    const call = prismaMock.payment.create.mock.calls[0]?.[0];
    expect(call?.data.currency).toBe("EUR");
  });
});

describe("getPayment", () => {
  it("throws NotFoundError for a missing id", async () => {
    prismaMock.payment.findUnique.mockResolvedValue(null);
    await expect(getPayment(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets an admin view any payment", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      memberId: "member-1",
    } as never);
    await expect(getPayment(admin, "payment-1")).resolves.toBeTruthy();
  });

  it("lets a member view their own payment", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      memberId: "member-1",
    } as never);
    await expect(getPayment(member, "payment-1")).resolves.toBeTruthy();
  });

  it("does not let a member view another member's payment — the core 'never see another member's payment info' rule", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      memberId: "member-2",
    } as never);
    await expect(getPayment(member, "payment-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("does not let a trainer view a payment", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      memberId: "member-1",
    } as never);
    await expect(getPayment(trainer, "payment-1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("listPaymentsForMember", () => {
  it("throws ForbiddenError for a member requesting someone else's history", async () => {
    await expect(listPaymentsForMember(member, "member-2")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows self and admin", async () => {
    prismaMock.payment.findMany.mockResolvedValue([]);
    await expect(listPaymentsForMember(member, "member-1")).resolves.toEqual([]);
    await expect(listPaymentsForMember(admin, "member-1")).resolves.toEqual([]);
  });
});

describe("listPayments (global admin list)", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(listPayments(member, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPayments(otherMember, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPayments(trainer, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("paginates and filters for an admin", async () => {
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.payment.count.mockResolvedValue(0);

    await listPayments(admin, { method: "CASH", page: 2 });

    expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ method: "CASH" }),
        skip: 20,
        take: 20,
      }),
    );
  });
});
