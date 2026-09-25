"use client";

import { useState } from "react";
import Link from "next/link";
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
import { navFont } from "@/components/marketing/landing-ui";
import { cn } from "cn";

type NavLink = { label: string; href: string };

/**
 * The landing page's phone menu: the same section links as the desktop bar,
 * stacked at full touch size, plus the primary actions. It closes itself
 * when a link is tapped so an in-page anchor jump isn't hidden under the
 * sheet.
 */
export function PublicMobileMenu({
  links,
  primaryHref,
  primaryLabel,
}: {
  links: NavLink[];
  primaryHref: string;
  primaryLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu" className="text-white hover:bg-white/10 hover:text-white md:hidden">
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        }
      />
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup side="left" className="border-white/10 bg-ink text-white">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <DialogTitle>Menu</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>
          <nav aria-label="Site" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  navFont.className,
                  "flex min-h-12 items-center rounded-lg px-3 text-base font-semibold tracking-[0.06em] text-white/85 uppercase hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4 pb-safe">
            <Link
              href={primaryHref}
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-ink hover:bg-brand-strong"
            >
              {primaryLabel}
            </Link>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
