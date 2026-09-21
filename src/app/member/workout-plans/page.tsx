import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
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
  title: "My workout plans",
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  COMPLETED: "outline",
  CANCELLED: "outline",
} as const;

export default async function MyWorkoutPlansPage() {
  const actor = await requireRole("MEMBER");

  // listWorkoutPlansForMember enforces "self only" — a member can never
  // load another member's plans through this page.
  const plans = await listWorkoutPlansForMember(actor, actor.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My workout plans</h1>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Your trainer hasn&apos;t assigned you a workout plan yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <Link href={`/member/workout-plans/${plan.id}`} className="hover:underline">
                      {plan.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.startDate.toLocaleDateString()}
                    {plan.endDate ? ` – ${plan.endDate.toLocaleDateString()}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[plan.status]}>{plan.status}</Badge>
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
