import { z } from "zod";

export const workoutSessionStatusSchema = z.enum([
  "in_progress",
  "completed",
  "abandoned",
]);

export const workoutSessionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  profileId: z.string().uuid(),
  workoutId: z.string().uuid(),
  status: workoutSessionStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  stepsCompleted: z.number().int().min(0),
  totalSteps: z.number().int().min(0),
});

export type WorkoutSessionSchema = z.infer<typeof workoutSessionSchema>;
