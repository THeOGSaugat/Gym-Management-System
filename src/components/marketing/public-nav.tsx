import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { PublicMobileMenu } from "@/components/marketing/public-mobile-menu";
import { Wordmark, navFont } from "@/components/marketing/landing-ui";
import { cn } from "cn";

const LINKS = [
  { label: "Home", href: "/#top" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Portals", href: "/#portals" },
];

/**
 * The public site's navbar — deliberately separate from the signed-in app
 * shell. A signed-in visitor sees "Go to dashboard" in place of "Login",
 * which still routes by their real role.
 */
export async function PublicNav() {
  const user = await getCurrentUser();
  const primary = user
    ? { href: "/dashboard", label: "Go to dashboard" }
    : { href: "/login", label: "Login" };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/80 shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:h-20 lg:px-8">
        <PublicMobileMenu links={LINKS} primaryHref={primary.href} primaryLabel={primary.label} />
        <Wordmark className="lg:text-[1.75rem]" />

        <nav aria-label="Site" className="mx-auto hidden items-center gap-1 md:flex lg:gap-3">
          {LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={index === 0 ? "true" : undefined}
              className={cn(
                // Underline grows from the left on hover and stays put on the
                // current link; text steps up to a comfortable size on laptops.
                navFont.className,
                "group relative inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold tracking-[0.06em] uppercase transition-colors duration-300 lg:h-12 lg:px-4 lg:text-[1.0625rem]",
                "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-brand after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] lg:after:inset-x-4 lg:after:bottom-2",
                index === 0
                  ? "text-brand after:scale-x-100"
                  : "text-white/80 after:scale-x-0 hover:text-white hover:after:scale-x-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={primary.href}
          className="ml-auto inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-ink transition-[translate,box-shadow,background-color,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-[0_10px_28px_-8px_color-mix(in_oklch,var(--color-brand)_75%,transparent)] active:translate-y-0 active:scale-[0.97] md:ml-0 lg:h-12 lg:px-7 lg:text-base"
        >
          {primary.label}
        </Link>
      </div>
    </header>
  );
}
