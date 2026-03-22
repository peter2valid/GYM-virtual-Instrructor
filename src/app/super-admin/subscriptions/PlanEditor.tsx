"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { updateTenantPlan, toggleTenantActive } from "@/features/tenants/admin-actions";

interface Props {
  tenantId: string;
  currentPlan: "starter" | "track" | "premium";
  currentStatus: "active" | "trialing" | "cancelled" | "past_due";
  isActive: boolean;
}

export function PlanEditor({ tenantId, currentPlan, currentStatus, isActive }: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const res = await updateTenantPlan(tenantId, plan, status);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
      }
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      await toggleTenantActive(tenantId, !isActive);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Edit plan"
      >
        <Settings2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-foreground">Edit Subscription</h2>

        {error && (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as typeof plan)}
              className="input w-full"
            >
              <option value="starter">Starter</option>
              <option value="track">Track</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="input w-full"
            >
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saved ? "Saved ✓" : isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
        </div>

        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          {isActive ? "Deactivate gym" : "Reactivate gym"}
        </button>
      </div>
    </div>
  );
}
