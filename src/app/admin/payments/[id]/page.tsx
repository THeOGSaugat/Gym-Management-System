import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getPayment } from "@/server/services/payment.service";
import { handlePageError } from "@/lib/service-error";
import { formatMinorUnits } from "@/lib/money";
import { paymentMethodLabel } from "@/lib/payment-display";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DetailGrid, DetailItem } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Payment",
};

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
      <PageHeader
        backHref="/admin/payments"
        backLabel="Payments"
        title={formatMinorUnits(payment.amountMinor, payment.currency)}
        badge={<StatusBadge kind="payment" status={payment.status} />}
        description={`Recorded ${payment.paidAt.toLocaleDateString(undefined, zoned({
          day: "numeric",
          month: "long",
          year: "numeric",
        }))}`}
      />

      <Card className="max-w-2xl">
        <CardContent>
          <DetailGrid>
            <DetailItem label="Member">
              <Link
                href={`/admin/members/${payment.memberId}`}
                className="font-medium hover:text-primary hover:underline"
              >
                {payment.member.fullName}
              </Link>
            </DetailItem>
            <DetailItem label="Method">{paymentMethodLabel(payment.method)}</DetailItem>
            <DetailItem label="Membership">
              {payment.membershipId ? (
                <Link
                  href={`/admin/members/${payment.memberId}/memberships/${payment.membershipId}`}
                  className="hover:text-primary hover:underline"
                >
                  View membership
                </Link>
              ) : (
                <span className="text-muted-foreground">Not tied to a membership</span>
              )}
            </DetailItem>
            <DetailItem label="Recorded by">{payment.recordedBy.fullName}</DetailItem>
            {payment.reference ? (
              <DetailItem label="Reference">{payment.reference}</DetailItem>
            ) : null}
            {payment.notes ? (
              <DetailItem label="Notes" className="sm:col-span-2">
                {payment.notes}
              </DetailItem>
            ) : null}
          </DetailGrid>
        </CardContent>
      </Card>

      <p className="flex max-w-2xl items-start gap-2 rounded-lg bg-muted/60 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Payment records are append-only — there is no edit option. A correction is recorded
        as a new payment, never a change to this one.
      </p>
    </div>
  );
}
