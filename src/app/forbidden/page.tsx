import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusScreen } from "@/components/ui/status-screen";
import { ROLE_LABEL } from "@/components/layout/nav-config";

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
      <main className="flex flex-1 flex-col">
        <StatusScreen
          icon={ShieldAlert}
          tone="warning"
          eyebrow="403 · Access denied"
          title="This area isn't yours"
          description={
            user
              ? `You're signed in as a ${ROLE_LABEL[user.role].toLowerCase()}, and that page belongs to a different role. Nothing was changed.`
              : "You don't have permission to view that page."
          }
          actions={
            user ? (
              <>
                <Button
                  className="w-full sm:w-auto"
                  nativeButton={false}
                  render={<Link href="/dashboard">Go to my dashboard</Link>}
                />
                <form action={logoutAction} className="w-full sm:w-auto">
                  <Button type="submit" variant="outline" block>
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <Button
                className="w-full sm:w-auto"
                nativeButton={false}
                render={<Link href="/login">Log in</Link>}
              />
            )
          }
        />
      </main>
    </div>
  );
}
