"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { parseIdArg } from "@/lib/validations/action-args";
import { recordPayment } from "@/server/services/payment.service";
import { recordPaymentSchema } from "@/lib/validations/payment";
import { AppError } from "@/lib/errors";

export type RecordPaymentState = { error: string } | undefined;

export async function recordPaymentAction(
  memberId: string,
  _prevState: RecordPaymentState,
  formData: FormData,
): Promise<RecordPaymentState> {
  const actor = await requireRole("ADMIN");
  memberId = parseIdArg(memberId);

  const parsed = recordPaymentSchema.safeParse({
    membershipId: formData.get("membershipId"),
    amountMinor: formData.get("amount"),
    method: formData.get("method"),
    status: formData.get("status"),
    reference: formData.get("reference"),
    notes: formData.get("notes"),
    paidAt: formData.get("paidAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await recordPayment(actor, memberId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/payments");
  redirect(`/admin/members/${memberId}`);
}
