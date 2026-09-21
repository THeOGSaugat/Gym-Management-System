import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listPlans } from "@/server/services/plan.service";
import { formatMinorUnits } from "@/lib/money";
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
  title: "Membership plans",
};

export default async function PlansPage() {
  const actor = await requireRole("ADMIN");
  const plans = await listPlans(actor, { includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membership plans</h1>
          <p className="text-muted-foreground">{plans.length} plan{plans.length === 1 ? "" : "s"}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/plans/new">New plan</Link>} />
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          No plans yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/plans/${plan.id}`} className="hover:underline">
                      {plan.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.durationDays} day{plan.durationDays === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMinorUnits(plan.priceMinor, plan.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "outline"}>
                      {plan.isActive ? "Active" : "Inactive"}
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
