import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "cn";
import { PublicNav } from "@/components/marketing/public-nav";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { Ribbon, Wordmark, display } from "@/components/marketing/landing-ui";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
};

const WHY = [
  {
    icon: ClipboardList,
    title: "Plans built for you",
    text: "Your trainer designs your programme day by day — exercises, sets, reps and rest.",
  },
  {
    icon: HeartHandshake,
    title: "A coach in your corner",
    text: "Every member can be paired with a trainer who follows your progress.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    text: "Log your measurements and watch the trend, not just today's number.",
  },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Dumbbell,
    title: "Workout plans",
    text: "Open today's session on your phone, set by set, right on the gym floor.",
  },
  {
    icon: TrendingUp,
    title: "Progress",
    text: "Weight, body fat and measurements tracked over time with clear trends.",
  },
  {
    icon: UserRound,
    title: "Trainer support",
    text: "Your trainer sees your plan and progress, so coaching stays on track.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance",
    text: "Check in and out with one tap and keep an honest record of your visits.",
  },
  {
    icon: CreditCard,
    title: "Membership",
    text: "Your plan, renewal date and payment history — always one tap away.",
  },
];

const STEPS = [
  {
    title: "Join at the front desk",
    text: "Our team sets up your membership and your account, and pairs you with a trainer.",
  },
  {
    title: "Get your plan",
    text: "Your trainer builds a programme around your goals — ready in your member portal.",
  },
  {
    title: "Train and track",
    text: "Check in, follow your workout, log your progress. Repeat, and watch it add up.",
  },
];

const PORTALS: {
  role: "member" | "trainer" | "admin";
  icon: LucideIcon;
  title: string;
  text: string;
  cta: string;
}[] = [
  {
    role: "member",
    icon: UserRound,
    title: "Member",
    text: "View your workouts, attendance, progress and membership.",
    cta: "Member login",
  },
  {
    role: "trainer",
    icon: Users,
    title: "Trainer",
    text: "Manage your members, workout plans, exercises and coaching.",
    cta: "Trainer login",
  },
  {
    role: "admin",
    icon: ShieldCheck,
    title: "Admin",
    text: "Run Infinity Fitness — members, trainers, memberships and payments.",
    cta: "Admin login",
  },
];

const FOOTER_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Portals", href: "/#portals" },
  { label: "Member login", href: "/login?role=member" },
  { label: "Trainer login", href: "/login?role=trainer" },
  { label: "Admin login", href: "/login?role=admin" },
];

/** The "///" accent the reference uses above small labels. */
function Slashes() {
  return (
    <span aria-hidden="true" className="font-bold tracking-[-0.15em] text-brand">
      {"///"}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  id,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  id: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
        <Slashes />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          display.className,
          "text-4xl leading-[1.05] font-bold tracking-tight text-balance text-white uppercase sm:text-5xl"
        )}
      >
        {title}
      </h2>
      {text ? (
        <p className="text-base leading-relaxed text-balance text-white/65">{text}</p>
      ) : null}
    </div>
  );
}

/*
 * Hover vocabulary for the whole page. Everything eases out on the same
 * curve so the page feels like one material: controls lift and glow, cards
 * lift and light up from the top edge, and icons/arrows nudge. `hover:` only
 * fires on devices that can actually hover (Tailwind v4), so none of this
 * gets "stuck" on touch, and the global reduced-motion rule shortens it.
 */
const ease =
  "transition-[translate,scale,rotate,box-shadow,border-color,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const pillPrimary = cn(
  ease,
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-ink shadow-[0_0_0_0_transparent] hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-[0_12px_32px_-8px_color-mix(in_oklch,var(--color-brand)_75%,transparent)] focus-visible:outline-white active:translate-y-0 active:scale-[0.97]"
);
const pillGhost = cn(
  ease,
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-7 text-base font-semibold text-white hover:-translate-y-0.5 hover:border-brand hover:bg-brand/10 hover:text-brand focus-visible:outline-white active:translate-y-0 active:scale-[0.97]"
);
const card = cn(
  ease,
  "group relative isolate flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-raised hover:-translate-y-1.5 hover:border-brand/60 hover:shadow-[0_24px_48px_-24px_color-mix(in_oklch,var(--color-brand)_55%,transparent)]"
);

/** Soft green light that fades in along a card's top edge on hover. */
function CardGlow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_50%_-10%,color-mix(in_oklch,var(--color-brand)_24%,transparent),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />
  );
}

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col bg-ink text-white [color-scheme:dark]">
      <PublicNav />

      <main>
        {/* HERO — the athlete photo fills the section as a full-bleed background. */}
        <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 lg:left-auto lg:w-[min(54%,780px)]">
            <MarketingImage
              src="/images/landing/hero.jpg"
              alt="An athlete doing a dumbbell curl in the Infinity Fitness gym"
              fallbackIcon={Dumbbell}
              fallbackLabel="Train better at Infinity Fitness"
              sizes="(min-width: 1024px) 780px, 100vw"
              preload
              className="absolute inset-0 rounded-none bg-ink"
              imageClassName="object-[58%_12%] lg:object-[center_18%]"
            />
            {/* Veils keep the headline readable over the photo: bottom-up on
                phones (text sits low), left-to-right on laptops (text sits left). */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-ink from-40% via-ink/60 via-65% to-ink/0 lg:bg-linear-to-r lg:from-ink lg:from-0% lg:via-ink/35 lg:via-50% lg:to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-ink to-transparent"
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/4 -left-40 -z-10 size-[34rem] rounded-full bg-brand/10 blur-[130px]"
          />

          <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl flex-col justify-end px-4 pt-[38svh] pb-44 sm:px-6 sm:pb-48 lg:justify-center lg:pt-24">
            <div className="flex max-w-2xl flex-col items-start">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-ink/60 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-white/85 uppercase backdrop-blur-sm">
                <Slashes />
                {BRAND.name}
              </p>
              <h1
                id="hero-title"
                className={cn(
                  display.className,
                  "text-[3.4rem] leading-[0.92] font-bold tracking-tight uppercase sm:text-7xl xl:text-[6.5rem]"
                )}
              >
                <span className="block text-brand">Train Better.</span>
                <span className="block">
                  Live <span className="text-brand">Stronger.</span>
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                Personal coaching, structured workout plans and progress you can actually see —
                everything you need to train with purpose and stay consistent.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link href="#join" className={pillPrimary}>
                  Join {BRAND.name}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link href="#features" className={cn(pillGhost, "bg-ink/40 backdrop-blur-sm")}>
                  Explore
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                {["Personal coaching", "Structured plans", "Progress tracking"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Crossing ribbons along the bottom edge of the hero. */}
          <div className="absolute inset-x-0 bottom-4 overflow-hidden py-6 sm:bottom-6">
            <Ribbon tone="steel" reverse className="rotate-[2deg]" />
            <Ribbon tone="brand" className="-mt-9 -rotate-[2deg] sm:-mt-11" />
          </div>
        </section>

        {/* WHY — the pull-up photo bleeds off the left edge on laptops and
            runs full-width above the copy on phones. */}
        <section aria-labelledby="why-title" className="relative isolate overflow-hidden">
          <div className="group/photo relative h-[26rem] sm:h-[34rem] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-1/2">
            <MarketingImage
              src="/images/landing/pull-up.jpg"
              alt="An athlete doing pull-ups in the Infinity Fitness gym"
              fallbackIcon={HeartHandshake}
              fallbackLabel="Coaching that keeps you on track"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 rounded-none bg-ink"
              imageClassName="object-[center_22%] transition-transform duration-[1400ms] ease-out group-hover/photo:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-ink via-transparent to-ink/40 lg:bg-linear-to-l lg:from-ink lg:via-ink/10 lg:to-ink/30"
            />
          </div>

          <div className="mx-auto grid w-full max-w-7xl px-4 sm:px-6 lg:grid-cols-2">
            <div className="relative -mt-20 flex flex-col gap-8 pb-16 lg:col-start-2 lg:mt-0 lg:py-28 lg:pl-14">
              <div className="flex flex-col items-start gap-5">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
                  <Slashes />
                  Why {BRAND.name}
                </p>
                <h2
                  id="why-title"
                  className={cn(
                    display.className,
                    "text-4xl leading-[1.02] font-bold tracking-tight uppercase sm:text-5xl xl:text-6xl"
                  )}
                >
                  More than a place to lift
                </h2>
                <p className="max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                  Real progress comes from a plan, a coach and consistency. We give you all three.
                </p>
              </div>

              <ul className="flex flex-col gap-4">
                {WHY.map((item) => (
                  <li
                    key={item.title}
                    className={cn(card, "flex-row gap-4 border-b-2 border-b-brand bg-ink-raised/90 p-5 backdrop-blur-sm hover:-translate-y-1 hover:translate-x-1")}
                  >
                    <CardGlow />
                    <span
                      aria-hidden="true"
                      className={cn(ease, "flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand group-hover:text-ink")}
                    >
                      <item.icon className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3
                        className={cn(display.className, "text-xl font-semibold tracking-wide uppercase")}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-white/65">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          aria-labelledby="features-title"
          id="features"
          className="scroll-mt-20 border-t border-white/5"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
            <SectionHeading
              id="features-title"
              eyebrow="Features"
              title="Everything your training needs"
              text="Your plan, your coach and your progress live together, so every session builds on the last."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className={cn(card, "gap-3 p-6")}
                >
                  <CardGlow />
                  <span
                    aria-hidden="true"
                    className={cn(ease, "flex size-12 items-center justify-center rounded-xl bg-brand text-ink group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-[0_8px_24px_-6px_color-mix(in_oklch,var(--color-brand)_80%,transparent)]")}
                  >
                    <feature.icon className="size-5" />
                  </span>
                  <h3
                    className={cn(display.className, "text-2xl font-semibold tracking-wide uppercase")}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/65">{feature.text}</p>
                </li>
              ))}
              <li
                aria-hidden="true"
                className="flex flex-col justify-center rounded-2xl bg-brand p-6 text-ink sm:col-span-2 lg:col-span-1"
              >
                <p
                  className={cn(
                    display.className,
                    "text-3xl leading-[1.05] font-bold tracking-tight uppercase"
                  )}
                >
                  Your coach.
                  <br />
                  Your plan.
                  <br />
                  Your progress.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* Ribbon divider */}
        <div className="overflow-hidden py-6" aria-hidden="true">
          <Ribbon tone="brand" className="-rotate-1" />
        </div>

        {/* HOW IT WORKS */}
        <section aria-labelledby="how-title" id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
            <SectionHeading
              id="how-title"
              eyebrow="How it works"
              title="From your first visit to your best set"
            />
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className={cn(card, "gap-3 p-6")}
                >
                  <CardGlow />
                  <span
                    aria-hidden="true"
                    className={cn(
                      display.className,
                      ease,
                      "origin-left text-6xl leading-none font-bold text-brand group-hover:scale-110"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className={cn(display.className, "text-2xl font-semibold tracking-wide uppercase")}>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/65">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PORTALS */}
        <section
          aria-labelledby="portals-title"
          id="portals"
          className="scroll-mt-20 border-t border-white/5"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
            <SectionHeading
              id="portals-title"
              eyebrow="Portals"
              title="Choose your portal"
              text="One login for everyone — you'll land in the portal that matches your account."
            />
            <ul className="grid gap-4 md:grid-cols-3">
              {PORTALS.map((portal) => (
                <li key={portal.role}>
                  <Link
                    href={`/login?role=${portal.role}`}
                    className={cn(card, "h-full gap-4 p-6 hover:border-brand focus-visible:border-brand focus-visible:outline-white")}
                  >
                    <CardGlow />
                    <span
                      aria-hidden="true"
                      className={cn(ease, "flex size-12 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand group-hover:text-ink")}
                    >
                      <portal.icon className="size-6" />
                    </span>
                    <div className="flex flex-1 flex-col gap-2">
                      <h3
                        className={cn(display.className, "text-3xl font-bold tracking-wide uppercase")}
                      >
                        {portal.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-white/65">{portal.text}</p>
                    </div>
                    <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">
                      {portal.cta}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1.5"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          aria-labelledby="join-title"
          id="join"
          className="scroll-mt-20 px-4 pb-16 sm:px-6 lg:pb-24"
        >
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-5 overflow-hidden rounded-3xl bg-brand p-8 text-ink sm:p-12">
            <p
              aria-hidden="true"
              className={cn(
                display.className,
                "pointer-events-none absolute -right-6 -bottom-10 text-[9rem] leading-none font-bold text-ink/10 uppercase sm:text-[12rem]"
              )}
            >
              Infinity
            </p>
            <h2
              id="join-title"
              className={cn(
                display.className,
                "relative text-4xl leading-[1.02] font-bold tracking-tight uppercase sm:text-5xl"
              )}
            >
              Ready to train better?
            </h2>
            <p className="relative max-w-lg text-base leading-relaxed font-medium text-ink/80">
              Memberships start at the {BRAND.name} front desk — our team will set up your
              account and match you with a trainer. Already a member? Log in to see today&apos;s
              plan.
            </p>
            <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/login?role=member"
                className={cn(ease, "inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-base font-semibold text-white hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.7)] active:translate-y-0 active:scale-[0.97]")}
              >
                Member login
              </Link>
              <Link
                href="#portals"
                className={cn(ease, "inline-flex h-12 items-center justify-center rounded-full border-2 border-ink/80 px-7 text-base font-semibold text-ink hover:-translate-y-0.5 hover:bg-ink hover:text-brand active:translate-y-0 active:scale-[0.97]")}
              >
                All portals
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <Wordmark />
            <p className="text-sm leading-relaxed text-white/60">{BRAND.tagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <p className="col-span-2 mb-1 text-xs font-semibold tracking-[0.1em] text-white/50 uppercase">
              Explore
            </p>
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(ease, "inline-flex min-h-9 items-center text-white/70 hover:translate-x-1 hover:text-brand")}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
