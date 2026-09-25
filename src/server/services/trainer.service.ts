import { db } from "@/server/db";
import { hashPassword } from "@/lib/auth/password";
import { canManageTrainers, type Actor } from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import type { UserStatus } from "@/generated/prisma/client";
import type { CreateTrainerInput, UpdateTrainerInput } from "@/lib/validations/trainer";
import { clampPage } from "@/lib/pagination";
import { recordAudit, withAudit } from "@/server/services/audit.service";

const TRAINERS_PER_PAGE = 20;

// Every query in this file filters to role: "TRAINER" explicitly, same
// reasoning as member.service.ts's MEMBER_ROLE constant.
const TRAINER_ROLE = "TRAINER" as const;

export type ListTrainersParams = {
  search?: string;
  status?: UserStatus;
  page?: number;
};

export async function listTrainers(actor: Actor, params: ListTrainersParams = {}) {
  if (!canManageTrainers(actor)) {
    throw new ForbiddenError("Only admins can view the trainer list.");
  }

  const page = clampPage(params.page);
  const search = params.search?.trim();

  const where = {
    role: TRAINER_ROLE,
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
      include: { trainerProfile: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * TRAINERS_PER_PAGE,
      take: TRAINERS_PER_PAGE,
    }),
    db.user.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: TRAINERS_PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / TRAINERS_PER_PAGE)),
  };
}

export async function getTrainer(actor: Actor, userId: string) {
  if (!canManageTrainers(actor)) {
    throw new ForbiddenError("Only admins can view trainer details.");
  }

  const trainer = await db.user.findUnique({
    where: { id: userId },
    include: { trainerProfile: true },
  });

  if (!trainer || trainer.role !== TRAINER_ROLE) {
    throw new NotFoundError("Trainer not found.");
  }

  return trainer;
}

export async function createTrainer(actor: Actor, input: CreateTrainerInput) {
  if (!canManageTrainers(actor)) {
    throw new ForbiddenError("Only admins can create trainers.");
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
            role: TRAINER_ROLE,
            status: "ACTIVE",
            trainerProfile: {
              create: {
                bio: input.bio,
                specialization: input.specialization,
                experienceYears: input.experienceYears,
              },
            },
          },
          include: { trainerProfile: true },
        }),
      (created) => ({
        action: "TRAINER_CREATED",
        entityType: "User",
        entityId: created.id,
        subjectUserId: created.id,
        summary: `Created trainer ${created.fullName}`,
      }),
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "email")) {
      throw new ConflictError("An account with this email already exists.");
    }
    throw error;
  }
}

export async function updateTrainer(actor: Actor, userId: string, input: UpdateTrainerInput) {
  if (!canManageTrainers(actor)) {
    throw new ForbiddenError("Only admins can edit trainers.");
  }

  const existingTrainer = await db.user.findUnique({ where: { id: userId } });
  if (!existingTrainer || existingTrainer.role !== TRAINER_ROLE) {
    throw new NotFoundError("Trainer not found.");
  }

  if (input.email !== existingTrainer.email) {
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
            trainerProfile: {
              upsert: {
                create: {
                  bio: input.bio,
                  specialization: input.specialization,
                  experienceYears: input.experienceYears,
                },
                update: {
                  bio: input.bio,
                  specialization: input.specialization,
                  experienceYears: input.experienceYears,
                },
              },
            },
          },
          include: { trainerProfile: true },
        }),
      (updated) => ({
        action: "TRAINER_UPDATED",
        entityType: "User",
        entityId: updated.id,
        subjectUserId: updated.id,
        summary: `Updated trainer ${updated.fullName}`,
        metadata: existingTrainer.email !== updated.email ? { emailChanged: true } : undefined,
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
 * Admin-only: activate or deactivate a trainer's account. Deactivating
 * (SUSPENDED) also closes out every one of their ACTIVE assignments in
 * the same transaction — a suspended trainer shouldn't keep an active
 * client roster, and a member left "assigned" to a trainer who can't log
 * in is a dangling, confusing state. Reactivating does *not* restore
 * those assignments; an admin reassigns members explicitly.
 */
export async function setTrainerStatus(actor: Actor, userId: string, status: UserStatus) {
  if (!canManageTrainers(actor)) {
    throw new ForbiddenError("Only admins can change a trainer's status.");
  }

  const trainer = await db.user.findUnique({ where: { id: userId } });
  if (!trainer || trainer.role !== TRAINER_ROLE) {
    throw new NotFoundError("Trainer not found.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { status },
      include: { trainerProfile: true },
    });

    let assignmentsEnded = 0;
    if (status === "SUSPENDED") {
      const ended = await tx.trainerAssignment.updateMany({
        where: { trainerId: userId, status: "ACTIVE" },
        data: { status: "ENDED", endDate: new Date() },
      });
      assignmentsEnded = ended?.count ?? 0;
    }

    await recordAudit(tx, actor, {
      action: "TRAINER_STATUS_CHANGED",
      entityType: "User",
      entityId: updated.id,
      subjectUserId: updated.id,
      summary: `${status === "SUSPENDED" ? "Suspended" : "Reactivated"} trainer ${updated.fullName}`,
      metadata: { from: trainer.status, to: status, assignmentsEnded },
    });

    return updated;
  });
}
