"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  createMembership,
  renewMembership,
  cancelMembership,
} from "@/server/services/membership.service";
import { assignMembershipSchema, cancelMembershipSchema } from "@/lib/validations/membership";
import { AppError } from "@/lib/errors";

export type AssignMembershipState = { error: string } | undefined;

export async function assignMembershipAction(
  memberId: string,
  _prevState: AssignMembershipState,
  formData: FormData,
): Promise<AssignMembershipState> {
  const actor = await requireRole("ADMIN");

  const parsed = assignMembershipSchema.safeParse({
    planId: formData.get("planId"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createMembership(actor, memberId, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/members/${memberId}`);
  redirect(`/admin/members/${memberId}/memberships/${createdId}`);
}

export async function renewMembershipAction(memberId: string, membershipId: string) {
  const actor = await requireRole("ADMIN");
  const renewed = await renewMembership(actor, membershipId);
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath(`/admin/members/${memberId}/memberships/${membershipId}`);
  redirect(`/admin/members/${memberId}/memberships/${renewed.id}`);
}

export type CancelMembershipState = { error: string } | undefined;

export async function cancelMembershipAction(
  memberId: string,
  membershipId: string,
  _prevState: CancelMembershipState,
  formData: FormData,
): Promise<CancelMembershipState> {
  const actor = await requireRole("ADMIN");

  const parsed = cancelMembershipSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await cancelMembership(actor, membershipId, parsed.data.reason);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath(`/admin/members/${memberId}/memberships/${membershipId}`);
  return undefined;
}
