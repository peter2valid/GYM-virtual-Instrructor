"use server";

import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Called after phone OTP verification (client-side auth).
 * Ensures profiles + members rows exist.
 * gymSlug is optional — only provided when signing up from a gym page.
 */
export async function reconcileAfterPhoneAuth(gymSlug?: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const meta = user.user_metadata ?? {};
  const fullName: string =
    meta.full_name ?? meta.name ?? user.phone ?? "Member";

  // 1. Ensure profiles row
  await supabase.from("profiles").upsert(
    { id: user.id, full_name: fullName, role: "member" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // 2. Ensure members row if gym context is known
  const slug = gymSlug ?? meta.gym_slug;
  if (!slug) return;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) return;

  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("gym_id", tenant.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) return;

  // Admin-created member: row may exist with null profile_id, link by phone
  if (user.phone) {
    const { data: byPhone } = await supabase
      .from("members")
      .select("id")
      .eq("gym_id", tenant.id)
      .eq("phone", user.phone)
      .is("profile_id", null)
      .maybeSingle();

    if (byPhone) {
      await supabase
        .from("members")
        .update({ profile_id: user.id })
        .eq("id", byPhone.id);
      return;
    }
  }

  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || firstName;

  await supabase.from("members").insert({
    gym_id: tenant.id,
    profile_id: user.id,
    first_name: firstName,
    last_name: lastName,
    phone: user.phone ?? null,
    status: "active",
  });
}
