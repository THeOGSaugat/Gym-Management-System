import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export const metadata: Metadata = {
  title: "Add exercise",
};

export default async function TrainerNewExercisePage() {
  await requireRole("TRAINER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/trainer/exercises"
        backLabel="Exercise library"
        title="Add exercise"
        description="Adds an entry to the shared library so it's available when building any workout day. You can edit or deactivate the entries you create."
      />

      <Card className="max-w-2xl">
        <CardContent>
          <ExerciseForm mode="create" action={createExerciseAction} />
        </CardContent>
      </Card>
    </div>
  );
}
