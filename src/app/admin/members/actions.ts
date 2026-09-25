"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { parseEnumArg, parseIdArg } from "@/lib/validations/action-args";
import {
  createMember,
  updateMemberAsAdmin,
  setMemberStatus,
} from "@/server/services/member.service";
import { createMemberSchema, adminUpdateMemberSchema } from "@/lib/validations/member";
import { AppError } from "@/lib/errors";
import type { MemberFormState } from "@/components/members/member-form";

function readMemberFormFields(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    address: formData.get("address"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
  };
}

export async function createMemberAction(
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  // Layer 2 check: this action must be safe to call on its own, not just
  // safe because the page that renders its form happens to be admin-only.
  const actor = await requireRole("ADMIN");

  const parsed = createMemberSchema.safeParse({
    ...readMemberFormFields(formData),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createMember(actor, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${createdId}`);
}

export async function updateMemberAction(
  memberId: string,
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);

  const parsed = adminUpdateMemberSchema.safeParse(readMemberFormFields(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updateMemberAsAdmin(actor, memberId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  redirect(`/admin/members/${memberId}`);
}

export async function setMemberStatusAction(memberId: string, nextStatus: "ACTIVE" | "SUSPENDED") {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);
  nextStatus = parseEnumArg(nextStatus, ["ACTIVE", "SUSPENDED"]);

  await setMemberStatus(actor, memberId, nextStatus);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
}
