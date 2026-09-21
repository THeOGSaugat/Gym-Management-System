"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AttendanceActionState } from "@/app/member/attendance/actions";

export function CheckInOutButton({
  isCheckedIn,
  checkInAction,
  checkOutAction,
}: {
  isCheckedIn: boolean;
  checkInAction: (state: AttendanceActionState) => Promise<AttendanceActionState>;
  checkOutAction: (state: AttendanceActionState) => Promise<AttendanceActionState>;
}) {
  const [state, formAction, pending] = useActionState<AttendanceActionState, FormData>(
    isCheckedIn ? checkOutAction : checkInAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <Button type="submit" size="lg" disabled={pending} variant={isCheckedIn ? "outline" : "default"}>
          {pending ? (isCheckedIn ? "Checking out…" : "Checking in…") : isCheckedIn ? "Check out" : "Check in"}
        </Button>
      </form>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
