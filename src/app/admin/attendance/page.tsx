import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listTodayAttendance } from "@/server/services/attendance.service";
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
  title: "Today's attendance",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function TodayAttendancePage() {
  const actor = await requireRole("ADMIN");
  const records = await listTodayAttendance(actor);

  const currentlyIn = records.filter((r) => !r.checkOutAt).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s attendance</h1>
          <p className="text-muted-foreground">
            {records.length} check-in{records.length === 1 ? "" : "s"} today · {currentlyIn}{" "}
            currently in
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/attendance/history">Full history</Link>} />
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          No one has checked in today yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/members/${record.memberId}`} className="hover:underline">
                      {record.member.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTime(record.checkInAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.checkOutAt ? formatTime(record.checkOutAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.checkOutAt ? "outline" : "default"}>
                      {record.checkOutAt ? "Checked out" : "Checked in"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
