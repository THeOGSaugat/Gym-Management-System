import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/server/services/notification.service";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("TRAINER");
  const unreadNotificationCount = await getUnreadNotificationCount(user);

  return (
    <AppShell
      role={user.role}
      userName={user.name ?? user.email ?? "Trainer"}
      userEmail={user.email ?? undefined}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
