"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Plan name</Label>
          <Input
            id="name"
            name="name"
            required
            disabled={pending}
            defaultValue={defaultValues?.name}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationDays">Duration (days)</Label>
          <Input
            id="durationDays"
            name="durationDays"
            type="number"
            min={1}
            step={1}
            required
            disabled={pending}
            defaultValue={defaultValues?.durationDays}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="49.99"
            required
            disabled={pending}
            defaultValue={defaultValues?.price}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          disabled={pending}
          defaultValue={defaultValues?.description}
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create plan"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
