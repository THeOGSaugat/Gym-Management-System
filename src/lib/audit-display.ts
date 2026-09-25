import type { AuditAction } from "@/generated/prisma/client";

/**
 * Display labels for audit actions. A Record over the enum, so adding a
 * new AuditAction without a label here is a type error, not a blank cell.
 */
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  MEMBER_CREATED: "Member created",
  MEMBER_UPDATED: "Member updated",
  MEMBER_STATUS_CHANGED: "Member status changed",
  TRAINER_CREATED: "Trainer created",
  TRAINER_UPDATED: "Trainer updated",
  TRAINER_STATUS_CHANGED: "Trainer status changed",
  PLAN_CREATED: "Plan created",
  PLAN_UPDATED: "Plan updated",
  PLAN_STATUS_CHANGED: "Plan activated/deactivated",
  MEMBERSHIP_CREATED: "Membership assigned",
  MEMBERSHIP_RENEWED: "Membership renewed",
  MEMBERSHIP_CANCELLED: "Membership cancelled",
  PAYMENT_RECORDED: "Payment recorded",
  TRAINER_ASSIGNED: "Trainer assigned",
  TRAINER_ASSIGNMENT_REMOVED: "Trainer assignment removed",
  EXERCISE_UPDATED: "Exercise updated",
  EXERCISE_STATUS_CHANGED: "Exercise retired/restored",
  WORKOUT_PLAN_STATUS_CHANGED: "Workout plan status changed",
};

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABEL) as AuditAction[];

export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === "string" && (AUDIT_ACTIONS as string[]).includes(value);
}
