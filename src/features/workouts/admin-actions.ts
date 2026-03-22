"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

export type WorkoutStepInput = {
  title: string;
  description?: string;
  durationSeconds: number;
  restAfterSeconds: number;
  exerciseId?: string | null;
};

export type WorkoutInput = {
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDurationMinutes: number;
  description?: string;
  isPublished: boolean;
  steps: WorkoutStepInput[];
};

type ActionResult = { error: string } | { success: true; workoutId?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function getAdminTenant() {
  const user = await getAuthUser();
  if (!user) return null;

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return null;
  }
  return { client, tenantId: profile.tenant_id };
}

// ─── createWorkout ────────────────────────────────────────────────────────────

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const VALID_CATEGORIES = [
  "Strength","Cardio","HIIT","Flexibility","Yoga","Pilates",
  "CrossFit","Bodyweight","Stretching","Recovery","Warmup","Full Body",
];

function validateWorkoutInput(input: WorkoutInput): string | null {
  if (!input.title?.trim()) return "Title is required.";
  if (!VALID_DIFFICULTIES.includes(input.difficulty as typeof VALID_DIFFICULTIES[number]))
    return "Invalid difficulty.";
  if (!VALID_CATEGORIES.includes(input.category)) return "Invalid category.";
  if (input.estimatedDurationMinutes < 1 || input.estimatedDurationMinutes > 240)
    return "Duration must be between 1 and 240 minutes.";
  for (const step of input.steps) {
    if (!step.title?.trim()) return "All steps must have a title.";
  }
  return null;
}

export async function createWorkout(input: WorkoutInput): Promise<ActionResult> {
  const validationError = validateWorkoutInput(input);
  if (validationError) return { error: validationError };

  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  // Generate a unique slug
  const baseSlug = slugify(input.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: workout, error: wErr } = await client
    .from("workouts")
    .insert({
      tenant_id: tenantId,
      title: input.title,
      slug,
      description: input.description || null,
      category: input.category,
      difficulty: input.difficulty,
      estimated_duration_minutes: input.estimatedDurationMinutes,
      is_published: input.isPublished,
      source_type: "tenant",
      is_featured: false,
      is_quick_start: false,
    })
    .select("id")
    .single();

  if (wErr) return { error: wErr.message };

  // Insert steps
  if (input.steps.length > 0) {
    const stepRows = input.steps.map((s, i) => ({
      workout_id: workout.id,
      step_order: i + 1,
      title: s.title,
      instruction_text: s.description || null,
      duration_seconds: s.durationSeconds,
      rest_seconds: s.restAfterSeconds,
      exercise_id: s.exerciseId || null,
    }));

    const { error: sErr } = await client.from("workout_steps").insert(stepRows);
    if (sErr) return { error: sErr.message };
  }

  // Add to tenant workout preferences
  await client.from("tenant_workout_preferences").upsert(
    { tenant_id: tenantId, workout_id: workout.id, is_recommended: false, is_quick_start: false },
    { onConflict: "tenant_id,workout_id" }
  );

  revalidatePath("/gym-admin/workouts");
  revalidatePath(`/g`);
  return { success: true, workoutId: workout.id };
}

// ─── updateWorkout ────────────────────────────────────────────────────────────

export async function updateWorkout(
  workoutId: string,
  input: WorkoutInput
): Promise<ActionResult> {
  const validationError = validateWorkoutInput(input);
  if (validationError) return { error: validationError };

  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  const { error: wErr } = await client
    .from("workouts")
    .update({
      title: input.title,
      description: input.description || null,
      category: input.category,
      difficulty: input.difficulty,
      estimated_duration_minutes: input.estimatedDurationMinutes,
      is_published: input.isPublished,
    })
    .eq("id", workoutId)
    .eq("tenant_id", tenantId); // enforce ownership

  if (wErr) return { error: wErr.message };

  // Replace all steps — delete old ones first, then insert new ones
  const { error: deleteErr } = await client
    .from("workout_steps")
    .delete()
    .eq("workout_id", workoutId);

  if (deleteErr) return { error: deleteErr.message };

  if (input.steps.length > 0) {
    const stepRows = input.steps.map((s, i) => ({
      workout_id: workoutId,
      step_order: i + 1,
      title: s.title,
      instruction_text: s.description || null,
      duration_seconds: s.durationSeconds,
      rest_seconds: s.restAfterSeconds,
      exercise_id: s.exerciseId || null,
    }));

    const { error: sErr } = await client.from("workout_steps").insert(stepRows);
    if (sErr) return { error: sErr.message };
  }

  revalidatePath("/gym-admin/workouts");
  revalidatePath(`/g`);
  return { success: true };
}

// ─── deleteWorkout ────────────────────────────────────────────────────────────

export async function deleteWorkout(workoutId: string): Promise<ActionResult> {
  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  // Delete steps and preferences first (FK constraints)
  await Promise.all([
    client.from("workout_steps").delete().eq("workout_id", workoutId),
    client.from("tenant_workout_preferences").delete().eq("workout_id", workoutId),
  ]);

  const { error } = await client
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/workouts");
  return { success: true };
}

// ─── toggleWorkoutPublished ───────────────────────────────────────────────────

export async function toggleWorkoutPublished(
  workoutId: string,
  published: boolean
): Promise<ActionResult> {
  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  const { error } = await client
    .from("workouts")
    .update({ is_published: published })
    .eq("id", workoutId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/workouts");
  return { success: true };
}
