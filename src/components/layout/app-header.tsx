import { Dumbbell } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Header shown inside role-scoped areas (admin/trainer/member). Distinct
 * from SiteHeader, which is for public pages — this one always has a
 * signed-in user and a logout action.
 */
export function AppHeader({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Dumbbell className="size-5" aria-hidden="true" />
          <span>Gym Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm leading-tight">
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground capitalize">{role.toLowerCase()}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
