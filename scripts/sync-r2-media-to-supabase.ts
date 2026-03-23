/**
 * scripts/sync-r2-media-to-supabase.ts
 *
 * Walks "gif and images/" locally (mirrors what's in R2 under exercises/),
 * matches each file to an exercise by slug, and upserts the R2 public URL
 * into exercise_media_map.
 *
 * Usage:
 *   npx tsx scripts/sync-r2-media-to-supabase.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_R2_PUBLIC_URL
 */

import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync } from "fs";
import { resolve, join, basename, extname, relative } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const R2_PUBLIC    = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/$/, "");
const MEDIA_DIR    = resolve(process.cwd(), "gif and images");

if (!SUPABASE_URL || !SERVICE_KEY || !R2_PUBLIC) {
  console.error("Missing env vars. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_R2_PUBLIC_URL.");
  process.exit(1);
}

const MEDIA_EXTS = new Set([".gif", ".png", ".jpg", ".jpeg", ".webp"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toR2Url(filePath: string): string {
  const rel = relative(MEDIA_DIR, filePath).split(/[\\/]/).join("/");
  return `${R2_PUBLIC}/exercises/${rel}`;
}

function mediaType(ext: string): string {
  if (ext === ".gif") return "gif";
  if (ext === ".mp4") return "video";
  return "image";
}

function inferAnatomyUrl(filePath: string, slugToId: Map<string, string>): string | null {
  // If this file ends in _muscles or _muscles_worked it's an anatomy image
  const name = basename(filePath, extname(filePath));
  return name.includes("_muscle") ? toR2Url(filePath) : null;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Load all exercises
  const { data: exercises, error } = await supabase.from("exercises").select("id, slug, name");
  if (error) { console.error("Failed to load exercises:", error.message); process.exit(1); }

  const slugToId = new Map<string, string>();
  for (const ex of exercises ?? []) slugToId.set(ex.slug, ex.id);
  console.log(`Loaded ${slugToId.size} exercises from Supabase.\n`);

  const files = walk(MEDIA_DIR).filter(f => MEDIA_EXTS.has(extname(f).toLowerCase()));
  console.log(`Found ${files.length} media files in "gif and images/".\n`);

  let matched = 0, skipped = 0, errors = 0;

  // Group anatomy images separately
  const anatomyFiles = new Map<string, string>(); // baseSlug → r2Url
  for (const f of files) {
    const name = basename(f, extname(f));
    if (name.includes("_muscle")) {
      const baseSlug = slugify(name.replace(/_muscle.*$/, "").replace(/_/g, "-"));
      anatomyFiles.set(baseSlug, toR2Url(f));
    }
  }

  for (const filePath of files) {
    const ext  = extname(filePath).toLowerCase();
    const name = basename(filePath, ext);

    // Skip anatomy images — they get attached via the anatomy_image_url field
    if (name.includes("_muscle")) continue;

    const slug1 = slugify(name.replace(/_/g, "-").replace(/\s+/g, "-"));
    const slug2 = slugify(name.replace(/[-\s]+/g, "-"));

    let exerciseId = slugToId.get(slug1) ?? slugToId.get(slug2);

    // Fuzzy fallback: find closest slug within edit distance 2
    if (!exerciseId) {
      for (const [exSlug, id] of slugToId) {
        if (
          (exSlug.startsWith(slug1) || slug1.startsWith(exSlug)) &&
          Math.abs(exSlug.length - slug1.length) <= 4
        ) {
          exerciseId = id;
          break;
        }
      }
    }

    if (!exerciseId) {
      skipped++;
      continue;
    }

    const r2Url       = toR2Url(filePath);
    const anatomyUrl  = anatomyFiles.get(slug1) ?? anatomyFiles.get(slug2) ?? null;
    const type        = mediaType(ext);

    const { error: upsertErr } = await supabase
      .from("exercise_media_map")
      .upsert(
        {
          exercise_id:       exerciseId,
          media_type:        type,
          media_url:         r2Url,
          anatomy_image_url: anatomyUrl,
          source_name:       "r2_sync",
          is_preferred:      true,
          quality_score:     70,
        },
        { onConflict: "exercise_id,source_name" }
      );

    if (upsertErr) {
      console.error(`  FAIL  ${name}: ${upsertErr.message}`);
      errors++;
    } else {
      console.log(`  OK    ${name}`);
      matched++;
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Matched & upserted : ${matched}`);
  console.log(`Skipped (no match) : ${skipped}`);
  console.log(`Errors             : ${errors}`);
  if (errors > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
