import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { listPlans } from "@/server/services/plan.service";
import { handlePageError } from "@/lib/service-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <h1 className="text-2xl font-semibold tracking-tight">
        Assign membership to {member.fullName}
      </h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Membership details</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                There are no active plans to assign. Create one first.
              </p>
              <div>
                <Button nativeButton={false} render={<Link href="/admin/plans/new">New plan</Link>} />
              </div>
            </div>
          ) : (
            <AssignMembershipForm action={boundAction} plans={plans} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
