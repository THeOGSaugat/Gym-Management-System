import { db } from "@/server/db";
import { canAccessNotification, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { NotificationType } from "@/generated/prisma/client";

const LIST_PAGE_SIZE = 30;

export type CreateNotificationInput = {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  relatedEntityId?: string;
};

/**
 * Creates one notification. Deliberately has no `actor` parameter and no
 * authorization check, unlike every other exported function in this
 * codebase's service layer — there's no "actor" performing this action
 * from the notified user's point of view, it's the system recording
 * that something happened to them. It is never called directly from a
 * page or Server Action; only from other services (membership, payment,
 * workout, assignment) at the exact moment a notification-worthy event
 * happens, the same way those services already write an audit-trail
 * `recordedByUserId`/`createdByUserId` without asking "is this allowed" —
 * the surrounding action already answered that question.
 */
export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      recipientUserId: input.recipientUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl,
      relatedEntityId: input.relatedEntityId,
    },
  });
}

/**
 * Same as createNotification, but skips creating a duplicate if one of
 * the same type already exists for the same recipient + related entity.
 * This is what keeps membership.service.ts's self-healing reads (which
 * run on every page load that touches a membership) from creating a
 * fresh "expiring soon" notification every single time instead of once
 * per membership — the explicit "do not create excessive notifications"
 * requirement, enforced structurally rather than by trusting every call
 * site to remember to check first.
 */
export async function createNotificationOnce(
  input: CreateNotificationInput & { relatedEntityId: string },
) {
  const existing = await db.notification.findFirst({
    where: {
      recipientUserId: input.recipientUserId,
      type: input.type,
      relatedEntityId: input.relatedEntityId,
    },
  });
  if (existing) return existing;

  return createNotification(input);
}

export type ListNotificationsParams = {
  unreadOnly?: boolean;
};

/**
 * A user's own notifications, newest first. Always self-scoped by
 * `actor.id` — there's no target-user parameter for this to even
 * validate, the same "safe by construction" shape as
 * member.service.ts's updateOwnProfile. Capped at LIST_PAGE_SIZE rather
 * than paginated: a notification feed a user hasn't looked at in a
 * while isn't expected to need a "page 2" the way an admin's payment
 * history might.
 */
export async function listNotifications(actor: Actor, params: ListNotificationsParams = {}) {
  return db.notification.findMany({
    where: {
      recipientUserId: actor.id,
      ...(params.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: LIST_PAGE_SIZE,
  });
}

/** The unread count shown as a badge next to the notification bell in every role's header. */
export async function getUnreadNotificationCount(actor: Actor): Promise<number> {
  return db.notification.count({ where: { recipientUserId: actor.id, isRead: false } });
}

export async function markNotificationAsRead(actor: Actor, notificationId: string) {
  const notification = await db.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError("Notification not found.");

  if (!canAccessNotification(actor, notification.recipientUserId)) {
    throw new ForbiddenError("You can only manage your own notifications.");
  }

  if (notification.isRead) return notification;

  return db.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/** Marks every one of the actor's own unread notifications as read in a single query. */
export async function markAllNotificationsAsRead(actor: Actor) {
  return db.notification.updateMany({
    where: { recipientUserId: actor.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
