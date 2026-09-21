"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type SelfProfileFormState = { error?: string; success?: boolean } | undefined;

export function SelfProfileForm({
  action,
  defaultValues,
}: {
  action: (state: SelfProfileFormState, formData: FormData) => Promise<SelfProfileFormState>;
  defaultValues: {
    fullName: string;
    phone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
}) {
  const [state, formAction, pending] = useActionState<SelfProfileFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            disabled={pending}
            defaultValue={defaultValues.fullName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            disabled={pending}
            defaultValue={defaultValues.phone}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          rows={2}
          disabled={pending}
          defaultValue={defaultValues.address}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergencyContactName">Emergency contact name</Label>
          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            disabled={pending}
            defaultValue={defaultValues.emergencyContactName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            type="tel"
            disabled={pending}
            defaultValue={defaultValues.emergencyContactPhone}
          />
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-green-600 dark:text-green-500">
          Profile updated.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
