import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * A landing-page photo slot backed by a local file in `public/`.
 *
 * Photography is served from the project itself — never hot-linked from a
 * third-party URL — so the page can't break when someone else's server does.
 * If the file hasn't been added yet, the slot renders a calm, on-brand panel
 * at the exact same size instead, so the layout never collapses or shows a
 * broken-image icon. Dropping a JPG at the expected path is all it takes to
 * switch a slot over to the real photo; see README "Landing page imagery".
 */
export function MarketingImage({
  src,
  alt,
  fallbackIcon: FallbackIcon,
  fallbackLabel,
  sizes,
  preload = false,
  eager = false,
  className,
  imageClassName,
}: {
  /** Path under /public, e.g. "/images/landing/hero.jpg". */
  src: string;
  alt: string;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  sizes: string;
  /** Only for the above-the-fold hero (Next 16 replaced `priority` with `preload`). */
  preload?: boolean;
  /** For a photo that is above the fold on some screens only (e.g. a laptop-only panel). */
  eager?: boolean;
  className?: string;
  /** Extra classes for the <img> itself, e.g. `object-top` to choose the crop. */
  imageClassName?: string;
}) {
  const hasPhoto = existsSync(path.join(process.cwd(), "public", src));

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-muted", className)}>
      {hasPhoto ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          loading={eager ? "eager" : undefined}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        // Decorative: announcing the photo's alt text here would describe a
        // picture that isn't actually on screen.
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary-subtle text-primary-subtle-foreground"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--primary) 18%, transparent) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-card/80 shadow-sm">
            <FallbackIcon aria-hidden="true" className="size-7" />
          </span>
          <span className="px-6 text-center text-sm font-medium">{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}
