import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles all Supabase Auth redirects:
 * - OAuth (Google, Apple) — receives ?code=
 * - Email confirmation / magic link — receives ?token_hash= + ?type=
 * - Phone OTP — handled client-side, not this route
 *
 * After session is established:
 * - Ensures profiles row exists (trigger handles this for new users, but upserts for safety)
 * - If gym_slug is in user metadata, ensures members row exists for that gym
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | "invite" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();
  let sessionUser = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error (code exchange):", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    sessionUser = data.user;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("Auth callback error (OTP verification):", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    sessionUser = data.user;
  } else {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (sessionUser) {
    await reconcileUserRecords(supabase, sessionUser);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

// ─── reconcileUserRecords ─────────────────────────────────────────────────────
// Ensures profiles + members rows exist after any auth event.
// Safe to call on every login — uses upsert/insert-if-missing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reconcileUserRecords(supabase: any, user: any) {
  const meta = user.user_metadata ?? {};
  const fullName: string =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Member";

  // 1. Ensure profiles row (trigger should have already created it for new users)
  await supabase.from("profiles").upsert(
    { id: user.id, full_name: fullName, role: "member" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // 2. If signed up from a gym page, ensure members row exists
  const gymSlug: string | undefined = meta.gym_slug;
  if (!gymSlug) return;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", gymSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) return;

  // Check if member row already exists for this user + gym (by profile_id)
  const { data: existing } = await supabase
    .from("members")
    .select("id, profile_id")
    .eq("gym_id", tenant.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) return;

  // Admin-created member: row exists but profile_id is null — link by email
  if (user.email) {
    const { data: byEmail } = await supabase
      .from("members")
      .select("id")
      .eq("gym_id", tenant.id)
      .eq("email", user.email)
      .is("profile_id", null)
      .maybeSingle();

    if (byEmail) {
      await supabase
        .from("members")
        .update({ profile_id: user.id })
        .eq("id", byEmail.id);
      return;
    }
  }

  // Create member row for self-registered user
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || firstName;

  await supabase.from("members").insert({
    gym_id: tenant.id,
    profile_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: user.email ?? null,
    phone: meta.phone ?? null,
    status: "active",
  });
}
