import { db } from "@/server/db";
import {
  canViewAdminDashboard,
  canViewTrainerDashboard,
  canViewMemberDashboard,
  type Actor,
} from "@/lib/auth/policies";
import { ForbiddenError } from "@/lib/errors";
import { startOfDay, startOfMonth } from "@/lib/date";
import { computeEffectiveStatus, isMembershipCurrentlyActive } from "@/lib/membership";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { listAttendanceForMember } from "@/server/services/attendance.service";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
import { listProgressForMember } from "@/server/services/progress.service";
import type { MembershipStatus } from "@/generated/prisma/client";

const RECENT_LIST_SIZE = 5;

/**
 * Buckets every member into the effective status of their single most
 * recent membership row (or "no membership" if they've never had one).
 * Deliberately *not* a count of every Membership row grouped by status —
 * a renewed member has one historical row per renewal, and counting all
 * of them would let one member inflate both the "active" and "expired"
 * buckets at once. Taking only the latest row per member, then computing
 * its *effective* status (never trusting the possibly-stale stored
 * `status` column — same principle as membership.service.ts's
 * self-healing reads), gives a true "how many members currently stand in
 * each state" snapshot instead of a count of historical purchase events.
 *
 * One query, then an in-memory reduce — deliberately not N+1 (a query per
 * member) or a raw SQL window function (more power than this needs).
 */
async function getMembershipStatusOverview(now: Date) {
  const memberships = await db.membership.findMany({
    select: { memberId: true, status: true, startDate: true, endDate: true },
    orderBy: { startDate: "desc" },
  });

  const latestByMember = new Map<string, (typeof memberships)[number]>();
  for (const membership of memberships) {
    if (!latestByMember.has(membership.memberId)) {
      latestByMember.set(membership.memberId, membership);
    }
  }

  const counts: Record<MembershipStatus, number> = {
    ACTIVE: 0,
    PENDING: 0,
    EXPIRED: 0,
    CANCELLED: 0,
  };
  for (const membership of latestByMember.values()) {
    counts[computeEffectiveStatus(membership, now)] += 1;
  }

  return { counts, membersWithMembership: latestByMember.size };
}

/**
 * Gym-wide aggregate metrics for the admin dashboard. Every figure here is
 * computed with a handful of `count`/`aggregate`/scoped `findMany` calls
 * against the whole table, run in parallel — never a query per row of
 * some other list, which is what would make this an N+1 problem as the
 * gym's data grows.
 */
export async function getAdminDashboard(actor: Actor) {
  if (!canViewAdminDashboard(actor)) {
    throw new ForbiddenError("Only admins can view the admin dashboard.");
  }

  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    totalMembers,
    totalTrainers,
    activeTrainers,
    { counts: membershipStatusCounts, membersWithMembership },
    todayAttendanceCount,
    currentlyCheckedInCount,
    totalRevenue,
    monthRevenue,
    recentPayments,
    recentMembers,
  ] = await Promise.all([
    db.user.count({ where: { role: "MEMBER" } }),
    db.user.count({ where: { role: "TRAINER" } }),
    db.user.count({ where: { role: "TRAINER", status: "ACTIVE" } }),
    getMembershipStatusOverview(now),
    db.attendance.count({ where: { attendanceDate: today } }),
    db.attendance.count({ where: { checkOutAt: null } }),
    db.payment.aggregate({ _sum: { amountMinor: true }, where: { status: "SUCCEEDED" } }),
    db.payment.aggregate({
      _sum: { amountMinor: true },
      where: { status: "SUCCEEDED", paidAt: { gte: monthStart } },
    }),
    db.payment.findMany({
      take: RECENT_LIST_SIZE,
      orderBy: { paidAt: "desc" },
      include: { member: true },
    }),
    db.user.findMany({
      where: { role: "MEMBER" },
      take: RECENT_LIST_SIZE,
      orderBy: { createdAt: "desc" },
      include: { memberProfile: true },
    }),
  ]);

  return {
    totalMembers,
    activeMembers: membershipStatusCounts.ACTIVE,
    expiredMemberships: membershipStatusCounts.EXPIRED,
    membersWithoutMembership: totalMembers - membersWithMembership,
    membershipStatusCounts,
    totalTrainers,
    activeTrainers,
    todayAttendanceCount,
    currentlyCheckedInCount,
    totalRevenueMinor: totalRevenue._sum.amountMinor ?? 0,
    monthRevenueMinor: monthRevenue._sum.amountMinor ?? 0,
    recentPayments,
    recentMembers,
  };
}

/**
 * A trainer's own dashboard: everything scoped to members *currently*
 * assigned to them. Deliberately does its own scoped queries here rather
 * than looping trainer-portal.service.ts's per-member functions over the
 * roster — that would be exactly the N+1 pattern this phase's
 * requirements call out to avoid. Instead, the assigned-member id list is
 * fetched once, then every other query filters on `memberId: { in: ... }`
 * in a single round trip.
 */
export async function getTrainerDashboard(actor: Actor) {
  if (!canViewTrainerDashboard(actor)) {
    throw new ForbiddenError("Only trainers can view the trainer dashboard.");
  }

  const today = startOfDay(new Date());

  const assignments = await db.trainerAssignment.findMany({
    where: { trainerId: actor.id, status: "ACTIVE" },
    select: { memberId: true },
  });
  const assignedMemberIds = assignments.map((a) => a.memberId);

  const [todaysAttendance, activeWorkoutPlanCount, totalWorkoutPlanCount, recentProgress] =
    await Promise.all([
      db.attendance.findMany({
        where: { memberId: { in: assignedMemberIds }, attendanceDate: today },
        include: { member: true },
        orderBy: { checkInAt: "desc" },
      }),
      db.workoutPlan.count({ where: { trainerId: actor.id, status: "ACTIVE" } }),
      db.workoutPlan.count({ where: { trainerId: actor.id } }),
      db.progressLog.findMany({
        where: { memberId: { in: assignedMemberIds } },
        orderBy: { recordedAt: "desc" },
        take: RECENT_LIST_SIZE,
        include: { member: true },
      }),
    ]);

  return {
    assignedMemberCount: assignedMemberIds.length,
    todayCheckInCount: todaysAttendance.length,
    currentlyCheckedIn: todaysAttendance.filter((a) => !a.checkOutAt),
    activeWorkoutPlanCount,
    totalWorkoutPlanCount,
    recentProgress,
  };
}

/**
 * A member's own dashboard. Every figure here comes from calling this
 * codebase's existing self-access service functions (membership,
 * attendance, workout plan, progress) rather than re-querying the same
 * tables directly — each of those functions already independently
 * re-checks "is this actor allowed to see this member's data" (trivially
 * true here, since a member always asks about themself), so reusing them
 * means this dashboard can't drift from the authorization rules those
 * services already enforce everywhere else they're used.
 */
export async function getMemberDashboard(actor: Actor) {
  if (!canViewMemberDashboard(actor)) {
    throw new ForbiddenError("Only a member can view their own dashboard.");
  }

  const [memberships, attendanceHistory, workoutPlans, progress] = await Promise.all([
    listMembershipsForMember(actor, actor.id),
    listAttendanceForMember(actor, actor.id, 1),
    listWorkoutPlansForMember(actor, actor.id),
    listProgressForMember(actor, actor.id),
  ]);

  const now = new Date();
  const activeMembership = memberships.find((m) => isMembershipCurrentlyActive(m, now));
  const currentMembership = activeMembership ?? memberships[0] ?? null;

  const currentWorkoutPlan =
    workoutPlans.find((plan) => plan.status === "ACTIVE") ?? workoutPlans[0] ?? null;

  return {
    membershipStatus: currentMembership
      ? {
          isCurrentlyActive: !!activeMembership,
          planName: currentMembership.planNameSnapshot,
          startDate: currentMembership.startDate,
          endDate: currentMembership.endDate,
          status: currentMembership.status,
        }
      : null,
    recentAttendance: attendanceHistory.items.slice(0, RECENT_LIST_SIZE),
    currentWorkoutPlan,
    recentProgress: progress.slice(0, RECENT_LIST_SIZE),
  };
}

// Derived from each function's own inferred return type, rather than
// hand-written ahead of it, so a page importing these can never drift out
// of sync with what the function actually returns.
export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;
export type TrainerDashboardData = Awaited<ReturnType<typeof getTrainerDashboard>>;
export type MemberDashboardData = Awaited<ReturnType<typeof getMemberDashboard>>;
