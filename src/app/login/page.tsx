import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  // Already signed in? Don't show the login form — send them straight in.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
          >
            <Dumbbell className="size-6" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Log in to manage your gym, your members or your training.
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Trouble signing in? Ask an admin to reset your password — self-service password
          reset isn&apos;t available yet.
        </p>
      </div>
    </main>
  );
}
