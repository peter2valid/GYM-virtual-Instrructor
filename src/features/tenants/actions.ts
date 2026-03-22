"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

export type TenantSettingsInput = {
  name: string;
  welcomeMessage?: string;
  logoUrl?: string;
  primaryColor?: string;
};

type ActionResult = { error: string } | { success: true };

export async function updateTenantProfile(input: TenantSettingsInput): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return { error: "Unauthorized" };
  }

  const { error } = await client
    .from("tenants")
    .update({
      name: input.name,
      welcome_message: input.welcomeMessage || null,
      logo_url: input.logoUrl || null,
      primary_color: input.primaryColor || null,
    })
    .eq("id", profile.tenant_id);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/settings");
  revalidatePath("/gym-admin");
  return { success: true };
}
