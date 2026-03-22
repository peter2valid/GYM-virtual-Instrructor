import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Gym Settings" };

export default async function GymAdminSettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/settings");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>
    );
  }

  const { data: tenant } = await client
    .from("tenants")
    .select(
      "id, name, slug, logo_url, primary_color, welcome_message, subscription_plan, subscription_status, is_active, created_at"
    )
    .eq("id", profile.tenant_id)
    .single();

  if (!tenant) return null;

  const PLAN_LABELS: Record<string, string> = {
    starter: "Starter (Free)",
    track: "Track — ₦15,000/mo",
    premium: "Premium — ₦30,000/mo",
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "text-green-600 dark:text-green-400",
    trialing: "text-yellow-600 dark:text-yellow-400",
    past_due: "text-orange-600 dark:text-orange-400",
    cancelled: "text-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your gym profile and preferences.
        </p>
      </div>

      {/* Subscription card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Plan
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {PLAN_LABELS[tenant.subscription_plan] ?? tenant.subscription_plan}
            </p>
            <p
              className={`mt-0.5 text-sm capitalize ${
                STATUS_COLORS[tenant.subscription_status] ?? "text-muted-foreground"
              }`}
            >
              {tenant.subscription_status}
            </p>
          </div>
          <a
            href="/contact"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            Upgrade Plan
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Gym URL</p>
            <p className="font-mono text-foreground">/g/{tenant.slug}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member since</p>
            <p className="text-foreground">
              {new Date(tenant.created_at).toLocaleDateString("en", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Editable settings */}
      <SettingsForm
        initialData={{
          name: tenant.name,
          welcomeMessage: tenant.welcome_message ?? "",
          logoUrl: tenant.logo_url ?? "",
          primaryColor: tenant.primary_color ?? "",
        }}
      />
    </div>
  );
}
