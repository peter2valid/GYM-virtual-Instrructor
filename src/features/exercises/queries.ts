import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { mapExerciseRow, mapExerciseMediaRow } from "./mappers";
import type { Exercise, ExerciseMedia } from "@/types";

// ─── getExerciseById ──────────────────────────────────────────────────────────

export async function getExerciseById(id: string): Promise<Exercise | null> {
  if (!isSupabaseConfigured) return null;

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("exercises")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapExerciseRow(data);
}

// ─── getExercises ─────────────────────────────────────────────────────────────

interface ExerciseFilters {
  category?: string;
  level?: string;
  equipment?: string;
}

export async function getExercises(
  filters?: ExerciseFilters
): Promise<Exercise[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  let query = client
    .from("exercises")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.level) query = query.eq("level", filters.level);
  if (filters?.equipment) query = query.eq("equipment", filters.equipment);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapExerciseRow);
}

// ─── getPreferredMediaForExercise ─────────────────────────────────────────────

export async function getPreferredMediaForExercise(
  exerciseId: string
): Promise<ExerciseMedia | null> {
  if (!isSupabaseConfigured) return null;

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("exercise_media_map")
    .select("*")
    .eq("exercise_id", exerciseId)
    .eq("is_preferred", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapExerciseMediaRow(data);
}

// ─── getPreferredMediaForExercises ────────────────────────────────────────────
// Batch version — fetches preferred media for multiple exercises in one query.

export async function getPreferredMediaForExercises(
  exerciseIds: string[]
): Promise<Map<string, ExerciseMedia>> {
  const result = new Map<string, ExerciseMedia>();
  if (!isSupabaseConfigured || exerciseIds.length === 0) return result;

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("exercise_media_map")
    .select("*")
    .in("exercise_id", exerciseIds)
    .eq("is_preferred", true);

  if (error || !data) return result;

  for (const row of data) {
    // Keep only the first preferred row per exercise_id
    if (!result.has(row.exercise_id)) {
      result.set(row.exercise_id, mapExerciseMediaRow(row));
    }
  }
  return result;
}
