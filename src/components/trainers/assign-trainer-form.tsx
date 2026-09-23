"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ActionFeedback } from "@/components/ui/action-feedback";
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
        <NativeSelect
          id="trainerId"
          name="trainerId"
          required
          disabled={pending}
          defaultValue={currentTrainerId ?? ""}
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
        </NativeSelect>
        {state?.error ? (
          <ActionFeedback tone="error">{state.error}</ActionFeedback>
        ) : null}
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
