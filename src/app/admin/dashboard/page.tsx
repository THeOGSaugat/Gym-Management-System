import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboard } from "@/server/services/dashboard.service";
import { formatMinorUnits } from "@/lib/money";
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
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

const MEMBERSHIP_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  PENDING: "bg-amber-500",
  EXPIRED: "bg-destructive",
  CANCELLED: "bg-muted-foreground/50",
};

export default async function AdminDashboardPage() {
  const actor = await requireRole("ADMIN");
  const data = await getAdminDashboard(actor);

  const statusItems = (
    Object.entries(data.membershipStatusCounts) as Array<[string, number]>
  ).map(([status, value]) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    value,
    colorClassName: MEMBERSHIP_STATUS_COLORS[status] ?? "bg-muted-foreground",
  }));
  if (data.membersWithoutMembership > 0) {
    statusItems.push({
      label: "No membership yet",
      value: data.membersWithoutMembership,
      colorClassName: "bg-muted-foreground/30",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-muted-foreground">An overview of the gym right now.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/admin/members">Manage members</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/trainers">Manage trainers</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/plans">Membership plans</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/payments">Payments</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/attendance">Attendance</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/exercises">Exercise library</Link>} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total members" value={data.totalMembers} />
        <StatCard
          label="Active members"
          value={data.activeMembers}
          description="Currently within a paid membership period"
        />
        <StatCard
          label="Expired memberships"
          value={data.expiredMemberships}
          description="Most recent membership has lapsed"
        />
        <StatCard
          label="Today's attendance"
          value={data.todayAttendanceCount}
          description={`${data.currentlyCheckedInCount} currently checked in`}
        />
        <StatCard
          label="Active trainers"
          value={data.activeTrainers}
          description={`${data.totalTrainers} total`}
        />
        <StatCard
          label="Total revenue"
          value={formatMinorUnits(data.totalRevenueMinor)}
          description="All-time, succeeded payments"
        />
        <StatCard
          label="This month's revenue"
          value={formatMinorUnits(data.monthRevenueMinor)}
          description="Succeeded payments this calendar month"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membership status overview</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart items={statusItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Link
                          href={`/admin/members/${payment.memberId}`}
                          className="hover:underline"
                        >
                          {payment.member.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{formatMinorUnits(payment.amountMinor, payment.currency)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paidAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently joined members</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/members/${m.id}`} className="hover:underline">
                        {m.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ACTIVE" ? "default" : "outline"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(m.memberProfile?.joinDate ?? m.createdAt).toLocaleDateString()}
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
