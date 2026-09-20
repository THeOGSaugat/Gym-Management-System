import { requireRole } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layer 2 authorization: runs on every request to anything under /admin,
  // server-side, regardless of what middleware did or didn't catch.
  const user = await requireRole("ADMIN");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name ?? user.email ?? "Admin"} role={user.role} />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
