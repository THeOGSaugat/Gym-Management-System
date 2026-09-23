"use client";

import { AreaError } from "@/components/layout/area-error";

/**
 * Root error boundary — the last resort, for errors outside any role area
 * (the landing page, login). Errors inside /admin, /trainer and /member are
 * caught earlier by those areas' own boundaries, which keep the app shell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AreaError error={error} reset={reset} homeHref="/dashboard" />;
}
