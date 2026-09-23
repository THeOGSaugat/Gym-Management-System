"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";
import { paymentMethodLabel } from "@/lib/payment-display";
import {
  paymentMethodValues,
  paymentStatusValues,
} from "@/lib/validations/payment";
import type { RecordPaymentState } from "@/app/admin/members/[id]/payments/actions";

type MembershipOption = {
  id: string;
  planNameSnapshot: string;
  status: string;
};

export function RecordPaymentForm({
  action,
  memberships,
  defaultMembershipId,
}: {
  action: (state: RecordPaymentState, formData: FormData) => Promise<RecordPaymentState>;
  memberships: MembershipOption[];
  defaultMembershipId?: string;
}) {
  const [state, formAction, pending] = useActionState<RecordPaymentState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormSection title="Payment">
        <Field label="Amount (USD)" htmlFor="amount" hint="e.g. 49.99">
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            required
            disabled={pending}
            aria-describedby="amount-hint"
          />
        </Field>
        <Field label="Payment date" htmlFor="paidAt">
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            disabled={pending}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Method" htmlFor="method">
          <NativeSelect id="method" name="method" required disabled={pending}>
            {paymentMethodValues.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabel(method)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" disabled={pending} defaultValue="SUCCEEDED">
            {paymentStatusValues.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </FormSection>

      <FormSection
        title="Bookkeeping"
        description="Link this payment to a membership and keep a reference for your records."
      >
        <Field label="Membership" htmlFor="membershipId" optional className="sm:col-span-2">
          <NativeSelect
            id="membershipId"
            name="membershipId"
            disabled={pending}
            defaultValue={defaultMembershipId ?? ""}
          >
            <option value="">Not tied to a specific membership</option>
            {memberships.map((m) => (
              <option key={m.id} value={m.id}>
                {m.planNameSnapshot} ({m.status.toLowerCase()})
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Reference"
          htmlFor="reference"
          optional
          hint="Receipt number, bank transfer ID, etc."
        >
          <Input id="reference" name="reference" disabled={pending} aria-describedby="reference-hint" />
        </Field>
        <Field label="Notes" htmlFor="notes" optional className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={2} disabled={pending} />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Recording…" : "Record payment"}
        </Button>
      </FormActions>
    </form>
  );
}
