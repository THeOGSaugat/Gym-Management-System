"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  createTrainer,
  updateTrainer,
  setTrainerStatus,
} from "@/server/services/trainer.service";
import { createTrainerSchema, updateTrainerSchema } from "@/lib/validations/trainer";
import { AppError } from "@/lib/errors";
import type { TrainerFormState } from "@/components/trainers/trainer-form";

function readTrainerFormFields(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
    specialization: formData.get("specialization"),
    experienceYears: formData.get("experienceYears"),
  };
}

export async function createTrainerAction(
  _prevState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = createTrainerSchema.safeParse({
    ...readTrainerFormFields(formData),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  let createdId: string;
  try {
    const created = await createTrainer(actor, parsed.data);
    createdId = created.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/trainers");
  redirect(`/admin/trainers/${createdId}`);
}

export async function updateTrainerAction(
  trainerId: string,
  _prevState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = updateTrainerSchema.safeParse(readTrainerFormFields(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  try {
    await updateTrainer(actor, trainerId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/trainers");
  revalidatePath(`/admin/trainers/${trainerId}`);
  redirect(`/admin/trainers/${trainerId}`);
}

export async function setTrainerStatusAction(trainerId: string, nextStatus: "ACTIVE" | "SUSPENDED") {
  const actor = await requireRole("ADMIN");
  await setTrainerStatus(actor, trainerId, nextStatus);
  revalidatePath("/admin/trainers");
  revalidatePath(`/admin/trainers/${trainerId}`);
}
