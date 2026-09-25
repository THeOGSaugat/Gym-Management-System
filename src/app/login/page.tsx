import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Dumbbell, ShieldCheck, UserRound, Users, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { BRAND } from "@/lib/brand";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/brand-mark";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { display } from "@/components/marketing/landing-ui";
import { cn } from "cn";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

type Portal = "member" | "trainer" | "admin";

const PORTALS: Record<Portal, { label: string; title: string; text: string; icon: LucideIcon }> = {
  member: {
    label: "Member",
    title: "Member login",
    text: "See today's workout, check in and track your progress.",
    icon: UserRound,
  },
  trainer: {
    label: "Trainer",
    title: "Trainer login",
    text: "Your members, their plans and your coaching workspace.",
    icon: Users,
  },
  admin: {
    label: "Admin",
    title: "Admin login",
    text: `Run ${BRAND.name} — members, trainers, memberships and payments.`,
    icon: ShieldCheck,
  },
};

function isPortal(value: string | undefined): value is Portal {
  return value === "member" || value === "trainer" || value === "admin";
}

/**
 * One login for every role. `?role=` only changes the wording and icon on
 * this page — it is never sent to the server, never trusted, and grants
 * nothing. After sign-in the user is sent to /dashboard, which routes them
 * by the role stored on their account, and every portal's layout plus the
 * service layer re-check that role on each request. Picking "Admin" here
 * cannot get a member into the admin portal.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  // Already signed in? Don't show the login form — send them straight in.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { role } = await searchParams;
  const portal = isPortal(role) ? role : null;
  const copy = portal ? PORTALS[portal] : null;
  const Icon = copy?.icon;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandMark href="/" />
          <Link
            href="/#portals"
            className="tap-target inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All portals
          </Link>
        </div>
      </header>

      <main className="flex flex-1 lg:grid lg:grid-cols-2">
        {/* Laptop and up: a full-height photo panel beside the form, so the
            page fills the screen instead of floating a small card in space. */}
        <div className="relative hidden lg:block">
          <MarketingImage
            src="/images/landing/pull-up.jpg"
            alt="An athlete doing pull-ups in the Infinity Fitness gym"
            fallbackIcon={Dumbbell}
            fallbackLabel={BRAND.tagline}
            sizes="50vw"
            eager
            className="absolute inset-0 rounded-none bg-background"
            imageClassName="object-[center_22%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-background via-background/25 to-background/10"
          />
          <p
            aria-hidden="true"
            className={cn(
              display.className,
              "absolute inset-x-0 bottom-0 p-10 text-5xl leading-[0.95] font-bold uppercase xl:p-14 xl:text-6xl",
            )}
          >
            <span className="block text-primary">Train Better.</span>
            <span className="block">Live Stronger.</span>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              {Icon ? (
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
                >
                  <Icon className="size-6" />
                </span>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-[-0.02em]">
                  {copy ? copy.title : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {copy ? copy.text : `Log in to ${BRAND.name}.`}
                </p>
              </div>
            </div>

            {/* Portal switcher — presentation only; see the comment above. */}
            <nav aria-label="Portal" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {(Object.keys(PORTALS) as Portal[]).map((key) => (
                <Link
                  key={key}
                  href={`/login?role=${key}`}
                  aria-current={portal === key ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    portal === key
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {PORTALS[key].label}
                </Link>
              ))}
            </nav>

            <Card>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              You&apos;ll be taken to the portal that matches your account. Trouble signing in? Ask
              an admin to reset your password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
