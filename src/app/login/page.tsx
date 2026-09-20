import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Log in",
};

/**
 * Placeholder login screen — layout and design only.
 * Real authentication (Auth.js, session handling, role-based redirects)
 * is built in Phase 1. The form below is not wired up yet.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Authentication is not implemented yet — this is a design
              placeholder for Phase 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled
                />
              </div>
              <Button type="submit" className="mt-2 w-full" disabled>
                Log in (coming in Phase 1)
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
