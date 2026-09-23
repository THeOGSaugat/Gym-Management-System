"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FormActions, FormSection } from "@/components/ui/form-field";

export type PlanFormState = { error: string } | undefined;

export function PlanForm({
  mode,
  action,
  defaultValues,
}: {
  mode: "create" | "edit";
  action: (state: PlanFormState, formData: FormData) => Promise<PlanFormState>;
  defaultValues?: {
    name?: string;
    description?: string;
    durationDays?: number;
    price?: string; // decimal string, e.g. "49.99"
  };
}) {
  const [state, formAction, pending] = useActionState<PlanFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormSection
        title="Plan"
        description={
          mode === "edit"
            ? "Changes apply to new and renewed memberships only — existing memberships keep the price and length they were sold at."
            : undefined
        }
      >
        <Field label="Plan name" htmlFor="name" className="sm:col-span-2">
          <Input
            id="name"
            name="name"
            placeholder="e.g. Monthly"
            required
            disabled={pending}
            defaultValue={defaultValues?.name}
          />
        </Field>
        <Field label="Duration (days)" htmlFor="durationDays">
          <Input
            id="durationDays"
            name="durationDays"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            disabled={pending}
            defaultValue={defaultValues?.durationDays}
          />
        </Field>
        <Field label="Price (USD)" htmlFor="price">
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            required
            disabled={pending}
            defaultValue={defaultValues?.price}
          />
        </Field>
        <Field label="Description" htmlFor="description" optional className="sm:col-span-2">
          <Textarea
            id="description"
            name="description"
            rows={3}
            disabled={pending}
            defaultValue={defaultValues?.description}
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
              ? "Create plan"
              : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
