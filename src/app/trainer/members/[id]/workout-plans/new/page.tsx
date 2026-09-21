import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAssignedMember } from "@/server/services/trainer-portal.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutPlanForm } from "@/components/workouts/workout-plan-form";
import { createWorkoutPlanAction } from "../actions";

export const metadata: Metadata = {
  title: "New workout plan",
};

export default async function NewWorkoutPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const { id } = await params;

  // getAssignedMember enforces the assignment check itself — a trainer
  // can't reach this form for a member who isn't theirs, even by URL.
  const member = await getAssignedMember(actor, id).catch(handlePageError);

  const boundAction = createWorkoutPlanAction.bind(null, member.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        New workout plan for {member.fullName}
      </h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutPlanForm mode="create" action={boundAction} />
        </CardContent>
      </Card>
    </div>
  );
}
