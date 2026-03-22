"use server";

import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerClient } from "@/lib/supabase/server";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function requireSuperAdmin() {
  const user = await getAuthUser();
  if (!user) return null;
  const client = await createServerClient();
  const { data } = await client.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "super_admin" ? user : null;
}

export async function updateTenantPlan(
  tenantId: string,
  plan: "starter" | "track" | "premium",
  status: "active" | "trialing" | "cancelled" | "past_due"
): Promise<{ success: true } | { error: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: "Unauthorized" };

  const { error } = await adminClient
    .from("tenants")
    .update({
      subscription_plan: plan,
      subscription_status: status,
      is_active: status === "active" || status === "trialing",
    })
    .eq("id", tenantId);

  if (error) return { error: error.message };

  // Sync feature flags
  const isTrack = plan === "track" || plan === "premium";
  const isPremium = plan === "premium";
  const flagUpdates = [
    { feature_key: "member_login",           enabled: isTrack },
    { feature_key: "attendance_tracking",    enabled: isTrack },
    { feature_key: "workout_history",        enabled: isTrack },
    { feature_key: "member_dashboard",       enabled: isTrack },
    { feature_key: "premium_branding",       enabled: isPremium },
    { feature_key: "advanced_analytics",     enabled: isPremium },
    { feature_key: "custom_recommendations", enabled: isPremium },
  ];

  for (const flag of flagUpdates) {
    await adminClient
      .from("feature_flags")
      .upsert(
        { tenant_id: tenantId, feature_key: flag.feature_key, enabled: flag.enabled },
        { onConflict: "tenant_id,feature_key" }
      );
  }

  return { success: true };
}

export async function toggleTenantActive(
  tenantId: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: "Unauthorized" };

  const { error } = await adminClient
    .from("tenants")
    .update({ is_active: isActive })
    .eq("id", tenantId);

  if (error) return { error: error.message };
  return { success: true };
}
