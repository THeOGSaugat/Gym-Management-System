"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

export type ExerciseFormState = { error: string } | undefined;

export function ExerciseForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: ExerciseFormState, formData: FormData) => Promise<ExerciseFormState>;
  defaultValues?: {
    name?: string;
    muscleGroup?: string;
    description?: string;
    instructions?: string;
  };
}) {
  const [state, formAction, pending] = useActionState<ExerciseFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormSection title="Exercise">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="e.g. Bench Press"
            required
            disabled={pending}
            defaultValue={defaultValues?.name}
          />
        </Field>
        <Field label="Muscle group" htmlFor="muscleGroup" optional>
          <Input
            id="muscleGroup"
            name="muscleGroup"
            placeholder="e.g. Chest"
            disabled={pending}
            defaultValue={defaultValues?.muscleGroup}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Guidance"
        description="Shown to trainers when they pick this exercise for a workout day."
        columns={1}
      >
        <Field label="Description" htmlFor="description" optional>
          <Textarea
            id="description"
            name="description"
            rows={2}
            disabled={pending}
            defaultValue={defaultValues?.description}
          />
        </Field>
        <Field label="Instructions" htmlFor="instructions" optional>
          <Textarea
            id="instructions"
            name="instructions"
            rows={4}
            disabled={pending}
            defaultValue={defaultValues?.instructions}
          />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending
            ? mode === "create"
              ? "Adding…"
              : "Saving…"
            : mode === "create"
              ? "Add exercise"
              : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
