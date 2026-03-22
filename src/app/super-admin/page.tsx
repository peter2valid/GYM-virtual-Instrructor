import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAllTenants } from "@/features/sessions/queries";

export const metadata = { title: "Super Admin" };

export default async function SuperAdminDashboard() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/super-admin");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const tenants = await getAllTenants();
  const active = tenants.filter((t) => t.isActive).length;

  const statCards = [
    { label: "Total Gyms", value: tenants.length.toLocaleString() },
    { label: "Active Gyms", value: active.toLocaleString() },
    { label: "Inactive Gyms", value: (tenants.length - active).toLocaleString() },
    { label: "Platform Status", value: "Live ✓" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">
          Manage all gyms and platform health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tenant list preview */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">All Gyms</p>
          <a href="/super-admin/gyms" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            View all
          </a>
        </div>
        <div className="divide-y divide-border">
          {tenants.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">/g/{t.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs capitalize text-muted-foreground">
                  {t.subscriptionPlan}
                </span>
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${
                    t.isActive
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
