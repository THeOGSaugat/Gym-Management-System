import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * A fully-mocked Prisma client. Every test file that touches `db` gets
 * this instead of a real connection — see setup.ts, which wires
 * `@/server/db` to resolve to it for the whole test run. This means
 * these tests verify business logic (authorization rules, what gets
 * passed to Prisma, how errors are mapped) rather than actual database
 * behavior — the real unique-email constraint, for example, was verified
 * by hand against Neon in Phase 2's manual testing, not by this mock.
 */
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

export function resetPrismaMock() {
  mockReset(prismaMock);
  // By default an interactive transaction just runs its callback against
  // the same mock (and a batch resolves its array), so services that wrap
  // a write in a transaction — e.g. withAudit() — are tested on the calls
  // they make. Tests that care about transaction behavior still override
  // this with their own mockImplementation.
  prismaMock.$transaction.mockImplementation((async (arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: typeof prismaMock) => unknown)(prismaMock)
      : Promise.all(arg as Promise<unknown>[])) as never);
}
