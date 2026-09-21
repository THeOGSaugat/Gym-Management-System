import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  listMembers,
  getMember,
  createMember,
  updateMemberAsAdmin,
  updateOwnProfile,
  setMemberStatus,
} from "./member.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const otherMember: Actor = { id: "member-2", role: "MEMBER" };

const baseUser = {
  id: "member-1",
  email: "member@example.com",
  passwordHash: "hashed",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const validCreateInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  password: "supersecret1",
  phone: undefined,
  dateOfBirth: undefined,
  address: undefined,
  emergencyContactName: undefined,
  emergencyContactPhone: undefined,
};

describe("listMembers", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(listMembers(member, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listMembers(trainer, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("queries only role: MEMBER, paginated, for an admin", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    await listMembers(admin, { page: 2 });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: "MEMBER" }),
        skip: 20, // page 2, 20 per page
        take: 20,
      }),
    );
  });

  it("adds a case-insensitive search filter across name and email", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    await listMembers(admin, { search: "jane" });

    const call = prismaMock.user.findMany.mock.calls[0]?.[0];
    expect(call?.where).toMatchObject({
      role: "MEMBER",
      OR: [
        { fullName: { contains: "jane", mode: "insensitive" } },
        { email: { contains: "jane", mode: "insensitive" } },
      ],
    });
  });
});

describe("getMember", () => {
  it("lets an admin view any member", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    const result = await getMember(admin, "member-1");
    expect(result.id).toBe("member-1");
  });

  it("lets a member view their own profile", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    const result = await getMember(member, "member-1");
    expect(result.id).toBe("member-1");
  });

  it("does not let a member view another member's profile", async () => {
    await expect(getMember(member, "member-2")).rejects.toBeInstanceOf(ForbiddenError);
    // The DB should never even be queried once the policy check fails.
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("does not let a trainer view a member's profile", async () => {
    await expect(getMember(trainer, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the id doesn't exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getMember(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the id belongs to a non-member (e.g. a trainer)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, id: "trainer-1", role: "TRAINER" });
    await expect(getMember(admin, "trainer-1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createMember", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(createMember(member, validCreateInput)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a MEMBER user with a nested MemberProfile, password hashed", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, email: validCreateInput.email });

    await createMember(admin, validCreateInput);

    const call = prismaMock.user.create.mock.calls[0]?.[0];
    expect(call?.data).toMatchObject({
      email: "jane@example.com",
      role: "MEMBER",
      status: "ACTIVE",
    });
    // The plaintext password must never reach the DB layer.
    expect(call?.data.passwordHash).not.toBe(validCreateInput.password);
    expect(typeof call?.data.passwordHash).toBe("string");
    expect(call?.data.memberProfile).toHaveProperty("create");
  });

  it("throws ConflictError when the email is already taken", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    await expect(createMember(admin, validCreateInput)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("updateMemberAsAdmin", () => {
  const updateInput = {
    fullName: "Updated Name",
    email: "member@example.com", // unchanged
    phone: undefined,
    dateOfBirth: undefined,
    address: undefined,
    emergencyContactName: undefined,
    emergencyContactPhone: undefined,
  };

  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(updateMemberAsAdmin(member, "member-1", updateInput)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(updateMemberAsAdmin(admin, "nope", updateInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("updates an existing member's fields", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockResolvedValue({ ...baseUser, fullName: "Updated Name" });

    await updateMemberAsAdmin(admin, "member-1", updateInput);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "member-1" },
        data: expect.objectContaining({ fullName: "Updated Name" }),
      }),
    );
  });

  it("throws ConflictError when changing email to one already in use", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(baseUser) // the member being edited
      .mockResolvedValueOnce({ ...baseUser, id: "someone-else" }); // email lookup hits another user

    await expect(
      updateMemberAsAdmin(admin, "member-1", { ...updateInput, email: "taken@example.com" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe("updateOwnProfile", () => {
  const selfInput = {
    fullName: "New Name",
    phone: undefined,
    address: undefined,
    emergencyContactName: undefined,
    emergencyContactPhone: undefined,
  };

  it("always targets the actor's own id, regardless of anything else", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockResolvedValue({ ...baseUser, fullName: "New Name" });

    await updateOwnProfile(member, selfInput);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: member.id } }),
    );
  });

  it("throws ForbiddenError for a non-MEMBER actor", async () => {
    await expect(updateOwnProfile(admin, selfInput)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateOwnProfile(trainer, selfInput)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError if the actor's own user row is somehow gone", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(updateOwnProfile(member, selfInput)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("setMemberStatus", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(setMemberStatus(member, "member-1", "SUSPENDED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setMemberStatus(otherMember, "member-1", "SUSPENDED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(setMemberStatus(admin, "nope", "SUSPENDED")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates status for an admin", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockResolvedValue({ ...baseUser, status: "SUSPENDED" });

    await setMemberStatus(admin, "member-1", "SUSPENDED");

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "member-1" },
        data: { status: "SUSPENDED" },
      }),
    );
  });
});
