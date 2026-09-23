import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listNotifications } from "@/server/services/notification.service";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader title="Notifications" />
      <NotificationList
        notifications={notifications}
        markAsReadAction={markNotificationReadAction}
        markAllAsReadAction={markAllNotificationsReadAction}
      />
    </div>
  );
}
