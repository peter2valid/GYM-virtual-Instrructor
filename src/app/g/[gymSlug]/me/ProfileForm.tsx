"use client";

import { useState } from "react";
import { updateProfile } from "@/features/profiles/actions";

interface Props {
  initialData: { fullName: string; avatarUrl: string };
  gymSlug: string;
}

export function ProfileForm({ initialData }: Props) {
  const [fullName, setFullName] = useState(initialData.fullName);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("Name is required."); return; }
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateProfile({
      fullName,
      avatarUrl: avatarUrl || undefined,
    });

    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold text-foreground">Edit Profile</h2>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Full name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Avatar URL</label>
        <input
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="input"
        />
        <p className="text-xs text-muted-foreground">Paste a link to your profile photo</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
        )}
      </div>
    </form>
  );
}
