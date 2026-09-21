import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getWorkoutPlan } from "@/server/services/workout.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Workout plan",
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  COMPLETED: "outline",
  CANCELLED: "outline",
} as const;

export default async function MyWorkoutPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("MEMBER");
  const { id } = await params;

  // getWorkoutPlan enforces "own plan only" — this member can never load
  // another member's plan by guessing an id.
  const plan = await getWorkoutPlan(actor, id).catch(handlePageError);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/member/workout-plans">← Back to my plans</Link>}
        />
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
        <Badge variant={STATUS_VARIANT[plan.status]}>{plan.status}</Badge>
      </div>
      {plan.description && <p className="text-muted-foreground">{plan.description}</p>}

      {plan.days.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your trainer hasn&apos;t added any days to this plan yet.
        </p>
      ) : (
        plan.days.map((day) => (
          <Card key={day.id} className="max-w-2xl">
            <CardHeader>
              <CardTitle>{day.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {day.notes && <p className="mb-3 text-sm text-muted-foreground">{day.notes}</p>}
              {day.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {day.exercises.map((we) => (
                    <li key={we.id} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <p className="font-medium">{we.exercise.name}</p>
                      <p className="text-muted-foreground">
                        {we.sets} sets × {we.reps} reps
                        {we.weightKg ? ` · ${we.weightKg} kg` : ""}
                        {we.restSeconds ? ` · ${we.restSeconds}s rest` : ""}
                      </p>
                      {we.notes && <p className="text-muted-foreground">{we.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
