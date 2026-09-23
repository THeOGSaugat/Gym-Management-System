"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";

export type WorkoutDayFormState = { error: string } | undefined;

export function AddWorkoutDayForm({
  action,
}: {
  action: (state: WorkoutDayFormState, formData: FormData) => Promise<WorkoutDayFormState>;
}) {
  const [state, formAction, pending] = useActionState<WorkoutDayFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="label">Day name</Label>
        <Input
          id="label"
          name="label"
          required
          disabled={pending}
          placeholder="e.g. Monday or Push Day"
        />
        {state?.error ? (
          <ActionFeedback tone="error">{state.error}</ActionFeedback>
        ) : null}
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Adding…" : "Add day"}
      </Button>
    </form>
  );
}
