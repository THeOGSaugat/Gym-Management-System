import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. Each is a well-understood
 * header that can't break the app.
 *
 * The Content-Security-Policy is NOT set here: it needs a fresh nonce per
 * request, so src/proxy.ts builds it (see src/lib/security/csp.ts).
 * X-Frame-Options stays here as well, so responses the proxy doesn't touch
 * (static files, Auth.js API routes) still refuse to be framed.
 *
 * HSTS is ignored by browsers over plain http (e.g. localhost), so it's
 * safe in development and takes effect once served over HTTPS.
 */
const securityHeaders = [
  // Older browsers that predate CSP frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version in an `X-Powered-By` header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
