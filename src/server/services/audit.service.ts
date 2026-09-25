import { db } from "@/server/db";
import { canViewAuditLog, type Actor } from "@/lib/auth/policies";
import { ForbiddenError } from "@/lib/errors";
import { clampPage } from "@/lib/pagination";
import type { AuditAction, Prisma } from "@/generated/prisma/client";

/**
 * What happened, described by the service that made it happen. The actor
 * is never part of this — it always comes from the session `actor`
 * passed to withAudit(), so a caller can't attribute an action to
 * someone else.
 */
export type AuditEntry = {
  action: AuditAction;
  entityType: string;
  entityId: string;
  /** The member/trainer the action concerns, if any. */
  subjectUserId?: string;
  /** One readable line, e.g. "Suspended member Mo Member". */
  summary: string;
  /** Small structured detail. Never passwords, hashes or other secrets. */
  metadata?: Prisma.InputJsonValue;
};

type Tx = Prisma.TransactionClient;

/**
 * Runs a mutation and writes its audit row in the same database
 * transaction: if either fails, neither is saved, so there is never a
 * change without its log entry (or a log entry for a change that didn't
 * happen). `describe` receives the mutation's result, so the entry can
 * use the saved row's id and values.
 */
export function withAudit<T>(
  actor: Actor,
  mutate: (tx: Tx) => Promise<T>,
  describe: (result: T) => AuditEntry,
): Promise<T> {
  return db.$transaction(async (tx) => {
    const result = await mutate(tx);
    await recordAudit(tx, actor, describe(result));
    return result;
  });
}

/** For services that already run their own transaction: append inside it. */
export async function recordAudit(tx: Tx, actor: Actor, entry: AuditEntry) {
  await tx.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      subjectUserId: entry.subjectUserId,
      summary: entry.summary,
      metadata: entry.metadata,
    },
  });
}

const AUDIT_PAGE_SIZE = 25;

export type ListAuditLogsParams = {
  page?: number;
  action?: AuditAction;
  subjectUserId?: string;
};

/** Admin-only, newest first. There is deliberately no update or delete. */
export async function listAuditLogs(actor: Actor, params: ListAuditLogsParams = {}) {
  if (!canViewAuditLog(actor)) {
    throw new ForbiddenError("Only admins can view the audit log.");
  }

  const page = clampPage(params.page);
  const where: Prisma.AuditLogWhereInput = {
    action: params.action,
    subjectUserId: params.subjectUserId,
  };

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { id: true, fullName: true, role: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
  };
}
