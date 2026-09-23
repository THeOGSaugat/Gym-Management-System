"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";
import { cn } from "cn";

/**
 * The grouped navigation list shared by the desktop sidebar and the mobile
 * drawer, so both always show the same destinations in the same order.
 *
 * The current route is signalled three ways at once — a tinted background,
 * a brand-coloured left rail, and a heavier font weight — plus
 * `aria-current="page"` for assistive tech, so "where am I" never depends
 * on colour perception alone.
 */
export function NavLinks({
  role,
  unreadNotificationCount = 0,
  onNavigate,
}: {
  /**
   * The role is passed rather than the resolved nav items because those
   * items carry Lucide icon *components*, which can't cross the
   * server→client boundary as props. Client components look the config up
   * themselves; only the role string travels.
   */
  role: Role;
  unreadNotificationCount?: number;
  /** Called after a link is activated — used by the drawer to close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { groups, notificationsHref } = NAV_BY_ROLE[role];

  return (
    <nav className="flex flex-col gap-6" aria-label="Main">
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-1">
          {group.label ? (
            <p className="px-3 pb-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              const showsUnread =
                unreadNotificationCount > 0 &&
                notificationsHref !== undefined &&
                item.href === notificationsHref;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary-subtle font-semibold text-primary-subtle-foreground"
                        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                      />
                    ) : null}
                    <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {showsUnread ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground tabular-nums">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                        <span className="sr-only"> unread notifications</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
