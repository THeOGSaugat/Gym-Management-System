import { requireRole } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { getUnreadNotificationCount } from "@/server/services/notification.service";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("MEMBER");
  const unreadNotificationCount = await getUnreadNotificationCount(user);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        name={user.name ?? user.email ?? "Member"}
        role={user.role}
        unreadNotificationCount={unreadNotificationCount}
        notificationsHref="/member/notifications"
      />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
