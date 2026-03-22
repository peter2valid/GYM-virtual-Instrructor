import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAllTenantsWithStats } from "@/features/sessions/queries";
import { PlanEditor } from "./PlanEditor";

export const metadata = { title: "Subscriptions" };

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  track: "Track",
  premium: "Premium",
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/10 text-green-600 dark:text-green-400",
  trialing:  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  past_due:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function SuperAdminSubscriptionsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/super-admin/subscriptions");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  const tenants = await getAllTenantsWithStats();

  const byPlan = {
    starter: tenants.filter((t) => t.subscriptionPlan === "starter").length,
    track:   tenants.filter((t) => t.subscriptionPlan === "track").length,
    premium: tenants.filter((t) => t.subscriptionPlan === "premium").length,
  };
  const active  = tenants.filter((t) => t.subscriptionStatus === "active").length;
  const pastDue = tenants.filter((t) => t.subscriptionStatus === "past_due").length;
  const totalRevenue = tenants.reduce((sum, t) => {
    if (!t.isActive) return sum;
    const planRevenue = t.subscriptionPlan === "premium" ? 9900 : t.subscriptionPlan === "track" ? 4900 : 0;
    return sum + planRevenue;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Manage gym plans and billing status across the platform.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Starter gyms",  value: byPlan.starter.toString() },
          { label: "Track gyms",    value: byPlan.track.toString() },
          { label: "Premium gyms",  value: byPlan.premium.toString() },
          { label: "Est. MRR",      value: `KES ${(totalRevenue / 100).toLocaleString()}` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-sm text-muted-foreground">{active} active</span>
        </div>
        {pastDue > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-muted-foreground">{pastDue} past due</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40"></span>
          <span className="text-sm text-muted-foreground">{tenants.length - active - pastDue} inactive</span>
        </div>
      </div>

      {/* All gyms table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_100px_100px_120px_40px] gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground">
            <span>Gym</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Members / Sessions</span>
            <span></span>
          </div>
          {tenants.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_100px_100px_120px_40px] items-center gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">/g/{t.slug}</p>
              </div>
              <span className="text-sm capitalize text-muted-foreground">
                {PLAN_LABELS[t.subscriptionPlan] ?? t.subscriptionPlan}
              </span>
              <span
                className={`inline-flex h-5 w-fit items-center rounded-full px-2 text-[10px] font-semibold ${
                  STATUS_STYLES[t.subscriptionStatus] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {t.subscriptionStatus}
              </span>
              <span className="text-sm text-muted-foreground">
                {t.memberCount} / {t.sessionCount}
              </span>
              <PlanEditor
                tenantId={t.id}
                currentPlan={t.subscriptionPlan as "starter" | "track" | "premium"}
                currentStatus={t.subscriptionStatus as "active" | "trialing" | "cancelled" | "past_due"}
                isActive={t.isActive}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
