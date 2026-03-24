#!/usr/bin/env node
/**
 * Seeds exercise_media rows for exercises that have demo.gif in R2.
 *
 * Run AFTER the V2 migration is applied:
 *   DB_PASSWORD=yourpassword node scripts/seed_demo_gifs.js
 *
 * What it does:
 *   1. Finds all exercise IDs that have a demo.gif folder in free-exercise-db/exercises/
 *   2. Inserts a demo_gif media row in exercise_media for each
 *   3. Sets is_preferred = true on demo_gif rows (and false on loop_gif rows for same exercises)
 *
 * Safe to re-run (uses ON CONFLICT DO NOTHING).
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const PROJECT_REF = "cblwoeoozzjagxgpmrbd";
const CDN_BASE = "https://pub-135146decfd44634b9e8e73a717545d1.r2.dev";
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || `db.${PROJECT_REF}.supabase.co`;
const DB_USER = process.env.DB_USER || "postgres";
const EXERCISE_DIR = path.resolve(__dirname, "../free-exercise-db/exercises");

if (!DB_PASSWORD) {
  console.error(`
  ❌  DB_PASSWORD env var is required.

  Run:
    DB_PASSWORD=yourpassword node scripts/seed_demo_gifs.js
  `);
  process.exit(1);
}

const CONN = {
  host: DB_HOST,
  port: 5432,
  database: "postgres",
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  family: 4, // force IPv4
};

async function run() {
  // Find all exercise IDs with demo.gif
  const exerciseDirs = fs.readdirSync(EXERCISE_DIR);
  const demoExercises = exerciseDirs.filter((dir) => {
    const demoPath = path.join(EXERCISE_DIR, dir, "demo.gif");
    return fs.existsSync(demoPath);
  });

  console.log(`\n📋  Found ${demoExercises.length} exercises with demo.gif`);

  const client = new Client(CONN);
  await client.connect();
  console.log("✅  Connected\n");

  let inserted = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    for (const sourceId of demoExercises) {
      // Look up the UUID for this exercise (exercises.id is uuid, source_id is text)
      const { rows: exRows } = await client.query(
        `SELECT id FROM exercises WHERE source_id = $1 AND is_active = true LIMIT 1`,
        [sourceId]
      );

      if (!exRows.length) {
        console.log(`  ⚠️  No exercise found for source_id="${sourceId}" — skipping`);
        continue;
      }

      const exerciseUuid = exRows[0].id;
      const cdnUrl = `${CDN_BASE}/exercises/${sourceId}/demo.gif`;
      const storageKey = `exercises/${sourceId}/demo.gif`;

      // Insert demo_gif row (upsert)
      const result = await client.query(
        `INSERT INTO exercise_media
           (exercise_id, media_type, storage_key, cdn_url, is_preferred)
         VALUES ($1, 'demo_gif', $2, $3, true)
         ON CONFLICT (exercise_id, media_type) DO UPDATE
           SET cdn_url = EXCLUDED.cdn_url,
               is_preferred = true,
               updated_at = now()
         RETURNING (xmax = 0) AS was_inserted`,
        [exerciseUuid, storageKey, cdnUrl]
      );

      if (result.rows[0]?.was_inserted) {
        inserted++;
      } else {
        skipped++;
      }

      // Make loop_gif non-preferred for exercises that have demo_gif
      await client.query(
        `UPDATE exercise_media
         SET is_preferred = false
         WHERE exercise_id = $1 AND media_type = 'loop_gif'`,
        [exerciseUuid]
      );
    }

    await client.query("COMMIT");

    console.log(`✅  Done!`);
    console.log(`   Inserted: ${inserted} new demo_gif rows`);
    console.log(`   Updated:  ${skipped} existing rows`);
    console.log(`   loop_gif rows for these ${demoExercises.length} exercises set to is_preferred=false`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌  Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
