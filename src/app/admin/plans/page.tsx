import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listPlans } from "@/server/services/plan.service";
import { formatMinorUnits } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";

export const metadata: Metadata = {
  title: "Membership plans",
};

export default async function PlansPage() {
  const actor = await requireRole("ADMIN");
  const plans = await listPlans(actor, { includeInactive: true });

  const active = plans.filter((plan) => plan.isActive);
  const inactive = plans.filter((plan) => !plan.isActive);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Membership plans"
        description={`${active.length} active of ${plans.length} plan${plans.length === 1 ? "" : "s"}`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/plans/new">
                <Plus aria-hidden="true" />
                New plan
              </Link>
            }
          />
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No plans yet"
          description="Create the plans your gym sells — members can only be assigned a membership once a plan exists."
          action={
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/plans/new">Create first plan</Link>}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {active.map((plan) => (
              <li key={plan.id}>
                <ListCard
                  href={`/admin/plans/${plan.id}`}
                  icon={Tags}
                  title={plan.name}
                  subtitle={`${formatMinorUnits(plan.priceMinor, plan.currency)} · ${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"}`}
                  meta={plan.description ?? undefined}
                  trailing={
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  }
                />
              </li>
            ))}
          </ul>

          {inactive.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.01em]">Inactive plans</h2>
              <p className="-mt-2 text-[0.8125rem] text-muted-foreground">
                Can&apos;t be assigned to new memberships. Existing memberships are unaffected.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {inactive.map((plan) => (
                  <li key={plan.id}>
                    <ListCard
                      href={`/admin/plans/${plan.id}`}
                      icon={Tags}
                      title={plan.name}
                      subtitle={`${formatMinorUnits(plan.priceMinor, plan.currency)} · ${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"}`}
                      trailing={
                        <Badge variant="muted" size="sm">
                          Inactive
                        </Badge>
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
