"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface MediaUploadProps {
  /** Current URL to show as preview */
  value: string;
  /** Called with the new public URL after upload */
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
}

export function MediaUpload({
  value,
  onChange,
  label = "Upload image",
  hint = "PNG, JPG, WebP or SVG — max 5 MB",
  accept = "image/jpeg,image/png,image/webp,image/svg+xml",
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Get pre-signed upload URL from our API
      const res = await fetch("/api/r2/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(msg ?? "Upload failed");
      }

      const { uploadUrl, publicUrl } = await res.json();

      // 2. PUT the file directly to R2
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) throw new Error("Failed to upload file to storage.");

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded"
              className="max-h-28 max-w-full rounded-lg object-contain"
            />
            <p className="text-xs text-muted-foreground">Click to replace</p>
          </>
        ) : (
          <>
            <Upload className="h-7 w-7 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>

      {/* Clear button */}
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
          Remove image
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
