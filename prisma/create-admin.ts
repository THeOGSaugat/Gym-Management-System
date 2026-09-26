/**
 * Creates one ADMIN account — the way to bootstrap a fresh production
 * database, where the demo seed (with its publicly known passwords) must
 * never run. After this, the admin creates trainers and members in the app.
 *
 *   read -s ADMIN_PASSWORD && export ADMIN_PASSWORD
 *   npm run db:create-admin -- --email owner@example.com --name "Owner Name"
 *   unset ADMIN_PASSWORD
 *
 * The password is read from the ADMIN_PASSWORD environment variable, never
 * from a command-line argument (arguments land in shell history and process
 * listings), and is never printed. It must be 12+ characters and within
 * bcrypt's 72-byte limit. The target database is whatever DATABASE_URL
 * points at — double-check it before running.
 *
 * Refuses to touch an existing account: it only ever creates.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { z } from "zod";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth/password";
import { emailSchema, newPasswordSchema } from "../src/lib/validations/shared";

const inputSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1, "--name is required").max(120, "Name is too long"),
  password: newPasswordSchema.refine((value) => value.length >= 12, {
    message: "ADMIN_PASSWORD must be at least 12 characters for an admin account",
  }),
});

async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
  });

  const parsed = inputSchema.safeParse({
    email: values.email ?? "",
    name: values.name ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) console.error(`✗ ${issue.message}`);
    process.exitCode = 1;
    return;
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing) {
      console.error(`✗ An account with ${parsed.data.email} already exists. Nothing was changed.`);
      process.exitCode = 1;
      return;
    }

    const admin = await db.user.create({
      data: {
        email: parsed.data.email,
        fullName: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
        role: "ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true },
    });
    console.log(`✓ Created admin ${admin.email} (id ${admin.id}). You can now log in at /login.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("✗ Failed to create admin:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
