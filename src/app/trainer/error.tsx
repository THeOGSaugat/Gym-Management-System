"use client";

import { AreaError } from "@/components/layout/area-error";

export default function TrainerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AreaError error={error} reset={reset} homeHref="/trainer/dashboard" />;
}
