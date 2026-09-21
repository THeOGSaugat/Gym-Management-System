"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <Label htmlFor="label">Add a day</Label>
        <Input
          id="label"
          name="label"
          required
          disabled={pending}
          placeholder="Monday, or &quot;Push Day&quot;"
        />
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Adding…" : "Add day"}
      </Button>
    </form>
  );
}
