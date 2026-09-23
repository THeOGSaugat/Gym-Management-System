import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { cn } from "cn";

/**
 * The product lockup: brand-coloured mark plus wordmark, optionally showing
 * which role's area you're in. The role sits directly under the product name
 * so "what am I signed in as" is answerable without opening a menu.
 */
export function BrandMark({
  href = "/",
  role,
  className,
  compact = false,
}: {
  href?: string;
  role?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs"
      >
        <Dumbbell className="size-4.5" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "truncate font-semibold tracking-[-0.01em]",
            compact ? "text-sm" : "text-[0.9375rem]"
          )}
        >
          Gym Management
        </span>
        {role ? (
          <span className="truncate text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            {role}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
