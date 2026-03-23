/**
 * scripts/upload-media-to-r2.ts
 *
 * Uploads all exercise GIFs and images from "gif and images/" to the
 * virtualgym-media R2 bucket under the "exercises/" prefix.
 *
 * Usage:
 *   npx tsx scripts/upload-media-to-r2.ts
 *
 * Requires in .env.local:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: ".env.local" });

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET_NAME!;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.error("Missing R2 env vars. Check .env.local.");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const MEDIA_DIR = path.join(process.cwd(), "gif and images");

const MIME: Record<string, string> = {
  ".gif":  "image/gif",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg":  "image/svg+xml",
  ".mp4":  "video/mp4",
};

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function toR2Key(filePath: string): string {
  const rel = path.relative(MEDIA_DIR, filePath);
  // exercises/Legs/barbell sqauts weight (male).gif
  return "exercises/" + rel.split(path.sep).join("/");
}

async function exists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const files = walk(MEDIA_DIR).filter((f) => MIME[path.extname(f).toLowerCase()]);

  console.log(`Found ${files.length} media files. Uploading to R2 bucket "${BUCKET}"...\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const key = toR2Key(file);
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    // Skip if already uploaded
    if (await exists(key)) {
      process.stdout.write(`  SKIP  ${key}\n`);
      skipped++;
      continue;
    }

    try {
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fs.readFileSync(file),
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }));
      process.stdout.write(`  OK    ${key}\n`);
      uploaded++;
    } catch (err) {
      process.stdout.write(`  FAIL  ${key} — ${(err as Error).message}\n`);
      failed++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
