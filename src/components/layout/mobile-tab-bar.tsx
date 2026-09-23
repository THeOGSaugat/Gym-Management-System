"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";
import { cn } from "cn";

/**
 * The persistent bottom navigation for MEMBER and TRAINER on phones.
 *
 * These roles have a small, task-shaped set of destinations, which is
 * exactly what a tab bar is for: every primary section is one thumb-reach
 * tap away from every other, with no menu to open first. Each tab is a full
 * 56px-tall target, sits above the iOS home indicator via `pb-safe`, and
 * marks the current section with a filled icon tile, a brand-coloured label
 * and `aria-current` rather than colour alone.
 */
export function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role].tabs;

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm pb-safe lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-primary-subtle" : "bg-transparent"
                  )}
                >
                  <Icon className={cn("size-5", active && "stroke-[2.25]")} />
                </span>
                <span className="w-full truncate text-center">
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
