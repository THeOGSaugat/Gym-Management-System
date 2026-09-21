import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export const metadata: Metadata = {
  title: "Add exercise",
};

export default async function NewExercisePage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add exercise</h1>
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
