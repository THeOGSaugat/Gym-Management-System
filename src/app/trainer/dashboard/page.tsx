import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTrainerDashboard } from "@/server/services/dashboard.service";
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

export const metadata: Metadata = {
  title: "Trainer dashboard",
};

const METRIC_LABELS: Record<string, string> = {
  WEIGHT_KG: "Body weight",
  BODY_FAT_PERCENT: "Body fat",
  CHEST_CM: "Chest",
  WAIST_CM: "Waist",
  HIPS_CM: "Hips",
  ARM_CM: "Arm",
  THIGH_CM: "Thigh",
  CUSTOM: "Custom",
};

export default async function TrainerDashboardPage() {
  const actor = await requireRole("TRAINER");
  const data = await getTrainerDashboard(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trainer dashboard</h1>
        <p className="text-muted-foreground">
          Build workout plans for your assigned members and add new
          exercises to the shared library.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/trainer/members">My members</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/trainer/exercises/new">Add exercise</Link>} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Assigned members" value={data.assignedMemberCount} />
        <StatCard
          label="Today's check-ins"
          value={data.todayCheckInCount}
          description={`${data.currentlyCheckedIn.length} currently at the gym`}
        />
        <StatCard label="Active workout plans" value={data.activeWorkoutPlanCount} />
        <StatCard
          label="Total workout plans"
          value={data.totalWorkoutPlanCount}
          description="Including completed/cancelled"
        />
      </div>

      {data.assignedMemberCount === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          You don&apos;t have any assigned members yet. An admin assigns
          members to trainers from a member&apos;s detail page.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Currently at the gym</CardTitle>
            </CardHeader>
            <CardContent>
              {data.currentlyCheckedIn.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None of your assigned members are checked in right now.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Checked in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.currentlyCheckedIn.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Link href={`/trainer/members/${a.memberId}`} className="hover:underline">
                            {a.member.fullName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.checkInAt.toLocaleTimeString()}
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
              <CardTitle>Recent progress from your members</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No progress has been logged by your assigned members yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentProgress.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            href={`/trainer/members/${entry.memberId}`}
                            className="hover:underline"
                          >
                            {entry.member.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entry.metric === "CUSTOM"
                              ? entry.customLabel ?? "Custom"
                              : METRIC_LABELS[entry.metric]}
                          </Badge>
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
        </div>
      )}
    </div>
  );
}
