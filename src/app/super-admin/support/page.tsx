import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Support & Platform Health" };

export default async function SuperAdminSupportPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/super-admin/support");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    { count: totalGyms },
    { count: activeGyms },
    { count: totalMembers },
    { count: totalSessions },
    { count: todaySessions },
    { count: weekSessions },
    { count: totalCheckIns },
  ] = await Promise.all([
    client.from("tenants").select("*", { count: "exact", head: true }),
    client.from("tenants").select("*", { count: "exact", head: true }).eq("is_active", true),
    client.from("members").select("*", { count: "exact", head: true }),
    client.from("workout_sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
    client.from("workout_sessions").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", today.toISOString()),
    client.from("workout_sessions").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", sevenDaysAgo.toISOString()),
    client.from("attendance_checkins").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Gyms",          value: (totalGyms ?? 0).toLocaleString(), sub: `${activeGyms ?? 0} active` },
    { label: "Total Members",       value: (totalMembers ?? 0).toLocaleString(), sub: "across all gyms" },
    { label: "Workouts Completed",  value: (totalSessions ?? 0).toLocaleString(), sub: `${todaySessions ?? 0} today` },
    { label: "Sessions (7 days)",   value: (weekSessions ?? 0).toLocaleString(), sub: "completed sessions" },
    { label: "QR Check-ins",        value: (totalCheckIns ?? 0).toLocaleString(), sub: "all time" },
  ];

  // Recent sign-ups (last 10 gyms)
  const { data: recentGyms } = await client
    .from("tenants")
    .select("id, name, slug, subscription_plan, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Health</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide metrics and recent activity.
        </p>
      </div>

      {/* Platform stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent gym sign-ups */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent Sign-ups</p>
        </div>
        <div className="divide-y divide-border">
          {(recentGyms ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  <a
                    href={`/g/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-4"
                  >
                    /g/{t.slug}
                  </a>
                  {" · "}
                  {new Date(t.created_at).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-xs capitalize text-muted-foreground">{t.subscription_plan}</span>
            </div>
          ))}
          {(recentGyms ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No gyms yet.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/super-admin/gyms"
          className="rounded-xl border border-border bg-card p-4 hover:bg-accent"
        >
          <p className="text-sm font-semibold text-foreground">Manage All Gyms →</p>
          <p className="mt-1 text-xs text-muted-foreground">View, preview, and manage every gym on the platform.</p>
        </Link>
        <Link
          href="/super-admin/subscriptions"
          className="rounded-xl border border-border bg-card p-4 hover:bg-accent"
        >
          <p className="text-sm font-semibold text-foreground">Subscription Manager →</p>
          <p className="mt-1 text-xs text-muted-foreground">Change plans, activate or deactivate gyms, view billing status.</p>
        </Link>
      </div>
    </div>
  );
}
