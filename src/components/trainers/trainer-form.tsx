"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            disabled={pending}
            defaultValue={defaultValues?.fullName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={pending}
            defaultValue={defaultValues?.email}
          />
        </div>
        {mode === "create" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Initial password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              disabled={pending}
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-muted-foreground">
              Tell the trainer to change this after their first login.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            disabled={pending}
            defaultValue={defaultValues?.phone}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input
            id="specialization"
            name="specialization"
            placeholder="Strength & conditioning, yoga, ..."
            disabled={pending}
            defaultValue={defaultValues?.specialization}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="experienceYears">Years of experience</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            step={1}
            disabled={pending}
            defaultValue={defaultValues?.experienceYears}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          disabled={pending}
          defaultValue={defaultValues?.bio}
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
              ? "Create trainer"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
