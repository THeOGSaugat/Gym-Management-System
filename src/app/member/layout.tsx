import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/server/services/notification.service";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("MEMBER");
  const unreadNotificationCount = await getUnreadNotificationCount(user);

  return (
    <AppShell
      role={user.role}
      userName={user.name ?? user.email ?? "Member"}
      userEmail={user.email ?? undefined}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
