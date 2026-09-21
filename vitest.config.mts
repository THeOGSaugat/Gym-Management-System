import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Native alternative to the vite-tsconfig-paths plugin: resolves the
    // same @/* -> src/* alias declared in tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Server-only code (route handlers, layouts, Server Actions) isn't
    // meaningfully unit-testable here, and UI component tests are out of
    // scope for this phase (see README) — this targets business logic:
    // services, policies, and validation schemas.
    include: ["src/**/*.test.ts"],
  },
});
