"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

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
      <FormSection
        title="Plan"
        description={
          mode === "create"
            ? "You'll add training days and exercises once the plan exists."
            : undefined
        }
      >
        <Field label="Plan name" htmlFor="name" className="sm:col-span-2">
          <Input
            id="name"
            name="name"
            required
            disabled={pending}
            defaultValue={defaultValues?.name}
            placeholder="e.g. Strength Block 1"
          />
        </Field>
        <Field label="Start date" htmlFor="startDate" optional hint="Leave blank to start today.">
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.startDate}
            aria-describedby="startDate-hint"
          />
        </Field>
        <Field label="End date" htmlFor="endDate" optional>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.endDate}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="description"
          optional
          hint="What this block is for — the member sees this at the top of their plan."
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            name="description"
            rows={2}
            disabled={pending}
            defaultValue={defaultValues?.description}
            aria-describedby="description-hint"
          />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create plan"
              : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
