import { z } from "zod";

export const workoutDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const workoutCategorySchema = z.enum([
  "Warmup",
  "Abs",
  "Legs",
  "Back",
  "Cardio",
  "Chest",
  "Shoulders",
  "Arms",
  "Rest",
  "Full Body",
  "Upper Body",
]);

export const workoutStepSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(),
  order: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  reps: z.number().int().positive().nullable(),
  sets: z.number().int().positive().nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  videoUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
});

export const workoutSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  difficulty: workoutDifficultySchema,
  estimatedMinutes: z.number().int().positive().nullable(),
  coverImageUrl: z.string().url().nullable(),
  category: workoutCategorySchema,
  isPublished: z.boolean(),
  steps: z.array(workoutStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkoutStepSchema = z.infer<typeof workoutStepSchema>;
export type WorkoutSchema = z.infer<typeof workoutSchema>;
