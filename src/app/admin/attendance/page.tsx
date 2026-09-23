import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, History } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listTodayAttendance } from "@/server/services/attendance.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListCard } from "@/components/ui/list-card";

export const metadata: Metadata = {
  title: "Attendance",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function TodayAttendancePage() {
  const actor = await requireRole("ADMIN");
  const records = await listTodayAttendance(actor);

  const currentlyIn = records.filter((r) => !r.checkOutAt);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/admin/attendance/history">
                <History aria-hidden="true" />
                Full history
              </Link>
            }
          />
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Check-ins today"
          value={records.length}
          icon={CalendarCheck}
          tone="brand"
        />
        <StatCard
          label="Currently in the gym"
          value={currentlyIn.length}
          icon={CalendarCheck}
          tone={currentlyIn.length > 0 ? "success" : "default"}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nobody has checked in today"
          description="Members check themselves in from their own portal when they arrive."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((record) => (
            <li key={record.id}>
              <ListCard
                href={`/admin/members/${record.memberId}`}
                avatarName={record.member.fullName}
                title={record.member.fullName}
                subtitle={
                  record.checkOutAt
                    ? `${formatTime(record.checkInAt)} – ${formatTime(record.checkOutAt)}`
                    : `In since ${formatTime(record.checkInAt)}`
                }
                trailing={
                  <StatusBadge
                    kind="attendance"
                    status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                    size="sm"
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
