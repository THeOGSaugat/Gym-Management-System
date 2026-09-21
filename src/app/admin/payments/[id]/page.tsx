import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getPayment } from "@/server/services/payment.service";
import { handlePageError } from "@/lib/service-error";
import { formatMinorUnits } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment details",
};

const STATUS_VARIANT = {
  SUCCEEDED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
} as const;

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const payment = await getPayment(actor, id).catch(handlePageError);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/payments">← Back to payments</Link>}
        />
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatMinorUnits(payment.amountMinor, payment.currency)}
        </h1>
        <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Payment record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Member</p>
            <Link href={`/admin/members/${payment.memberId}`} className="hover:underline">
              {payment.member.fullName}
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p>{payment.paidAt.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <p>
              {payment.method === "BANK_TRANSFER"
                ? "Bank transfer"
                : payment.method === "CASH"
                  ? "Cash"
                  : "Other"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Membership</p>
            {payment.membershipId ? (
              <Link
                href={`/admin/members/${payment.memberId}/memberships/${payment.membershipId}`}
                className="hover:underline"
              >
                View membership
              </Link>
            ) : (
              <p className="text-muted-foreground">Not tied to a membership</p>
            )}
          </div>
          {payment.reference && (
            <div>
              <p className="text-sm text-muted-foreground">Reference</p>
              <p>{payment.reference}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Recorded by</p>
            <p>{payment.recordedBy.fullName}</p>
          </div>
          {payment.notes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{payment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Payment records are append-only — there is no edit option. A
        correction is recorded as a new payment, not a change to this one.
      </p>
    </div>
  );
}
