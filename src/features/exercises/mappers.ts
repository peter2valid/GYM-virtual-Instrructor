import type { Exercise, ExerciseMedia, ResolvedExerciseMedia } from "@/types";

// ─── Raw DB row types ─────────────────────────────────────────────────────────
// These match the Supabase schema exactly. Private to this module.

interface ExerciseDbRow {
  id: string;
  source_id: string | null;
  source_name: string | null;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  level: string | null;
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  image_1_url: string | null;
  image_2_url: string | null;
  media_loop_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ExerciseMediaDbRow {
  id: string;
  exercise_id: string;
  media_type: "loop_gif" | "demo_gif";
  cdn_url: string;
  quality_score: number | null;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapExerciseRow(row: ExerciseDbRow): Exercise {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    level: row.level,
    force: row.force,
    mechanic: row.mechanic,
    equipment: row.equipment,
    primaryMuscles: row.primary_muscles ?? [],
    secondaryMuscles: row.secondary_muscles ?? [],
    instructions: row.instructions ?? [],
    image1Url: row.image_1_url,
    image2Url: row.image_2_url,
    mediaLoopUrl: row.media_loop_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExerciseMediaRow(row: ExerciseMediaDbRow): ExerciseMedia {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    mediaType: row.media_type,
    mediaUrl: row.cdn_url,
    qualityScore: row.quality_score,
    isPreferred: row.is_preferred,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Resolves the best media URL for an exercise using the priority chain:
 *   1. Preferred row from exercise_media_map
 *   2. exercises.media_loop_url
 *   3. exercises.image_1_url
 *   4. null (caller renders fallback UI)
 *
 * Call this in query mappers, not in UI components.
 */
export function resolveExerciseMedia(
  exercise: Pick<Exercise, "image1Url" | "image2Url" | "mediaLoopUrl">,
  preferredMedia: ExerciseMedia | null
): ResolvedExerciseMedia {
  if (preferredMedia) {
    return { url: preferredMedia.mediaUrl, type: "preferred_map", anatomyImageUrl: null };
  }
  if (exercise.mediaLoopUrl) {
    return { url: exercise.mediaLoopUrl, type: "media_loop", anatomyImageUrl: null };
  }
  if (exercise.image1Url) {
    return { url: exercise.image1Url, type: "image_1", anatomyImageUrl: null };
  }
  return { url: null, type: "none", anatomyImageUrl: null };
}
