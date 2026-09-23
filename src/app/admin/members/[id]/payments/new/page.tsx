import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordPaymentForm } from "@/components/payments/record-payment-form";
import { recordPaymentAction } from "../actions";

export const metadata: Metadata = {
  title: "Record payment",
};

export default async function RecordPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ membershipId?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;
  const { membershipId } = await searchParams;

  const member = await getMember(actor, id).catch(handlePageError);
  const memberships = await listMembershipsForMember(actor, member.id);

  const boundAction = recordPaymentAction.bind(null, member.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref={`/admin/members/${member.id}?section=membership`}
        backLabel={member.fullName}
        title="Record payment"
        description="Payment records are append-only — a correction is recorded as a new payment, never an edit."
      />

      <Card className="max-w-2xl">
        <CardContent>
          <RecordPaymentForm
            action={boundAction}
            memberships={memberships}
            defaultMembershipId={membershipId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
