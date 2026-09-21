import type { MembershipStatus } from "@/generated/prisma/client";

/**
 * The subset of a Membership row this logic actually needs — kept as a
 * plain type (not imported from Prisma's generated model type) so these
 * functions have zero framework/ORM dependency and are trivial to unit
 * test with plain objects.
 */
export type MembershipLike = {
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
};

/**
 * The authoritative answer to "is this membership active right now" —
 * computed fresh from status + dates, never just read off the stored
 * `status` column. Same principle as the rest of this codebase's account
 * status handling: the stored value is a convenience/cache, not the
 * source of truth. A CANCELLED or EXPIRED membership is never "active"
 * regardless of dates; a PENDING or ACTIVE one is only active while
 * `now` actually falls within [startDate, endDate].
 */
export function isMembershipCurrentlyActive(
  membership: MembershipLike,
  now: Date = new Date(),
): boolean {
  if (membership.status === "CANCELLED") return false;
  if (membership.status === "EXPIRED") return false;
  return membership.startDate <= now && now <= membership.endDate;
}

/**
 * What the stored `status` column *should* say right now, given the
 * dates — used to self-heal a stale ACTIVE row whose endDate has quietly
 * passed (see membership.service.ts, which persists this on read instead
 * of requiring a cron job). Only ever moves ACTIVE -> EXPIRED or
 * PENDING -> ACTIVE automatically; CANCELLED is a deliberate action and
 * is never overwritten by date math, and an already-EXPIRED row that's
 * somehow before its own endDate (shouldn't happen, but defensively)
 * isn't un-expired by this function — expiry is a one-way transition
 * once set.
 */
export function computeEffectiveStatus(
  membership: MembershipLike,
  now: Date = new Date(),
): MembershipStatus {
  if (membership.status === "CANCELLED" || membership.status === "EXPIRED") {
    return membership.status;
  }

  if (now > membership.endDate) return "EXPIRED";
  if (now >= membership.startDate) return "ACTIVE";
  return "PENDING";
}

/**
 * Adds whole days to a date without the "add a month" class of bug (a
 * plan starting Jan 31 + "1 month" landing on a nonexistent date, or
 * silently rolling into March). Membership durations are always stored
 * and computed in days for exactly this reason.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Where a renewal's new start date should land: the day after the
 * existing membership's end date if renewing before (or exactly at)
 * expiry — the member keeps every day they already paid for — or today
 * if the old membership has already lapsed, since back-dating free
 * coverage isn't something this app does.
 */
export function computeRenewalStartDate(
  currentEndDate: Date,
  now: Date = new Date(),
): Date {
  const dayAfterCurrentEnd = addDays(currentEndDate, 1);
  return dayAfterCurrentEnd > now ? dayAfterCurrentEnd : now;
}
