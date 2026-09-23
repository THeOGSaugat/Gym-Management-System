"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field } from "@/components/ui/form-field";

export type WorkoutExerciseFormState = { error: string } | undefined;

type ExerciseOption = { id: string; name: string; muscleGroup?: string | null };

export function AddWorkoutExerciseForm({
  action,
  exercises,
}: {
  action: (
    state: WorkoutExerciseFormState,
    formData: FormData,
  ) => Promise<WorkoutExerciseFormState>;
  exercises: ExerciseOption[];
}) {
  const [state, formAction, pending] = useActionState<WorkoutExerciseFormState, FormData>(
    action,
    undefined,
  );

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No exercises in the library yet.{" "}
        <Link href="/trainer/exercises/new" className="font-medium text-primary hover:underline">
          Add one
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Exercise" htmlFor="exerciseId">
        <NativeSelect id="exerciseId" name="exerciseId" required disabled={pending} defaultValue="">
          <option value="" disabled>
            Select an exercise
          </option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.muscleGroup ? ` (${exercise.muscleGroup})` : ""}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {/* Two columns even on a phone: these are short numeric inputs, and
          seeing sets and reps side by side mirrors how they're read ("4 × 8"). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Sets" htmlFor="sets">
          <Input id="sets" name="sets" type="number" inputMode="numeric" min={1} step={1} required disabled={pending} />
        </Field>
        <Field label="Reps" htmlFor="reps">
          <Input id="reps" name="reps" type="number" inputMode="numeric" min={1} step={1} required disabled={pending} />
        </Field>
        <Field label="Weight (kg)" htmlFor="weightKg" optional>
          <Input id="weightKg" name="weightKg" type="number" inputMode="decimal" min={0} step="0.5" disabled={pending} />
        </Field>
        <Field label="Rest (sec)" htmlFor="restSeconds" optional>
          <Input id="restSeconds" name="restSeconds" type="number" inputMode="numeric" min={0} step={1} disabled={pending} />
        </Field>
      </div>

      <Field label="Coaching note" htmlFor="notes" optional>
        <Input id="notes" name="notes" disabled={pending} placeholder="e.g. slow on the way down" />
      </Field>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-start">
        {pending ? "Adding…" : "Add exercise"}
      </Button>
    </form>
  );
}
