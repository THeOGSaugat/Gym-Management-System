"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { parseBooleanArg, parseIdArg } from "@/lib/validations/action-args";
import { createPlan, updatePlan, setPlanActive } from "@/server/services/plan.service";
import { planSchema } from "@/lib/validations/plan";
import { AppError } from "@/lib/errors";
import type { PlanFormState } from "@/components/plans/plan-form";

function readPlanFormFields(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    durationDays: formData.get("durationDays"),
    priceMinor: formData.get("price"),
  };
}

export async function createPlanAction(
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = planSchema.safeParse(readPlanFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createPlan(actor, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${createdId}`);
}

export async function updatePlanAction(
  planId: string,
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const actor = await requireRole("ADMIN");
  planId = parseIdArg(planId);

  const parsed = planSchema.safeParse(readPlanFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updatePlan(actor, planId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

export async function setPlanActiveAction(planId: string, isActive: boolean) {
  const actor = await requireRole("ADMIN");
  planId = parseIdArg(planId);
  isActive = parseBooleanArg(isActive);
  await setPlanActive(actor, planId, isActive);
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${planId}`);
}
