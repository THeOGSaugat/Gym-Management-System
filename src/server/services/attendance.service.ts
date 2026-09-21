import { db } from "@/server/db";
import {
  canRecordAttendanceFor,
  canViewAttendanceFor,
  canViewAllAttendance,
  type Actor,
} from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { startOfDay } from "@/lib/date";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import type { AttendanceMethod } from "@/generated/prisma/client";

const HISTORY_PAGE_SIZE = 20;

async function findOpenSession(memberId: string) {
  return db.attendance.findFirst({ where: { memberId, checkOutAt: null } });
}

async function requireMember(memberId: string) {
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }
  return member;
}

/**
 * Checks a member in. `method` exists specifically so a future QR-code
 * check-in flow — decode the QR payload to a memberId, then call this
 * exact function with method: "QR" — requires zero changes here. There
 * is deliberately no timestamp parameter: check-in time is always the
 * server's own clock at the moment this runs, never a client-supplied
 * value (see the Attendance model's comment in schema.prisma).
 */
export async function checkIn(
  actor: Actor,
  memberId: string,
  method: AttendanceMethod = "MANUAL",
) {
  if (!canRecordAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You can only check yourself in.");
  }

  await requireMember(memberId);

  const openSession = await findOpenSession(memberId);
  if (openSession) {
    throw new ConflictError("You're already checked in. Check out first.");
  }

  const now = new Date();

  try {
    return await db.attendance.create({
      data: {
        memberId,
        checkInAt: now,
        attendanceDate: startOfDay(now),
        method,
        recordedByUserId: actor.id,
      },
    });
  } catch (error) {
    // Defense-in-depth against a race between the check above and this
    // insert (e.g. a double-tapped button or two open tabs) — caught by
    // the partial unique index on (memberId) WHERE checkOutAt IS NULL.
    if (isUniqueConstraintError(error, "memberId")) {
      throw new ConflictError("You're already checked in. Check out first.");
    }
    throw error;
  }
}

export async function checkOut(actor: Actor, memberId: string) {
  if (!canRecordAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You can only check yourself out.");
  }

  await requireMember(memberId);

  const openSession = await findOpenSession(memberId);
  if (!openSession) {
    throw new ConflictError("You don't have an active check-in to check out from.");
  }

  return db.attendance.update({
    where: { id: openSession.id },
    data: { checkOutAt: new Date() },
  });
}

type AttendanceRecord = NonNullable<Awaited<ReturnType<typeof findOpenSession>>>;

export type TodayStatus = {
  openSession: AttendanceRecord | null;
  todaysRecords: AttendanceRecord[];
};

/** A member's (or, for an admin, any member's) status for the current day. */
export async function getTodayStatus(actor: Actor, memberId: string): Promise<TodayStatus> {
  if (!canViewAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's attendance.");
  }

  const today = startOfDay(new Date());

  const [openSession, todaysRecords] = await Promise.all([
    findOpenSession(memberId),
    db.attendance.findMany({
      where: { memberId, attendanceDate: today },
      orderBy: { checkInAt: "desc" },
    }),
  ]);

  return { openSession, todaysRecords };
}

export async function listAttendanceForMember(actor: Actor, memberId: string, page = 1) {
  if (!canViewAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's attendance.");
  }

  const safePage = Math.max(1, page);
  const where = { memberId };

  const [items, total] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: { checkInAt: "desc" },
      skip: (safePage - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    db.attendance.count({ where }),
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
}

/** Admin-only: everyone's attendance for today, most recent check-in first. */
export async function listTodayAttendance(actor: Actor) {
  if (!canViewAllAttendance(actor)) {
    throw new ForbiddenError("Only admins can view all members' attendance.");
  }

  const today = startOfDay(new Date());

  return db.attendance.findMany({
    where: { attendanceDate: today },
    include: { member: true },
    orderBy: { checkInAt: "desc" },
  });
}

export type AttendanceHistoryParams = {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
};

/** Admin-only: gym-wide attendance history, searchable by member and filterable by date range. */
export async function listAttendanceHistory(actor: Actor, params: AttendanceHistoryParams = {}) {
  if (!canViewAllAttendance(actor)) {
    throw new ForbiddenError("Only admins can view attendance history.");
  }

  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  const where = {
    ...(params.dateFrom || params.dateTo
      ? {
          attendanceDate: {
            ...(params.dateFrom ? { gte: startOfDay(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: startOfDay(params.dateTo) } : {}),
          },
        }
      : {}),
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
    db.attendance.findMany({
      where,
      include: { member: true },
      orderBy: { checkInAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    db.attendance.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
}
