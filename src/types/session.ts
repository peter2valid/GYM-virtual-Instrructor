export type WorkoutSessionStatus = "in_progress" | "completed" | "abandoned";

export interface WorkoutSession {
  id: string;
  tenantId: string;
  profileId: string;
  workoutId: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  stepsCompleted: number;
  totalSteps: number;
}
