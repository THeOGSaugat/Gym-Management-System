import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlanForm } from "@/components/plans/plan-form";
import { createPlanAction } from "../actions";

export const metadata: Metadata = {
  title: "New plan",
};

export default async function NewPlanPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/plans"
        backLabel="Membership plans"
        title="New plan"
        description="Plans define what the gym sells. Price and duration are snapshotted onto each membership when it's assigned, so changing them later won't alter existing memberships."
      />
      <Card className="max-w-2xl">
        <CardContent>
          <PlanForm mode="create" action={createPlanAction} />
        </CardContent>
      </Card>
    </div>
  );
}
