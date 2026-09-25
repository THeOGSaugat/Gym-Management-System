import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, createNonce } from "./csp";

const directive = (policy: string, name: string) =>
  policy.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("buildContentSecurityPolicy", () => {
  const prod = buildContentSecurityPolicy({ nonce: "abc123", isDev: false, isHttps: true });

  it("only lets scripts carrying this request's nonce run — no inline, no eval in production", () => {
    const scripts = directive(prod, "script-src");
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("allows eval only in development (React's dev tooling)", () => {
    const dev = buildContentSecurityPolicy({ nonce: "n", isDev: true, isHttps: false });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
  });

  it("never puts a nonce in style-src (it would disable 'unsafe-inline' and break style attributes)", () => {
    const styles = directive(prod, "style-src");
    expect(styles).toContain("'unsafe-inline'");
    expect(styles).not.toContain("nonce-");
  });

  it("keeps the framing, form, base and plugin restrictions", () => {
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("form-action 'self'");
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("object-src 'none'");
  });

  it("upgrades insecure requests only when actually served over HTTPS", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    const http = buildContentSecurityPolicy({ nonce: "n", isDev: false, isHttps: false });
    expect(http).not.toContain("upgrade-insecure-requests");
  });
});

describe("createNonce", () => {
  it("is 128 random bits, different every time", () => {
    const nonces = new Set(Array.from({ length: 200 }, () => createNonce()));
    expect(nonces.size).toBe(200);
    for (const nonce of nonces) expect(atob(nonce)).toHaveLength(16);
  });
});
