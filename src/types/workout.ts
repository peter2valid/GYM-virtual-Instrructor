export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced";

export type WorkoutCategory =
  | "Strength"
  | "Cardio"
  | "HIIT"
  | "Flexibility"
  | "Yoga"
  | "Pilates"
  | "CrossFit"
  | "Bodyweight"
  | "Stretching"
  | "Recovery"
  | "Warmup"
  | "Full Body"
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
  createdAt: string;
  updatedAt: string;
}
