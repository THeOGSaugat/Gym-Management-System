import { z } from "zod";
import { requiredIdField } from "./shared";

export const assignTrainerSchema = z.object({
  trainerId: requiredIdField("Choose a trainer"),
});

export type AssignTrainerInput = z.infer<typeof assignTrainerSchema>;
