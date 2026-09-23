import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prev/next pagination for the admin list pages, which all previously
 * carried their own copy of this markup.
 *
 * At a boundary it renders a genuinely disabled `<button>` rather than a
 * styled-disabled link, because the `disabled` attribute does nothing on an
 * anchor — a "disabled" link would still navigate on click and still be
 * focusable.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={className ?? "flex items-center justify-between gap-3"}
    >
      <p className="text-[0.8125rem] text-muted-foreground" aria-live="polite">
        Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
      </p>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={buildHref(page - 1)} rel="prev">
                <ChevronLeft aria-hidden="true" />
                Previous
              </Link>
            }
          />
        )}
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={buildHref(page + 1)} rel="next">
                Next
                <ChevronRight aria-hidden="true" />
              </Link>
            }
          />
        )}
      </div>
    </nav>
  );
}
