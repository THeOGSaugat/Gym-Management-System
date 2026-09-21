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

// Extra TRAINER fixtures (beyond the core trainer@gym.test), each with a
// TrainerProfile — enough to exercise the admin trainer list/search and
// to have a trainer with genuinely zero assigned members to check the
// empty state.
const EXTRA_TRAINERS: Array<{
  fullName: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
}> = [
  { fullName: "Deepak Kapoor", phone: "555-0201", specialization: "Strength & conditioning", experienceYears: 6 },
  { fullName: "Hannah Weiss", phone: "555-0202", specialization: "Yoga & mobility", experienceYears: 9 },
];

// A small, realistic plan catalog for testing membership assignment,
// renewal and payments without having to create plans by hand first.
const PLANS: Array<{
  name: string;
  description: string;
  durationDays: number;
  priceMinor: number;
}> = [
  { name: "Monthly", description: "Billed every 30 days.", durationDays: 30, priceMinor: 4999 },
  { name: "Quarterly", description: "Billed every 90 days.", durationDays: 90, priceMinor: 12999 },
  { name: "Annual", description: "Billed once a year.", durationDays: 365, priceMinor: 44999 },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// A small starter exercise catalog, enough to build a two-day plan and
// to test the picker in the "add exercise to a day" form.
const EXERCISES: Array<{ name: string; muscleGroup: string }> = [
  { name: "Bench Press", muscleGroup: "Chest" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest" },
  { name: "Tricep Pushdown", muscleGroup: "Triceps" },
  { name: "Squat", muscleGroup: "Legs" },
  { name: "Leg Press", muscleGroup: "Legs" },
  { name: "Walking Lunges", muscleGroup: "Legs" },
];

async function main() {
  const coreUserIds: Partial<Record<Role, string>> = {};

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
    coreUserIds[seedUser.role] = user.id;

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

  const extraMemberIds: Record<string, string> = {};
  for (const extra of EXTRA_MEMBERS) {
    const email = slugEmail(extra.fullName);
    const user = await db.user.upsert({
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
    extraMemberIds[extra.fullName] = user.id;
  }

  const extraTrainerIds: string[] = [];
  for (const extra of EXTRA_TRAINERS) {
    const email = slugEmail(extra.fullName);
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: sharedPasswordHash,
        fullName: extra.fullName,
        phone: extra.phone,
        role: "TRAINER",
        status: "ACTIVE",
        trainerProfile: {
          create: {
            specialization: extra.specialization,
            experienceYears: extra.experienceYears,
          },
        },
      },
    });
    extraTrainerIds.push(user.id);
  }

  const planIds: string[] = [];
  for (const plan of PLANS) {
    const existing = await db.membershipPlan.findFirst({ where: { name: plan.name } });
    const row = existing
      ? await db.membershipPlan.update({ where: { id: existing.id }, data: plan })
      : await db.membershipPlan.create({ data: plan });
    planIds.push(row.id);
  }

  // Give the core member fixture a sample ACTIVE membership + a matching
  // payment, so /member/membership, /member/payments, and the admin
  // member-detail memberships/payments sections have something to show
  // immediately, without needing to click through "Assign" by hand first.
  const monthlyPlan = await db.membershipPlan.findFirst({ where: { name: "Monthly" } });
  const coreMemberId = coreUserIds.MEMBER;
  const adminId = coreUserIds.ADMIN;

  if (monthlyPlan && coreMemberId && adminId) {
    const existingMembership = await db.membership.findFirst({
      where: { memberId: coreMemberId, status: "ACTIVE" },
    });

    if (!existingMembership) {
      const startDate = new Date();
      const membership = await db.membership.create({
        data: {
          memberId: coreMemberId,
          planId: monthlyPlan.id,
          startDate,
          endDate: addDays(startDate, monthlyPlan.durationDays),
          status: "ACTIVE",
          planNameSnapshot: monthlyPlan.name,
          priceMinorSnapshot: monthlyPlan.priceMinor,
          currencySnapshot: monthlyPlan.currency,
          createdByUserId: adminId,
        },
      });

      await db.payment.create({
        data: {
          memberId: coreMemberId,
          membershipId: membership.id,
          amountMinor: monthlyPlan.priceMinor,
          currency: monthlyPlan.currency,
          method: "CASH",
          status: "SUCCEEDED",
          paidAt: startDate,
          recordedByUserId: adminId,
        },
      });
    }
  }

  // Assign a few members to trainers, so the trainer portal
  // (/trainer/members, /trainer/members/[id]) and the admin trainer
  // detail page's roster both have something to show immediately.
  // Deepak gets a small roster (including the core member fixture, so
  // /trainer/members/[id]'s membership-status/attendance sections have
  // real data to render); Hannah is left with zero, to exercise that
  // page's empty state without extra setup.
  const coreTrainerId = coreUserIds.TRAINER;
  const [deepakId] = extraTrainerIds;

  if (coreTrainerId && deepakId && coreMemberId && adminId) {
    const assignments: Array<{ memberId: string; trainerId: string }> = [
      { memberId: coreMemberId, trainerId: deepakId },
      ...(["Priya Sharma", "Liam Chen"] as const)
        .map((name) => extraMemberIds[name])
        .filter((id): id is string => !!id)
        .map((memberId) => ({ memberId, trainerId: coreTrainerId })),
    ];

    for (const { memberId, trainerId } of assignments) {
      const existing = await db.trainerAssignment.findFirst({
        where: { memberId, status: "ACTIVE" },
      });
      if (!existing) {
        await db.trainerAssignment.create({
          data: { memberId, trainerId, assignedByUserId: adminId },
        });
      }
    }
  }

  // Exercise catalog, attributed to the core trainer (an admin could
  // just as validly have created these — the fixture data just needs an
  // owner, and the trainer is the more realistic one in practice).
  const exerciseIds: Record<string, string> = {};
  if (coreTrainerId) {
    for (const exercise of EXERCISES) {
      const existing = await db.exercise.findFirst({ where: { name: exercise.name } });
      const row = existing
        ? existing
        : await db.exercise.create({
            data: { ...exercise, createdByUserId: coreTrainerId },
          });
      exerciseIds[exercise.name] = row.id;
    }
  }

  // A sample workout plan for member@gym.test, built by their assigned
  // trainer (Deepak Kapoor — see the assignment above), with two days
  // and a few exercises each, so /member/workout-plans,
  // /trainer/members/[id], and the admin member-detail page's read-only
  // summary all have something real to show immediately.
  if (deepakId && coreMemberId) {
    const existingPlan = await db.workoutPlan.findFirst({
      where: { memberId: coreMemberId, trainerId: deepakId },
    });

    if (!existingPlan) {
      const plan = await db.workoutPlan.create({
        data: {
          memberId: coreMemberId,
          trainerId: deepakId,
          name: "Foundations Block 1",
          description: "A 4-week introductory strength block.",
          status: "ACTIVE",
        },
      });

      const pushDay = await db.workoutDay.create({
        data: { planId: plan.id, label: "Monday — Push", orderIndex: 0 },
      });
      const legDay = await db.workoutDay.create({
        data: { planId: plan.id, label: "Wednesday — Legs", orderIndex: 1 },
      });

      const pushExercises = [
        { name: "Bench Press", sets: 4, reps: 8, weightKg: 60 },
        { name: "Incline Dumbbell Press", sets: 3, reps: 10, weightKg: 22 },
        { name: "Tricep Pushdown", sets: 3, reps: 12, weightKg: 25 },
      ];
      for (const [index, ex] of pushExercises.entries()) {
        const exerciseId = exerciseIds[ex.name];
        if (!exerciseId) continue;
        await db.workoutExercise.create({
          data: {
            workoutDayId: pushDay.id,
            exerciseId,
            orderIndex: index,
            sets: ex.sets,
            reps: ex.reps,
            weightKg: ex.weightKg,
            restSeconds: 90,
          },
        });
      }

      const legExercises = [
        { name: "Squat", sets: 4, reps: 6, weightKg: 80 },
        { name: "Leg Press", sets: 3, reps: 10, weightKg: 120 },
        { name: "Walking Lunges", sets: 3, reps: 12, weightKg: 20 },
      ];
      for (const [index, ex] of legExercises.entries()) {
        const exerciseId = exerciseIds[ex.name];
        if (!exerciseId) continue;
        await db.workoutExercise.create({
          data: {
            workoutDayId: legDay.id,
            exerciseId,
            orderIndex: index,
            sets: ex.sets,
            reps: ex.reps,
            weightKg: ex.weightKg,
            restSeconds: 120,
          },
        });
      }
    }
  }

  // A couple of progress entries for member@gym.test, so /member/progress
  // and the trainer/admin read-only summaries have real history.
  if (coreMemberId) {
    const existingProgress = await db.progressLog.findFirst({ where: { memberId: coreMemberId } });
    if (!existingProgress) {
      await db.progressLog.createMany({
        data: [
          {
            memberId: coreMemberId,
            recordedByUserId: coreMemberId,
            metric: "WEIGHT_KG",
            value: 84.2,
            recordedAt: addDays(new Date(), -28),
          },
          {
            memberId: coreMemberId,
            recordedByUserId: coreMemberId,
            metric: "WEIGHT_KG",
            value: 82.5,
            recordedAt: addDays(new Date(), -7),
          },
          {
            memberId: coreMemberId,
            recordedByUserId: coreMemberId,
            metric: "BODY_FAT_PERCENT",
            value: 21.5,
            recordedAt: addDays(new Date(), -7),
          },
        ],
      });
    }
  }

  console.log("Seeded core test users:");
  for (const seedUser of CORE_USERS) {
    console.log(`  ${seedUser.role.padEnd(8)} ${seedUser.email}  /  ${seedUser.password}`);
  }
  console.log(`Seeded ${EXTRA_MEMBERS.length} extra member fixtures (password: Member123!)`);
  console.log(`Seeded ${EXTRA_TRAINERS.length} extra trainer fixtures (password: Member123!)`);
  console.log(`Seeded ${PLANS.length} membership plans`);
  console.log("Seeded an active Monthly membership + payment for member@gym.test");
  console.log("Seeded trainer assignments: member@gym.test -> Deepak Kapoor; Priya/Liam -> trainer@gym.test");
  console.log(`Seeded ${EXERCISES.length} exercises`);
  console.log("Seeded a 2-day workout plan (Foundations Block 1) for member@gym.test");
  console.log("Seeded 3 progress log entries for member@gym.test");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
