import { db } from "@/server/db";
import { canManageFinancialRecords, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { PlanInput } from "@/lib/validations/plan";

/**
 * Anyone signed in can browse the plan catalog (a member should be able
 * to see what plans exist), but only admins can change it. There's no
 * "canViewPlans" policy function because there's no restriction to
 * express — every authenticated actor can list/view plans.
 */
export async function listPlans(_actor: Actor, params: { includeInactive?: boolean } = {}) {
  return db.membershipPlan.findMany({
    where: params.includeInactive ? {} : { isActive: true },
    orderBy: [{ isActive: "desc" }, { priceMinor: "asc" }],
  });
}

export async function getPlan(_actor: Actor, id: string) {
  const plan = await db.membershipPlan.findUnique({ where: { id } });
  if (!plan) throw new NotFoundError("Plan not found.");
  return plan;
}

export async function createPlan(actor: Actor, input: PlanInput) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can create plans.");
  }

  return db.membershipPlan.create({
    data: {
      name: input.name,
      description: input.description,
      durationDays: input.durationDays,
      priceMinor: input.priceMinor,
    },
  });
}

export async function updatePlan(actor: Actor, id: string, input: PlanInput) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can edit plans.");
  }

  const existing = await db.membershipPlan.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Plan not found.");

  return db.membershipPlan.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      durationDays: input.durationDays,
      priceMinor: input.priceMinor,
    },
  });
}

/**
 * Deactivating a plan only stops it being offered for *new* memberships
 * (see membership.service.ts's createMembership, which requires
 * isActive) — it never touches existing memberships already using it.
 * There is no delete: a plan referenced by membership history must
 * survive, same reasoning as never hard-deleting a member.
 */
export async function setPlanActive(actor: Actor, id: string, isActive: boolean) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can activate or deactivate plans.");
  }

  const existing = await db.membershipPlan.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Plan not found.");

  return db.membershipPlan.update({ where: { id }, data: { isActive } });
}
