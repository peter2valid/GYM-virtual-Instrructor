"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function requireSuperAdmin() {
  const user = await getAuthUser();
  if (!user) return null;
  const client = await createServerClient();
  const { data } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "super_admin" ? user : null;
}

export async function updateTenantPlan(
  tenantId: string,
  plan: "starter" | "track" | "premium",
  status: "active" | "trialing" | "cancelled" | "past_due"
): Promise<{ success: true } | { error: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: "Unauthorized" };

  const { error } = await getAdminClient()
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
    await getAdminClient()
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

  const { error } = await getAdminClient()
    .from("tenants")
    .update({ is_active: isActive })
    .eq("id", tenantId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createTenant(input: {
  name: string;
  slug: string;
  plan: "starter" | "track" | "premium";
  adminEmail: string;
}): Promise<{ success: true; tenantId: string } | { error: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: "Unauthorized" };

  const admin = getAdminClient();

  // 1. Validate slug is available
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", input.slug).maybeSingle();
  if (existing) return { error: "Slug already taken. Choose a different one." };

  // 2. Create tenant
  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({
      name: input.name,
      slug: input.slug,
      subscription_plan: input.plan,
      subscription_status: "active",
      is_active: true,
    })
    .select("id")
    .single();

  if (tenantErr || !tenant) return { error: tenantErr?.message ?? "Failed to create gym" };

  // 3. Invite admin user (sends email invite via Supabase Auth)
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/gym-admin`;
  const { data: authUser, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.adminEmail, {
    redirectTo,
    data: { role: "gym_admin", tenant_id: tenant.id },
  });

  if (inviteErr) {
    // Non-fatal: tenant was created, admin can be invited later
    console.error("Admin invite failed:", inviteErr.message);
  }

  // 4. Create profile for invited admin
  if (authUser?.user) {
    await admin.from("profiles").upsert(
      { id: authUser.user.id, full_name: input.adminEmail.split("@")[0], role: "gym_admin", tenant_id: tenant.id },
      { onConflict: "id", ignoreDuplicates: false }
    );

    await admin.from("gym_user_roles").insert({
      gym_id: tenant.id,
      profile_id: authUser.user.id,
      role: "gym_admin",
      is_active: true,
    });
  }

  revalidatePath("/super-admin/gyms");
  revalidatePath("/super-admin");
  return { success: true, tenantId: tenant.id };
}
