"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { NAV_BY_ROLE } from "@/components/layout/nav-config";
import type { Role } from "@/generated/prisma/client";

/**
 * Mobile navigation for roles with more sections than a tab bar can hold
 * (ADMIN). A left sheet with the same grouped destinations as the desktop
 * sidebar, at full touch size.
 *
 * It closes itself on navigation — without that, tapping a link would leave
 * the drawer covering the page it just navigated to, since Next.js client
 * navigation doesn't unmount the layout.
 */
export function MobileNavDrawer({
  role,
  roleLabel,
  userName,
  unreadNotificationCount,
}: {
  role: Role;
  roleLabel: string;
  userName: string;
  unreadNotificationCount: number;
}) {
  const [open, setOpen] = useState(false);
  const nav = NAV_BY_ROLE[role];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        }
      />
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup side="left">
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <BrandMark href={nav.home} role={roleLabel} compact />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <DialogTitle className="sr-only">Navigation</DialogTitle>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavLinks
              role={role}
              unreadNotificationCount={unreadNotificationCount}
              onNavigate={() => setOpen(false)}
            />
          </div>

          <div className="shrink-0 border-t border-border px-5 py-4 pb-safe">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Signed in as {roleLabel.toLowerCase()}</p>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
