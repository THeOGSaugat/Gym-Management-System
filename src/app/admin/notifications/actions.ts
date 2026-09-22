"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/server/services/notification.service";

export async function markNotificationReadAction(notificationId: string) {
  const actor = await requireRole("ADMIN");
  await markNotificationAsRead(actor, notificationId);
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsReadAction() {
  const actor = await requireRole("ADMIN");
  await markAllNotificationsAsRead(actor);
  revalidatePath("/admin/notifications");
}
