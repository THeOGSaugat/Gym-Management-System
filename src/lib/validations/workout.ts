import { z } from "zod";
import { isBlank, optionalDate, optionalTrimmedString, requiredIdField } from "./shared";

export const workoutPlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  description: optionalTrimmedString(1000),
  // Defaults to today in the service if omitted, same convention as
  // assignMembershipSchema's startDate.
  startDate: optionalDate(),
  endDate: optionalDate(),
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

export const workoutDaySchema = z.object({
  label: z.string().trim().min(1, "Give this day a label, e.g. \"Monday\" or \"Push Day\"").max(60, "Label is too long"),
  notes: optionalTrimmedString(300),
});

export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

export const workoutExerciseSchema = z.object({
  exerciseId: requiredIdField("Choose an exercise"),
  sets: z.coerce.number().int("Sets must be a whole number").min(1, "At least 1 set").max(50, "That's an unrealistic number of sets"),
  reps: z.coerce.number().int("Reps must be a whole number").min(1, "At least 1 rep").max(200, "That's an unrealistic number of reps"),
  weightKg: z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.coerce.number().min(0, "Weight can't be negative").max(1000, "That's an unrealistic weight").optional(),
  ),
  restSeconds: z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.coerce.number().int("Rest time must be a whole number of seconds").min(0, "Rest time can't be negative").max(3600, "Rest time can't exceed an hour").optional(),
  ),
  notes: optionalTrimmedString(300),
});

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
