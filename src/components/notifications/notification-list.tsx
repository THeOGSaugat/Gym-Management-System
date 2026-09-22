import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP_EXPIRING: "Membership",
  MEMBERSHIP_EXPIRED: "Membership",
  PAYMENT_RECORDED: "Payment",
  WORKOUT_PLAN_ASSIGNED: "Workout plan",
  TRAINER_ASSIGNED: "Trainer",
};

/**
 * Shared across all three role areas — every field here is role-agnostic
 * (a notification looks the same regardless of who's viewing it), so
 * only the surrounding page (which fetches the list and binds the mark-
 * as-read actions to the right role's requireRole/revalidatePath) is
 * role-specific, not this presentational component.
 */
export function NotificationList({
  notifications,
  markAsReadAction,
  markAllAsReadAction,
}: {
  notifications: NotificationRow[];
  markAsReadAction: (id: string) => Promise<void>;
  markAllAsReadAction: () => Promise<void>;
}) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount === 0 ? "You're all caught up." : `${unreadCount} unread`}
        </p>
        {unreadCount > 0 ? (
          <form action={markAllAsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map((notification) => {
          const boundMarkAsRead = markAsReadAction.bind(null, notification.id);
          return (
            <Card key={notification.id} className={notification.isRead ? "opacity-60" : undefined}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TYPE_LABELS[notification.type] ?? "Update"}</Badge>
                    {!notification.isRead ? <Badge>New</Badge> : null}
                  </div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.createdAt.toLocaleString()}
                  </p>
                  {notification.linkUrl ? (
                    <Link
                      href={notification.linkUrl}
                      className="w-fit text-sm text-primary hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
                {!notification.isRead ? (
                  <form action={boundMarkAsRead}>
                    <Button type="submit" variant="ghost" size="sm">
                      Mark as read
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
