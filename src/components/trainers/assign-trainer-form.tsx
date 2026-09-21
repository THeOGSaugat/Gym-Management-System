"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AssignTrainerState } from "@/app/admin/members/[id]/assignment/actions";

type TrainerOption = {
  id: string;
  fullName: string;
  specialization?: string | null;
};

export function AssignTrainerForm({
  action,
  trainers,
  currentTrainerId,
  submitLabel,
}: {
  action: (state: AssignTrainerState, formData: FormData) => Promise<AssignTrainerState>;
  trainers: TrainerOption[];
  currentTrainerId?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AssignTrainerState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="trainerId" className="text-sm font-medium">
          Trainer
        </label>
        <select
          id="trainerId"
          name="trainerId"
          required
          disabled={pending}
          defaultValue={currentTrainerId ?? ""}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="" disabled>
            Select a trainer
          </option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.fullName}
              {trainer.specialization ? ` — ${trainer.specialization}` : ""}
            </option>
          ))}
        </select>
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
