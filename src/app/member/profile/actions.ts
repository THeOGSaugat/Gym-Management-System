"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { updateOwnProfile } from "@/server/services/member.service";
import { selfUpdateMemberSchema } from "@/lib/validations/member";
import { AppError } from "@/lib/errors";
import type { SelfProfileFormState } from "@/components/members/self-profile-form";

export async function updateOwnProfileAction(
  _prevState: SelfProfileFormState,
  formData: FormData,
): Promise<SelfProfileFormState> {
  // Layer 2 check, independent of the page that renders this form's
  // requireRole("MEMBER") — and note updateOwnProfile itself never takes
  // a target user id, so there's no id to tamper with in the first place.
  const actor = await requireRole("MEMBER");

  const parsed = selfUpdateMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updateOwnProfile(actor, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/member/profile");
  return { success: true };
}
