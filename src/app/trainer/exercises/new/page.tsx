import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export const metadata: Metadata = {
  title: "Add exercise",
};

export default async function TrainerNewExercisePage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  await requireRole("TRAINER");
  const { added } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add exercise</h1>
        <p className="text-muted-foreground">
          Adds a new entry to the shared exercise library, so it&apos;s available
          when building any workout day. You can edit or deactivate it later
          — only entries you create.
        </p>
      </div>

      {added && (
        <p role="status" className="text-sm text-green-600 dark:text-green-500">
          Exercise added.
        </p>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Exercise details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseForm mode="create" action={createExerciseAction} />
        </CardContent>
      </Card>
    </div>
  );
}
