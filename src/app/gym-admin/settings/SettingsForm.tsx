"use client";

import { useState } from "react";
import { updateTenantProfile } from "@/features/tenants/actions";
import { MediaUpload } from "@/components/MediaUpload";

interface Props {
  initialData: {
    name: string;
    welcomeMessage: string;
    logoUrl: string;
    primaryColor: string;
  };
}

export function SettingsForm({ initialData }: Props) {
  const [name, setName] = useState(initialData.name);
  const [welcomeMessage, setWelcomeMessage] = useState(initialData.welcomeMessage);
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Gym name is required."); return; }
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateTenantProfile({
      name,
      welcomeMessage: welcomeMessage || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor: primaryColor || undefined,
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h2 className="text-sm font-semibold text-foreground">Gym Profile</h2>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Field label="Gym name">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Welcome message" hint="Shown on your gym's homepage">
        <textarea
          rows={3}
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          placeholder="Welcome to our gym! Get fit, stay strong."
          className="input resize-none"
        />
      </Field>

      <Field label="Logo" hint="Upload a PNG, JPG, or SVG (max 5 MB) or paste a URL">
        <MediaUpload
          value={logoUrl}
          onChange={setLogoUrl}
          label="Upload gym logo"
          hint="PNG, JPG, SVG — max 5 MB"
        />
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="input mt-2"
        />
      </Field>

      <Field label="Primary color" hint="Hex color for buttons and highlights">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor || "#6366f1"}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#6366f1"
            className="input w-32 font-mono"
          />
        </div>
      </Field>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved successfully
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
