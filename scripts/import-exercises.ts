/**
 * Import 873 exercises from free-exercise-db into the exercises table.
 *
 * Usage:
 *   npx tsx scripts/import-exercises.ts
 *
 * Requirements:
 *   SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   (service role bypasses RLS for bulk inserts)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 50;

// ─── Slugify ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars (keeps letters, digits, spaces, hyphens)
    .trim()
    .replace(/\s+/g, "-")         // spaces → hyphens
    .replace(/-+/g, "-");          // collapse multiple hyphens
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawExercise {
  id: string;
  name: string;
  category: string;
  level: string;
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local and retry."
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const jsonPath = resolve(__dirname, "../free-exercise-db/dist/exercises.json");
  const raw: RawExercise[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Loaded ${raw.length} exercises from JSON.`);

  // Slugify + deduplicate — exercises.json has unique ids but slugs might collide
  const slugCount: Record<string, number> = {};
  const rows = raw.map((ex) => {
    let slug = slugify(ex.name);
    slugCount[slug] = (slugCount[slug] ?? 0) + 1;
    if (slugCount[slug] > 1) {
      slug = `${slug}-${slugCount[slug]}`;
    }

    // Images are relative paths like "3_4_Sit-Up/0.jpg"
    // During import we store them as-is; a separate step uploads to R2.
    const image1Url = ex.images[0] ? `/exercise-images/${ex.images[0]}` : null;
    const image2Url = ex.images[1] ? `/exercise-images/${ex.images[1]}` : null;

    return {
      source_id: ex.id,
      source_name: "free-exercise-db",
      slug,
      name: ex.name,
      category: ex.category,
      level: ex.level,
      force: ex.force ?? null,
      mechanic: ex.mechanic ?? null,
      equipment: ex.equipment ?? null,
      primary_muscles: ex.primaryMuscles,
      secondary_muscles: ex.secondaryMuscles,
      instructions: ex.instructions,
      image_1_url: image1Url,
      image_2_url: image2Url,
      is_active: true,
    };
  });

  // Batch upsert
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("exercises")
      .upsert(batch, { onConflict: "source_id,source_name", ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(
        `\rProgress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`
      );
    }
  }

  console.log(`\n\nDone. ${inserted} upserted, ${errors} errors.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
