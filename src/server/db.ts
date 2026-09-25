import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 connects through an explicit driver adapter rather than a bundled
// native query engine. PrismaPg wraps the `pg` connection pool.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single PrismaClient instance across hot reloads in development.
// Without this, every file change would open a fresh connection pool and
// eventually exhaust Neon's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Password hashes are left out of every User query unless one asks for
    // the column explicitly — which only the login check does (see
    // lib/auth/credentials.ts). Pages today pick the fields they render,
    // but this makes "a hash can't reach a component" structural rather
    // than something each new query has to remember.
    omit: { user: { passwordHash: true } },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
