import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getTodayStatus, listAttendanceForMember } from "@/server/services/attendance.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckInOutButton } from "@/components/attendance/check-in-out-button";
import { checkInAction, checkOutAction } from "./actions";

export const metadata: Metadata = {
  title: "My attendance",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function MyAttendancePage() {
  const actor = await requireRole("MEMBER");

  const [{ openSession, todaysRecords }, history] = await Promise.all([
    getTodayStatus(actor, actor.id),
    listAttendanceForMember(actor, actor.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My attendance</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Badge variant={openSession ? "default" : "outline"}>
              {openSession ? "Checked in" : "Not checked in"}
            </Badge>
            {openSession && (
              <p className="text-sm text-muted-foreground">
                Since {formatTime(openSession.checkInAt)}
              </p>
            )}
          </div>

          <CheckInOutButton
            isCheckedIn={!!openSession}
            checkInAction={checkInAction}
            checkOutAction={checkOutAction}
          />

          {todaysRecords.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Today&apos;s visits</p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {todaysRecords.map((record) => (
                  <li key={record.id}>
                    {formatTime(record.checkInAt)} –{" "}
                    {record.checkOutAt ? formatTime(record.checkOutAt) : "still checked in"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.items.length === 0 ? (
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
                {history.items.map((record) => (
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
