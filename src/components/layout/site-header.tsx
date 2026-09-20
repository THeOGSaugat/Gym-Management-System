import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";

/**
 * Public header shown on unauthenticated pages (landing, login, forbidden).
 * The authenticated app (admin/trainer/member) uses AppHeader instead.
 * This is a server component so it can read the session and swap between
 * "Log in" and "Dashboard / Log out" without any client-side fetch.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Dumbbell className="size-5" aria-hidden="true" />
          <span>Gym Management System</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
