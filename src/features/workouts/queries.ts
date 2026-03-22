import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { mockWorkouts } from "./mock-workouts";
import { getPreferredMediaForExercises } from "@/features/exercises/queries";
import type { Workout, WorkoutCategory, WorkoutStep } from "@/types";

// ─── DB row mappers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStepRow(row: any): WorkoutStep {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id ?? null,
    order: row.step_order,
    title: row.title,
    description: row.instruction_text ?? null,
    mediaUrl: row.media_url ?? null,
    durationSeconds: row.duration_seconds ?? null,
    reps: row.reps ?? null,
    sets: row.sets ?? null,
    restSeconds: row.rest_seconds ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkoutRow(row: any, steps: WorkoutStep[] = []): Workout {
  return {
    id: row.id,
    tenantId: row.tenant_id ?? null,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    category: row.category as WorkoutCategory,
    difficulty: row.difficulty,
    estimatedMinutes: row.estimated_duration_minutes ?? null,
    isFeatured: row.is_featured,
    isQuickStart: row.is_quick_start,
    isPublished: row.is_published,
    sourceType: row.source_type,
    steps,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── getWorkoutSteps ──────────────────────────────────────────────────────────
// Fetches steps and resolves media for each step with an exercise_id.

async function getWorkoutSteps(workoutId: string): Promise<WorkoutStep[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_steps")
    .select("*")
    .eq("workout_id", workoutId)
    .order("step_order");

  if (error || !data) return [];

  const rawSteps = data.map(mapStepRow);

  // Resolve preferred media for steps linked to exercises
  const exerciseIds = rawSteps
    .map((s) => s.exerciseId)
    .filter((id): id is string => id !== null);

  if (exerciseIds.length === 0) return rawSteps;

  const mediaMap = await getPreferredMediaForExercises(exerciseIds);

  return rawSteps.map((step) => {
    // Step-level media_url is an override — takes priority over exercise media
    if (step.mediaUrl || !step.exerciseId) return step;
    const preferred = mediaMap.get(step.exerciseId);
    if (preferred) return { ...step, mediaUrl: preferred.mediaUrl };
    return step;
  });
}

// ─── getWorkoutsByTenant ──────────────────────────────────────────────────────

export async function getWorkoutsByTenant(
  tenantId: string,
  filters?: { category?: WorkoutCategory }
): Promise<Workout[]> {
  if (!isSupabaseConfigured) {
    let results = mockWorkouts.filter(
      (w) => w.tenantId === tenantId && w.isPublished
    );
    if (filters?.category) {
      results = results.filter((w) => w.category === filters.category);
    }
    return results;
  }

  const client = await createServerSupabaseClient();

  // Fetch workouts via tenant_workout_preferences to respect DB-driven ordering
  let query = client
    .from("workouts")
    .select(
      `*, tenant_workout_preferences!inner(display_order)`
    )
    .eq("tenant_workout_preferences.tenant_id", tenantId)
    .eq("is_published", true)
    .order("tenant_workout_preferences.display_order");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Steps are not fetched here — list views don't need them
  return data.map((row) => mapWorkoutRow(row, []));
}

// ─── getWorkoutBySlugOrId ─────────────────────────────────────────────────────

export async function getWorkoutBySlugOrId(
  tenantId: string,
  identifier: string
): Promise<Workout | null> {
  if (!isSupabaseConfigured) {
    const mock =
      mockWorkouts.find(
        (w) =>
          (w.id === identifier || w.slug === identifier) &&
          w.tenantId === tenantId &&
          w.isPublished
      ) ?? null;
    return mock;
  }

  const client = await createServerSupabaseClient();

  // Try UUID lookup first, fall back to slug
  const isUuid = /^[0-9a-f-]{36}$/i.test(identifier);
  const { data, error } = await client
    .from("workouts")
    .select("*")
    .eq(isUuid ? "id" : "slug", identifier)
    .eq("tenant_id", tenantId)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;

  const steps = await getWorkoutSteps(data.id);
  return mapWorkoutRow(data, steps);
}

// ─── getCategoriesForTenant ───────────────────────────────────────────────────

export async function getCategoriesForTenant(
  tenantId: string
): Promise<WorkoutCategory[]> {
  if (!isSupabaseConfigured) {
    const workouts = mockWorkouts.filter(
      (w) => w.tenantId === tenantId && w.isPublished
    );
    return Array.from(new Set(workouts.map((w) => w.category)));
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workouts")
    .select("category, tenant_workout_preferences!inner(tenant_id)")
    .eq("tenant_workout_preferences.tenant_id", tenantId)
    .eq("is_published", true)
    .not("category", "is", null);

  if (error || !data) return [];

  return Array.from(
    new Set(data.map((row) => row.category as WorkoutCategory))
  );
}

// ─── getQuickStartWorkoutsForTenant ──────────────────────────────────────────
// Driven by tenant_workout_preferences.is_quick_start — no hardcoded logic.

export async function getQuickStartWorkoutsForTenant(
  tenantId: string
): Promise<Workout[]> {
  if (!isSupabaseConfigured) {
    return mockWorkouts
      .filter((w) => w.tenantId === tenantId && w.isPublished && w.isQuickStart)
      .slice(0, 3);
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workouts")
    .select("*, tenant_workout_preferences!inner(display_order, is_quick_start)")
    .eq("tenant_workout_preferences.tenant_id", tenantId)
    .eq("tenant_workout_preferences.is_quick_start", true)
    .eq("is_published", true)
    .order("tenant_workout_preferences.display_order")
    .limit(3);

  if (error || !data) return [];
  return data.map((row) => mapWorkoutRow(row, []));
}

// ─── getFeaturedWorkoutsForTenant ─────────────────────────────────────────────
// Driven by tenant_workout_preferences.is_recommended — no hardcoded logic.

export async function getFeaturedWorkoutsForTenant(
  tenantId: string,
  count = 4
): Promise<Workout[]> {
  if (!isSupabaseConfigured) {
    return mockWorkouts
      .filter((w) => w.tenantId === tenantId && w.isPublished && w.isFeatured)
      .slice(0, count);
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workouts")
    .select("*, tenant_workout_preferences!inner(display_order, is_recommended)")
    .eq("tenant_workout_preferences.tenant_id", tenantId)
    .eq("tenant_workout_preferences.is_recommended", true)
    .eq("is_published", true)
    .order("tenant_workout_preferences.display_order")
    .limit(count);

  if (error || !data) return [];
  return data.map((row) => mapWorkoutRow(row, []));
}

// ─── getRecommendedWorkoutsForTenant ──────────────────────────────────────────
// All recommended workouts, ordered by display_order.

export async function getRecommendedWorkoutsForTenant(
  tenantId: string
): Promise<Workout[]> {
  return getFeaturedWorkoutsForTenant(tenantId, 20);
}
