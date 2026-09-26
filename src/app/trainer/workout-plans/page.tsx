import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listWorkoutPlansForTrainer } from "@/server/services/workout.service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Workout plans",
};

export default async function TrainerWorkoutPlansPage() {
  const actor = await requireRole("TRAINER");

  // Scoped to this trainer's own plans by the service — see
  // listWorkoutPlansForTrainer.
  const plans = await listWorkoutPlansForTrainer(actor);
  const active = plans.filter((plan) => plan.status === "ACTIVE");
  const past = plans.filter((plan) => plan.status !== "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workout plans"
        description={
          plans.length > 0
            ? `${active.length} active of ${plans.length} total`
            : "Programmes you've built for your members."
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No workout plans yet"
          description="Open one of your assigned members and create their first plan — it'll show up here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 ? (
            <Section title="Active">
              <ul className="flex flex-col gap-2">
                {active.map((plan) => (
                  <li key={plan.id}>
                    <ListCard
                      href={`/trainer/workout-plans/${plan.id}`}
                      icon={ClipboardList}
                      title={plan.name}
                      subtitle={plan.member.fullName}
                      meta={
                        plan.endDate
                          ? `${plan.startDate.toLocaleDateString(undefined, zoned())} – ${plan.endDate.toLocaleDateString(undefined, zoned())}`
                          : `Started ${plan.startDate.toLocaleDateString(undefined, zoned())}`
                      }
                      trailing={<StatusBadge kind="plan" status={plan.status} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {past.length > 0 ? (
            <Section title="Completed & cancelled">
              <ul className="flex flex-col gap-2">
                {past.map((plan) => (
                  <li key={plan.id}>
                    <ListCard
                      href={`/trainer/workout-plans/${plan.id}`}
                      icon={ClipboardList}
                      title={plan.name}
                      subtitle={plan.member.fullName}
                      meta={
                        plan.endDate
                          ? `${plan.startDate.toLocaleDateString(undefined, zoned())} – ${plan.endDate.toLocaleDateString(undefined, zoned())}`
                          : `Started ${plan.startDate.toLocaleDateString(undefined, zoned())}`
                      }
                      trailing={<StatusBadge kind="plan" status={plan.status} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}
