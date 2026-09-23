"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

export type MemberFormState = { error: string } | undefined;

export type MemberFormDefaultValues = {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string; // yyyy-mm-dd, for <input type="date">
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

/**
 * Shared by the "create member" and "edit member" admin pages. The only
 * difference is whether a password field is shown (create only — email
 * is fixed as the identifier either way) and which server action it
 * posts to.
 */
export function MemberForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  defaultValues?: MemberFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormSection
        title="Account"
        description={
          mode === "create"
            ? "How the member signs in. Email is their login."
            : "Email is the member's login — changing it changes how they sign in."
        }
      >
        <Field label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            disabled={pending}
            defaultValue={defaultValues?.fullName}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={pending}
            defaultValue={defaultValues?.email}
          />
        </Field>
        {mode === "create" ? (
          <Field
            label="Initial password"
            htmlFor="password"
            hint="At least 8 characters. Ask the member to change it after their first login."
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={pending}
              aria-describedby="password-hint"
            />
          </Field>
        ) : null}
      </FormSection>

      <FormSection title="Personal details">
        <Field label="Phone" htmlFor="phone" optional>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={pending}
            defaultValue={defaultValues?.phone}
          />
        </Field>
        <Field label="Date of birth" htmlFor="dateOfBirth" optional>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.dateOfBirth}
          />
        </Field>
        <Field label="Address" htmlFor="address" optional className="sm:col-span-2">
          <Textarea
            id="address"
            name="address"
            rows={2}
            autoComplete="street-address"
            disabled={pending}
            defaultValue={defaultValues?.address}
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
            defaultValue={defaultValues?.emergencyContactName}
          />
        </Field>
        <Field label="Phone" htmlFor="emergencyContactPhone" optional>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            type="tel"
            inputMode="tel"
            disabled={pending}
            defaultValue={defaultValues?.emergencyContactPhone}
          />
        </Field>
      </FormSection>

      {state?.error ? <ActionFeedback tone="error">{state.error}</ActionFeedback> : null}

      <FormActions>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create member"
              : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
