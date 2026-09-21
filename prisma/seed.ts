/**
 * Creates one test user per role (Phase 1) plus a batch of extra MEMBER
 * fixtures with profiles (Phase 2), so the admin member-management screens
 * have enough data to actually exercise search, filter and pagination
 * (pagination doesn't mean much with one row).
 *
 * There's no self-serve registration or admin-driven account creation UI
 * for ADMIN/TRAINER accounts — this script is currently the only way to
 * get one into the database. MEMBER accounts can now also be created
 * through the admin UI (Phase 2); these seeded ones are just convenient
 * fixtures for testing that UI.
 *
 * Run with: npm run db:seed
 *
 * ⚠️ Dev-only credentials. Never run this against a production database,
 * and never reuse these passwords anywhere real.
 */
import "dotenv/config";
import { PrismaClient, type Role, type UserStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const CORE_USERS: Array<{
  email: string;
  password: string;
  fullName: string;
  role: Role;
}> = [
  { email: "admin@gym.test", password: "Admin123!", fullName: "Ada Admin", role: "ADMIN" },
  { email: "trainer@gym.test", password: "Trainer123!", fullName: "Tara Trainer", role: "TRAINER" },
  { email: "member@gym.test", password: "Member123!", fullName: "Mo Member", role: "MEMBER" },
];

// Extra MEMBER fixtures, each with a MemberProfile. Deliberately more
// than one page's worth (member.service.ts pages at 20) so pagination is
// actually testable, plus a couple of varied names for search and one
// SUSPENDED account for the status filter.
const EXTRA_MEMBERS: Array<{
  fullName: string;
  phone?: string;
  status?: UserStatus;
}> = [
  { fullName: "Priya Sharma", phone: "555-0101" },
  { fullName: "Liam Chen", phone: "555-0102" },
  { fullName: "Sofia Rossi", phone: "555-0103" },
  { fullName: "Noah Kim", phone: "555-0104" },
  { fullName: "Aisha Bello", phone: "555-0105" },
  { fullName: "Diego Fernandez", phone: "555-0106" },
  { fullName: "Emma Johansson", phone: "555-0107" },
  { fullName: "Kenji Watanabe", phone: "555-0108" },
  { fullName: "Fatima Haidari", phone: "555-0109" },
  { fullName: "Lucas Meyer", phone: "555-0110" },
  { fullName: "Grace Okafor", phone: "555-0111" },
  { fullName: "Tomás Alves", phone: "555-0112", status: "SUSPENDED" },
  { fullName: "Ingrid Nilsen", phone: "555-0113" },
  { fullName: "Marco Bianchi", phone: "555-0114" },
  { fullName: "Zara Ahmed", phone: "555-0115" },
  { fullName: "Ravi Patel", phone: "555-0116" },
  { fullName: "Ella Novak", phone: "555-0117" },
  { fullName: "Samuel Dube", phone: "555-0118" },
  { fullName: "Yuki Tanaka", phone: "555-0119" },
  { fullName: "Clara Dubois", phone: "555-0120" },
  { fullName: "Omar Haddad", phone: "555-0121" },
  { fullName: "Nina Petrova", phone: "555-0122" },
];

function slugEmail(fullName: string): string {
  return `${fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@gym.test`;
}

async function main() {
  for (const seedUser of CORE_USERS) {
    const passwordHash = await hashPassword(seedUser.password);

    const user = await db.user.upsert({
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

    // Ensure the invariant "a MEMBER has one MemberProfile" holds even on
    // a re-run against a database seeded before Phase 2 existed (the
    // `update` branch above wouldn't otherwise create one for an
    // already-existing user).
    if (seedUser.role === "MEMBER") {
      await db.memberProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }
  }

  const sharedPasswordHash = await hashPassword("Member123!");

  for (const extra of EXTRA_MEMBERS) {
    const email = slugEmail(extra.fullName);
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: sharedPasswordHash,
        fullName: extra.fullName,
        phone: extra.phone,
        role: "MEMBER",
        status: extra.status ?? "ACTIVE",
        memberProfile: { create: {} },
      },
    });
  }

  console.log("Seeded core test users:");
  for (const seedUser of CORE_USERS) {
    console.log(`  ${seedUser.role.padEnd(8)} ${seedUser.email}  /  ${seedUser.password}`);
  }
  console.log(`Seeded ${EXTRA_MEMBERS.length} extra member fixtures (password: Member123!)`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
