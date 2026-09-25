import { db } from "@/server/db";
import { canManageFinancialRecords, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { PlanInput } from "@/lib/validations/plan";
import { withAudit } from "@/server/services/audit.service";

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

  return withAudit(
    actor,
    (tx) =>
      tx.membershipPlan.create({
        data: {
          name: input.name,
          description: input.description,
          durationDays: input.durationDays,
          priceMinor: input.priceMinor,
        },
      }),
    (created) => ({
      action: "PLAN_CREATED",
      entityType: "MembershipPlan",
      entityId: created.id,
      summary: `Created plan ${created.name}`,
      metadata: { priceMinor: created.priceMinor, durationDays: created.durationDays },
    }),
  );
}

export async function updatePlan(actor: Actor, id: string, input: PlanInput) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can edit plans.");
  }

  const existing = await db.membershipPlan.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Plan not found.");

  return withAudit(
    actor,
    (tx) =>
      tx.membershipPlan.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          durationDays: input.durationDays,
          priceMinor: input.priceMinor,
        },
      }),
    (updated) => ({
      action: "PLAN_UPDATED",
      entityType: "MembershipPlan",
      entityId: updated.id,
      summary: `Updated plan ${updated.name}`,
      // Price and length are what change what members are charged — record both sides.
      metadata: {
        priceMinor: { from: existing.priceMinor, to: updated.priceMinor },
        durationDays: { from: existing.durationDays, to: updated.durationDays },
      },
    }),
  );
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

  return withAudit(
    actor,
    (tx) => tx.membershipPlan.update({ where: { id }, data: { isActive } }),
    (updated) => ({
      action: "PLAN_STATUS_CHANGED",
      entityType: "MembershipPlan",
      entityId: updated.id,
      summary: `${isActive ? "Activated" : "Deactivated"} plan ${updated.name}`,
      metadata: { from: existing.isActive, to: isActive },
    }),
  );
}
