export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced";

export type WorkoutCategory =
  | "Warmup"
  | "Abs"
  | "Legs"
  | "Back"
  | "Cardio"
  | "Chest"
  | "Shoulders"
  | "Arms"
  | "Rest"
  | "Full Body"
  | "Upper Body"
  | "Strength"
  | "HIIT"
  | "Flexibility"
  | "Yoga"
  | "Pilates"
  | "CrossFit"
  | "Bodyweight"
  | "Stretching"
  | "Recovery"
  | string; // allow future categories from DB without breaking

export interface WorkoutStep {
  id: string;
  workoutId: string;
  exerciseId: string | null;
  order: number;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  durationSeconds: number | null;
  reps: number | null;
  sets: number | null;
  restSeconds: number | null;
}

export interface Workout {
  id: string;
  tenantId: string | null;
  slug: string;
  title: string;
  description: string | null;
  category: WorkoutCategory;
  difficulty: WorkoutDifficulty;
  estimatedMinutes: number | null;
  isFeatured: boolean;
  isQuickStart: boolean;
  isPublished: boolean;
  sourceType: "tenant" | "global";
  steps: WorkoutStep[];
  /** Pre-fetched step count for list views where steps[] is empty. */
  stepCount?: number;
  createdAt: string;
  updatedAt: string;
}
