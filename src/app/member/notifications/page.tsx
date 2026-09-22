import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listNotifications } from "@/server/services/notification.service";
import { NotificationList } from "@/components/notifications/notification-list";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function MemberNotificationsPage() {
  const actor = await requireRole("MEMBER");

  const notifications = await listNotifications(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <NotificationList
        notifications={notifications}
        markAsReadAction={markNotificationReadAction}
        markAllAsReadAction={markAllNotificationsReadAction}
      />
    </div>
  );
}
