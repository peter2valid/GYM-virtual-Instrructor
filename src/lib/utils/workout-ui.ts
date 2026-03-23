import type { WorkoutCategory, WorkoutDifficulty } from "@/types";

/**
 * Single icon per category — used sparingly as a functional indicator,
 * never as a large decorative element with a colored background.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  Warmup: "Flame",
  Abs: "Zap",
  Legs: "PersonStanding",
  Back: "Activity",
  Cardio: "Heart",
  Chest: "Dumbbell",
  Shoulders: "Target",
  Arms: "Dumbbell",
  Rest: "Clock",
  "Full Body": "Target",
  "Upper Body": "Dumbbell",
};

export const DIFFICULTY_STYLES: Record<WorkoutDifficulty, { label: string }> =
  {
    beginner: { label: "Beginner" },
    intermediate: { label: "Intermediate" },
    advanced: { label: "Advanced" },
  };

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSeconds(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins > 0) return `${mins}:${String(secs).padStart(2, "0")}`;
  return `${s}s`;
}
