import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMembership } from "@/server/services/membership.service";
import { handlePageError } from "@/lib/service-error";
import { formatMinorUnits } from "@/lib/money";
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
import { renewMembershipAction, cancelMembershipAction } from "../actions";
import { CancelMembershipForm } from "@/components/memberships/cancel-membership-form";

export const metadata: Metadata = {
  title: "Membership details",
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string; membershipId: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id: memberId, membershipId } = await params;

  const membership = await getMembership(actor, membershipId).catch(handlePageError);

  const boundRenewAction = renewMembershipAction.bind(null, memberId, membershipId);
  const boundCancelAction = cancelMembershipAction.bind(null, memberId, membershipId);

  const canRenew = membership.status !== "CANCELLED";
  const canCancel = membership.status === "ACTIVE" || membership.status === "PENDING";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/members/${memberId}`}>← Back to member</Link>}
        />
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{membership.planNameSnapshot}</h1>
        <Badge variant={STATUS_VARIANT[membership.status]}>{membership.status}</Badge>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Start date</p>
            <p>{membership.startDate.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End date</p>
            <p>{membership.endDate.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price paid</p>
            <p>{formatMinorUnits(membership.priceMinorSnapshot, membership.currencySnapshot)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p>
              {Math.round(
                (membership.endDate.getTime() - membership.startDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days
            </p>
          </div>
          {membership.status === "CANCELLED" && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p>
                {membership.cancelledAt?.toLocaleDateString()}
                {membership.cancelReason ? ` — ${membership.cancelReason}` : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(canRenew || canCancel) && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {canRenew && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Creates a new membership starting the day after this one
                  ends (or today, if it&apos;s already expired), at the plan&apos;s
                  current price.
                </p>
                <form action={boundRenewAction}>
                  <Button type="submit" variant="outline">
                    Renew
                  </Button>
                </form>
              </div>
            )}
            {canCancel && (
              <div className="flex flex-col gap-3 border-t pt-4">
                <p className="text-sm text-destructive">Cancel this membership</p>
                <CancelMembershipForm action={boundCancelAction} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Payments for this membership</CardTitle>
        </CardHeader>
        <CardContent>
          {membership.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membership.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        className="hover:underline"
                      >
                        {payment.paidAt.toLocaleDateString()}
                      </Link>
                    </TableCell>
                    <TableCell>{formatMinorUnits(payment.amountMinor, payment.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.method}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/admin/members/${memberId}/payments/new?membershipId=${membershipId}`}>
                  Record a payment
                </Link>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
