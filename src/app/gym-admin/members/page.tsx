import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantMembersWithStats } from "@/features/sessions/queries";
import { MembersClient } from "./MembersClient";

export const metadata = { title: "Members" };

export default async function GymAdminMembersPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/members");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const members = await getTenantMembersWithStats(profile.tenant_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} registered member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <MembersClient members={members} />
    </div>
  );
}
