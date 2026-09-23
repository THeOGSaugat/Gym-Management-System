import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

/**
 * Public header shown on unauthenticated pages (landing, login, forbidden).
 * The authenticated app (admin/trainer/member) uses AppShell instead.
 * This is a server component so it can read the session and swap between
 * "Log in" and "Dashboard / Log out" without any client-side fetch.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandMark href="/" />

        <nav className="flex items-center gap-2" aria-label="Account">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard">Dashboard</Link>}
              />
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button size="sm" nativeButton={false} render={<Link href="/login">Log in</Link>} />
          )}
        </nav>
      </div>
    </header>
  );
}
