"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { parseIdArg } from "@/lib/validations/action-args";
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
  memberId = parseIdArg(memberId);

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
  memberId = parseIdArg(memberId);
  membershipId = parseIdArg(membershipId);
  const renewed = await renewMembership(actor, membershipId);
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath(`/admin/members/${memberId}/memberships/${membershipId}`);
  redirect(`/admin/members/${memberId}/memberships/${renewed.id}`);
}

/**
 * Cancelling now happens inside a confirmation dialog (see ConfirmAction),
 * which owns the form — so this is a plain action rather than a
 * useActionState one, and a rejected cancel comes back as a `?error=`
 * on the membership page instead of form state. The service call and its
 * rules are unchanged.
 */
export async function cancelMembershipAction(
  memberId: string,
  membershipId: string,
  formData: FormData,
) {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);
  membershipId = parseIdArg(membershipId);
  const membershipHref = `/admin/members/${memberId}/memberships/${membershipId}`;

  const parsed = cancelMembershipSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    redirect(
      `${membershipHref}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form for errors.")}`,
    );
  }

  try {
    await cancelMembership(actor, membershipId, parsed.data.reason);
  } catch (error) {
    if (error instanceof AppError) {
      redirect(`${membershipHref}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath(membershipHref);
  redirect(`${membershipHref}?cancelled=1`);
}
