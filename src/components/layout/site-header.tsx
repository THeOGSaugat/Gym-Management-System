import Link from "next/link";
import { Dumbbell } from "lucide-react";

/**
 * Minimal public header shown on unauthenticated pages (landing, login).
 * The authenticated app (admin/trainer/member) will get its own layout
 * with a sidebar in a later phase — this is intentionally separate.
 */
export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Dumbbell className="size-5" aria-hidden="true" />
          <span>Gym Management System</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
