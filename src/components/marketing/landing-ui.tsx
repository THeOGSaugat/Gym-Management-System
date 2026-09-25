import Link from "next/link";
import { Manrope, Oswald } from "next/font/google";
import { cn } from "cn";

/**
 * Condensed, heavy display face for the landing page's poster-style
 * headlines. Loaded through `next/font` (self-hosted at build time, no new
 * dependency, no layout shift) and applied only on the public homepage.
 */
export const display = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/**
 * Manrope SemiBold for the navbar links only — a clean, slightly bold
 * geometric sans that reads as polished next to the poster headlines. Same
 * `next/font` mechanism as above, so it is self-hosted with no new package.
 */
export const navFont = Manrope({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

/** "INFINITY FITNESS" wordmark — white/brand split, like a gym's shop sign. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        display.className,
        "inline-flex items-center rounded-md text-xl font-bold tracking-wide uppercase",
        className
      )}
    >
      <span className="text-foreground">Infinity</span>
      <span className="text-brand">Fitness</span>
    </Link>
  );
}

const DEFAULT_WORDS = ["Deadlift", "Pilates", "Cardio", "Plank", "Squat", "Strength", "Mobility"];

/**
 * One slanted, endlessly scrolling training-word ribbon. The word list is
 * rendered twice so the -50% keyframe loops seamlessly. Purely decorative
 * (aria-hidden) and frozen for anyone with reduced motion enabled — the
 * global `prefers-reduced-motion` rule stops the animation.
 */
export function Ribbon({
  tone,
  reverse = false,
  words = DEFAULT_WORDS,
  className,
}: {
  tone: "brand" | "steel";
  reverse?: boolean;
  words?: string[];
  className?: string;
}) {
  const row = [...words, ...words];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "group w-[140%] -translate-x-[14%] overflow-hidden border-y py-2.5 shadow-lg",
        tone === "brand"
          ? "border-brand-strong bg-brand text-ink"
          : "border-white/10 bg-border-strong text-foreground/90",
        className
      )}
    >
      <div
        className={cn(
          display.className,
          "flex w-max items-center gap-6 pr-6 text-lg font-semibold tracking-wide whitespace-nowrap uppercase sm:text-2xl",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          "group-hover:[animation-play-state:paused]"
        )}
      >
        {row.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-6">
            {word}
            <span className={tone === "brand" ? "text-ink/70" : "text-brand"}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
