import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Built from `authConfig` only (no providers, no Prisma, no bcrypt) so it
// stays a fast, DB-free check — even though Next.js 16's Proxy defaults to
// the Node.js runtime, keeping this side light is still the right call:
// it runs on every matched request, and the real authorization boundary is
// each area's layout.tsx (see src/lib/auth/session.ts). See the comment
// at the top of src/lib/auth/config.ts for the full reasoning.
const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  // Run on everything except Auth.js's own API routes, Next static assets,
  // and common static file extensions. The `authorized` callback in
  // authConfig decides, per-request, whether the matched path actually
  // needs a role check — most paths (landing page, /login) just pass
  // through.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
