import type { Metadata } from "next";
import { Dumbbell, Repeat, Timer, Weight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getWorkoutPlan } from "@/server/services/workout.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Workout plan",
};

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
      <PageHeader
        backHref="/member/workout-plans"
        backLabel="Workout plans"
        title={plan.name}
        badge={<StatusBadge kind="plan" status={plan.status} />}
        description={
          <>
            {plan.startDate.toLocaleDateString()}
            {plan.endDate ? ` – ${plan.endDate.toLocaleDateString()}` : ""}
            {plan.description ? ` · ${plan.description}` : ""}
          </>
        }
      />

      {plan.days.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No days in this plan yet"
          description="Your trainer hasn't added training days to this plan."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {plan.days.map((day, index) => (
            <section
              key={day.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
            >
              <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[0.8125rem] font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col">
                  <h2 className="truncate text-base font-semibold tracking-[-0.01em]">
                    {day.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {day.notes ? (
                <p className="border-b border-border px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {day.notes}
                </p>
              ) : null}

              {day.exercises.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No exercises added to this day yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {day.exercises.map((we) => (
                    <li key={we.id} className="flex flex-col gap-2 px-4 py-3.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium">{we.exercise.name}</p>
                        {we.exercise.muscleGroup ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {we.exercise.muscleGroup}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Repeat aria-hidden="true" className="size-3.5" />
                          <span className="tabular-nums">
                            {we.sets} × {we.reps}
                          </span>
                          <span className="sr-only">sets by reps</span>
                        </span>
                        {we.weightKg ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Weight aria-hidden="true" className="size-3.5" />
                            <span className="tabular-nums">{we.weightKg} kg</span>
                          </span>
                        ) : null}
                        {we.restSeconds ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Timer aria-hidden="true" className="size-3.5" />
                            <span className="tabular-nums">{we.restSeconds}s rest</span>
                          </span>
                        ) : null}
                      </div>

                      {we.notes ? (
                        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                          {we.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
