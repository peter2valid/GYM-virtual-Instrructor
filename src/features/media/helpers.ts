/**
 * Media resolution helpers.
 *
 * These functions implement the preferred display order for exercise visuals:
 *   1. exercise_media_map preferred row  (best quality, curated)
 *   2. exercises.media_loop_url          (source DB looping visual)
 *   3. exercises.image_1_url             (source DB static image)
 *   4. null                              (caller shows placeholder UI)
 *
 * This logic lives here — not scattered across UI components — so it can
 * be updated centrally when media strategy changes (e.g. GIF → MP4/WebM).
 */

import type { ResolvedExerciseMedia } from "@/types";

interface MediaResolutionInput {
  mediaLoopUrl: string | null;
  image1Url: string | null;
  preferredMapUrl: string | null;
  preferredMapAnatomyUrl: string | null;
}

export function resolveStepMedia(input: MediaResolutionInput): ResolvedExerciseMedia {
  if (input.preferredMapUrl) {
    return {
      url: input.preferredMapUrl,
      type: "preferred_map",
      anatomyImageUrl: input.preferredMapAnatomyUrl,
    };
  }
  if (input.mediaLoopUrl) {
    return { url: input.mediaLoopUrl, type: "media_loop", anatomyImageUrl: null };
  }
  if (input.image1Url) {
    return { url: input.image1Url, type: "image_1", anatomyImageUrl: null };
  }
  return { url: null, type: "none", anatomyImageUrl: null };
}

/**
 * Returns true if a media URL is likely a GIF.
 * Useful for applying autoPlay/loop logic in future video migration.
 */
export function isGifUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".gif");
}

/**
 * Returns true if a media URL is a looping video (MP4 or WebM).
 * These should be rendered as <video autoplay loop muted playsInline>.
 */
export function isLoopingVideo(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm");
}
