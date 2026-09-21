import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getWorkoutPlan } from "@/server/services/workout.service";
import { listExercises } from "@/server/services/exercise.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkoutPlanForm } from "@/components/workouts/workout-plan-form";
import { AddWorkoutDayForm } from "@/components/workouts/add-workout-day-form";
import { AddWorkoutExerciseForm } from "@/components/workouts/add-workout-exercise-form";
import { toDateInputValue } from "@/lib/date";
import {
  updateWorkoutPlanAction,
  setWorkoutPlanStatusAction,
  addWorkoutDayAction,
  removeWorkoutDayAction,
  addWorkoutExerciseAction,
  removeWorkoutExerciseAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Workout plan",
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  COMPLETED: "outline",
  CANCELLED: "outline",
} as const;

export default async function TrainerWorkoutPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const { id } = await params;

  const plan = await getWorkoutPlan(actor, id).catch(handlePageError);
  const exercises = await listExercises(actor, {});

  const boundUpdateAction = updateWorkoutPlanAction.bind(null, plan.id);
  const boundAddDayAction = addWorkoutDayAction.bind(null, plan.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/trainer/members/${plan.memberId}`}>← Back to member</Link>}
        />
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
        <Badge variant={STATUS_VARIANT[plan.status]}>{plan.status}</Badge>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutPlanForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              name: plan.name,
              description: plan.description ?? undefined,
              startDate: toDateInputValue(plan.startDate),
              endDate: toDateInputValue(plan.endDate),
            }}
          />
        </CardContent>
      </Card>

      {plan.status === "ACTIVE" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <form action={setWorkoutPlanStatusAction.bind(null, plan.id, "COMPLETED")}>
              <Button type="submit" variant="outline">
                Mark completed
              </Button>
            </form>
            <form action={setWorkoutPlanStatusAction.bind(null, plan.id, "CANCELLED")}>
              <Button type="submit" variant="destructive">
                Cancel plan
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Workout days</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {plan.days.length === 0 ? (
            <p className="text-sm text-muted-foreground">No days added yet.</p>
          ) : (
            plan.days.map((day) => (
              <div key={day.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{day.label}</h3>
                  <form action={removeWorkoutDayAction.bind(null, plan.id, day.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remove day
                    </Button>
                  </form>
                </div>
                {day.notes && <p className="text-sm text-muted-foreground">{day.notes}</p>}

                {day.exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exercises yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {day.exercises.map((we) => (
                      <li
                        key={we.id}
                        className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{we.exercise.name}</p>
                          <p className="text-muted-foreground">
                            {we.sets} sets × {we.reps} reps
                            {we.weightKg ? ` · ${we.weightKg} kg` : ""}
                            {we.restSeconds ? ` · ${we.restSeconds}s rest` : ""}
                          </p>
                          {we.notes && <p className="text-muted-foreground">{we.notes}</p>}
                        </div>
                        <form action={removeWorkoutExerciseAction.bind(null, plan.id, we.id)}>
                          <Button type="submit" variant="ghost" size="sm">
                            Remove
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <AddWorkoutExerciseForm
                  action={addWorkoutExerciseAction.bind(null, plan.id, day.id)}
                  exercises={exercises}
                />
              </div>
            ))
          )}

          <div className="border-t pt-4">
            <AddWorkoutDayForm action={boundAddDayAction} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
