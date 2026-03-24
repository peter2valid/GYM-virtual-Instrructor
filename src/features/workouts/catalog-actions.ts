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
    is_featured?: boolean; // V2 uses is_featured instead of is_recommended
    is_recommended?: boolean; // Legacy support
  }
): Promise<ActionResult> {
  const ctx = await getAdminTenant();
  if (!ctx) return { error: "Unauthorized" };

  const { client, tenantId } = ctx;

  // Map legacy is_recommended to is_featured for V2
  const updatedPatch: any = { ...patch };
  if (patch.is_recommended !== undefined && patch.is_featured === undefined) {
    updatedPatch.is_featured = patch.is_recommended;
    delete updatedPatch.is_recommended;
  }

  // Verify the workout belongs to this tenant before updating
  const { data: owned } = await client
    .from("workout_templates")
    .select("id")
    .eq("id", workoutId)
    .eq("gym_id", tenantId)
    .maybeSingle();

  if (!owned) return { error: "Workout not found or access denied." };

  const { error } = await client
    .from("workout_templates")
    .update(updatedPatch)
    .eq("id", workoutId)
    .eq("gym_id", tenantId);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/workouts");
  revalidatePath("/g");
  return { success: true };
}
