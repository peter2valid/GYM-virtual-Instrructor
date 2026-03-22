import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { mockTenants } from "./mock-tenants";
import type {
  Tenant,
  TenantSettings,
  FeatureFlag,
  FeatureFlagKey,
  TenantEquipmentProfile,
} from "@/types";

// ─── DB row mappers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTenantRow(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subscriptionPlan: row.subscription_plan,
    subscriptionStatus: row.subscription_status,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    welcomeMessage: row.welcome_message,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSettingsRow(row: any): TenantSettings {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    showLoginRequired: row.show_login_required,
    showQuickStart: row.show_quick_start,
    defaultRecommendationMode: row.default_recommendation_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── getTenantBySlug ──────────────────────────────────────────────────────────

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (!isSupabaseConfigured) {
    return mockTenants.find((t) => t.slug === slug && t.isActive) ?? null;
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapTenantRow(data);
}

// ─── getTenantById ────────────────────────────────────────────────────────────

export async function getTenantById(id: string): Promise<Tenant | null> {
  if (!isSupabaseConfigured) {
    return mockTenants.find((t) => t.id === id && t.isActive) ?? null;
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("tenants")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapTenantRow(data);
}

// ─── getTenantSettings ────────────────────────────────────────────────────────

export async function getTenantSettings(
  tenantId: string
): Promise<TenantSettings | null> {
  if (!isSupabaseConfigured) {
    return {
      id: `settings-${tenantId}`,
      tenantId,
      showLoginRequired: false,
      showQuickStart: true,
      defaultRecommendationMode: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) return null;
  return mapSettingsRow(data);
}

// ─── getFeatureFlagsForTenant ─────────────────────────────────────────────────

export async function getFeatureFlagsForTenant(
  tenantId: string
): Promise<Record<FeatureFlagKey, boolean>> {
  const defaults: Record<FeatureFlagKey, boolean> = {
    member_login: false,
    attendance_tracking: false,
    workout_history: false,
    member_dashboard: false,
    gym_admin_dashboard: false,
    premium_branding: false,
    advanced_analytics: false,
    custom_recommendations: false,
  };

  if (!isSupabaseConfigured) return defaults;

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("feature_flags")
    .select("feature_key, enabled")
    .eq("tenant_id", tenantId);

  if (error || !data) return defaults;

  const flags = { ...defaults };
  for (const row of data) {
    if (row.feature_key in flags) {
      flags[row.feature_key as FeatureFlagKey] = row.enabled;
    }
  }
  return flags;
}

// ─── getTenantEquipmentProfile ────────────────────────────────────────────────

export async function getTenantEquipmentProfile(
  tenantId: string
): Promise<TenantEquipmentProfile[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("tenant_equipment_profiles")
    .select("*, equipment_type:equipment_types(*)")
    .eq("tenant_id", tenantId)
    .eq("is_available", true);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    equipmentTypeId: row.equipment_type_id,
    quantity: row.quantity,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    equipmentType: row.equipment_type ?? undefined,
  }));
}
