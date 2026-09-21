"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            disabled={pending}
            defaultValue={defaultValues?.name}
            placeholder="Bench Press"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="muscleGroup">Muscle group</Label>
          <Input
            id="muscleGroup"
            name="muscleGroup"
            disabled={pending}
            defaultValue={defaultValues?.muscleGroup}
            placeholder="Chest"
          />
        </div>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={4}
          disabled={pending}
          defaultValue={defaultValues?.instructions}
          placeholder="How to perform this exercise safely and correctly."
        />
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
              ? "Adding…"
              : "Saving…"
            : mode === "create"
              ? "Add exercise"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
