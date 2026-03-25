import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAllTenantsWithStats } from "@/features/sessions/queries";
import Link from "next/link";
import { CreateGymDialog } from "./CreateGymDialog";

export const metadata = { title: "All Gyms" };

export default async function SuperAdminGymsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/super-admin/gyms");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const tenants = await getAllTenantsWithStats();
  const totalMembers = tenants.reduce((s, t) => s + t.memberCount, 0);
  const totalSessions = tenants.reduce((s, t) => s + t.sessionCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Gyms</h1>
          <p className="text-sm text-muted-foreground">
            {tenants.length} gym{tenants.length !== 1 ? "s" : ""} &middot; {totalMembers} members &middot; {totalSessions} sessions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateGymDialog />
          <Link
            href="/super-admin/subscriptions"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Manage plans
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {tenants.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No gyms registered yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_120px_80px_100px_80px] px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Gym</span>
              <span>Slug</span>
              <span>Plan</span>
              <span>Members / Sessions</span>
              <span className="text-right">Status</span>
            </div>
            {tenants.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_120px_80px_100px_80px] items-center px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/super-admin/gyms/${t.id}`} className="truncate text-sm font-medium text-foreground hover:underline underline-offset-4">
                    {t.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    since {new Date(t.createdAt).toLocaleDateString("en", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <a
                  href={`/g/${t.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t.slug}
                </a>
                <span className="text-sm capitalize text-muted-foreground">
                  {t.subscriptionPlan}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t.memberCount} / {t.sessionCount}
                </span>
                <div className="flex justify-end">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${
                      t.isActive
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
