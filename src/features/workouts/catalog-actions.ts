"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

type ActionResult = { error: string } | { success: true };

async function getAdminTenant() {
  const user = await getAuthUser();
  if (!user) return null;
  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? ""))
    return null;
  return { client, tenantId: profile.tenant_id };
}

export async function updateCatalogPreference(
  workoutId: string,
  patch: {
    is_quick_start?: boolean;
    is_recommended?: boolean;
    display_order?: number;
  }
): Promise<ActionResult> {
  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  // Verify the workout belongs to this tenant before updating preferences
  const { data: owned } = await client
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!owned) return { error: "Workout not found or access denied." };

  const { error } = await client
    .from("tenant_workout_preferences")
    .upsert(
      { tenant_id: tenantId, workout_id: workoutId, ...patch },
      { onConflict: "tenant_id,workout_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/workouts");
  revalidatePath("/g");
  return { success: true };
}
