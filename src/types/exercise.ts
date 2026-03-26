export interface Exercise {
  id: string;
  sourceId: string | null;
  sourceName: string | null;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  level: string | null;
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  image1Url: string | null;
  image2Url: string | null;
  mediaLoopUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseMedia {
  id: string;
  exerciseId: string;
  mediaType: "loop_gif" | "demo_gif";
  mediaUrl: string;
  qualityScore: number | null;
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * The resolved media URL for an exercise step, after applying the fallback chain:
 *   1. exercise_media_map preferred row
 *   2. exercises.media_loop_url
 *   3. exercises.image_1_url
 *   4. null (fallback UI)
 */
export interface ResolvedExerciseMedia {
  url: string | null;
  type: "preferred_map" | "media_loop" | "image_1" | "none";
  anatomyImageUrl: string | null;
}
