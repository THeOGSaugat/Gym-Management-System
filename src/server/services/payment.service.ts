import { db } from "@/server/db";
import { canManageFinancialRecords, canViewFinancialRecordsFor, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

const PAYMENTS_PER_PAGE = 20;

export type RecordPaymentInput = {
  membershipId?: string;
  amountMinor: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  paidAt?: Date;
};

/**
 * Records a manual payment (cash handed over, a bank transfer confirmed,
 * ...). Unlike a membership's price, this amount genuinely does come
 * from the caller — there's no gateway checkout to read a trusted price
 * from, this *is* the trusted admin's manual bookkeeping of a real-world
 * transaction. What's enforced instead: admin-only, a positive integer
 * amount within a sane bound (see lib/validations/payment.ts), and — if
 * a membership is specified — that it actually belongs to this member,
 * so a payment can never be attributed to the wrong person's membership.
 */
export async function recordPayment(actor: Actor, memberId: string, input: RecordPaymentInput) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can record payments.");
  }

  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }

  let currency = "USD";
  if (input.membershipId) {
    const membership = await db.membership.findUnique({ where: { id: input.membershipId } });
    if (!membership) throw new NotFoundError("Membership not found.");
    if (membership.memberId !== memberId) {
      throw new ConflictError("That membership doesn't belong to this member.");
    }
    currency = membership.currencySnapshot;
  }

  return db.payment.create({
    data: {
      memberId,
      membershipId: input.membershipId,
      amountMinor: input.amountMinor,
      currency,
      method: input.method,
      status: input.status,
      reference: input.reference,
      notes: input.notes,
      paidAt: input.paidAt ?? new Date(),
      recordedByUserId: actor.id,
    },
  });
}

export async function getPayment(actor: Actor, id: string) {
  const payment = await db.payment.findUnique({
    where: { id },
    include: { member: true, membership: true, recordedBy: true },
  });
  if (!payment) throw new NotFoundError("Payment not found.");

  if (!canViewFinancialRecordsFor(actor, payment.memberId)) {
    throw new ForbiddenError("You don't have permission to view this payment.");
  }

  return payment;
}

export async function listPaymentsForMember(actor: Actor, memberId: string) {
  if (!canViewFinancialRecordsFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's payments.");
  }

  return db.payment.findMany({
    where: { memberId },
    orderBy: { paidAt: "desc" },
  });
}

export type ListPaymentsParams = {
  search?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  page?: number;
};

/** Admin-only global payment list — search/filter/paginate across everyone. */
export async function listPayments(actor: Actor, params: ListPaymentsParams = {}) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can view all payments.");
  }

  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  const where = {
    ...(params.method ? { method: params.method } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(search
      ? {
          member: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: { member: true },
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * PAYMENTS_PER_PAGE,
      take: PAYMENTS_PER_PAGE,
    }),
    db.payment.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAYMENTS_PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / PAYMENTS_PER_PAGE)),
  };
}
