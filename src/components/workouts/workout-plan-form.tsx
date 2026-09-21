"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type WorkoutPlanFormState = { error: string } | undefined;

export function WorkoutPlanForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: WorkoutPlanFormState, formData: FormData) => Promise<WorkoutPlanFormState>;
  defaultValues?: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const [state, formAction, pending] = useActionState<WorkoutPlanFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Plan name</Label>
        <Input
          id="name"
          name="name"
          required
          disabled={pending}
          defaultValue={defaultValues?.name}
          placeholder="Strength Block 1"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          disabled={pending}
          defaultValue={defaultValues?.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.startDate}
          />
          <p className="text-xs text-muted-foreground">Leave blank to start today.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.endDate}
          />
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create plan"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
