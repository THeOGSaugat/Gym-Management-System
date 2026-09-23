"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";
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
      <FormSection title="Membership">
        <Field label="Plan" htmlFor="planId" className="sm:col-span-2">
          <NativeSelect id="planId" name="planId" required disabled={pending} defaultValue="">
            <option value="" disabled>
              Select a plan
            </option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.durationDays} days —{" "}
                {formatMinorUnits(plan.priceMinor, plan.currency)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Start date"
          htmlFor="startDate"
          optional
          hint="Leave blank to start today. A future date creates a scheduled (pending) membership."
          className="sm:col-span-2"
        >
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={pending}
            aria-describedby="startDate-hint"
            className="sm:max-w-60"
          />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Assigning…" : "Assign membership"}
        </Button>
      </FormActions>
    </form>
  );
}
