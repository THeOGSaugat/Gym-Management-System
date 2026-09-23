"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

/**
 * Thin wrappers over Base UI's Dialog, which handles focus trapping, focus
 * restoration, scroll locking and `aria-modal` semantics for us.
 *
 * `DialogPopup` supports two shapes: a centred modal (default) and a
 * `side="left"` sheet used for the admin's mobile navigation drawer. Both
 * are constrained to the viewport with their own internal scrolling, so a
 * long dialog is usable at 375px rather than overflowing off-screen.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100",
        className
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  side = "center",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "center" | "left" }) {
  return (
    <DialogPrimitive.Popup
      data-slot="dialog-popup"
      className={cn(
        "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-200",
        side === "center" &&
          "top-1/2 left-1/2 max-h-[min(38rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border data-closed:scale-95 data-closed:opacity-0",
        side === "left" &&
          "inset-y-0 left-0 h-dvh w-[min(20rem,88vw)] border-r border-border data-closed:-translate-x-full",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
