"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMinorUnits } from "@/lib/money";
import type { AssignMembershipState } from "@/app/admin/members/[id]/memberships/actions";

type PlanOption = {
  id: string;
  name: string;
  durationDays: number;
  priceMinor: number;
  currency: string;
};

export function AssignMembershipForm({
  action,
  plans,
}: {
  action: (state: AssignMembershipState, formData: FormData) => Promise<AssignMembershipState>;
  plans: PlanOption[];
}) {
  const [state, formAction, pending] = useActionState<AssignMembershipState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="planId">Plan</Label>
        <select
          id="planId"
          name="planId"
          required
          disabled={pending}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="" disabled defaultValue="">
            Select a plan
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — {plan.durationDays} days — {formatMinorUnits(plan.priceMinor, plan.currency)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" disabled={pending} />
        <p className="text-xs text-muted-foreground">
          Leave blank to start today. A future date creates a scheduled
          (pending) membership.
        </p>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Assigning…" : "Assign membership"}
        </Button>
      </div>
    </form>
  );
}
