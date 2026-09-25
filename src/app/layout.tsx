import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page must render per request: the Content-Security-Policy nonce
  // (see src/proxy.ts) is unique per request, and a statically pre-rendered
  // page would ship scripts without it — which the browser would then
  // refuse to run. All routes are dynamic today anyway (they read the
  // session); this guarantees a future static page can't silently break.
  await connection();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="dark h-full scroll-smooth antialiased"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
