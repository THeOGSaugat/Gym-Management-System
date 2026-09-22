import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  createNotification,
  createNotificationOnce,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const member: Actor = { id: "member-1", role: "MEMBER" };
const otherMember: Actor = { id: "member-2", role: "MEMBER" };
const admin: Actor = { id: "admin-1", role: "ADMIN" };

const baseNotification = {
  id: "notif-1",
  recipientUserId: "member-1",
  type: "PAYMENT_RECORDED" as const,
  title: "Payment recorded",
  message: "A payment was recorded.",
  linkUrl: "/member/payments",
  relatedEntityId: "payment-1",
  isRead: false,
  readAt: null,
  createdAt: new Date(),
};

describe("createNotification", () => {
  it("creates a row with the given fields, unauthenticated by design", async () => {
    prismaMock.notification.create.mockResolvedValue(baseNotification);

    await createNotification({
      recipientUserId: "member-1",
      type: "PAYMENT_RECORDED",
      title: "Payment recorded",
      message: "A payment was recorded.",
      linkUrl: "/member/payments",
      relatedEntityId: "payment-1",
    });

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: {
        recipientUserId: "member-1",
        type: "PAYMENT_RECORDED",
        title: "Payment recorded",
        message: "A payment was recorded.",
        linkUrl: "/member/payments",
        relatedEntityId: "payment-1",
      },
    });
  });
});

describe("createNotificationOnce", () => {
  it("creates a new notification when none exists for this recipient/type/relatedEntityId", async () => {
    prismaMock.notification.findFirst.mockResolvedValue(null);
    prismaMock.notification.create.mockResolvedValue(baseNotification);

    await createNotificationOnce({
      recipientUserId: "member-1",
      type: "MEMBERSHIP_EXPIRING",
      title: "Membership expiring soon",
      message: "Your membership expires soon.",
      relatedEntityId: "membership-1",
    });

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });

  it("skips creating a duplicate when one already exists for the same related entity", async () => {
    prismaMock.notification.findFirst.mockResolvedValue(baseNotification);

    const result = await createNotificationOnce({
      recipientUserId: "member-1",
      type: "MEMBERSHIP_EXPIRING",
      title: "Membership expiring soon",
      message: "Your membership expires soon.",
      relatedEntityId: "membership-1",
    });

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
    expect(result).toEqual(baseNotification);
  });
});

describe("listNotifications", () => {
  it("scopes to the actor's own recipientUserId only", async () => {
    prismaMock.notification.findMany.mockResolvedValue([baseNotification]);

    await listNotifications(member);

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientUserId: "member-1" } }),
    );
  });

  it("filters to unread only when asked", async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);

    await listNotifications(member, { unreadOnly: true });

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientUserId: "member-1", isRead: false } }),
    );
  });
});

describe("getUnreadNotificationCount", () => {
  it("counts only this actor's unread notifications", async () => {
    prismaMock.notification.count.mockResolvedValue(3);

    await expect(getUnreadNotificationCount(member)).resolves.toBe(3);
    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { recipientUserId: "member-1", isRead: false },
    });
  });
});

describe("markNotificationAsRead", () => {
  it("throws NotFoundError for a missing id", async () => {
    prismaMock.notification.findUnique.mockResolvedValue(null);
    await expect(markNotificationAsRead(member, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the notification belongs to someone else", async () => {
    prismaMock.notification.findUnique.mockResolvedValue(baseNotification);
    await expect(markNotificationAsRead(otherMember, "notif-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(prismaMock.notification.update).not.toHaveBeenCalled();
  });

  it("denies even an admin trying to mark someone else's notification read", async () => {
    prismaMock.notification.findUnique.mockResolvedValue(baseNotification);
    await expect(markNotificationAsRead(admin, "notif-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("marks the recipient's own notification as read", async () => {
    prismaMock.notification.findUnique.mockResolvedValue(baseNotification);
    prismaMock.notification.update.mockResolvedValue({ ...baseNotification, isRead: true });

    await markNotificationAsRead(member, "notif-1");

    expect(prismaMock.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "notif-1" }, data: expect.objectContaining({ isRead: true }) }),
    );
  });

  it("is a no-op (no update call) when already read", async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ ...baseNotification, isRead: true });

    await markNotificationAsRead(member, "notif-1");

    expect(prismaMock.notification.update).not.toHaveBeenCalled();
  });
});

describe("markAllNotificationsAsRead", () => {
  it("only updates the actor's own unread notifications", async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 4 });

    await markAllNotificationsAsRead(member);

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { recipientUserId: "member-1", isRead: false },
      data: expect.objectContaining({ isRead: true }),
    });
  });
});
