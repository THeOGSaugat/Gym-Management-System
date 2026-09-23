"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useFormStatus } from "react-dom";
import { TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type Tone = "destructive" | "default";

function ConfirmSubmitButton({ label, tone }: { label: string; tone: Tone }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={tone === "destructive" ? "destructive" : "default"}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? "Working…" : label}
    </Button>
  );
}

/**
 * The confirmation step in front of every destructive action in the app.
 *
 * It wraps a Server Action in an accessible alert dialog: the action itself
 * is unchanged — still a plain `<form action={serverAction}>` submitting to
 * the same function — the dialog just stands between the trigger and that
 * submit. Base UI's AlertDialog traps focus, is announced with the title
 * and description as its accessible name, and (unlike a plain Dialog)
 * doesn't dismiss on an outside click, so the choice has to be deliberate.
 *
 * Danger is never signalled by colour alone: the popup carries a warning
 * icon, an explicit "what happens" description, an optional list of
 * consequences, and an explicit reversibility note.
 *
 * Trade-off worth knowing: because the dialog is client-rendered, a
 * destructive action requires JavaScript, where previously it was a raw
 * form post that worked without it. That is deliberate — for irreversible
 * operations, a confirmation step is worth more than no-JS support, and
 * every non-destructive flow in the app remains progressively enhanced.
 */
export function ConfirmAction({
  action,
  title,
  description,
  consequences,
  reversibility,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "destructive",
  formFields,
  triggerLabel,
  triggerVariant,
  triggerSize = "default",
  triggerIcon: TriggerIcon,
  triggerClassName,
  triggerAriaLabel,
  hideTriggerLabel = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description: string;
  consequences?: string[];
  reversibility?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  /**
   * Optional inputs rendered inside the confirmation's own form — e.g. a
   * "reason" field captured at the moment of confirming, which is where
   * someone is actually thinking about why they're doing it.
   */
  formFields?: React.ReactNode;
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  triggerIcon?: LucideIcon;
  triggerClassName?: string;
  /** Use when the trigger shows only an icon, so it still has an accessible name. */
  triggerAriaLabel?: string;
  hideTriggerLabel?: boolean;
}) {
  const resolvedTriggerVariant =
    triggerVariant ?? (tone === "destructive" ? "destructive-subtle" : "outline");

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        render={
          <Button
            variant={resolvedTriggerVariant}
            size={triggerSize}
            className={cn(triggerClassName)}
            aria-label={triggerAriaLabel}
          >
            {TriggerIcon ? <TriggerIcon aria-hidden="true" /> : null}
            {hideTriggerLabel ? (
              <span className="sr-only">{triggerLabel}</span>
            ) : (
              triggerLabel
            )}
          </Button>
        }
      />

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100" />
        <AlertDialog.Popup
          className={cn(
            "fixed z-50 flex flex-col gap-4 bg-popover p-5 text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-200",
            // Bottom sheet on phones, centred dialog from `sm` up.
            "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border pb-[max(1.25rem,env(safe-area-inset-bottom))] data-closed:translate-y-full",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(28rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:pb-5 sm:data-closed:translate-y-[-48%] sm:data-closed:scale-95 sm:data-closed:opacity-0"
          )}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                tone === "destructive"
                  ? "bg-destructive-subtle text-destructive-foreground"
                  : "bg-primary-subtle text-primary-subtle-foreground"
              )}
            >
              <TriangleAlert className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <AlertDialog.Title className="text-base font-semibold tracking-[-0.01em]">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {consequences && consequences.length > 0 ? (
            <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {consequences.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-muted-foreground/60">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {reversibility ? (
            <p className="text-[0.8125rem] font-medium text-foreground">{reversibility}</p>
          ) : null}

          <form action={action} className="flex flex-col gap-4">
            {formFields}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                render={
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    {cancelLabel}
                  </Button>
                }
              />
              <div className="w-full sm:w-auto">
                <ConfirmSubmitButton label={confirmLabel} tone={tone} />
              </div>
            </div>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
