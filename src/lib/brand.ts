/**
 * The gym's public identity, in one place. User-facing copy (page titles,
 * the logo lockup, the landing page) reads from here so a rename is a
 * one-file change. Internal identifiers — package name, database, code
 * symbols — intentionally don't use this.
 */
export const BRAND = {
  name: "Infinity Fitness",
  tagline: "Train Better. Live Stronger.",
  description:
    "Infinity Fitness is a modern gym where members train with personal coaching, follow structured workout plans and track their progress — all in one place.",
} as const;
