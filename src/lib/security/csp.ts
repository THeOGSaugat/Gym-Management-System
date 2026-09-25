/**
 * Builds the app's Content-Security-Policy for one request.
 *
 * The important directive is `script-src`: only scripts carrying this
 * request's random nonce may run (`'strict-dynamic'` then lets those
 * trusted scripts load the app's own chunks). Next.js reads the nonce from
 * this header while rendering and stamps it on every framework script, so
 * an injected `<script>` — the core of an XSS attack — has no valid nonce
 * and is refused by the browser.
 *
 * Deliberate choices:
 * - `style-src 'unsafe-inline'`: `next/image` and a few components set
 *   `style=""` attributes, which nonces can't cover. Style injection is far
 *   less dangerous than script injection, and scripts stay locked down.
 *   (A nonce must NOT be added to style-src: browsers then ignore
 *   'unsafe-inline' and every style attribute breaks.)
 * - `'unsafe-eval'` in development only — React uses eval for its dev-mode
 *   debugging aids; production never gets it.
 * - `upgrade-insecure-requests` only when the site is actually served over
 *   HTTPS, so `next start` on http://localhost keeps working.
 */
export function buildContentSecurityPolicy({
  nonce,
  isDev,
  isHttps,
}: {
  nonce: string;
  isDev: boolean;
  isHttps: boolean;
}): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

/** 128 bits from the platform CSPRNG, base64-encoded — unguessable per request. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
