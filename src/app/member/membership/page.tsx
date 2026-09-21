import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { isMembershipCurrentlyActive } from "@/lib/membership";
import { formatMinorUnits } from "@/lib/money";
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

export const metadata: Metadata = {
  title: "My membership",
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

export default async function MyMembershipPage() {
  const actor = await requireRole("MEMBER");

  // listMembershipsForMember enforces "self only" itself — this isn't a
  // shortcut around that check, just this page's only valid call shape.
  const memberships = await listMembershipsForMember(actor, actor.id);
  const current = memberships.find((m) => isMembershipCurrentlyActive(m));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My membership</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Current status</CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <p className="text-lg font-medium">{current.planNameSnapshot}</p>
                <Badge variant={STATUS_VARIANT[current.status]}>{current.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Valid {current.startDate.toLocaleDateString()} – {current.endDate.toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have an active membership right now. Ask the front
              desk to assign one.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memberships on record.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.planNameSnapshot}
                      <p className="text-xs font-normal text-muted-foreground">
                        {formatMinorUnits(m.priceMinorSnapshot, m.currencySnapshot)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.startDate.toLocaleDateString()} – {m.endDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
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
