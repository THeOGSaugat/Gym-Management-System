import type { MembershipStatus } from "@/generated/prisma/client";

/**
 * Mirrors `EXPIRING_SOON_THRESHOLD_DAYS` in
 * `server/services/membership.service.ts` — that's the number of days out
 * the backend itself starts sending a MEMBERSHIP_EXPIRING notification, so
 * the UI's own "expiring soon" treatment uses the same number rather than
 * inventing a different one. Not imported directly (that constant isn't
 * exported, and a service file isn't a sensible import target for a
 * presentation helper) — if that threshold ever changes, this one should
 * change with it.
 */
export const MEMBERSHIP_EXPIRING_SOON_DAYS = 3;

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type MembershipUrgency = "none" | "active" | "expiring" | "inactive";

/**
 * One place that decides "does this member's membership need their
 * attention right now" — used by both the dashboard's attention banner and
 * the membership page's status treatment, so a membership 2 days from
 * expiring reads the same way (colour, urgency) wherever a member sees it.
 *
 * `expiring` only applies to a currently-active membership within the
 * threshold. `inactive` covers everything else that isn't active right now
 * (EXPIRED, CANCELLED, or PENDING-not-yet-started) — the real `status`
 * value is always shown alongside via `StatusBadge`, so this enum only
 * needs to decide the surrounding callout's tone, not restate the status.
 */
export function getMembershipUrgency(membership: {
  status: MembershipStatus;
  isCurrentlyActive: boolean;
  endDate: Date;
} | null): MembershipUrgency {
  if (!membership) return "none";
  if (!membership.isCurrentlyActive) return "inactive";

  const remaining = daysUntil(membership.endDate);
  if (remaining <= MEMBERSHIP_EXPIRING_SOON_DAYS) return "expiring";
  return "active";
}
