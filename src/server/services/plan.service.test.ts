import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { listPlans, getPlan, createPlan, updatePlan, setPlanActive } from "./plan.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };

const basePlan = {
  id: "plan-1",
  name: "Monthly",
  description: null,
  durationDays: 30,
  priceMinor: 4999,
  currency: "USD",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  name: "Monthly",
  description: undefined,
  durationDays: 30,
  priceMinor: 4999,
};

describe("listPlans", () => {
  it("any authenticated actor can browse the catalog", async () => {
    prismaMock.membershipPlan.findMany.mockResolvedValue([basePlan]);
    await expect(listPlans(member, {})).resolves.toEqual([basePlan]);
    await expect(listPlans(trainer, {})).resolves.toEqual([basePlan]);
  });

  it("filters to active-only by default", async () => {
    prismaMock.membershipPlan.findMany.mockResolvedValue([]);
    await listPlans(admin, {});
    expect(prismaMock.membershipPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("includes inactive plans when asked", async () => {
    prismaMock.membershipPlan.findMany.mockResolvedValue([]);
    await listPlans(admin, { includeInactive: true });
    expect(prismaMock.membershipPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe("getPlan", () => {
  it("throws NotFoundError for a missing id", async () => {
    prismaMock.membershipPlan.findUnique.mockResolvedValue(null);
    await expect(getPlan(admin, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createPlan", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(createPlan(member, validInput)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createPlan(trainer, validInput)).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.membershipPlan.create).not.toHaveBeenCalled();
  });

  it("creates a plan for an admin", async () => {
    prismaMock.membershipPlan.create.mockResolvedValue(basePlan);
    await createPlan(admin, validInput);
    expect(prismaMock.membershipPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Monthly", durationDays: 30, priceMinor: 4999 }),
      }),
    );
  });
});

describe("updatePlan", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(updatePlan(member, "plan-1", validInput)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.membershipPlan.findUnique.mockResolvedValue(null);
    await expect(updatePlan(admin, "nope", validInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates an existing plan for an admin", async () => {
    prismaMock.membershipPlan.findUnique.mockResolvedValue(basePlan);
    prismaMock.membershipPlan.update.mockResolvedValue({ ...basePlan, name: "Updated" });
    await updatePlan(admin, "plan-1", { ...validInput, name: "Updated" });
    expect(prismaMock.membershipPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "plan-1" },
        data: expect.objectContaining({ name: "Updated" }),
      }),
    );
  });
});

describe("setPlanActive", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(setPlanActive(member, "plan-1", false)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a missing plan", async () => {
    prismaMock.membershipPlan.findUnique.mockResolvedValue(null);
    await expect(setPlanActive(admin, "nope", false)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deactivates a plan for an admin", async () => {
    prismaMock.membershipPlan.findUnique.mockResolvedValue(basePlan);
    prismaMock.membershipPlan.update.mockResolvedValue({ ...basePlan, isActive: false });
    await setPlanActive(admin, "plan-1", false);
    expect(prismaMock.membershipPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { isActive: false },
    });
  });
});
