import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAttendanceHistory } from "@/server/services/attendance.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Attendance history",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const dateFrom = params.from ? new Date(params.from) : undefined;
  const dateTo = params.to ? new Date(params.to) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, totalPages } = await listAttendanceHistory(actor, {
    search,
    dateFrom,
    dateTo,
    page,
  });

  function buildHref(overrides: { page?: number }) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (params.from) next.set("from", params.from);
    if (params.to) next.set("to", params.to);
    const p = overrides.page ?? page;
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/attendance/history?${qs}` : "/admin/attendance/history";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance history</h1>
          <p className="text-muted-foreground">{total} record{total === 1 ? "" : "s"}</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/attendance">Today</Link>} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Member name or email" defaultValue={search ?? ""} className="w-56" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-sm font-medium">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={params.from ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-sm font-medium">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={params.to ?? ""} />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {(search || params.from || params.to) && (
          <Button variant="ghost" nativeButton={false} render={<Link href="/admin/attendance/history">Clear</Link>} />
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {search || dateFrom || dateTo ? "No attendance matches your search." : "No attendance recorded yet."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground">
                    {record.attendanceDate.toLocaleDateString()}
                  </TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={buildHref({ page: page - 1 })}>Previous</Link>}
              />
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={buildHref({ page: page + 1 })}>Next</Link>}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
