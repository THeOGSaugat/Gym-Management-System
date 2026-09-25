import { z } from "zod";
import { optionalDate, optionalTrimmedString, requiredIdField } from "./shared";

/**
 * Deliberately has no price/amount field at all — a membership's price is
 * always read server-side from the plan record (see
 * membership.service.ts). There is nothing here for a tampered form
 * submission to override, because the field doesn't exist on this schema.
 */
export const assignMembershipSchema = z.object({
  planId: requiredIdField("Choose a plan"),
  // Defaults to today in the service if omitted — lets an admin schedule
  // a membership to start later (status starts PENDING) or backdate one
  // being entered after the fact.
  startDate: optionalDate(),
});

export type AssignMembershipInput = z.infer<typeof assignMembershipSchema>;

export const cancelMembershipSchema = z.object({
  reason: optionalTrimmedString(300),
});

export type CancelMembershipInput = z.infer<typeof cancelMembershipSchema>;
