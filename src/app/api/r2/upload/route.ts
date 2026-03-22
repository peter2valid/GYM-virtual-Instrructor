/**
 * POST /api/r2/upload
 * Body: { filename: string; contentType: string }
 * Returns: { uploadUrl: string; publicUrl: string }
 *
 * Generates a pre-signed PUT URL so the client can upload directly to R2.
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, NEXT_PUBLIC_R2_PUBLIC_URL
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(req: NextRequest) {
  // Auth check
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Role check — only gym_admin and super_admin may upload
  const client = await createClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["gym_admin", "super_admin"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // R2 config check
  const r2 = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2 || !bucket || !publicUrl) {
    return NextResponse.json(
      { error: "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, NEXT_PUBLIC_R2_PUBLIC_URL." },
      { status: 503 }
    );
  }

  // Parse request body
  const { filename, contentType } = await req.json().catch(() => ({}));

  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `contentType must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Build a unique key: uploads/<userId>/<timestamp>-<sanitized-filename>
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
  const key = `uploads/${user.id}/${Date.now()}-${sanitized}`;

  // Generate pre-signed URL (expires in 5 minutes)
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: undefined, // client must send correct Content-Length
    // Max 5 MB enforced via Content-Length condition on the client side
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const filePublicUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl: filePublicUrl });
}
