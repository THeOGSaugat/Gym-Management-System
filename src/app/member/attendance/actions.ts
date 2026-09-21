"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { checkIn, checkOut } from "@/server/services/attendance.service";
import { AppError } from "@/lib/errors";

export type AttendanceActionState = { error: string } | undefined;

// No `(prevState, formData)` params: there's no form input for these two
// actions to read, and useActionState calls with both regardless of how
// many parameters the function actually declares.
export async function checkInAction(): Promise<AttendanceActionState> {
  const actor = await requireRole("MEMBER");

  try {
    await checkIn(actor, actor.id);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/member/attendance");
  return undefined;
}

export async function checkOutAction(): Promise<AttendanceActionState> {
  const actor = await requireRole("MEMBER");

  try {
    await checkOut(actor, actor.id);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/member/attendance");
  return undefined;
}
