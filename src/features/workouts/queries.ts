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
    workoutId: row.workout_template_id,
    exerciseId: row.exercise_id ?? null,
    order: row.step_order,
    title: row.title ?? "",
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
  // Supabase returns step count as workout_template_items: [{count: N}] when using count()
  const dbStepCount = Array.isArray(row.workout_template_items)
    ? (row.workout_template_items[0]?.count as number | undefined)
    : undefined;

  return {
    id: row.id,
    tenantId: row.gym_id || row.tenant_id || null,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    category: row.category as WorkoutCategory,
    difficulty:
      row.difficulty === "expert"
        ? "advanced"
        : (row.difficulty as "beginner" | "intermediate" | "advanced"),
    estimatedMinutes: row.estimated_duration_minutes ?? null,
    isFeatured: row.is_featured,
    isQuickStart: row.is_quick_start,
    isPublished: row.is_published,
    sourceType: row.source_type === "gym" ? "tenant" : row.source_type,
    steps,
    stepCount: steps.length > 0 ? steps.length : dbStepCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── getWorkoutSteps ──────────────────────────────────────────────────────────
// Fetches steps and resolves media for each step with an exercise_id.

async function getWorkoutSteps(workoutId: string): Promise<WorkoutStep[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_template_items")
    .select("*")
    .eq("workout_template_id", workoutId)
    .order("step_order", { ascending: true });

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
// Returns tenant-specific workouts (via preferences) + ALL global workouts.

export async function getWorkoutsByTenant(
  tenantId: string,
  filters?: { category?: WorkoutCategory }
): Promise<Workout[]> {
  if (!isSupabaseConfigured) {
    let results = mockWorkouts.filter(
      (w) =>
        (w.tenantId === tenantId || w.tenantId === null) && w.isPublished
    );
    if (filters?.category) {
      results = results.filter((w) => w.category === filters.category);
    }
    return results;
  }

  const client = await createServerSupabaseClient();

  // Tenant-specific workouts (with step count)
  let tenantQuery = client
    .from("workout_templates")
    .select(`*, workout_template_items(count)`)
    .eq("gym_id", tenantId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (filters?.category) {
    tenantQuery = tenantQuery.eq("category", filters.category);
  }

  // Global workouts available to all gyms (with step count)
  let globalQuery = client
    .from("workout_templates")
    .select("*, workout_template_items(count)")
    .is("gym_id", null)
    .eq("is_published", true)
    .order("created_at");

  if (filters?.category) {
    globalQuery = globalQuery.eq("category", filters.category);
  }

  const [tenantResult, globalResult] = await Promise.all([
    tenantQuery,
    globalQuery,
  ]);

  if (tenantResult.error) {
    console.error("[getWorkoutsByTenant] Tenant Error:", tenantResult.error);
  }
  if (globalResult.error) {
    console.error("[getWorkoutsByTenant] Global Error:", globalResult.error);
  }

  const tenantWorkouts = (tenantResult.data ?? []).map((row) =>
    mapWorkoutRow(row, [])
  );
  const globalWorkouts = (globalResult.data ?? []).map((row) =>
    mapWorkoutRow(row, [])
  );

  // Global workouts first, dedup by id
  const seen = new Set<string>();
  const combined: Workout[] = [];
  for (const w of [...globalWorkouts, ...tenantWorkouts]) {
    if (!seen.has(w.id)) {
      seen.add(w.id);
      combined.push(w);
    }
  }
  return combined;
}

// ─── getWorkoutBySlugOrId ─────────────────────────────────────────────────────

export async function getWorkoutBySlugOrId(
  tenantId: string,
  identifier: string
): Promise<Workout | null> {
  if (!isSupabaseConfigured) {
    // Check tenant workouts first, then fall back to global workouts
    const mock =
      mockWorkouts.find(
        (w) =>
          (w.id === identifier || w.slug === identifier) &&
          w.tenantId === tenantId &&
          w.isPublished
      ) ??
      mockWorkouts.find(
        (w) =>
          (w.id === identifier || w.slug === identifier) &&
          w.tenantId === null &&
          w.isPublished
      ) ??
      null;
    return mock;
  }

  const client = await createServerSupabaseClient();

  const isUuid = /^[0-9a-f-]{36}$/i.test(identifier);
  const field = isUuid ? "id" : "slug";

  // Try tenant-specific workout first
  const { data: tenantData } = await client
    .from("workout_templates")
    .select("*")
    .eq(field, identifier)
    .eq("gym_id", tenantId)
    .eq("is_published", true)
    .maybeSingle();

  if (tenantData) {
    const steps = await getWorkoutSteps(tenantData.id);
    return mapWorkoutRow(tenantData, steps);
  }

  // Fall back to global workout
  const { data: globalData, error } = await client
    .from("workout_templates")
    .select("*")
    .eq(field, identifier)
    .is("gym_id", null)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !globalData) return null;

  const steps = await getWorkoutSteps(globalData.id);
  return mapWorkoutRow(globalData, steps);
}

// ─── getCategoriesForTenant ───────────────────────────────────────────────────

export async function getCategoriesForTenant(
  tenantId: string
): Promise<WorkoutCategory[]> {
  if (!isSupabaseConfigured) {
    const workouts = mockWorkouts.filter(
      (w) =>
        (w.tenantId === tenantId || w.tenantId === null) && w.isPublished
    );
    return Array.from(new Set(workouts.map((w) => w.category)));
  }

  const client = await createServerSupabaseClient();

  const [tenantResult, globalResult] = await Promise.all([
    client
      .from("workout_templates")
      .select("category")
      .eq("gym_id", tenantId)
      .eq("is_published", true)
      .not("category", "is", null),
    client
      .from("workout_templates")
      .select("category")
      .is("gym_id", null)
      .eq("is_published", true)
      .not("category", "is", null),
  ]);

  const cats = [
    ...(tenantResult.data ?? []),
    ...(globalResult.data ?? []),
  ].map((row) => row.category as WorkoutCategory);

  return Array.from(new Set(cats));
}

// ─── getQuickStartWorkoutsForTenant ──────────────────────────────────────────
// Driven by tenant_workout_preferences.is_quick_start — no hardcoded logic.

export async function getQuickStartWorkoutsForTenant(
  tenantId: string
): Promise<Workout[]> {
  if (!isSupabaseConfigured) {
    return mockWorkouts
      .filter(
        (w) =>
          (w.tenantId === tenantId || w.tenantId === null) &&
          w.isPublished &&
          w.isQuickStart
      )
      .slice(0, 3);
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_templates")
    .select("*, workout_template_items(count)")
    .eq("gym_id", tenantId)
    .eq("is_quick_start", true)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
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
      .filter(
        (w) =>
          (w.tenantId === tenantId || w.tenantId === null) &&
          w.isPublished &&
          w.isFeatured
      )
      .slice(0, count);
  }

  const client = await createServerSupabaseClient();

  const [tenantResult, globalResult] = await Promise.all([
    client
      .from("workout_templates")
      .select("*, workout_template_items(count)")
      .eq("gym_id", tenantId)
      .eq("is_featured", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(count),
    client
      .from("workout_templates")
      .select("*, workout_template_items(count)")
      .is("gym_id", null)
      .eq("is_featured", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(count),
  ]);

  const combined = [
    ...(tenantResult.data ?? []).map((row) => mapWorkoutRow(row, [])),
    ...(globalResult.data ?? []).map((row) => mapWorkoutRow(row, [])),
  ];

  // Dedup by id and cap at requested count
  const seen = new Set<string>();
  const result: Workout[] = [];
  for (const w of combined) {
    if (!seen.has(w.id) && result.length < count) {
      seen.add(w.id);
      result.push(w);
    }
  }
  return result;
}

// ─── getRecommendedWorkoutsForTenant ──────────────────────────────────────────
// All recommended workouts, ordered by display_order.

export async function getRecommendedWorkoutsForTenant(
  tenantId: string
): Promise<Workout[]> {
  return getFeaturedWorkoutsForTenant(tenantId, 20);
}
