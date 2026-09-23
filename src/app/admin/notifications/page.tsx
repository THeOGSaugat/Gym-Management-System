import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listNotifications } from "@/server/services/notification.service";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function AdminNotificationsPage() {
  const actor = await requireRole("ADMIN");

  // listNotifications is self-scoped by actor.id — an admin sees only their
  // own notifications here, never a gym-wide feed of everyone else's (see
  // canAccessNotification: this is the one resource with no admin override).
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
