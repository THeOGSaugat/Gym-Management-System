"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
              Tell the member to change this after their first login.
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
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            disabled={pending}
            defaultValue={defaultValues?.dateOfBirth}
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
          defaultValue={defaultValues?.address}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergencyContactName">Emergency contact name</Label>
          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            disabled={pending}
            defaultValue={defaultValues?.emergencyContactName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            type="tel"
            disabled={pending}
            defaultValue={defaultValues?.emergencyContactPhone}
          />
        </div>
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
              ? "Create member"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
