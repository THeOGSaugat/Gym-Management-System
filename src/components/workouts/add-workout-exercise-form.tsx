"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <Link href="/trainer/exercises/new" className="hover:underline">
          Add one
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exerciseId">Exercise</Label>
        <select
          id="exerciseId"
          name="exerciseId"
          required
          disabled={pending}
          defaultValue=""
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="" disabled>
            Select an exercise
          </option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.muscleGroup ? ` (${exercise.muscleGroup})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sets">Sets</Label>
          <Input id="sets" name="sets" type="number" min={1} step={1} required disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reps">Reps</Label>
          <Input id="reps" name="reps" type="number" min={1} step={1} required disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input id="weightKg" name="weightKg" type="number" min={0} step="0.5" disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restSeconds">Rest (sec)</Label>
          <Input id="restSeconds" name="restSeconds" type="number" min={0} step={1} disabled={pending} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" disabled={pending} placeholder="e.g. focus on control on the way down" />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Adding…" : "Add exercise"}
        </Button>
      </div>
    </form>
  );
}
