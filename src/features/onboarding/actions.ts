"use server";

import { createClient } from "@supabase/supabase-js";
import { sendEmail, buildWelcomeEmail } from "@/lib/email";

const SERVICE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type OnboardingData = {
  gymName: string;
  gymSlug: string;
  welcomeMessage?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  plan: "starter" | "track" | "premium";
};

export type OnboardingResult =
  | { tenantId: string; tenantSlug: string; userId: string; error?: never }
  | { error: string; tenantId?: never };

export async function createGym(data: OnboardingData): Promise<OnboardingResult> {
  const admin = createClient(SERVICE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Create the tenant
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: data.gymName,
      slug: data.gymSlug,
      welcome_message: data.welcomeMessage || null,
      subscription_plan: data.plan,
      subscription_status: data.plan === "starter" ? "active" : "trialing",
      is_active: true,
    })
    .select("id, slug")
    .single();

  if (tenantError) {
    if (tenantError.code === "23505") {
      return { error: "That gym URL is already taken. Choose a different name." };
    }
    return { error: tenantError.message };
  }

  // 2. Create auth user — pass metadata so the trigger sets role + tenant_id
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.adminEmail,
    password: data.adminPassword,
    email_confirm: true, // skip email confirmation for the owner
    user_metadata: {
      full_name: data.adminName,
      tenant_id: tenant.id,
      role: "gym_admin",
    },
  });

  if (authError) {
    // Roll back tenant so slug is freed
    await admin.from("tenants").delete().eq("id", tenant.id);
    if (authError.message.includes("already registered")) {
      return { error: "An account with that email already exists. Please sign in." };
    }
    return { error: authError.message };
  }

  // 3. Ensure profile has correct role (trigger may have set it to 'member')
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: authData.user.id,
        tenant_id: tenant.id,
        full_name: data.adminName,
        role: "gym_admin",
      },
      { onConflict: "id" }
    );

  if (profileError) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to set up admin profile. Please try again." };
  }

  // 4. Default feature flags based on plan
  const isTrackOrPremium = data.plan !== "starter";
  const isPremium = data.plan === "premium";
  const flags = [
    { feature_key: "member_login",          enabled: isTrackOrPremium },
    { feature_key: "attendance_tracking",   enabled: isTrackOrPremium },
    { feature_key: "workout_history",       enabled: isTrackOrPremium },
    { feature_key: "member_dashboard",      enabled: isTrackOrPremium },
    { feature_key: "gym_admin_dashboard",   enabled: true },
    { feature_key: "premium_branding",      enabled: isPremium },
    { feature_key: "advanced_analytics",    enabled: isPremium },
    { feature_key: "custom_recommendations",enabled: isPremium },
  ].map((f) => ({ ...f, tenant_id: tenant.id }));

  const { error: flagsError } = await admin.from("feature_flags").insert(flags);
  if (flagsError) {
    // Non-fatal: flags can be re-seeded; don't abort the whole onboarding
    console.error("[onboarding] feature_flags insert failed:", flagsError.message);
  }

  // 5. Default tenant settings
  const { error: settingsError } = await admin.from("tenant_settings").insert({
    tenant_id: tenant.id,
    show_login_required: false,
    show_quick_start: true,
    default_recommendation_mode: "manual",
  });
  if (settingsError) {
    console.error("[onboarding] tenant_settings insert failed:", settingsError.message);
  }

  // 6. Send welcome email (best-effort)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendEmail({
    to: data.adminEmail,
    subject: `Welcome to VirtualGYM — ${data.gymName} is live!`,
    html: buildWelcomeEmail({
      gymName: data.gymName,
      adminName: data.adminName,
      gymUrl: `${appUrl}/g/${tenant.slug}`,
      dashboardUrl: `${appUrl}/gym-admin`,
    }),
  });

  return { tenantId: tenant.id, tenantSlug: tenant.slug, userId: authData.user.id };
}
