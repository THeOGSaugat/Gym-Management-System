"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="49.99"
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paidAt">Payment date</Label>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            disabled={pending}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="method">Method</Label>
          <select
            id="method"
            name="method"
            required
            disabled={pending}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {paymentMethodValues.map((method) => (
              <option key={method} value={method}>
                {method === "BANK_TRANSFER" ? "Bank transfer" : method === "CASH" ? "Cash" : "Other"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            disabled={pending}
            defaultValue="SUCCEEDED"
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {paymentStatusValues.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="membershipId">Membership (optional)</Label>
          <select
            id="membershipId"
            name="membershipId"
            disabled={pending}
            defaultValue={defaultMembershipId ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Not tied to a specific membership</option>
            {memberships.map((m) => (
              <option key={m.id} value={m.id}>
                {m.planNameSnapshot} ({m.status})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reference">Reference (optional)</Label>
          <Input id="reference" name="reference" disabled={pending} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} disabled={pending} />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Recording…" : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
