import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getExercise } from "@/server/services/exercise.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { updateExerciseAction, setExerciseActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Exercise details",
};

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const exercise = await getExercise(actor, id).catch(handlePageError);

  const boundUpdateAction = updateExerciseAction.bind(null, exercise.id);
  const nextActive = !exercise.isActive;
  const toggleActiveAction = setExerciseActiveAction.bind(null, exercise.id, nextActive);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
        <Badge variant={exercise.isActive ? "default" : "outline"}>
          {exercise.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Exercise details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              name: exercise.name,
              muscleGroup: exercise.muscleGroup ?? undefined,
              description: exercise.description ?? undefined,
              instructions: exercise.instructions ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            {exercise.isActive ? "Deactivate exercise" : "Reactivate exercise"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {exercise.isActive
                ? "Deactivating removes it from the picker when building new workout days. Existing workout plans using it are unaffected."
                : "Reactivating makes it selectable again when building workout days."}
            </p>
            <form action={toggleActiveAction}>
              <Button type="submit" variant={exercise.isActive ? "destructive" : "outline"}>
                {exercise.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
