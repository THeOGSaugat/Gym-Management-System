import Link from "next/link";
import { CalendarCheck, CreditCard, Dumbbell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth/session";

const HIGHLIGHTS = [
  {
    icon: Dumbbell,
    title: "Training that travels",
    description: "Trainers build plans; members open them on the gym floor, set by set.",
  },
  {
    icon: CalendarCheck,
    title: "Check in from your phone",
    description: "One tap in, one tap out — attendance without a front-desk queue.",
  },
  {
    icon: CreditCard,
    title: "Memberships and payments",
    description: "Plans, renewals and payment history, recorded and easy to audit.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    description: "Weight and measurements logged over time by the member themselves.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            Members · Trainers · Admins
          </span>
          <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Run your gym from one place
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-balance text-muted-foreground">
            Members, trainers, memberships, payments, attendance and training plans — one
            system, built to work as well on the gym floor as it does at the front desk.
          </p>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            nativeButton={false}
            render={
              user ? (
                <Link href="/dashboard">Go to dashboard</Link>
              ) : (
                <Link href="/login">Log in</Link>
              )
            }
          />
        </div>

        <ul className="mt-16 grid w-full max-w-4xl gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map((highlight) => (
            <li
              key={highlight.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-xs"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground"
              >
                <highlight.icon className="size-4.5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
                  {highlight.title}
                </h2>
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {highlight.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
