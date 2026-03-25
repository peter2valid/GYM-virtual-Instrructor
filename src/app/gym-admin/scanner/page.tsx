import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { ScannerClient } from "./ScannerClient";

export const metadata = { title: "Member Scanner" };

// Full-screen scanner — no layout chrome needed
export default async function ScannerPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/scanner");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile?.tenant_id ||
    !["gym_admin", "super_admin"].includes(profile.role ?? "")
  ) {
    redirect("/gym-admin");
  }

  return <ScannerClient gymId={profile.tenant_id} />;
}
