import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

/**
 * A styled native `<select>`.
 *
 * This is deliberately NOT the Base UI `Select` in components/ui/select.tsx.
 * Every dropdown in this app lives in one of two places: a zero-JS GET
 * filter form (the admin list pages, which submit without any client
 * component at all) or a Server Action form that is expected to keep
 * working when JavaScript hasn't loaded. A native `<select>` submits its
 * value with the form in both cases, is keyboard- and screen-reader-native,
 * and gets the platform's own picker UI on mobile — which is a better touch
 * experience than a custom listbox, not a worse one.
 *
 * What was actually wrong before this component existed is that the same
 * ~6 utility classes were copy-pasted into eight different files, at two
 * different heights. That's what this fixes: one styled control, matching
 * `Input`, used everywhere. The Base UI `Select` remains available for a
 * future case that genuinely needs rich option rendering.
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-card py-1 pr-9 pl-3 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
