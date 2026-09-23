import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  CircleAlert,
  Dumbbell,
  TrendingUp,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMemberDashboard } from "@/server/services/dashboard.service";
import { listNotifications } from "@/server/services/notification.service";
import { getTodayStatus } from "@/server/services/attendance.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckInPanel } from "@/components/attendance/check-in-panel";
import { METRIC_UNIT, metricLabel } from "@/lib/progress-display";
import { MetricDelta } from "@/components/progress/metric-trend";
import { daysUntil, getMembershipUrgency } from "@/lib/membership-display";
import { checkInAction, checkOutAction } from "../attendance/actions";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Home",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function MemberDashboardPage() {
  const actor = await requireRole("MEMBER");

  const [data, unreadNotifications, todayStatus] = await Promise.all([
    getMemberDashboard(actor),
    listNotifications(actor, { unreadOnly: true }),
    getTodayStatus(actor, actor.id),
  ]);

  const firstName = (actor.name ?? "").split(" ")[0] ?? "";
  const membership = data.membershipStatus;
  const daysLeft = membership ? daysUntil(membership.endDate) : null;
  const urgency = getMembershipUrgency(
    membership
      ? { status: membership.status, isCurrentlyActive: membership.isCurrentlyActive, endDate: membership.endDate }
      : null,
  );
  const needsAttention = urgency === "none" || urgency === "expiring" || urgency === "inactive";

  const latestProgress = data.recentProgress[0];
  // The next *same-metric* entry within the already-fetched recent list —
  // not just recentProgress[1], since that could be a different metric
  // logged in between. If it's not in this small window, no delta shows;
  // that's a smaller ask on the dashboard than the full-history trend on
  // the Progress page itself.
  const previousProgress = latestProgress
    ? data.recentProgress
        .slice(1)
        .find(
          (entry) =>
            entry.metric === latestProgress.metric &&
            (entry.metric !== "CUSTOM" || entry.customLabel === latestProgress.customLabel),
        )
    : undefined;
  const recentNotifications = unreadNotifications.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-[0.8125rem] font-medium text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </div>

      {/* The primary action, above the fold, on every visit. */}
      <CheckInPanel
        isCheckedIn={!!todayStatus.openSession}
        checkedInSince={
          todayStatus.openSession ? formatTime(todayStatus.openSession.checkInAt) : undefined
        }
        checkInAction={checkInAction}
        checkOutAction={checkOutAction}
      />

      {/* Membership only shouts when it needs something from the member. */}
      {needsAttention ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
            urgency === "expiring"
              ? "border-warning-border bg-warning-subtle"
              : "border-destructive-border bg-destructive-subtle"
          )}
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-5 shrink-0",
                urgency === "expiring" ? "text-warning-foreground" : "text-destructive-foreground"
              )}
            />
            <div className="flex flex-col gap-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  urgency === "expiring" ? "text-warning-foreground" : "text-destructive-foreground"
                )}
              >
                {membership === null
                  ? "No membership yet"
                  : urgency === "expiring"
                    ? `Membership expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                    : membership.status === "EXPIRED"
                      ? "Membership has expired"
                      : "Membership not active"}
              </p>
              <p
                className={cn(
                  "text-[0.8125rem] leading-relaxed",
                  urgency === "expiring"
                    ? "text-warning-foreground/90"
                    : "text-destructive-foreground/90"
                )}
              >
                {membership === null
                  ? "Ask the front desk to set you up with a plan."
                  : urgency === "expiring"
                    ? `Your ${membership.planName} plan ends on ${membership.endDate.toLocaleDateString()}. Speak to the front desk to renew.`
                    : "Speak to the front desk to renew and keep access to the gym."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 sm:w-auto"
            nativeButton={false}
            render={<Link href="/member/membership">View membership</Link>}
          />
        </div>
      ) : null}

      {/*
        Main content (today's workout, recent activity) gets the wider
        column; membership/progress/notifications are secondary — useful,
        but not what a member opened the app to do. Below `lg` this is
        just a single stacked column, same order top-to-bottom as before.
      */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s workout</CardTitle>
            </CardHeader>
            <CardContent>
              {data.currentWorkoutPlan ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium">{data.currentWorkoutPlan.name}</p>
                    <StatusBadge
                      kind="plan"
                      status={data.currentWorkoutPlan.status}
                      size="sm"
                    />
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    Started {data.currentWorkoutPlan.startDate.toLocaleDateString()}
                    {data.currentWorkoutPlan.endDate
                      ? ` · ends ${data.currentWorkoutPlan.endDate.toLocaleDateString()}`
                      : ""}
                  </p>
                  <Button
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={
                      <Link href={`/member/workout-plans/${data.currentWorkoutPlan.id}`}>
                        Open plan
                      </Link>
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={Dumbbell}
                  title="No workout plan yet"
                  description="Your trainer will assign one — it'll show up here."
                />
              )}
            </CardContent>
          </Card>

          <Section
            title="Recent activity"
            actions={
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/member/attendance">All visits</Link>}
              />
            }
          >
            {data.recentAttendance.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarCheck}
                title="No visits yet"
                description="Check in when you arrive and your visits will appear here."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.recentAttendance.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">
                        {record.attendanceDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[0.8125rem] text-muted-foreground">
                        {formatTime(record.checkInAt)}
                        {record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ""}
                      </span>
                    </div>
                    <StatusBadge
                      kind="attendance"
                      status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent>
              {membership ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium">{membership.planName}</p>
                    <StatusBadge kind="membership" status={membership.status} size="sm" />
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {membership.isCurrentlyActive && daysLeft !== null && daysLeft >= 0
                      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · renews ${membership.endDate.toLocaleDateString()}`
                      : `Valid ${membership.startDate.toLocaleDateString()} – ${membership.endDate.toLocaleDateString()}`}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={<Link href="/member/membership">View details</Link>}
                  />
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No membership on record"
                  description="The front desk can assign you a plan."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {latestProgress ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
                        {latestProgress.value}
                      </span>
                      <span className="pb-0.5 text-sm text-muted-foreground">
                        {METRIC_UNIT[latestProgress.metric] ?? ""}
                      </span>
                    </div>
                    {previousProgress ? (
                      <MetricDelta
                        current={latestProgress.value}
                        previous={previousProgress.value}
                        unit={METRIC_UNIT[latestProgress.metric]}
                      />
                    ) : null}
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {metricLabel(latestProgress.metric, latestProgress.customLabel)} · logged{" "}
                    {latestProgress.recordedAt.toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={<Link href="/member/progress">Log progress</Link>}
                  />
                </>
              ) : (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="Nothing logged yet"
                  description="Track your weight or measurements to see change over time."
                  action={
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/member/progress">Log progress</Link>}
                    />
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <EmptyState compact icon={Bell} title="You're all caught up" />
              ) : (
                <ul className="flex flex-col gap-3">
                  {recentNotifications.map((notification) => (
                    <li key={notification.id} className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/member/notifications"
                className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all notifications
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
