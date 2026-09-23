"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

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
      <FormSection title="Contact details">
        <Field label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            disabled={pending}
            defaultValue={defaultValues.fullName}
          />
        </Field>
        <Field label="Phone" htmlFor="phone" optional>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={pending}
            defaultValue={defaultValues.phone}
          />
        </Field>
        <Field label="Address" htmlFor="address" optional className="sm:col-span-2">
          <Textarea
            id="address"
            name="address"
            rows={2}
            autoComplete="street-address"
            disabled={pending}
            defaultValue={defaultValues.address}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Emergency contact"
        description="Who the gym should call if something happens during a session."
      >
        <Field label="Name" htmlFor="emergencyContactName" optional>
          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            disabled={pending}
            defaultValue={defaultValues.emergencyContactName}
          />
        </Field>
        <Field label="Phone" htmlFor="emergencyContactPhone" optional>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            type="tel"
            inputMode="tel"
            disabled={pending}
            defaultValue={defaultValues.emergencyContactPhone}
          />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}
      {state?.success ? <ActionFeedback>Profile updated.</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
