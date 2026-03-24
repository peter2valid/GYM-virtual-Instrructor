/**
 * Workout GIF pre-caching.
 *
 * Call preCacheWorkoutGifs() as soon as a workout is loaded.
 * It pushes the exercise GIFs into the SW "vg-exercises-v1" cache so
 * they're available even if signal drops mid-session.
 *
 * Only pre-caches loop.gif (~208KB each) — not demo.gif — to keep
 * the pre-cache payload small (~2MB for a 10-exercise workout).
 */

import { exerciseLoopUrl } from "./url";

const GIF_CACHE = "vg-exercises-v1";

/**
 * Pre-cache loop.gif for each exercise in the workout.
 * Silent — never throws, never blocks rendering.
 */
export async function preCacheWorkoutGifs(exerciseIds: string[]): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  if (!exerciseIds.length) return;

  try {
    const cache = await caches.open(GIF_CACHE);

    await Promise.allSettled(
      exerciseIds.map(async (id) => {
        const url = exerciseLoopUrl(id);
        // Only fetch if not already cached
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { priority: "low" } as RequestInit);
          if (response.ok) await cache.put(url, response);
        }
      })
    );
  } catch {
    // Pre-caching is best-effort; don't surface errors to the user
  }
}

/**
 * Check whether a specific exercise GIF is already in cache.
 * Useful to decide whether to show a loading spinner or not.
 */
export async function isExerciseCached(exerciseId: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(GIF_CACHE);
    const match = await cache.match(exerciseLoopUrl(exerciseId));
    return !!match;
  } catch {
    return false;
  }
}
