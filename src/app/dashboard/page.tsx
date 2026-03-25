/**
 * /dashboard — smart post-login redirect.
 * Reads the session, looks up the profile role, and sends the user
 * to the correct destination. Used as the default "next" after login.
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getAuthUser();

  // Not logged in — back to login
  if (!user) redirect("/login");

  const client = await createClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.role === "super_admin") {
    redirect("/super-admin");
  }

  if (profile.role === "gym_admin") {
    redirect("/gym-admin");
  }

  // Member — find their gym via members table (V2) or profiles.tenant_id (legacy)
  if (profile.role === "member") {
    // V2: look up gym membership
    const { data: membership } = await client
      .from("members")
      .select("tenants(slug)")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slug = (membership?.tenants as any)?.slug;
    if (slug) redirect(`/g/${slug}`);

    // Legacy fallback: profiles.tenant_id
    if (profile.tenant_id) {
      const { data: tenant } = await client
        .from("tenants")
        .select("slug")
        .eq("id", profile.tenant_id)
        .maybeSingle();
      if (tenant?.slug) redirect(`/g/${tenant.slug}`);
    }
  }

  // Fallback
  redirect("/");
}
