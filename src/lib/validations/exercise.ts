import { z } from "zod";
import { optionalTrimmedString } from "./shared";

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  muscleGroup: optionalTrimmedString(100),
  description: optionalTrimmedString(1000),
  instructions: optionalTrimmedString(2000),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
