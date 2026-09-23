import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listAssignedMembers } from "@/server/services/assignment.service";
import { listWorkoutPlansForTrainer } from "@/server/services/workout.service";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";

export const metadata: Metadata = {
  title: "My members",
};

export default async function TrainerAssignedMembersPage() {
  const actor = await requireRole("TRAINER");

  // listAssignedMembers enforces "self only" itself (canViewTrainerRoster)
  // — passing actor.id here isn't a bypassable shortcut, it's the only
  // roster this page is capable of requesting.
  const [assignments, plans] = await Promise.all([
    listAssignedMembers(actor, actor.id),
    listWorkoutPlansForTrainer(actor),
  ]);
  const activePlanCount = new Map<string, number>();
  for (const plan of plans) {
    if (plan.status !== "ACTIVE") continue;
    activePlanCount.set(plan.memberId, (activePlanCount.get(plan.memberId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My members"
        description={`${assignments.length} assigned member${assignments.length === 1 ? "" : "s"}`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members assigned"
          description="An admin assigns members to you from a member's detail page. They'll appear here as soon as they do."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <ListCard
                href={`/trainer/members/${assignment.memberId}`}
                avatarName={assignment.member.fullName}
                title={assignment.member.fullName}
                subtitle={
                  assignment.member.memberProfile?.memberNumber
                    ? `Member #${assignment.member.memberProfile.memberNumber}`
                    : undefined
                }
                meta={`Assigned since ${assignment.startDate.toLocaleDateString()}`}
                trailing={
                  activePlanCount.get(assignment.memberId) ? (
                    <Badge variant="success" size="sm">
                      Active plan
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      No plan
                    </Badge>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
