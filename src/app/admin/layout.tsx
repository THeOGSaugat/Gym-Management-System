import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/server/services/notification.service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layer 2 authorization: runs on every request to anything under /admin,
  // server-side, regardless of what middleware did or didn't catch.
  const user = await requireRole("ADMIN");
  const unreadNotificationCount = await getUnreadNotificationCount(user);

  return (
    <AppShell
      role={user.role}
      userName={user.name ?? user.email ?? "Admin"}
      userEmail={user.email ?? undefined}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
