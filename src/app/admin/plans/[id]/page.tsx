import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getPlan } from "@/server/services/plan.service";
import { handlePageError } from "@/lib/service-error";
import { toDecimalString } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/plans/plan-form";
import { updatePlanAction, setPlanActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Plan details",
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const plan = await getPlan(actor, id).catch(handlePageError);

  const boundUpdateAction = updatePlanAction.bind(null, plan.id);
  const nextActive = !plan.isActive;
  const toggleActiveAction = setPlanActiveAction.bind(null, plan.id, nextActive);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
        <Badge variant={plan.isActive ? "default" : "outline"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode="edit"
            action={boundUpdateAction}
            defaultValues={{
              name: plan.name,
              description: plan.description ?? undefined,
              durationDays: plan.durationDays,
              price: toDecimalString(plan.priceMinor),
            }}
          />
        </CardContent>
      </Card>

      <Card className="max-w-xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            {plan.isActive ? "Deactivate plan" : "Reactivate plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {plan.isActive
                ? "Deactivating stops this plan being offered for new or renewed memberships. Existing memberships on this plan are unaffected."
                : "Reactivating lets admins assign this plan to new memberships again."}
            </p>
            <form action={toggleActiveAction}>
              <Button type="submit" variant={plan.isActive ? "destructive" : "outline"}>
                {plan.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
