import { db } from "@/server/db";
import { hashPassword } from "@/lib/auth/password";
import { canManageMembers, canViewMember, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import type { UserStatus } from "@/generated/prisma/client";
import type {
  CreateMemberInput,
  AdminUpdateMemberInput,
  SelfUpdateMemberInput,
} from "@/lib/validations/member";
import { clampPage } from "@/lib/pagination";
import { withAudit } from "@/server/services/audit.service";

const MEMBERS_PER_PAGE = 20;

// Every query in this file filters to role: "MEMBER" explicitly — never
// just "everyone in the users table" — so an admin can't accidentally
// pull other admins/trainers into a member-management screen.
const MEMBER_ROLE = "MEMBER" as const;

export type ListMembersParams = {
  search?: string;
  status?: UserStatus;
  page?: number;
};

/**
 * Every function here takes `actor` (the already-authenticated session
 * user) and re-checks authorization itself via the policies in
 * lib/auth/policies.ts. Pages also gate navigation with requireRole(),
 * but that's not a substitute for this — a page-level check only
 * protects that one page; this protects the operation no matter what
 * calls it.
 */

export async function listMembers(actor: Actor, params: ListMembersParams = {}) {
  if (!canManageMembers(actor)) {
    throw new ForbiddenError("Only admins can view the member list.");
  }

  const page = clampPage(params.page);
  const search = params.search?.trim();

  const where = {
    role: MEMBER_ROLE,
    ...(params.status ? { status: params.status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { memberProfile: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MEMBERS_PER_PAGE,
      take: MEMBERS_PER_PAGE,
    }),
    db.user.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: MEMBERS_PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE)),
  };
}

export async function getMember(actor: Actor, userId: string) {
  if (!canViewMember(actor, userId)) {
    throw new ForbiddenError("You don't have permission to view this member.");
  }

  const member = await db.user.findUnique({
    where: { id: userId },
    include: { memberProfile: true },
  });

  if (!member || member.role !== MEMBER_ROLE) {
    throw new NotFoundError("Member not found.");
  }

  return member;
}

export async function createMember(actor: Actor, input: CreateMemberInput) {
  if (!canManageMembers(actor)) {
    throw new ForbiddenError("Only admins can create members.");
  }

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await withAudit(
      actor,
      (tx) =>
        tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            phone: input.phone,
            role: MEMBER_ROLE,
            status: "ACTIVE",
            memberProfile: {
              create: {
                dateOfBirth: input.dateOfBirth,
                address: input.address,
                emergencyContactName: input.emergencyContactName,
                emergencyContactPhone: input.emergencyContactPhone,
              },
            },
          },
          include: { memberProfile: true },
        }),
      (created) => ({
        action: "MEMBER_CREATED",
        entityType: "User",
        entityId: created.id,
        subjectUserId: created.id,
        summary: `Created member ${created.fullName}`,
      }),
    );
  } catch (error) {
    // Defense-in-depth against a race between the pre-check above and
    // this insert — see isUniqueConstraintError's own comment.
    if (isUniqueConstraintError(error, "email")) {
      throw new ConflictError("An account with this email already exists.");
    }
    throw error;
  }
}

export async function updateMemberAsAdmin(
  actor: Actor,
  userId: string,
  input: AdminUpdateMemberInput,
) {
  if (!canManageMembers(actor)) {
    throw new ForbiddenError("Only admins can edit members.");
  }

  const existingMember = await db.user.findUnique({ where: { id: userId } });
  if (!existingMember || existingMember.role !== MEMBER_ROLE) {
    throw new NotFoundError("Member not found.");
  }

  if (input.email !== existingMember.email) {
    const emailTaken = await db.user.findUnique({ where: { email: input.email } });
    if (emailTaken) {
      throw new ConflictError("An account with this email already exists.");
    }
  }

  try {
    return await withAudit(
      actor,
      (tx) =>
        tx.user.update({
          where: { id: userId },
          data: {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            memberProfile: {
              upsert: {
                create: {
                  dateOfBirth: input.dateOfBirth,
                  address: input.address,
                  emergencyContactName: input.emergencyContactName,
                  emergencyContactPhone: input.emergencyContactPhone,
                },
                update: {
                  dateOfBirth: input.dateOfBirth,
                  address: input.address,
                  emergencyContactName: input.emergencyContactName,
                  emergencyContactPhone: input.emergencyContactPhone,
                },
              },
            },
          },
          include: { memberProfile: true },
        }),
      (updated) => ({
        action: "MEMBER_UPDATED",
        entityType: "User",
        entityId: updated.id,
        subjectUserId: updated.id,
        summary: `Updated member ${updated.fullName}`,
        metadata: existingMember.email !== updated.email ? { emailChanged: true } : undefined,
      }),
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "email")) {
      throw new ConflictError("An account with this email already exists.");
    }
    throw error;
  }
}

/**
 * A member editing their own profile. Note there's no `userId` parameter
 * here at all — the target is always `actor.id`. That's not an
 * authorization check that could be forgotten or bypassed; it's simply
 * the only user this function is capable of touching, by its signature.
 */
export async function updateOwnProfile(actor: Actor, input: SelfUpdateMemberInput) {
  if (actor.role !== MEMBER_ROLE) {
    throw new ForbiddenError("Only members have a member profile to edit.");
  }

  const existingMember = await db.user.findUnique({ where: { id: actor.id } });
  if (!existingMember || existingMember.role !== MEMBER_ROLE) {
    throw new NotFoundError("Member profile not found.");
  }

  return db.user.update({
    where: { id: actor.id },
    data: {
      fullName: input.fullName,
      phone: input.phone,
      memberProfile: {
        upsert: {
          create: {
            address: input.address,
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
          },
          update: {
            address: input.address,
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
          },
        },
      },
    },
    include: { memberProfile: true },
  });
}

/** Admin-only: activate or deactivate a member's account. */
export async function setMemberStatus(actor: Actor, userId: string, status: UserStatus) {
  if (!canManageMembers(actor)) {
    throw new ForbiddenError("Only admins can change a member's status.");
  }

  const member = await db.user.findUnique({ where: { id: userId } });
  if (!member || member.role !== MEMBER_ROLE) {
    throw new NotFoundError("Member not found.");
  }

  return withAudit(
    actor,
    (tx) =>
      tx.user.update({
        where: { id: userId },
        data: { status },
        include: { memberProfile: true },
      }),
    (updated) => ({
      action: "MEMBER_STATUS_CHANGED",
      entityType: "User",
      entityId: updated.id,
      subjectUserId: updated.id,
      summary: `${status === "SUSPENDED" ? "Suspended" : "Reactivated"} member ${updated.fullName}`,
      metadata: { from: member.status, to: status },
    }),
  );
}
