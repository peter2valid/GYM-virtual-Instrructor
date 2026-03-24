#!/usr/bin/env python3
"""
Bulk upload exercise GIFs to Cloudflare R2.

Uses S3-compatible API. Run once to seed assets; run again to upload new files
(skips files already present via ETag comparison).

Requires: pip install boto3
Set env vars:
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
Or edit the CONFIG block below.
"""

import os, sys, hashlib, mimetypes
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError
    from botocore.config import Config
except ImportError:
    sys.exit("Run: pip install boto3")

# ─── CONFIG (override with env vars) ─────────────────────────────────────────
ACCOUNT_ID   = os.getenv("R2_ACCOUNT_ID",        "4c75121caca80bc72bc64cfcd99826f3")
ACCESS_KEY   = os.getenv("R2_ACCESS_KEY_ID",      "")
SECRET_KEY   = os.getenv("R2_SECRET_ACCESS_KEY",  "")
BUCKET       = os.getenv("R2_BUCKET_NAME",        "virtualgym-media")
EXERCISE_DIR = Path("/home/peter/million dollar/Virtual.GYM/free-exercise-db/exercises")

if not ACCESS_KEY or not SECRET_KEY:
    sys.exit("Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars")

ENDPOINT = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# Headers applied to every exercise GIF
GIF_HEADERS = {
    "ContentType":        "image/gif",
    "CacheControl":       "public, max-age=31536000, immutable",
    "ContentDisposition": "inline",
}

# ─── S3 client ────────────────────────────────────────────────────────────────
s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

def etag_of(path: Path) -> str:
    """MD5 of file contents (matches S3/R2 ETag for non-multipart uploads)."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def remote_etag(key: str) -> str | None:
    try:
        head = s3.head_object(Bucket=BUCKET, Key=key)
        return head["ETag"].strip('"')
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return None
        raise

def upload(local_path: Path, key: str) -> str:
    """Returns 'uploaded', 'skipped', or 'error'."""
    remote = remote_etag(key)
    local  = etag_of(local_path)

    if remote == local:
        return "skipped"

    size_kb = local_path.stat().st_size // 1024
    s3.upload_file(
        str(local_path), BUCKET, key,
        ExtraArgs=GIF_HEADERS,
    )
    return f"uploaded ({size_kb}KB)"

# ─── Collect files ────────────────────────────────────────────────────────────
files = []
for ex_dir in sorted(EXERCISE_DIR.iterdir()):
    if not ex_dir.is_dir():
        continue
    ex_id = ex_dir.name
    for fname in ("loop.gif", "demo.gif"):
        local = ex_dir / fname
        if local.is_file():
            key = f"exercises/{ex_id}/{fname}"
            files.append((local, key))

print(f"Files to process: {len(files)}")
print(f"Bucket: {BUCKET}  Endpoint: {ENDPOINT}\n")

# ─── Upload ───────────────────────────────────────────────────────────────────
uploaded = skipped = errors = 0

for i, (local_path, key) in enumerate(files, 1):
    try:
        result = upload(local_path, key)
        if result.startswith("uploaded"):
            uploaded += 1
            print(f"  [{i:>4}/{len(files)}] ✓ {key}  {result}")
        else:
            skipped += 1
            if i % 50 == 0:  # log every 50 skipped to show progress
                print(f"  [{i:>4}/{len(files)}] — {key} (already current)")
    except Exception as e:
        errors += 1
        print(f"  [{i:>4}/{len(files)}] ✗ {key}  ERROR: {e}")

print(f"\nDone: {uploaded} uploaded | {skipped} skipped (already current) | {errors} errors")
print(f"\nPublic URL base: https://pub-135146decfd44634b9e8e73a717545d1.r2.dev")
print(f"Example: https://pub-135146decfd44634b9e8e73a717545d1.r2.dev/exercises/Barbell_Curl/loop.gif")
