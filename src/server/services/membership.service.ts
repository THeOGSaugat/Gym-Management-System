import { db } from "@/server/db";
import { canManageFinancialRecords, canViewFinancialRecordsFor, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import {
  computeEffectiveStatus,
  computeRenewalStartDate,
  addDays,
  isMembershipCurrentlyActive,
} from "@/lib/membership";
import { createNotificationOnce } from "@/server/services/notification.service";
import type { Membership } from "@/generated/prisma/client";
import { withAudit } from "@/server/services/audit.service";

// How many days out "expiring soon" starts warning a member — chosen to
// give enough time to renew without being so early the reminder feels
// premature. A membership that's already within this window when a
// member visits any page that self-heals their memberships (their
// membership page, their dashboard, ...) gets exactly one notification,
// not one per visit — see createNotificationOnce's dedup-by-related-
// entity guard below.
const EXPIRING_SOON_THRESHOLD_DAYS = 3;

/**
 * If a membership's stored `status` has gone stale (an ACTIVE row whose
 * endDate has quietly passed, or a PENDING one whose startDate has now
 * arrived), persist the corrected value. This is what lets "expiring a
 * membership" work correctly with no cron job: every read opportunistically
 * self-heals instead of trusting a value nothing has updated recently.
 * Called from every read path below, plus explicitly before any lifecycle
 * action that depends on the membership's *current* state.
 *
 * Also where the two membership-related notification types get created —
 * this is the one choke point every read path already funnels through,
 * so it's the natural (and only) place to notice "this just expired" or
 * "this is about to." Both use createNotificationOnce, keyed on this
 * membership's id, so re-visiting the same page repeatedly never creates
 * a second notification for the same event.
 */
async function syncMembershipStatus(membership: Membership, now = new Date()): Promise<Membership> {
  const effective = computeEffectiveStatus(membership, now);

  let current = membership;
  if (effective !== membership.status) {
    current = await db.membership.update({ where: { id: membership.id }, data: { status: effective } });

    if (effective === "EXPIRED") {
      await createNotificationOnce({
        recipientUserId: current.memberId,
        type: "MEMBERSHIP_EXPIRED",
        title: "Membership expired",
        message: `Your ${current.planNameSnapshot} membership expired on ${current.endDate.toLocaleDateString()}.`,
        linkUrl: "/member/membership",
        relatedEntityId: current.id,
      });
    }
  }

  if (effective === "ACTIVE") {
    const daysUntilExpiry = Math.ceil(
      (current.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRING_SOON_THRESHOLD_DAYS) {
      await createNotificationOnce({
        recipientUserId: current.memberId,
        type: "MEMBERSHIP_EXPIRING",
        title: "Membership expiring soon",
        message: `Your ${current.planNameSnapshot} membership expires on ${current.endDate.toLocaleDateString()}.`,
        linkUrl: "/member/membership",
        relatedEntityId: current.id,
      });
    }
  }

  return current;
}

export async function listMembershipsForMember(actor: Actor, memberId: string) {
  if (!canViewFinancialRecordsFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's memberships.");
  }

  const memberships = await db.membership.findMany({
    where: { memberId },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();
  return Promise.all(memberships.map((m) => syncMembershipStatus(m, now)));
}

export async function getMembership(actor: Actor, id: string) {
  const membership = await db.membership.findUnique({
    where: { id },
    include: { plan: true, payments: { orderBy: { paidAt: "desc" } } },
  });
  if (!membership) throw new NotFoundError("Membership not found.");

  if (!canViewFinancialRecordsFor(actor, membership.memberId)) {
    throw new ForbiddenError("You don't have permission to view this membership.");
  }

  const synced = await syncMembershipStatus(membership);
  return { ...membership, status: synced.status };
}

export type CreateMembershipInput = {
  planId: string;
  startDate?: Date;
};

/**
 * Assigns a brand-new membership to a member. The price is never taken
 * from the caller — it's read from the plan record found by `planId` and
 * snapshotted onto the new row. There is no amount/price parameter on
 * this function's input type at all, so there's nothing for a tampered
 * request to override.
 */
export async function createMembership(
  actor: Actor,
  memberId: string,
  input: CreateMembershipInput,
) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can assign memberships.");
  }

  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }

  const plan = await db.membershipPlan.findUnique({ where: { id: input.planId } });
  if (!plan) throw new NotFoundError("Plan not found.");
  if (!plan.isActive) {
    throw new ConflictError("This plan is inactive and can't be assigned to new memberships.");
  }

  const now = new Date();

  // Self-heal any stale existing memberships before checking for a
  // conflict, so a row that's *actually* expired (just not yet marked so)
  // doesn't wrongly block a new assignment.
  const existing = await db.membership.findMany({
    where: { memberId, status: { in: ["ACTIVE", "PENDING"] } },
  });
  const stillOpen = await Promise.all(existing.map((m) => syncMembershipStatus(m, now)));
  if (stillOpen.some((m) => m.status === "ACTIVE" || m.status === "PENDING")) {
    throw new ConflictError(
      "This member already has an active or pending membership. Cancel it, wait for it to expire, or use Renew instead.",
    );
  }

  const startDate = input.startDate ?? now;
  const endDate = addDays(startDate, plan.durationDays);
  const status = computeEffectiveStatus({ status: "PENDING", startDate, endDate }, now);

  return withAudit(
    actor,
    (tx) =>
      tx.membership.create({
        data: {
          memberId,
          planId: plan.id,
          startDate,
          endDate,
          status,
          planNameSnapshot: plan.name,
          priceMinorSnapshot: plan.priceMinor,
          currencySnapshot: plan.currency,
          createdByUserId: actor.id,
        },
      }),
    (created) => ({
      action: "MEMBERSHIP_CREATED",
      entityType: "Membership",
      entityId: created.id,
      subjectUserId: memberId,
      summary: `Assigned ${plan.name} membership to ${member.fullName}`,
      metadata: { planId: plan.id, priceMinor: plan.priceMinor, startDate, endDate },
    }),
  );
}

/**
 * Renews an existing membership: always creates a *new* row rather than
 * editing the old one's end date, so renewal history (and what was
 * actually charged each time) is never lost. Uses the plan's *current*
 * price — a renewal is a new purchase decision at today's rate, not a
 * continuation of the old snapshot.
 */
export async function renewMembership(actor: Actor, membershipId: string) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can renew memberships.");
  }

  const existingRaw = await db.membership.findUnique({ where: { id: membershipId } });
  if (!existingRaw) throw new NotFoundError("Membership not found.");

  const now = new Date();
  const existing = await syncMembershipStatus(existingRaw, now);

  if (existing.status === "CANCELLED") {
    throw new ConflictError("Cannot renew a cancelled membership.");
  }

  const plan = await db.membershipPlan.findUnique({ where: { id: existing.planId } });
  if (!plan || !plan.isActive) {
    throw new ConflictError(
      "This membership's plan is no longer active and can't be renewed. Assign a different plan instead.",
    );
  }

  const startDate = computeRenewalStartDate(existing.endDate, now);
  const endDate = addDays(startDate, plan.durationDays);
  const status = computeEffectiveStatus({ status: "PENDING", startDate, endDate }, now);

  return withAudit(
    actor,
    (tx) =>
      tx.membership.create({
        data: {
          memberId: existing.memberId,
          planId: plan.id,
          startDate,
          endDate,
          status,
          planNameSnapshot: plan.name,
          priceMinorSnapshot: plan.priceMinor,
          currencySnapshot: plan.currency,
          createdByUserId: actor.id,
        },
      }),
    (renewed) => ({
      action: "MEMBERSHIP_RENEWED",
      entityType: "Membership",
      entityId: renewed.id,
      subjectUserId: existing.memberId,
      summary: `Renewed ${plan.name} membership`,
      metadata: { renewedFrom: existing.id, priceMinor: plan.priceMinor, startDate, endDate },
    }),
  );
}

export async function cancelMembership(actor: Actor, membershipId: string, reason?: string) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can cancel memberships.");
  }

  const raw = await db.membership.findUnique({ where: { id: membershipId } });
  if (!raw) throw new NotFoundError("Membership not found.");

  const current = await syncMembershipStatus(raw);

  if (current.status === "CANCELLED") {
    throw new ConflictError("This membership is already cancelled.");
  }
  if (current.status === "EXPIRED") {
    throw new ConflictError("Cannot cancel a membership that has already expired.");
  }

  return withAudit(
    actor,
    (tx) =>
      tx.membership.update({
        where: { id: membershipId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
      }),
    (cancelled) => ({
      action: "MEMBERSHIP_CANCELLED",
      entityType: "Membership",
      entityId: cancelled.id,
      subjectUserId: cancelled.memberId,
      summary: `Cancelled ${cancelled.planNameSnapshot} membership`,
      metadata: { from: current.status, reason: reason ?? null },
    }),
  );
}

/**
 * Manual stand-in for a cron job: sweeps every non-final membership
 * (ACTIVE or PENDING) and self-heals its status if the dates say
 * otherwise. Every read path already self-heals the rows it touches, so
 * this exists for admin peace of mind / testing rather than being load
 * bearing — nothing depends on it having been run recently. Reuses
 * syncMembershipStatus (rather than its own inline update) so a sweep
 * also picks up the same expiring-soon/expired notifications an
 * individual member's own page visit would have triggered — one
 * implementation of "what changed and who to tell," not two.
 */
export async function sweepMembershipStatuses(actor: Actor) {
  if (!canManageFinancialRecords(actor)) {
    throw new ForbiddenError("Only admins can do this.");
  }

  const candidates = await db.membership.findMany({
    where: { status: { in: ["ACTIVE", "PENDING"] } },
  });

  const now = new Date();
  let changed = 0;
  for (const membership of candidates) {
    const synced = await syncMembershipStatus(membership, now);
    if (synced.status !== membership.status) changed += 1;
  }

  return { checked: candidates.length, changed };
}

export { isMembershipCurrentlyActive };
