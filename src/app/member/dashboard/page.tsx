import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMemberDashboard } from "@/server/services/dashboard.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Member dashboard",
};

const MEMBERSHIP_STATUS_VARIANT = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

const WORKOUT_STATUS_VARIANT = {
  ACTIVE: "default",
  COMPLETED: "outline",
  CANCELLED: "outline",
} as const;

const METRIC_LABELS: Record<string, string> = {
  WEIGHT_KG: "Body weight (kg)",
  BODY_FAT_PERCENT: "Body fat (%)",
  CHEST_CM: "Chest (cm)",
  WAIST_CM: "Waist (cm)",
  HIPS_CM: "Hips (cm)",
  ARM_CM: "Arm (cm)",
  THIGH_CM: "Thigh (cm)",
  CUSTOM: "Custom",
};

export default async function MemberDashboardPage() {
  const actor = await requireRole("MEMBER");
  const data = await getMemberDashboard(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Member dashboard</h1>
        <p className="text-muted-foreground">
          Everything for your membership, workouts and progress in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/member/attendance">Check in / out</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/workout-plans">My workout plans</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/progress">My progress</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/profile">View my profile</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/membership">My membership</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/member/payments">My payments</Link>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membership status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.membershipStatus ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-medium">{data.membershipStatus.planName}</p>
                  <Badge variant={MEMBERSHIP_STATUS_VARIANT[data.membershipStatus.status]}>
                    {data.membershipStatus.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.membershipStatus.isCurrentlyActive
                    ? `Expires ${data.membershipStatus.endDate.toLocaleDateString()}`
                    : `Valid ${data.membershipStatus.startDate.toLocaleDateString()} – ${data.membershipStatus.endDate.toLocaleDateString()}`}
                </p>
                <Button
                  variant="outline"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href="/member/membership">View details</Link>}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have a membership yet. Ask the front desk to
                assign one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current workout plan</CardTitle>
          </CardHeader>
          <CardContent>
            {data.currentWorkoutPlan ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-medium">{data.currentWorkoutPlan.name}</p>
                  <Badge variant={WORKOUT_STATUS_VARIANT[data.currentWorkoutPlan.status]}>
                    {data.currentWorkoutPlan.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started {data.currentWorkoutPlan.startDate.toLocaleDateString()}
                  {data.currentWorkoutPlan.endDate
                    ? ` – ${data.currentWorkoutPlan.endDate.toLocaleDateString()}`
                    : ""}
                </p>
                <Button
                  variant="outline"
                  className="w-fit"
                  nativeButton={false}
                  render={
                    <Link href={`/member/workout-plans/${data.currentWorkoutPlan.id}`}>
                      View plan
                    </Link>
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your trainer hasn&apos;t assigned you a workout plan yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No check-ins yet — use the button above to check in.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Checked in</TableHead>
                    <TableHead>Checked out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentAttendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.checkInAt.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.checkOutAt ? a.checkOutAt.toLocaleString() : "Still checked in"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent progress</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t logged any progress yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentProgress.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.metric === "CUSTOM"
                          ? entry.customLabel ?? "Custom"
                          : METRIC_LABELS[entry.metric]}
                      </TableCell>
                      <TableCell>{entry.value}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.recordedAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No notifications yet — this is coming in a later phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
