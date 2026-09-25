import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";

const auth = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => auth() }));

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));

const { getCurrentUser, requireRole, requireUser } = await import("./session");

function sessionFor(id: string, role: "ADMIN" | "TRAINER" | "MEMBER") {
  return { user: { id, role, name: "Token Name", email: "token@gym.test" } };
}

function dbAccount(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    fullName: "Mo Member",
    email: "member@gym.test",
    ...overrides,
  };
}

beforeEach(() => {
  auth.mockReset();
});

describe("getCurrentUser — sessions are confirmed against the database", () => {
  it("returns null without a session, and never queries the database", async () => {
    auth.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the account for a valid session, with name/email fresh from the database", async () => {
    auth.mockResolvedValue(sessionFor("user-1", "MEMBER"));
    prismaMock.user.findUnique.mockResolvedValue(dbAccount() as never);

    expect(await getCurrentUser()).toEqual({
      id: "user-1",
      role: "MEMBER",
      name: "Mo Member",
      email: "member@gym.test",
    });
  });

  it("treats a still-valid token for a since-suspended account as signed out", async () => {
    auth.mockResolvedValue(sessionFor("user-1", "MEMBER"));
    prismaMock.user.findUnique.mockResolvedValue(dbAccount({ status: "SUSPENDED" }) as never);
    expect(await getCurrentUser()).toBeNull();
  });

  it("treats a token for a deleted account as signed out", async () => {
    auth.mockResolvedValue(sessionFor("ghost", "ADMIN"));
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it("never trusts the token's role over the database's", async () => {
    // A token claiming ADMIN for an account that is actually a MEMBER.
    auth.mockResolvedValue(sessionFor("user-1", "ADMIN"));
    prismaMock.user.findUnique.mockResolvedValue(dbAccount({ role: "MEMBER" }) as never);
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("requireUser / requireRole", () => {
  it("sends an unauthenticated visitor to /login", async () => {
    auth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toMatchObject({ url: "/login" });
    await expect(requireRole("MEMBER")).rejects.toMatchObject({ url: "/login" });
  });

  it("sends a suspended account to /login, not into the portal", async () => {
    auth.mockResolvedValue(sessionFor("user-1", "ADMIN"));
    prismaMock.user.findUnique.mockResolvedValue(
      dbAccount({ role: "ADMIN", status: "SUSPENDED" }) as never,
    );
    await expect(requireRole("ADMIN")).rejects.toMatchObject({ url: "/login" });
  });

  it.each([
    ["MEMBER", "ADMIN"],
    ["TRAINER", "ADMIN"],
    ["MEMBER", "TRAINER"],
    ["TRAINER", "MEMBER"],
    ["ADMIN", "MEMBER"],
  ] as const)("sends a %s to /forbidden for a %s-only area", async (actual, required) => {
    auth.mockResolvedValue(sessionFor("user-1", actual));
    prismaMock.user.findUnique.mockResolvedValue(dbAccount({ role: actual }) as never);
    await expect(requireRole(required)).rejects.toMatchObject({ url: "/forbidden" });
  });

  it("lets the right role through", async () => {
    auth.mockResolvedValue(sessionFor("trainer-1", "TRAINER"));
    prismaMock.user.findUnique.mockResolvedValue(
      dbAccount({ id: "trainer-1", role: "TRAINER" }) as never,
    );
    await expect(requireRole("TRAINER")).resolves.toMatchObject({ id: "trainer-1", role: "TRAINER" });
  });
});
