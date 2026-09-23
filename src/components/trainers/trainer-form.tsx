"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

export type TrainerFormState = { error: string } | undefined;

export type TrainerFormDefaultValues = {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
};

export function TrainerForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: TrainerFormState, formData: FormData) => Promise<TrainerFormState>;
  defaultValues?: TrainerFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState<TrainerFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormSection
        title="Account"
        description={
          mode === "create"
            ? "How the trainer signs in. Email is their login."
            : "Email is the trainer's login — changing it changes how they sign in."
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
            hint="At least 8 characters. Ask the trainer to change it after their first login."
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
      </FormSection>

      <FormSection
        title="Coaching profile"
        description="Shown to admins when choosing who to assign a member to."
      >
        <Field label="Specialization" htmlFor="specialization" optional>
          <Input
            id="specialization"
            name="specialization"
            placeholder="e.g. Strength & conditioning"
            disabled={pending}
            defaultValue={defaultValues?.specialization}
          />
        </Field>
        <Field label="Years of experience" htmlFor="experienceYears" optional>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            disabled={pending}
            defaultValue={defaultValues?.experienceYears}
          />
        </Field>
        <Field label="Bio" htmlFor="bio" optional className="sm:col-span-2">
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            disabled={pending}
            defaultValue={defaultValues?.bio}
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
              ? "Create trainer"
              : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
