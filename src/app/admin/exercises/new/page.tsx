import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export const metadata: Metadata = {
  title: "Add exercise",
};

export default async function NewExercisePage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/exercises"
        backLabel="Exercise library"
        title="Add exercise"
        description="Adds an entry to the shared library that every trainer can use when building workout days."
      />
      <Card className="max-w-2xl">
        <CardContent>
          <ExerciseForm mode="create" action={createExerciseAction} />
        </CardContent>
      </Card>
    </div>
  );
}
