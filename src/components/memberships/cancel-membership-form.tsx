"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CancelMembershipState } from "@/app/admin/members/[id]/memberships/actions";

export function CancelMembershipForm({
  action,
}: {
  action: (state: CancelMembershipState, formData: FormData) => Promise<CancelMembershipState>;
}) {
  const [state, formAction, pending] = useActionState<CancelMembershipState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea id="reason" name="reason" rows={2} disabled={pending} />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Cancelling…" : "Cancel membership"}
        </Button>
      </div>
    </form>
  );
}
