/**
 * Exercise asset URL construction.
 *
 * URLs are deterministic from the exercise ID — no DB query needed for
 * list views. Only fetch exercise_media rows when you need the `is_preferred`
 * flag or custom gym overrides.
 */

const CDN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!CDN && typeof window !== "undefined") {
  console.warn("[exercises/url] NEXT_PUBLIC_R2_PUBLIC_URL is not set");
}

/**
 * The auto-generated 4-frame loop GIF.
 * Always present for all 873 exercises. ~208KB. Use in list cards.
 */
export function exerciseLoopUrl(exerciseId: string): string {
  return `${CDN}/exercises/${exerciseId}/loop.gif`;
}

/**
 * The high-quality demo GIF (1–2.5MB). Present for ~107 exercises.
 * Use on exercise detail pages. Falls back to loop if not available.
 */
export function exerciseDemoUrl(exerciseId: string): string {
  return `${CDN}/exercises/${exerciseId}/demo.gif`;
}

/**
 * Given an array of exercise_media rows, return the best available GIF URL.
 * Prefers demo_gif → loop_gif, and picks is_preferred=true when tied.
 */
export function pickBestGifUrl(
  media: Array<{ cdn_url: string; media_type: string; is_preferred: boolean }>
): string | null {
  const preferred = media.find((m) => m.is_preferred);
  if (preferred) return preferred.cdn_url;

  const demo = media.find((m) => m.media_type === "demo_gif");
  if (demo) return demo.cdn_url;

  const loop = media.find((m) => m.media_type === "loop_gif");
  return loop?.cdn_url ?? null;
}
