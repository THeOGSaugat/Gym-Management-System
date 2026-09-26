import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ClipboardPlus, Dumbbell, TrendingUp, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getTrainerDashboard } from "@/server/services/dashboard.service";
import { listAssignedMembers } from "@/server/services/assignment.service";
import { listWorkoutPlansForTrainer } from "@/server/services/workout.service";
import { formatMetricValue, metricLabel } from "@/lib/progress-display";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { ListCard } from "@/components/ui/list-card";
import { Section } from "@/components/ui/section";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Dashboard",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }));
}

export default async function TrainerDashboardPage() {
  const actor = await requireRole("TRAINER");
  const [data, assignments, plans] = await Promise.all([
    getTrainerDashboard(actor),
    listAssignedMembers(actor, actor.id),
    listWorkoutPlansForTrainer(actor),
  ]);

  // "Who needs something from me" — assigned members with no ACTIVE plan
  // authored by this trainer. Both inputs are this trainer's own roster and
  // own plans from existing, already-authorized reads; nothing new is exposed.
  const membersWithActivePlan = new Set(
    plans.filter((plan) => plan.status === "ACTIVE").map((plan) => plan.memberId),
  );
  const needingPlan = assignments.filter(
    (assignment) => !membersWithActivePlan.has(assignment.memberId),
  );

  const firstName = (actor.name ?? "").split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={firstName ? `Hi, ${firstName}` : "Dashboard"}
        description="Your roster, your programmes, and what's happening today."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Assigned members"
          value={data.assignedMemberCount}
          icon={Users}
          tone="brand"
          href="/trainer/members"
        />
        <StatCard
          label="In the gym now"
          value={data.currentlyCheckedIn.length}
          icon={Dumbbell}
          tone={data.currentlyCheckedIn.length > 0 ? "success" : "default"}
          description={`${data.todayCheckInCount} check-in${data.todayCheckInCount === 1 ? "" : "s"} today`}
        />
        <StatCard
          label="Active plans"
          value={data.activeWorkoutPlanCount}
          icon={ClipboardList}
          href="/trainer/workout-plans"
        />
        <StatCard
          label="Need a plan"
          value={needingPlan.length}
          icon={ClipboardPlus}
          tone={needingPlan.length > 0 ? "warning" : "default"}
          description={
            needingPlan.length > 0 ? "Members with no active plan" : "Everyone has a plan"
          }
        />
      </div>

      {data.assignedMemberCount === 0 ? (
        <EmptyState
          icon={Users}
          title="No members assigned yet"
          description="An admin assigns members to trainers from a member's detail page. Once you have members, their activity shows up here."
        />
      ) : (
        <>
        {needingPlan.length > 0 ? (
          <Section
            title="Needs a workout plan"
            description="Assigned to you, but without an active programme."
          >
            <ul className="flex flex-col gap-2">
              {needingPlan.slice(0, 5).map((assignment) => (
                <li key={assignment.id}>
                  <ListCard
                    href={`/trainer/members/${assignment.memberId}/workout-plans/new`}
                    avatarName={assignment.member.fullName}
                    title={assignment.member.fullName}
                    subtitle="Create a plan"
                    meta={`Assigned since ${assignment.startDate.toLocaleDateString(undefined, zoned())}`}
                  />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>In the gym right now</CardTitle>
            </CardHeader>
            <CardContent>
              {data.currentlyCheckedIn.length === 0 ? (
                <EmptyState
                  compact
                  title="Nobody's checked in"
                  description="None of your members are at the gym at the moment."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.currentlyCheckedIn.map((record) => (
                    <li key={record.id}>
                      <Link
                        href={`/trainer/members/${record.memberId}`}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                      >
                        <span className="truncate text-sm font-medium">
                          {record.member.fullName}
                        </span>
                        <span className="shrink-0 text-[0.8125rem] text-muted-foreground tabular-nums">
                          since {formatTime(record.checkInAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent progress</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentProgress.length === 0 ? (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="No progress logged"
                  description="Your members haven't logged any measurements yet."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.recentProgress.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/trainer/members/${entry.memberId}`}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">
                            {entry.member.fullName}
                          </span>
                          <span className="truncate text-[0.8125rem] text-muted-foreground">
                            {metricLabel(entry.metric, entry.customLabel)} ·{" "}
                            {entry.recordedAt.toLocaleDateString(undefined, zoned())}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatMetricValue(entry.metric, entry.value)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/trainer/members">View my members</Link>}
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/trainer/exercises/new">Add an exercise</Link>}
        />
      </div>
    </div>
  );
}
