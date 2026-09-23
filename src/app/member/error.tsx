"use client";

import { AreaError } from "@/components/layout/area-error";

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AreaError error={error} reset={reset} homeHref="/member/dashboard" />;
}
