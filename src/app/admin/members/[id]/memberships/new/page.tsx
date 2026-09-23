import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { listPlans } from "@/server/services/plan.service";
import { handlePageError } from "@/lib/service-error";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignMembershipForm } from "@/components/memberships/assign-membership-form";
import { assignMembershipAction } from "../actions";

export const metadata: Metadata = {
  title: "Assign membership",
};

export default async function AssignMembershipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const member = await getMember(actor, id).catch(handlePageError);
  const plans = await listPlans(actor, {});

  const boundAction = assignMembershipAction.bind(null, member.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref={`/admin/members/${member.id}?section=membership`}
        backLabel={member.fullName}
        title="Assign membership"
        description={`The price and duration are taken from the plan, not from this form — whatever ${member.fullName} is charged is snapshotted at assignment time.`}
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No active plans"
          description="A membership can only be assigned from an active plan. Create one first."
          action={
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/plans/new">Create a plan</Link>}
            />
          }
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent>
            <AssignMembershipForm action={boundAction} plans={plans} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
