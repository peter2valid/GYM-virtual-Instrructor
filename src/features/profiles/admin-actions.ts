"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerClient } from "@/lib/supabase/server";

function generateTempPassword(): string {
  // 12 random url-safe chars + fixed suffix to guarantee complexity requirements
  return randomBytes(9).toString("base64url") + "!G7";
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function createMemberAccount({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string;
  phone?: string;
}) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const client = await createServerClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return { error: "Access denied" };
  }

  const tempPassword = generateTempPassword();

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    if (authError.message.includes("already exist") || authError.message.includes("already been registered")) {
      return { error: "A user with this email already exists." };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user." };
  }

  // 2. Upsert profiles table
  const { error: profileError } = await adminAuthClient.from("profiles").upsert({
    id: authData.user.id,
    full_name: fullName,
    role: "member",
    tenant_id: profile.tenant_id,
  });

  if (profileError) {
    console.error("Failed to upsert profile:", profileError);
    return { error: "User created but profile linking failed." };
  }

  // 3. Insert into V2 members table
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || firstName;

  const { error: memberError } = await adminAuthClient.from("members").insert({
    gym_id: profile.tenant_id,
    profile_id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone ?? null,
    status: "active",
  });

  if (memberError) {
    // Non-fatal — profile exists; member row can be reconciled
    console.error("Failed to insert member row:", memberError);
  }

  revalidatePath("/gym-admin/members");
  return { success: true as const, tempPassword };
}
