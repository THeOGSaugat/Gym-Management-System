import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "cn";

type Tone = "success" | "error" | "info";

const TONES: Record<Tone, { icon: typeof CircleCheck; className: string; role: "status" | "alert" }> = {
  success: {
    icon: CircleCheck,
    className: "border-success-border bg-success-subtle text-success-foreground",
    role: "status",
  },
  error: {
    icon: CircleAlert,
    className: "border-destructive-border bg-destructive-subtle text-destructive-foreground",
    role: "alert",
  },
  info: {
    icon: Info,
    className: "border-info-border bg-info-subtle text-info-foreground",
    role: "status",
  },
};

/**
 * Feedback after an action, rendered on the server.
 *
 * This is deliberately not a toast library. Every mutation in this app is a
 * Server Action that re-renders the page, so a server-rendered banner
 * communicates the result without introducing a client-side provider,
 * client state, or a second source of truth for "did that work" — and
 * unlike a toast it doesn't disappear before a screen reader or a
 * distracted user gets to it. `role="status"` (or `role="alert"` for
 * failures) means assistive tech announces it when it appears.
 */
export function ActionFeedback({
  tone = "success",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClassName, role } = TONES[tone];

  return (
    <p
      role={role}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium",
        toneClassName,
        className
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
