"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { createTenant } from "@/features/tenants/admin-actions";
import { useRouter } from "next/navigation";

const INPUT = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

export function CreateGymDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName]           = useState("");
  const [slug, setSlug]           = useState("");
  const [plan, setPlan]           = useState<"starter" | "track" | "premium">("starter");
  const [adminEmail, setAdminEmail] = useState("");

  function deriveSlug(gymName: string) {
    return gymName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
  }

  function handleNameChange(val: string) {
    setName(val);
    setSlug(deriveSlug(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTenant({ name, slug, plan, adminEmail });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setName(""); setSlug(""); setPlan("starter"); setAdminEmail("");
      router.push(`/super-admin/gyms/${result.tenantId}`);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> New Gym
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-foreground">Create New Gym</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Gym Name</label>
              <input
                type="text"
                required
                placeholder="Elite Fitness"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">/g/</span>
                <input
                  type="text"
                  required
                  placeholder="elite-fitness"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className={INPUT}
                />
              </div>
              <p className="text-xs text-muted-foreground">URL-safe, lowercase, hyphens only.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={INPUT}>
                <option value="starter">Starter (free)</option>
                <option value="track">Track</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Admin Email</label>
              <input
                type="email"
                required
                placeholder="owner@gym.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={INPUT}
              />
              <p className="text-xs text-muted-foreground">An invite email will be sent to set up their account.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending || !name || !slug || !adminEmail}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isPending ? "Creating…" : "Create Gym"}
              </button>
              <Dialog.Close className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent">
                Cancel
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
