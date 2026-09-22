import Link from "next/link";
import { Bell, Dumbbell } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Header shown inside role-scoped areas (admin/trainer/member). Distinct
 * from SiteHeader, which is for public pages — this one always has a
 * signed-in user and a logout action.
 */
export function AppHeader({
  name,
  role,
  unreadNotificationCount = 0,
  notificationsHref,
}: {
  name: string;
  role: string;
  /** Omit (or pass 0) on a page that doesn't have a signed-in actor's notification count handy — the bell just shows with no badge. */
  unreadNotificationCount?: number;
  /** Where the bell links — each role area has its own /notifications page under the same role-gated layout. */
  notificationsHref: string;
}) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Dumbbell className="size-5" aria-hidden="true" />
          <span>Gym Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={notificationsHref}
            className="relative inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
            aria-label={
              unreadNotificationCount > 0
                ? `Notifications (${unreadNotificationCount} unread)`
                : "Notifications"
            }
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>
          <div className="text-right text-sm leading-tight">
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground capitalize">{role.toLowerCase()}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
