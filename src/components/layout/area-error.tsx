"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

/**
 * Error boundary body for a role area (admin / trainer / member).
 *
 * Because each role's `error.tsx` sits *inside* that role's layout, a page
 * that throws now fails inside the app shell — the sidebar, tab bar and
 * header all stay put — instead of the root boundary replacing the whole
 * screen and stranding the user with no navigation. Only the digest (an
 * opaque server reference) is ever shown, never the error message or stack.
 */
export function AreaError({
  error,
  reset,
  homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
}) {
  useEffect(() => {
    console.error("Unhandled render error:", error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      tone="danger"
      eyebrow="Something went wrong"
      title="We couldn't load this page"
      description="This is on our side, not yours. Try again — if it keeps happening, let an admin know."
      actions={
        <>
          <Button onClick={reset} className="w-full sm:w-auto">
            Try again
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href={homeHref}>Go to dashboard</Link>}
          />
        </>
      }
    >
      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </StatusScreen>
  );
}
