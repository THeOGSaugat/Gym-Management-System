import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getPlan } from "@/server/services/plan.service";
import { handlePageError } from "@/lib/service-error";
import { formatMinorUnits, toDecimalString } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Section } from "@/components/ui/section";
import { PlanForm } from "@/components/plans/plan-form";
import { updatePlanAction, setPlanActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Plan",
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
      <PageHeader
        backHref="/admin/plans"
        backLabel="Membership plans"
        title={plan.name}
        badge={
          plan.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="muted">Inactive</Badge>
          )
        }
        description={`${formatMinorUnits(plan.priceMinor, plan.currency)} · ${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"}`}
      />

      <Section title="Plan details">
        <Card className="max-w-2xl">
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
      </Section>

      <Section title="Availability">
        <Card className="max-w-2xl border-destructive-border">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {plan.isActive ? "Deactivate plan" : "Reactivate plan"}
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                {plan.isActive
                  ? "Stops this plan being offered for new or renewed memberships."
                  : "Lets admins assign this plan to new memberships again."}
              </p>
            </div>

            {plan.isActive ? (
              <ConfirmAction
                action={toggleActiveAction}
                title={`Deactivate "${plan.name}"?`}
                description="This plan will no longer be selectable when assigning or renewing a membership."
                consequences={[
                  "Members already on this plan keep their membership and its price — nothing changes for them.",
                  "Renewing an existing membership on this plan will be blocked until it's reactivated.",
                ]}
                reversibility="Fully reversible — you can reactivate the plan from this page."
                confirmLabel="Deactivate plan"
                triggerLabel="Deactivate"
                triggerClassName="w-full sm:w-auto"
              />
            ) : (
              <ConfirmAction
                action={toggleActiveAction}
                tone="default"
                title={`Reactivate "${plan.name}"?`}
                description="This plan becomes selectable again for new and renewed memberships."
                reversibility="Reversible — you can deactivate it again later."
                confirmLabel="Reactivate plan"
                triggerLabel="Reactivate"
                triggerVariant="outline"
                triggerClassName="w-full sm:w-auto"
              />
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
