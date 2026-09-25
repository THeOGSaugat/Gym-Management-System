import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, requiredRoleForPath } from "@/lib/auth/config";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";

// Built from `authConfig` only (no providers, no Prisma, no bcrypt) so it
// stays a fast, DB-free check — even though Next.js 16's Proxy defaults to
// the Node.js runtime, keeping this side light is still the right call:
// it runs on every matched request, and the real authorization boundary is
// each area's layout.tsx (see src/lib/auth/session.ts). See the comment
// at the top of src/lib/auth/config.ts for the full reasoning.
const { auth } = NextAuth(authConfig);

/**
 * Two jobs per request:
 *
 * 1. Layer-1 auth. `authConfig.callbacks.authorized` runs first; when it
 *    returns a redirect (signed in, wrong role → /forbidden) Auth.js sends
 *    that and this handler never runs. When the visitor isn't signed in,
 *    Auth.js does NOT redirect to the sign-in page by itself once a custom
 *    handler is supplied — it calls this handler instead — so the /login
 *    redirect is done here, exactly as Auth.js would have.
 *
 * 2. A per-request nonce-based Content-Security-Policy (see csp.ts). The
 *    policy goes on the *request* headers too, which is where Next.js reads
 *    the nonce from to stamp it on its own scripts while rendering.
 */
export const proxy = auth((request) => {
  const { nextUrl } = request;

  if (requiredRoleForPath(nextUrl.pathname) && !request.auth?.user) {
    const signInUrl = nextUrl.clone();
    signInUrl.pathname = authConfig.pages.signIn;
    signInUrl.search = "";
    signInUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  const nonce = createNonce();
  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    isHttps:
      nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
});

export const config = {
  // Run on everything except Auth.js's own API routes, Next static assets,
  // and common static file extensions. The `authorized` callback in
  // authConfig decides, per-request, whether the matched path actually
  // needs a role check — most paths (landing page, /login) just pass
  // through, picking up the CSP on the way.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
