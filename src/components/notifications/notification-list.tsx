import Link from "next/link";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Dumbbell,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "cn";
import { zoned } from "@/lib/time-zone";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

type Presentation = { icon: LucideIcon; label: string; tone: "info" | "warning" | "danger" | "success" };

/**
 * Each notification type gets its own icon and tone so a feed can be
 * scanned rather than read: a money event looks different from a coaching
 * event, and the two membership types are visibly "attention needed"
 * (warning/danger) rather than sharing one neutral style.
 */
const PRESENTATION: Record<string, Presentation> = {
  MEMBERSHIP_EXPIRING: { icon: CalendarClock, label: "Membership", tone: "warning" },
  MEMBERSHIP_EXPIRED: { icon: CircleAlert, label: "Membership", tone: "danger" },
  PAYMENT_RECORDED: { icon: CreditCard, label: "Payment", tone: "success" },
  WORKOUT_PLAN_ASSIGNED: { icon: Dumbbell, label: "Workout plan", tone: "info" },
  TRAINER_ASSIGNED: { icon: UserRound, label: "Trainer", tone: "info" },
};

const TONE_CLASSES: Record<Presentation["tone"], string> = {
  info: "bg-info-subtle text-info-foreground",
  warning: "bg-warning-subtle text-warning-foreground",
  danger: "bg-destructive-subtle text-destructive-foreground",
  success: "bg-success-subtle text-success-foreground",
};

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatTimestamp(date: Date): string {
  return isToday(date)
    ? date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }))
    : date.toLocaleDateString(undefined, zoned({ day: "numeric", month: "short", year: "numeric" }));
}

function NotificationItem({
  notification,
  markAsReadAction,
}: {
  notification: NotificationRow;
  markAsReadAction: (id: string) => Promise<void>;
}) {
  const presentation = PRESENTATION[notification.type] ?? {
    icon: Bell,
    label: "Update",
    tone: "info" as const,
  };
  const Icon = presentation.icon;
  const boundMarkAsRead = markAsReadAction.bind(null, notification.id);

  return (
    <li
      className={cn(
        "relative flex gap-3 rounded-xl border p-4 shadow-xs transition-colors",
        notification.isRead
          ? "border-border bg-card"
          : "border-border-strong bg-card ring-1 ring-primary/10"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          TONE_CLASSES[presentation.tone]
        )}
      >
        <Icon className="size-4.5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "text-sm",
              notification.isRead ? "font-medium text-foreground" : "font-semibold text-foreground"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-subtle-foreground">
              New
            </span>
          ) : null}
        </div>

        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          {notification.message}
        </p>

        <p className="text-xs text-muted-foreground">
          <span className="sr-only">Received </span>
          {formatTimestamp(notification.createdAt)}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {notification.linkUrl ? (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={
                <Link href={notification.linkUrl}>
                  Open
                  <ChevronRight aria-hidden="true" />
                </Link>
              }
            />
          ) : null}
          {!notification.isRead ? (
            <form action={boundMarkAsRead}>
              <Button type="submit" size="sm" variant="ghost">
                Mark as read
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Shared across all three role areas — a notification looks the same
 * whoever is reading it, so only the surrounding page (which fetches the
 * list and binds the actions to the right role's requireRole /
 * revalidatePath) is role-specific.
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
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="Membership reminders, payments and new workout plans will show up here."
      />
    );
  }

  const today = notifications.filter((n) => isToday(n.createdAt));
  const earlier = notifications.filter((n) => !isToday(n.createdAt));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" role="status">
          {unreadCount === 0
            ? "You're all caught up."
            : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
        </p>
        {unreadCount > 0 ? (
          <form action={markAllAsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        ) : null}
      </div>

      {today.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Today
          </h2>
          <ul className="flex flex-col gap-2">
            {today.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                markAsReadAction={markAsReadAction}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {earlier.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Earlier
          </h2>
          <ul className="flex flex-col gap-2">
            {earlier.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                markAsReadAction={markAsReadAction}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
