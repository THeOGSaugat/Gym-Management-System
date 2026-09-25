import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { ForbiddenError, ValidationError } from "@/lib/errors";

/**
 * Server Actions are public HTTP endpoints: anyone who can reach the app
 * can POST to one with whatever arguments and form fields they like,
 * whatever the UI shows them. These tests call the real actions directly,
 * as a crafted request would, and check that the *server* refuses — with
 * no database write — for the wrong role, a suspended account, tampered
 * arguments, someone else's data, and forged form fields.
 *
 * Only the edges are mocked: the Auth.js session (which account the
 * request's cookie belongs to), Next's redirect/revalidate, and Prisma.
 * The session check, policies and services all run for real.
 */

const auth = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => auth(), signIn: vi.fn(), signOut: vi.fn() }));

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { setMemberStatusAction, updateMemberAction } = await import("@/app/admin/members/actions");
const { recordPaymentAction } = await import("@/app/admin/members/[id]/payments/actions");
const { cancelMembershipAction } = await import("@/app/admin/members/[id]/memberships/actions");
const { removeAssignmentAction } = await import("@/app/admin/members/[id]/assignment/actions");
const { setPlanActiveAction } = await import("@/app/admin/plans/actions");
const { setTrainerStatusAction } = await import("@/app/admin/trainers/actions");
const { setWorkoutPlanStatusAction, removeWorkoutDayAction } = await import(
  "@/app/trainer/workout-plans/[id]/actions"
);
const { createWorkoutPlanAction } = await import("@/app/trainer/members/[id]/workout-plans/actions");
const { markNotificationReadAction } = await import("@/app/member/notifications/actions");
const { recordProgressAction } = await import("@/app/member/progress/actions");
const { updateOwnProfileAction } = await import("@/app/member/profile/actions");

type Role = "ADMIN" | "TRAINER" | "MEMBER";

/**
 * Signs the request in as `id`/`role`. The session lookup is the
 * `select: { status: true, ... }` query in session.ts; every other
 * user lookup falls through to `otherUsers`.
 */
function signInAs(
  id: string,
  role: Role,
  { status = "ACTIVE", otherUsers = {} as Record<string, unknown> } = {},
) {
  auth.mockResolvedValue({ user: { id, role, name: "x", email: "x@gym.test" } });
  prismaMock.user.findUnique.mockImplementation((async (args: {
    where: { id?: string };
    select?: { status?: boolean };
  }) => {
    if (args.select?.status && args.where.id === id) {
      return { id, role, status, fullName: "Signed In", email: `${id}@gym.test` };
    }
    return (args.where.id && otherUsers[args.where.id]) ?? null;
  }) as never);
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function expectNoWrites() {
  expect(prismaMock.user.update).not.toHaveBeenCalled();
  expect(prismaMock.payment.create).not.toHaveBeenCalled();
  expect(prismaMock.membership.update).not.toHaveBeenCalled();
  expect(prismaMock.membershipPlan.update).not.toHaveBeenCalled();
  expect(prismaMock.trainerAssignment.update).not.toHaveBeenCalled();
  expect(prismaMock.workoutPlan.update).not.toHaveBeenCalled();
  expect(prismaMock.workoutPlan.create).not.toHaveBeenCalled();
  expect(prismaMock.workoutDay.delete).not.toHaveBeenCalled();
  expect(prismaMock.notification.update).not.toHaveBeenCalled();
  expect(prismaMock.$transaction).not.toHaveBeenCalled();
  expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
}

const memberRow = {
  id: "member-1",
  email: "m@gym.test",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  auth.mockReset();
});

describe("unauthenticated requests", () => {
  it("are sent to /login before any admin mutation runs", async () => {
    auth.mockResolvedValue(null);
    await expect(setMemberStatusAction("member-1", "SUSPENDED")).rejects.toMatchObject({
      url: "/login",
    });
    await expect(
      recordPaymentAction("member-1", undefined, form({ amount: "10", method: "CASH" })),
    ).rejects.toMatchObject({ url: "/login" });
    expectNoWrites();
  });
});

describe("wrong role → rejected server-side", () => {
  it.each([
    ["MEMBER suspending a member", "MEMBER", () => setMemberStatusAction("member-2", "SUSPENDED")],
    [
      "MEMBER recording a payment",
      "MEMBER",
      () => recordPaymentAction("member-1", undefined, form({ amount: "0.01", method: "CASH" })),
    ],
    [
      "MEMBER cancelling a membership",
      "MEMBER",
      () => cancelMembershipAction("member-1", "ms-1", form({})),
    ],
    ["TRAINER removing an assignment", "TRAINER", () => removeAssignmentAction("member-1")],
    ["TRAINER deactivating a plan", "TRAINER", () => setPlanActiveAction("plan-1", false)],
    ["TRAINER suspending a trainer", "TRAINER", () => setTrainerStatusAction("trainer-2", "SUSPENDED")],
    ["MEMBER cancelling a workout plan", "MEMBER", () => setWorkoutPlanStatusAction("wp-1", "CANCELLED")],
    ["ADMIN using a member-only action", "ADMIN", () => markNotificationReadAction("n-1")],
  ] as const)("%s → /forbidden", async (_label, role, call) => {
    signInAs("actor-1", role);
    await expect(call()).rejects.toMatchObject({ url: "/forbidden" });
    expectNoWrites();
  });

  it("a suspended admin's still-valid token can't run admin actions", async () => {
    signInAs("admin-1", "ADMIN", { status: "SUSPENDED" });
    await expect(setMemberStatusAction("member-1", "SUSPENDED")).rejects.toMatchObject({
      url: "/login",
    });
    expectNoWrites();
  });
});

describe("tampered action arguments → rejected before any query", () => {
  it.each([
    ["an object as an id (Prisma filter injection)", () => setMemberStatusAction({ not: "" } as never, "SUSPENDED")],
    ["an out-of-enum status", () => setMemberStatusAction("member-1", "ADMIN" as never)],
    ["a string for a boolean", () => setPlanActiveAction("plan-1", "false" as never)],
    ["path characters in an id", () => removeAssignmentAction("../../trainers")],
    ["an oversized id", () => removeAssignmentAction("a".repeat(500))],
  ])("%s", async (_label, call) => {
    signInAs("admin-1", "ADMIN");
    await expect(call()).rejects.toBeInstanceOf(ValidationError);
    // Only the session lookup ran — nothing about the target was queried.
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expectNoWrites();
  });

  it("a trainer can't re-activate a plan by sending a status the UI never offers", async () => {
    signInAs("trainer-1", "TRAINER");
    await expect(setWorkoutPlanStatusAction("wp-1", "ARCHIVED" as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expectNoWrites();
  });
});

describe("ownership — changing an id doesn't reach someone else's data", () => {
  it("a trainer can't change the status of a plan for a member not assigned to them", async () => {
    signInAs("trainer-1", "TRAINER");
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "wp-9",
      memberId: "member-9",
      trainerId: "trainer-2",
      status: "ACTIVE",
    } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);

    await expect(setWorkoutPlanStatusAction("wp-9", "CANCELLED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expectNoWrites();
  });

  it("a trainer can't delete a day from another trainer's plan", async () => {
    signInAs("trainer-1", "TRAINER");
    prismaMock.workoutDay.findUnique.mockResolvedValue({
      id: "day-9",
      planId: "wp-9",
      plan: { id: "wp-9", memberId: "member-9", trainerId: "trainer-2", status: "ACTIVE" },
    } as never);
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);

    await expect(removeWorkoutDayAction("wp-1", "day-9")).rejects.toBeInstanceOf(ForbiddenError);
    expectNoWrites();
  });

  it("a trainer can't create a plan for a member who isn't assigned to them", async () => {
    signInAs("trainer-1", "TRAINER", { otherUsers: { "member-9": { ...memberRow, id: "member-9" } } });
    prismaMock.trainerAssignment.findFirst.mockResolvedValue(null);

    const result = await createWorkoutPlanAction("member-9", undefined, form({ name: "Sneaky plan" }));
    expect(result).toEqual({ error: expect.stringMatching(/assigned to you/) });
    expectNoWrites();
  });

  it("a member can't mark another member's notification as read", async () => {
    signInAs("member-1", "MEMBER");
    prismaMock.notification.findUnique.mockResolvedValue({
      id: "n-2",
      recipientUserId: "member-2",
      isRead: false,
    } as never);

    await expect(markNotificationReadAction("n-2")).rejects.toBeInstanceOf(ForbiddenError);
    expectNoWrites();
  });
});

describe("forged form fields are ignored — identity always comes from the session", () => {
  it("progress is always recorded for the signed-in member, whatever memberId the form sends", async () => {
    signInAs("member-1", "MEMBER");
    prismaMock.progressLog.create.mockResolvedValue({} as never);

    await recordProgressAction(
      undefined,
      form({ metric: "WEIGHT_KG", value: "80", memberId: "member-2", recordedByUserId: "admin-1" }),
    );

    expect(prismaMock.progressLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ memberId: "member-1", recordedByUserId: "member-1" }),
    });
  });

  it("a member editing their profile can't change their role, status or email", async () => {
    signInAs("member-1", "MEMBER", { otherUsers: { "member-1": memberRow } });
    // The service's own lookup (no select) must find the member row too.
    prismaMock.user.findUnique.mockImplementation((async (args: {
      where: { id?: string };
      select?: { status?: boolean };
    }) =>
      args.select?.status
        ? { id: "member-1", role: "MEMBER", status: "ACTIVE", fullName: "Mo", email: "m@gym.test" }
        : memberRow) as never);
    prismaMock.user.update.mockResolvedValue(memberRow as never);

    await updateOwnProfileAction(
      undefined,
      form({ fullName: "Mo Member", role: "ADMIN", status: "ACTIVE", email: "boss@gym.test" }),
    );

    const data = prismaMock.user.update.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(prismaMock.user.update.mock.calls[0]?.[0].where).toEqual({ id: "member-1" });
    expect(data).not.toHaveProperty("role");
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("email");
  });
});

describe("invalid input on permitted actions → a form error, not a write", () => {
  it.each([
    ["a negative amount", { amount: "-5", method: "CASH" }],
    ["a zero amount", { amount: "0", method: "CASH" }],
    ["a non-numeric amount", { amount: "ten", method: "CASH" }],
    ["an unknown payment method", { amount: "10", method: "BITCOIN" }],
    ["a malformed membership id", { amount: "10", method: "CASH", membershipId: "x; DROP TABLE" }],
    ["a payment dated in the future", { amount: "10", method: "CASH", paidAt: "2099-01-01" }],
  ])("recording a payment with %s", async (_label, fields) => {
    signInAs("admin-1", "ADMIN");
    const result = await recordPaymentAction("member-1", undefined, form(fields));
    expect(result).toEqual({ error: expect.any(String) });
    expectNoWrites();
  });

  it("editing a member with an invalid email returns an error without updating", async () => {
    signInAs("admin-1", "ADMIN");
    const result = await updateMemberAction("member-1", undefined, form({ fullName: "X", email: "nope" }));
    expect(result).toEqual({ error: expect.any(String) });
    expectNoWrites();
  });
});
