import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  getAssignedMember,
  getAssignedMemberAttendance,
  getAssignedMemberMembershipStatus,
} from "@/server/services/trainer-portal.service";
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
  const [attendance, membershipStatus] = await Promise.all([
    getAssignedMemberAttendance(actor, id),
    getAssignedMemberMembershipStatus(actor, id),
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
    </div>
  );
}
