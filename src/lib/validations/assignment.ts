import { z } from "zod";

export const assignTrainerSchema = z.object({
  trainerId: z.string().trim().min(1, "Choose a trainer"),
});

export type AssignTrainerInput = z.infer<typeof assignTrainerSchema>;
