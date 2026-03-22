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

  // Member — redirect to their gym's landing page
  if (profile.role === "member" && profile.tenant_id) {
    const { data: tenant } = await client
      .from("tenants")
      .select("slug")
      .eq("id", profile.tenant_id)
      .maybeSingle();

    if (tenant?.slug) redirect(`/g/${tenant.slug}`);
  }

  // Fallback
  redirect("/");
}
