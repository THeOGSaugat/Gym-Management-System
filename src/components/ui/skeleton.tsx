import { cn } from "cn";

/** A single shimmering placeholder block. Compose these to mirror the shape of the page that's loading. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * The standard page-level loading shape: a header block plus a body. Every
 * `loading.tsx` in the app builds on this so a route transition always
 * resolves into roughly the layout that's about to appear, rather than a
 * spinner that tells the user nothing about what's coming.
 */
function PageSkeleton({
  children,
  withHeaderAction = false,
}: {
  children?: React.ReactNode;
  withHeaderAction?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        {withHeaderAction ? <Skeleton className="h-10 w-32" /> : null}
      </div>
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Placeholder for a list of rows (list pages, history tables, feeds). */
function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl sm:h-14" />
      ))}
    </div>
  );
}

/** Placeholder for a row of stat cards. */
function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

/** Placeholder for a stack of content cards. */
function CardSkeleton({ count = 2, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

export { Skeleton, PageSkeleton, ListSkeleton, StatGridSkeleton, CardSkeleton };
