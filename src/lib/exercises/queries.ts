/**
 * TanStack Query hooks for the exercise library.
 *
 * Key decisions:
 * - staleTime: Infinity  — exercise data is seeded once and never changes.
 *   No point re-fetching on every page visit.
 * - networkMode: "always" — the service worker handles offline via cache.
 * - Always use select() with explicit columns — never SELECT *.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Query key factory ────────────────────────────────────────────────────────
export const exerciseKeys = {
  all:    () => ["exercises"] as const,
  list:   (filters: ExerciseFilters) => ["exercises", "list", filters] as const,
  detail: (id: string) => ["exercises", "detail", id] as const,
  search: (q: string)  => ["exercises", "search", q] as const,
  batch:  (ids: string[]) => ["exercises", "batch", ids.sort().join(",")] as const,
};

export interface ExerciseFilters {
  category?: string;
  level?: string;
  equipment?: string;
  muscle?: string;
  limit?: number;
  offset?: number;
}

export interface ExerciseRow {
  id: string;
  source_id: string;   // e.g. "Barbell_Curl" — used for CDN URL construction
  name: string;
  category: string;
  level: string;
  equipment: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
}

export interface ExerciseDetail extends ExerciseRow {
  mechanic: string | null;
  force: string | null;
  instructions: string[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Paginated exercise list with optional filters.
 * Used in the exercise browser / search UI.
 */
export function useExercises(filters: ExerciseFilters = {}) {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: async () => {
      const sb = createClient();
      const { category, level, equipment, muscle, limit = 30, offset = 0 } = filters;

      let q = sb
        .from("exercises")
        .select("id, source_id, name, category, level, equipment, primary_muscles, secondary_muscles")
        .eq("is_active", true)
        .order("name")
        .range(offset, offset + limit - 1);

      if (category)  q = q.eq("category", category);
      if (level)     q = q.eq("level", level);
      if (equipment) q = q.eq("equipment", equipment);
      if (muscle)    q = q.contains("primary_muscles", [muscle]);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ExerciseRow[];
    },
    staleTime: Infinity,     // exercise library never changes
    gcTime: 60 * 60 * 1000, // keep in memory 1 hour
    networkMode: "always",
  });
}

/**
 * Single exercise with full detail + media.
 * Used on the exercise detail page / workout step screen.
 */
export function useExercise(id: string | null) {
  return useQuery({
    queryKey: exerciseKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const sb = createClient();

      const { data, error } = await sb
        .from("exercises")
        .select(`
          id, source_id, name, category, level, equipment,
          mechanic, force, instructions,
          primary_muscles, secondary_muscles
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as ExerciseDetail;
    },
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    networkMode: "always",
  });
}

/**
 * Fetch a batch of exercises by ID in a single query.
 * Use this when loading a workout that references N exercises — avoids N round trips.
 */
export function useWorkoutExercises(ids: string[]) {
  return useQuery({
    queryKey: exerciseKeys.batch(ids),
    queryFn: async () => {
      if (!ids.length) return [];
      const sb = createClient();

      const { data, error } = await sb
        .from("exercises")
        .select(`
          id, source_id, name, category, level, equipment,
          mechanic, force, instructions,
          primary_muscles, secondary_muscles
        `)
        .in("id", ids)
        .eq("is_active", true);

      if (error) throw error;

      // Return in the same order as requested IDs
      const byId = new Map((data ?? []).map(e => [e.id, e]));
      return ids.map(id => byId.get(id)).filter(Boolean) as ExerciseDetail[];
    },
    enabled: ids.length > 0,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    networkMode: "always",
  });
}

/**
 * Debounced exercise search.
 * Pass a query string; hook skips fetching until q.length >= 2.
 * Results are cached per query string — same search = zero extra requests.
 */
export function useSearchExercises(q: string) {
  return useQuery({
    queryKey: exerciseKeys.search(q),
    queryFn: async () => {
      const sb = createClient();
      const { data, error } = await sb
        .from("exercises")
        .select("id, source_id, name, category, primary_muscles")
        .ilike("name", `%${q}%`)
        .eq("is_active", true)
        .order("name")
        .limit(10);

      if (error) throw error;
      return (data ?? []) as Pick<ExerciseRow, "id" | "source_id" | "name" | "category" | "primary_muscles">[];
    },
    enabled: q.trim().length >= 2,
    staleTime: 10 * 60 * 1000, // search results fine for 10 min
    networkMode: "always",
    placeholderData: (prev) => prev, // keep showing old results while typing
  });
}
