import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Access denied",
};

/**
 * Shown when a signed-in user's role doesn't match the area they tried to
 * open (e.g. a MEMBER hitting /admin/dashboard). Reached from the
 * `authorized` callback in src/lib/auth/config.ts.
 */
export default async function ForbiddenPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-medium text-muted-foreground">403</p>
        <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
        <p className="max-w-md text-muted-foreground">
          {user
            ? `Your account (${user.role.toLowerCase()}) doesn't have permission to view that page.`
            : "You don't have permission to view that page."}
        </p>
        <div className="flex gap-3">
          {user ? (
            <>
              <Button nativeButton={false} render={<Link href="/dashboard">Go to my dashboard</Link>} />
              <form action={logoutAction}>
                <Button type="submit" variant="outline">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button nativeButton={false} render={<Link href="/login">Log in</Link>} />
          )}
        </div>
      </main>
    </div>
  );
}
