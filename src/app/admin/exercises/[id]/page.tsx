import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getExercise } from "@/server/services/exercise.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { updateExerciseAction, setExerciseActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Exercise",
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
      <PageHeader
        backHref="/admin/exercises"
        backLabel="Exercise library"
        title={exercise.name}
        badge={
          <StatusBadge
            kind="exercise"
            status={exercise.isActive ? "ACTIVE" : "INACTIVE"}
          />
        }
        description={exercise.muscleGroup ?? "No muscle group set"}
      />

      <Section title="Exercise details">
        <Card className="max-w-2xl">
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
      </Section>

      <Section title="Availability">
        <Card className="max-w-2xl border-destructive-border">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {exercise.isActive ? "Deactivate exercise" : "Reactivate exercise"}
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                {exercise.isActive
                  ? "Removes it from the picker when building new workout days."
                  : "Makes it selectable again when building workout days."}
              </p>
            </div>

            {exercise.isActive ? (
              <ConfirmAction
                action={toggleActiveAction}
                title={`Deactivate "${exercise.name}"?`}
                description="Trainers won't be able to add this exercise to new workout days."
                consequences={[
                  "Workout plans that already prescribe it keep working and still show it.",
                  "Nothing is deleted — this only hides it from the exercise picker.",
                ]}
                reversibility="Fully reversible — you can reactivate it from this page."
                confirmLabel="Deactivate exercise"
                triggerLabel="Deactivate"
                triggerClassName="w-full sm:w-auto"
              />
            ) : (
              <ConfirmAction
                action={toggleActiveAction}
                tone="default"
                title={`Reactivate "${exercise.name}"?`}
                description="Trainers will be able to add this exercise to workout days again."
                reversibility="Reversible — you can deactivate it again later."
                confirmLabel="Reactivate exercise"
                triggerLabel="Reactivate"
                triggerVariant="outline"
                triggerClassName="w-full sm:w-auto"
              />
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
