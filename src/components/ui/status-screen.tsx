import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

type Tone = "neutral" | "warning" | "danger";

const TONE_ICON: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-subtle text-warning-foreground",
  danger: "bg-destructive-subtle text-destructive-foreground",
};

/**
 * The full-page "something stopped you" layout — 404, 403, and render
 * errors all use it, both at the root (outside the app shell) and inside
 * each role area (where it renders *within* the shell, so the navigation is
 * still there to get out).
 *
 * The status is stated three ways — an icon, a short uppercase eyebrow
 * ("404 · Not found"), and a plain-language heading — so it never depends on
 * the icon's colour to be understood.
 */
export function StatusScreen({
  icon: Icon,
  tone = "neutral",
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center px-4 py-16 sm:px-6",
        className
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <span
          aria-hidden="true"
          className={cn("flex size-12 items-center justify-center rounded-2xl", TONE_ICON[tone])}
        >
          <Icon className="size-6" />
        </span>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">{title}</h1>
          <div className="text-sm leading-relaxed text-muted-foreground">{description}</div>
          {children}
        </div>

        {actions ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
