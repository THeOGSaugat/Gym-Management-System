"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { recordProgress } from "@/server/services/progress.service";
import { progressLogSchema } from "@/lib/validations/progress";
import { AppError } from "@/lib/errors";
import type { ProgressLogFormState } from "@/components/progress/progress-log-form";

export async function recordProgressAction(
  _prevState: ProgressLogFormState,
  formData: FormData,
): Promise<ProgressLogFormState> {
  const actor = await requireRole("MEMBER");

  const parsed = progressLogSchema.safeParse({
    metric: formData.get("metric"),
    customLabel: formData.get("customLabel"),
    value: formData.get("value"),
    notes: formData.get("notes"),
    recordedAt: formData.get("recordedAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await recordProgress(actor, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/member/progress");
  return { success: true };
}
