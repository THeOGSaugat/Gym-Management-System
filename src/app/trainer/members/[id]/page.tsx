import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  getAssignedMember,
  getAssignedMemberAttendance,
  getAssignedMemberMembershipStatus,
} from "@/server/services/trainer-portal.service";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
import { listProgressForMember } from "@/server/services/progress.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Member details",
};

const MEMBERSHIP_STATUS_VARIANT = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

const PLAN_STATUS_VARIANT = {
  ACTIVE: "default",
  COMPLETED: "outline",
  CANCELLED: "outline",
} as const;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function TrainerAssignedMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const { id } = await params;

  const member = await getAssignedMember(actor, id).catch(handlePageError);
  const [attendance, membershipStatus, workoutPlans, progressLogs] = await Promise.all([
    getAssignedMemberAttendance(actor, id),
    getAssignedMemberMembershipStatus(actor, id),
    listWorkoutPlansForMember(actor, id),
    listProgressForMember(actor, id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/trainer/members">← Back to my members</Link>}
        />
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{member.fullName}</h1>
        <p className="text-muted-foreground">
          Member #{member.memberNumber ?? "—"} · Joined {member.joinDate.toLocaleDateString()}
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{member.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p>{member.phone ?? "Not on file"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Membership status</CardTitle>
        </CardHeader>
        <CardContent>
          {membershipStatus.current ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <p className="font-medium">{membershipStatus.current.planName}</p>
                <Badge variant={MEMBERSHIP_STATUS_VARIANT[membershipStatus.current.status]}>
                  {membershipStatus.current.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {membershipStatus.current.startDate.toLocaleDateString()} –{" "}
                {membershipStatus.current.endDate.toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No membership on record.</p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Recent attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance on record yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.attendanceDate.toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(record.checkInAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.checkOutAt ? formatTime(record.checkOutAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workout plans</CardTitle>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/trainer/members/${id}/workout-plans/new`}>New plan</Link>}
          />
        </CardHeader>
        <CardContent>
          {workoutPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workout plans yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workoutPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <Link href={`/trainer/workout-plans/${plan.id}`} className="hover:underline">
                        {plan.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.startDate.toLocaleDateString()}
                      {plan.endDate ? ` – ${plan.endDate.toLocaleDateString()}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PLAN_STATUS_VARIANT[plan.status]}>{plan.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Recent progress</CardTitle>
        </CardHeader>
        <CardContent>
          {progressLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No progress logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.recordedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{log.metric === "CUSTOM" ? log.customLabel : log.metric}</TableCell>
                    <TableCell className="font-medium">{log.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
