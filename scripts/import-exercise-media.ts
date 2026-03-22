/**
 * Import exercise GIF media from the local "gif and images/" directory.
 *
 * Strategy:
 *   1. Walk all subdirectories looking for *.gif files
 *   2. Slugify the filename (without extension) to match exercise slugs
 *   3. Look up the exercise by slug in the DB
 *   4. Upsert a row in exercise_media_map with the local path
 *
 * Usage:
 *   npx tsx scripts/import-exercise-media.ts
 *
 * Requirements:
 *   SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *
 * Note: This imports the LOCAL file path as the media URL.
 *       In production, upload the files to Cloudflare R2 first,
 *       then update exercise_media_map.media_url to the R2 URL.
 */

import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync } from "fs";
import { resolve, join, basename, extname } from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MEDIA_DIR = resolve(__dirname, "../gif and images");

// ─── Slugify (matches the import-exercises.ts logic) ─────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Walk directory recursively ───────────────────────────────────────────────

function walkGifs(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkGifs(full));
    } else if (extname(entry).toLowerCase() === ".gif") {
      results.push(full);
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const gifPaths = walkGifs(MEDIA_DIR);
  console.log(`Found ${gifPaths.length} GIF files.`);

  // Load all exercise slugs from DB into a map slug → id
  const { data: exercises, error: exErr } = await supabase
    .from("exercises")
    .select("id, slug, name");

  if (exErr) {
    console.error("Failed to load exercises:", exErr.message);
    process.exit(1);
  }

  const slugToId = new Map<string, string>();
  for (const ex of exercises ?? []) {
    slugToId.set(ex.slug, ex.id);
  }

  console.log(`Loaded ${slugToId.size} exercises from DB.`);

  let matched = 0;
  let skipped = 0;
  let errors = 0;

  for (const gifPath of gifPaths) {
    const fileName = basename(gifPath, ".gif"); // e.g. "barbell_curl" or "push-up"
    // Try both underscore → hyphen and direct slug
    const slug = slugify(fileName.replace(/_/g, "-"));
    const slugUnderscore = slugify(fileName.replace(/-/g, "_").replace(/_/g, "-"));

    const exerciseId = slugToId.get(slug) ?? slugToId.get(slugUnderscore);

    if (!exerciseId) {
      // Try partial match — check if any exercise slug starts with the slug
      let found: string | undefined;
      for (const [exSlug, id] of slugToId) {
        if (exSlug.startsWith(slug) || slug.startsWith(exSlug.slice(0, Math.min(exSlug.length, slug.length)))) {
          if (Math.abs(exSlug.length - slug.length) <= 3) {
            found = id;
            break;
          }
        }
      }
      if (!found) {
        skipped++;
        continue;
      }
    }

    const id = exerciseId;
    // Relative path from project root — useful as a reference before R2 upload
    const relativePath = gifPath.replace(resolve(__dirname, ".."), "").replace(/\\/g, "/");

    const { error } = await supabase
      .from("exercise_media_map")
      .upsert(
        {
          exercise_id: id,
          media_type: "gif",
          media_url: relativePath,
          source_name: "local_gif_import",
          is_preferred: true,
          quality_score: 50,
        },
        { onConflict: "exercise_id,source_name" }
      );

    if (error) {
      console.error(`Error for ${fileName}:`, error.message);
      errors++;
    } else {
      matched++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Matched & upserted: ${matched}`);
  console.log(`  Skipped (no match):  ${skipped}`);
  console.log(`  Errors:              ${errors}`);
  console.log(`\nNext step: Upload GIFs to Cloudflare R2, then update`);
  console.log(`exercise_media_map.media_url with the R2 public URLs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
