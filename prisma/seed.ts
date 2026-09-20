/**
 * Creates one test user per role so Phase 1's role boundaries can be
 * verified manually. There's no self-serve registration or admin UI yet
 * (that's Phase 2), so this script is currently the only way to get a
 * user into the database.
 *
 * Run with: npm run db:seed
 *
 * ⚠️ Dev-only credentials. Never run this against a production database,
 * and never reuse these passwords anywhere real.
 */
import "dotenv/config";
import { PrismaClient, type Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const SEED_USERS: Array<{
  email: string;
  password: string;
  fullName: string;
  role: Role;
}> = [
  { email: "admin@gym.test", password: "Admin123!", fullName: "Ada Admin", role: "ADMIN" },
  { email: "trainer@gym.test", password: "Trainer123!", fullName: "Tara Trainer", role: "TRAINER" },
  { email: "member@gym.test", password: "Member123!", fullName: "Mo Member", role: "MEMBER" },
];

async function main() {
  for (const seedUser of SEED_USERS) {
    const passwordHash = await hashPassword(seedUser.password);

    await db.user.upsert({
      where: { email: seedUser.email },
      update: { passwordHash, fullName: seedUser.fullName, role: seedUser.role, status: "ACTIVE" },
      create: {
        email: seedUser.email,
        passwordHash,
        fullName: seedUser.fullName,
        role: seedUser.role,
        status: "ACTIVE",
      },
    });
  }

  console.log("Seeded test users:");
  for (const seedUser of SEED_USERS) {
    console.log(`  ${seedUser.role.padEnd(8)} ${seedUser.email}  /  ${seedUser.password}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
