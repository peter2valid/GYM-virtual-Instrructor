"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

export type ProfileInput = {
  fullName: string;
  avatarUrl?: string;
};

type ActionResult = { error: string } | { success: true };

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const client = await createServerSupabaseClient();
  const { error } = await client
    .from("profiles")
    .update({
      full_name: input.fullName,
      avatar_url: input.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
