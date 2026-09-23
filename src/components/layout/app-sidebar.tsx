import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";

/**
 * The persistent desktop navigation (lg and up). Identity at the top,
 * destinations in the middle, account at the bottom — so the two things a
 * user looks for most ("where can I go", "who am I signed in as") are always
 * in the same place, and the page body never has to carry navigation.
 */
export function AppSidebar({
  role,
  roleLabel,
  userName,
  userEmail,
  unreadNotificationCount,
}: {
  role: Role;
  roleLabel: string;
  userName: string;
  userEmail?: string;
  unreadNotificationCount: number;
}) {
  const nav = NAV_BY_ROLE[role];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
        <BrandMark href={nav.home} role={roleLabel} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavLinks role={role} unreadNotificationCount={unreadNotificationCount} />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.8125rem] font-semibold text-foreground"
          >
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{userName}</span>
            {userEmail ? (
              <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
            ) : null}
          </span>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            block
            className="mt-1 justify-start text-muted-foreground"
          >
            <LogOut aria-hidden="true" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
